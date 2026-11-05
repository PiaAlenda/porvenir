import express from "express"
import cors from "cors"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { isContactConfigured, sendContactEmail, validateContact } from "./contact.mjs"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  getAll,
  getPage,
  getById,
  createAlumno,
  updateAlumno,
  deleteAlumno,
  findByDocumento,
  positionInCareer,
  DUPLICATE_MESSAGE,
} from "./db.mjs"
import {
  getConfig,
  getPublicConfig,
  getFormOptions,
  updateFormOptions,
  updateItem,
  deleteItem,
  parseCantidadTitulares,
  MAX_CANTIDAD_TITULARES,
  normalizeList,
  normalizeSyllabus,
  normalizeTeachers,
  TEXT_LIMITS,
  VALID_CATEGORIES,
  getContract,
  updateContract,
  resetContract,
} from "./site-config.mjs"
import {
  authenticate,
  changePassword,
  verifyToken,
  refreshAdminSession,
  isDefaultPassword,
  hasUsableAdminConfig,
  SESSION_EXPIRED_MESSAGE,
} from "./auth.mjs"
import {
  upload,
  careerUpload,
  saveUpload,
  deleteUpload,
  UPLOADS_URL_PREFIX,
  directUploadsEnabled,
  createUploadTickets,
  claimDirectUpload,
  discardPendingUploads,
  isPendingKey,
} from "./storage.mjs"
import { ensureBuckets, supabaseEnabled, cleanupPendingUploads } from "./supabase.mjs"
import { generarFichaPdf } from "./pdf.mjs"
import { PublicError } from "./errors.mjs"
import { resolverFichaMedica } from "./ficha-medica.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, "data", "uploads")
const DIST_DIR = path.join(__dirname, "..", "dist")

const app = express()
const PORT = process.env.PORT || 3001

const IS_PRODUCTION = process.env.NODE_ENV === "production"

/* ---------- guardas de arranque ---------- */
/*
 * En producción la configuración incompleta tiene que frenar el arranque en vez
 * de dejarlo en un estado medio seguro. Todas estas condiciones antes solo
 * imprimían una advertencia y seguían adelante.
 */
const missingInProduction = []
if (IS_PRODUCTION) {
  if (!supabaseEnabled) missingInProduction.push("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  if (!process.env.ALLOWED_ORIGIN) missingInProduction.push("ALLOWED_ORIGIN")
  if (!hasUsableAdminConfig()) missingInProduction.push("ADMIN_EMAIL / ADMIN_EMAILS")
}
if (missingInProduction.length) {
  console.error(
    `[config] Faltan variables obligatorias en producción: ${missingInProduction.join(", ")}. No se inicia el servidor.`,
  )
  process.exit(1)
}
if (isDefaultPassword()) {
  console.error("[config] ADMIN_PASSWORD sigue con el valor por defecto. No se inicia el servidor.")
  process.exit(1)
}

/* ---------- proxy ---------- */
/*
 * En Render la app corre detrás de un proxy inverso. Sin esto, `req.ip` vale
 * la IP del proxy — la misma para todos los usuarios — y el rate limiting del
 * login agruparía a toda la escuela en un único bucket, con lo que cinco
 * intentos fallidos bloquearían el acceso de todos a la vez.
 */
app.set("trust proxy", 1)

/* ---------- rate limiting ---------- */

const RATE_LIMIT_MESSAGE = "Demasiados intentos. Probá de nuevo en unos minutos."

/** Login: estricto. Solo cuenta los intentos fallidos. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: RATE_LIMIT_MESSAGE },
})

/*
 * Inscripción pública: tiene que tolerar que una escuela entera se conecte
 * desde la misma IP (mismo wifi, NAT de la institución), por eso el tope es
 * alto. Con 40 por hora, de un aula de 100 alumnos en el mismo wifi quedaban
 * 60 rechazados. Igual pone un techo al antiflood: cada request puede
 * arrastrar hasta 20MB de adjuntos en memoria (aunque el formulario ya las
 * manda comprimidas, a unos cientos de KB).
 */
const inscriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas inscripciones desde esta conexión. Probá más tarde." },
})

/** Contacto público: pocas consultas por hora y por conexión (anti-spam). */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Enviaste varias consultas seguidas. Probá de nuevo en un rato." },
})

/**
 * Permisos de subida directa: un pedido por intento de inscripción (trae los
 * dos permisos). Margen doble que la inscripción para cubrir los reintentos,
 * con el mismo criterio: una escuela entera puede estar detrás de una IP.
 */
const uploadUrlsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas inscripciones desde esta conexión. Probá más tarde." },
})

/**
 * Renovación de sesión: cuenta solo los intentos fallidos, igual que el login.
 * Una pestaña con varias llamadas vencidas pueden renovar una sola vez y
 * reutilizar ese token para el resto, así que el tope alto no abre una
 * ventana para adivinar refresh tokens.
 */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: RATE_LIMIT_MESSAGE },
})

/** API en general: holgado, solo para frenar scripts automatizados. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: RATE_LIMIT_MESSAGE },
})

/* ---------- headers de seguridad ---------- */

/*
 * helmet endurece las cabeceras por defecto. El CSP es el único que hay que
 * ajustar: el panel carga adjuntos desde el dominio de Storage de Supabase y
 * los PDF generados se descargan como blob.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co"],
        // Los videos de las carreras también salen de Storage cuando el admin
        // los sube: sin esto el reproductor los bloquea.
        mediaSrc: ["'self'", "blob:", "https://*.supabase.co"],
        fontSrc: ["'self'", "data:", "https://*.supabase.co"],
        connectSrc: ["'self'", "https://*.supabase.co"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // Los adjuntos y banners se sirven desde otro origen (Supabase Storage).
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Detrás del proxy de Render, HSTS solo se agrega si el request llegó por
    // HTTPS; helmet lo resuelve solo con esto.
    hsts: IS_PRODUCTION ? { maxAge: 15552000, includeSubDomains: true } : false,
  }),
)

/* ---------- CORS ---------- */
/* El frontend vive en Vercel, la API en Render: hay que permitir ese origen. */

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean)

app.use(
  cors({
    origin(origin, cb) {
      // Sin Origin (curl, apps nativas, same-origin) no hay CORS que aplicar.
      if (!origin) return cb(null, true)
      /*
       * Fail-closed: si la allow-list está vacía, el origen se rechaza en vez
       * de aceptarse cualquiera. Antes devolvía `true` y dejaba la API
       * abierta a cualquier sitio. En producción, el arranque ya se aborta
       * cuando falta ALLOWED_ORIGIN, así que acá solo queda el camino de
       * desarrollo.
       */
      if (!ALLOWED_ORIGINS.length) return cb(null, false)
      cb(null, ALLOWED_ORIGINS.includes(origin.replace(/\/$/, "")))
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

if (!supabaseEnabled && fs.existsSync(UPLOADS_DIR)) {
  app.use(UPLOADS_URL_PREFIX, express.static(UPLOADS_DIR))
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    storage: supabaseEnabled ? "supabase" : "local",
    auth: supabaseEnabled ? "supabase" : "local",
    time: new Date().toISOString(),
  })
})

/* ---------- auth ---------- */

async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ""
  // Solo por header: el token nunca se acepta en la query string porque
  // ahí quedaría en los logs de acceso, en el Referer y en el historial.
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!(await verifyToken(token))) {
    // Con token vencido la causa es la sesión; sin token, solo el 401 crudo.
    return res.status(401).json({ error: token ? SESSION_EXPIRED_MESSAGE : "No autorizado" })
  }
  req.adminToken = token
  next()
}

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const ip = req.ip || (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown"
  const { email, password } = req.body || {}
  const result = await authenticate(email, password)
  if (result.error) {
    return res.status(401).json({ error: result.error })
  }

  res.json({
    token: result.token,
    refreshToken: result.refreshToken || "",
    expiresIn: result.expiresIn,
    email: result.user?.email || String(email).trim().toLowerCase(),
  })
})

/**
 * Emite un access token nuevo a partir del refresh token del login.
 *
 * El access token de Supabase dura una hora. Antes el panel lo guardaba en la
 * pestaña y a la hora siguiente todas sus llamadas respondían 401, mientras el
 * sitio público (que no pide token) seguía funcionando: era el "me sale no
 * autorizado pero puedo ver el resto" que reportaba la administración.
 */
app.post("/api/auth/refresh", refreshLimiter, async (req, res) => {
  const result = await refreshAdminSession(req.body?.refreshToken)
  if (result.error) {
    return res.status(401).json({ error: result.error })
  }
  res.json({ token: result.token, refreshToken: result.refreshToken, expiresIn: result.expiresIn })
})

app.post("/api/auth/password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  const result = await changePassword(req.adminToken, currentPassword, newPassword)
  if (!result.ok) {
    return res.status(400).json({ error: result.message })
  }
  res.json({ ok: true, message: "Contraseña actualizada correctamente" })
})

/* ---------- inscripciones ---------- */

const FIELDS_7 = ["apellido", "nombre", "c_documento", "numeroDocumento", "cuil", "fechaNacimiento", "c_sexo"]
const INTERNAL_FIELDS = [
  "domicilio",
  "departamento",
  "celular",
  "celularUrgencia",
  "email",
  "careerId",
  "courseTitle",
  "c_pais_nacimiento",
  "c_provincia_nacimiento",
  "lugar_nacimiento",
  "c_nacionalidad",
  "especialidad",
  "anioDivision",
  "c_discapacidad",
  "c_pueblo_indigena",
  "cud",
  "problematicaIntegrado",
  "fotoDni",
  "fotoCertificado",
  "fotoCuil",
]

function validateRequeridos(body) {
  const faltantes = FIELDS_7.filter((f) => !body[f] || !String(body[f]).trim())
  if (faltantes.length) {
    return "Por favor, completá todos los datos obligatorios del formulario."
  }
  if (!/^\d{11}$/.test(String(body.cuil))) return "El CUIL ingresado no es válido (debe tener 11 dígitos numéricos)."
  if (!/^\d+$/.test(String(body.numeroDocumento))) return "El número de documento debe contener únicamente números."
  const fecha = String(body.fechaNacimiento)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "La fecha de nacimiento no es válida."
  if (!["M", "F", "X"].includes(String(body.c_sexo).toUpperCase())) return "El sexo seleccionado no es válido."
  return null
}

/**
 * Respuestas a los campos que agregó el admin (ids `x_…`). Solo se aceptan las
 * de campos que existen y están visibles en el esquema guardado; el resto se
 * descarta. Devuelve { extras } o { error } si falta un obligatorio.
 */
async function resolverExtras(raw) {
  let parsed = raw
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {}
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) parsed = {}

  const { campos } = await getFormOptions()
  const extras = {}
  for (const campo of campos) {
    if (!campo.id.startsWith("x_") || !campo.visible) continue
    let valor = String(parsed[campo.id] ?? "").trim().slice(0, 500)
    const valida = (v) => (campo.options ?? []).some((o) => o.value === v)
    if (valor && (campo.kind === "select" || campo.kind === "radio") && !valida(valor)) valor = ""
    if (valor && campo.kind === "checkbox") {
      // Selección múltiple: valores separados por "|"; se descartan los que no son opciones.
      valor = [...new Set(valor.split("|").map((v) => v.trim()).filter((v) => v && valida(v)))].join(" | ")
    }
    if (!valor) {
      if (campo.required) return { error: `Completá el campo ${campo.label}.` }
      continue
    }
    extras[campo.id] = valor
  }
  return { extras }
}

const uploader = upload.fields([
  { name: "fotoDni", maxCount: 1 },
  { name: "fotoCertificado", maxCount: 1 },
  { name: "fotoCuil", maxCount: 1 },
])

const inscripcionUpload = (req, res, next) => {
  uploader(req, res, (err) => {
    if (err) {
      console.error("[multer error]", err.message)
      return res.status(400).json({
        error: err.code === "LIMIT_FILE_SIZE"
          ? "Cada imagen debe pesar menos de 10MB."
          : err.message || "No se pudieron adjuntar los archivos.",
      })
    }
    next()
  })
}

/**
 * Determina si la inscripción recién guardada entró como titular o quedó como
 * suplente.
 *
 * Queda como suplente cuando:
 *  - la carrera/curso está marcada como no disponible ("Sin cupo") en la config, o
 *  - tiene cupo de titulares cargado y su posición por orden de llegada lo supera.
 * Sin cupo cargado (0) no se limita el registro: todos entran como titulares.
 *
 * Se llama con el record ya insertado: la posición sale de contar las
 * inscripciones hasta su `createdAt`, el mismo criterio que usa el panel. Si
 * se contara antes de insertar, varias inscripciones simultáneas verían el
 * mismo último lugar libre y todas se creerían titulares.
 */
async function resolverHayCupo(record) {
  const id = String(record.careerId || "").trim()
  if (!id) return true
  const config = await getConfig()
  const item = config[id]
  // Sin config para ese id no hay límite conocido: se registra con normalidad.
  if (!item) return true
  if (item.available === false) return false
  const cupo = parseCantidadTitulares(item.cantidadTitulares) ?? 0
  if (cupo <= 0) return true
  const posicion = await positionInCareer(id, record.createdAt)
  return posicion <= cupo
}

/*
 * Permisos de subida directa a Storage para las dos fotos del formulario.
 * El navegador sube con estos permisos y después manda la inscripción en
 * JSON con las claves (`fotoDniKey`, `fotoCertificadoKey`): las fotos nunca
 * pasan por la memoria de esta instancia.
 *
 * Sin Supabase responde `direct: false` y el formulario usa el multipart.
 */
app.post("/api/contacto", contactLimiter, async (req, res) => {
  // Campo trampa: las personas no lo ven ni lo completan, los bots sí.
  // Se responde "ok" igual para no darles pistas.
  if (req.body?.website) return res.json({ ok: true })

  const parsed = validateContact(req.body)
  if (!parsed.ok) return res.status(400).json({ error: parsed.error })

  if (!isContactConfigured()) {
    console.error("[contacto] Faltan RESEND_API_KEY o CONTACT_TO_EMAIL: no se pudo enviar la consulta.")
    return res.status(503).json({ error: "El envío de consultas no está disponible por el momento. Llamanos al +54 264 581-5111." })
  }

  try {
    await sendContactEmail(parsed.data)
  } catch (e) {
    console.error("[contacto] fallo el envío:", e?.message || e)
    return res.status(502).json({ error: "No pudimos enviar tu consulta. Probá de nuevo en unos minutos o llamanos al +54 264 581-5111." })
  }
  res.status(201).json({ ok: true })
})

/*
 * El formulario pregunta si el DNI ya está inscripto al terminar el primer
 * paso, para avisarlo ahí y no después de completar todo y subir las fotos.
 * Solo responde sí/no (ningún dato de la inscripción). El tope por IP frena
 * el barrido de documentos; el chequeo definitivo sigue siendo el del envío.
 */
const verificarDocumentoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas consultas desde esta conexión. Probá más tarde." },
})

app.post("/api/inscripciones/verificar-documento", verificarDocumentoLimiter, async (req, res) => {
  const doc = String(req.body?.numeroDocumento ?? "").trim()
  if (!/^\d{6,8}$/.test(doc)) return res.status(400).json({ error: "Número de documento inválido" })
  const existente = await findByDocumento(doc)
  res.json({ inscripto: Boolean(existente) })
})

app.post("/api/inscripciones/upload-urls", uploadUrlsLimiter, async (req, res) => {
  if (!directUploadsEnabled) return res.json({ direct: false })
  const tickets = await createUploadTickets(req.body?.files)
  res.json({ direct: true, uploads: tickets })
})

app.post("/api/inscripciones", inscriptionLimiter, inscripcionUpload, async (req, res) => {
  const body = req.body || {}

  /*
   * Dos formas de recibir las fotos:
   *  - directa: el navegador ya las subió a `pending/` y manda las claves;
   *  - multipart: vienen en el request (modo local, o un front viejo en caché).
   */
  // La foto del CUIL es opcional para el servidor: un front en caché que
  // todavía no la manda no debe romper la inscripción.
  const cuilKey = typeof body.fotoCuilKey === "string" && body.fotoCuilKey ? body.fotoCuilKey : ""
  const directKeys = [body.fotoDniKey, body.fotoCertificadoKey, ...(cuilKey ? [cuilKey] : [])]
  const esDirecta = !req.files?.fotoDni?.[0] && !req.files?.fotoCertificado?.[0] &&
    directKeys.some((k) => typeof k === "string" && k)
  // Si el envío se rechaza antes de reclamar las fotos, se borran ya: la
  // persona vuelve a subirlas en el próximo intento.
  const rechazar = async (status, error) => {
    if (esDirecta) await discardPendingUploads(directKeys)
    return res.status(status).json({ error })
  }

  const err = validateRequeridos(body)
  if (err) return rechazar(400, err)

  const extrasResult = await resolverExtras(body.extras)
  if (extrasResult.error) return rechazar(400, extrasResult.error)

  // Un front anterior a la ficha médica no la manda: se acepta sin ficha
  // para no romper inscripciones mientras se despliega el cambio.
  const fichaResult = body.fichaMedica === undefined ? { ficha: null } : resolverFichaMedica(body.fichaMedica)
  if (fichaResult.error) return rechazar(400, fichaResult.error)

  if (esDirecta && !directUploadsEnabled) {
    return rechazar(400, "Faltan adjuntar las fotos del DNI y del certificado.")
  }
  if (esDirecta) {
    if (!isPendingKey(body.fotoDniKey)) return rechazar(400, "Falta adjuntar la foto del DNI")
    if (!isPendingKey(body.fotoCertificadoKey)) {
      return rechazar(400, "Falta adjuntar la foto del certificado de estudios")
    }
    if (cuilKey && !isPendingKey(cuilKey)) return rechazar(400, "Falta adjuntar la foto del CUIL")
    if (new Set(directKeys).size !== directKeys.length) {
      return rechazar(400, "El DNI, el certificado y el CUIL tienen que ser archivos distintos.")
    }
  } else {
    if (!req.files?.fotoDni?.[0]) {
      return rechazar(400, "Falta adjuntar la foto del DNI")
    }
    if (!req.files?.fotoCertificado?.[0]) {
      return rechazar(400, "Falta adjuntar la foto del certificado de estudios")
    }
  }

  const email = body.email ? String(body.email).trim() : ""
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return rechazar(400, "Correo electrónico inválido")
  }

  /*
   * Una persona no puede inscribirse dos veces: el documento es la clave
   * natural del alumno. Este chequeo es el camino rápido (evita guardar fotos
   * de alguien que ya está inscripto); la garantía real es el índice único de
   * la base: dos envíos simultáneos del mismo documento pueden pasar los dos
   * por acá, y el segundo lo frena `createAlumno` con el mismo 409.
   */
  const duplicada = await findByDocumento(body.numeroDocumento)
  if (duplicada) return rechazar(409, DUPLICATE_MESSAGE)

  /*
   * Las dos fotos se guardan (o se reclaman de `pending/`) en paralelo. Si
   * alguna falla, o si después falla el guardado, se borran las que sí
   * quedaron: si no, ocupan el bucket sin pertenecer a ninguna inscripción.
   */
  const subidas = await Promise.allSettled(
    esDirecta
      ? directKeys.map((key) => claimDirectUpload(key))
      : [
          saveUpload(req.files.fotoDni[0]),
          saveUpload(req.files.fotoCertificado[0]),
          ...(req.files.fotoCuil?.[0] ? [saveUpload(req.files.fotoCuil[0])] : []),
        ],
  )
  const subidasOk = subidas.filter((s) => s.status === "fulfilled").map((s) => s.value)
  const limpiarSubidas = async () => {
    await Promise.allSettled(subidasOk.map((key) => deleteUpload(key)))
    // Las que no se llegaron a reclamar siguen en pending/.
    if (esDirecta) await discardPendingUploads(directKeys)
  }

  const fallida = subidas.find((s) => s.status === "rejected")
  if (fallida) {
    await limpiarSubidas()
    throw fallida.reason
  }
  const [fotoDni, fotoCertificado, fotoCuil = ""] = subidasOk

  let record
  try {
    record = await createAlumno({
      apellido: String(body.apellido).trim(),
      nombre: String(body.nombre).trim(),
      c_documento: String(body.c_documento).trim(),
      numeroDocumento: String(body.numeroDocumento).trim(),
      cuil: String(body.cuil).trim(),
      fechaNacimiento: String(body.fechaNacimiento).trim(),
      c_sexo: String(body.c_sexo).toUpperCase(),
      c_pais_nacimiento: body.c_pais_nacimiento ? String(body.c_pais_nacimiento).trim() : "",
      c_provincia_nacimiento: body.c_provincia_nacimiento ? String(body.c_provincia_nacimiento).trim() : "",
      lugar_nacimiento: body.lugar_nacimiento ? String(body.lugar_nacimiento).trim() : "",
      c_nacionalidad: body.c_nacionalidad ? String(body.c_nacionalidad).trim() : "",
      email,
      celular: body.celular ? String(body.celular).trim() : "",
      celularUrgencia: body.celularUrgencia ? String(body.celularUrgencia).trim() : "",
      domicilio: body.domicilio ? String(body.domicilio).trim() : "",
      departamento: body.departamento ? String(body.departamento).trim() : "",
      careerId: body.careerId ? String(body.careerId) : "",
      courseTitle: body.courseTitle ? String(body.courseTitle) : "",
      especialidad: body.especialidad ? String(body.especialidad).trim() : "",
      anioDivision: body.anioDivision ? String(body.anioDivision).trim() : "",
      c_discapacidad: body.c_discapacidad ? String(body.c_discapacidad).trim() : "",
      cud: body.cud ? String(body.cud).trim() : "",
      c_pueblo_indigena: body.c_pueblo_indigena ? String(body.c_pueblo_indigena).trim() : "",
      problematicaIntegrado: body.problematicaIntegrado ? String(body.problematicaIntegrado).trim() : "",
      ...(Object.keys(extrasResult.extras).length ? { extras: extrasResult.extras } : {}),
      ...(fichaResult.ficha ? { fichaMedica: fichaResult.ficha } : {}),
      fotoDni,
      fotoCertificado,
      fotoCuil,
    })
  } catch (err) {
    await limpiarSubidas()
    throw err
  }

  /*
   * La inscripción ya está guardada: si contar la posición falla, no se puede
   * responder con error (la persona reintentaría y chocaría con "ya existe").
   * Se informa como titular y el panel muestra la condición real.
   */
  const hayCupo = await resolverHayCupo(record).catch((err) => {
    console.error("[cupo] no se pudo calcular la posición:", err?.message || err)
    return true
  })

  res.status(201).json({
    id: record.id,
    nombre: `${record.apellido} ${record.nombre}`,
    hayCupo,
    message: hayCupo
      ? "Preinscripción registrada. Imprimí el contrato y acercate a la administración para confirmarla."
      : "Cupo completo: quedaste preinscripto como suplente.",
  })
})

app.get("/api/inscripciones", requireAdmin, async (req, res) => {
  // Con `page` responde paginado (panel de inscripciones); sin él, la lista completa.
  if (req.query.page !== undefined) {
    const { page, pageSize, q, career } = req.query
    return res.json(
      await getPage({
        page,
        pageSize,
        q: typeof q === "string" ? q.slice(0, 100) : "",
        career: typeof career === "string" ? career.slice(0, 200) : "",
      }),
    )
  }
  res.json({ inscripciones: await getAll() })
})

app.put("/api/inscripciones/:id", requireAdmin, async (req, res) => {
  const body = req.body || {}
  const patch = {}
  for (const f of [...FIELDS_7, ...INTERNAL_FIELDS]) {
    if (body[f] !== undefined) patch[f] = typeof body[f] === "string" ? body[f].trim() : body[f]
  }
  const updated = await updateAlumno(req.params.id, patch)
  if (!updated) return res.status(404).json({ error: "No existe la inscripción" })
  res.json({ inscripcion: updated })
})

app.post("/api/inscripciones/:id/archivos", requireAdmin, inscripcionUpload, async (req, res) => {
  const alumno = await getById(req.params.id)
  if (!alumno) return res.status(404).json({ error: "No existe la inscripción" })

  const patch = {}
  if (req.files?.fotoDni?.[0]) {
    patch.fotoDni = await saveUpload(req.files.fotoDni[0])
    await deleteUpload(alumno.fotoDni)
  } else if (req.body?.removeFotoDni === "true") {
    patch.fotoDni = ""
    await deleteUpload(alumno.fotoDni)
  }

  if (req.files?.fotoCertificado?.[0]) {
    patch.fotoCertificado = await saveUpload(req.files.fotoCertificado[0])
    await deleteUpload(alumno.fotoCertificado)
  } else if (req.body?.removeFotoCertificado === "true") {
    patch.fotoCertificado = ""
    await deleteUpload(alumno.fotoCertificado)
  }

  if (req.files?.fotoCuil?.[0]) {
    patch.fotoCuil = await saveUpload(req.files.fotoCuil[0])
    await deleteUpload(alumno.fotoCuil)
  } else if (req.body?.removeFotoCuil === "true") {
    patch.fotoCuil = ""
    await deleteUpload(alumno.fotoCuil)
  }

  const updated = await updateAlumno(req.params.id, patch)
  res.json({ inscripcion: updated })
})

app.delete("/api/inscripciones/:id", requireAdmin, async (req, res) => {
  const alumno = await getById(req.params.id)
  if (alumno) {
    await deleteUpload(alumno.fotoDni)
    await deleteUpload(alumno.fotoCertificado)
    await deleteUpload(alumno.fotoCuil)
  }
  if (!(await deleteAlumno(req.params.id))) {
    return res.status(404).json({ error: "No existe la inscripción" })
  }
  res.json({ ok: true })
})

/* ---------- PDFs ---------- */

async function sendPdf(res, bytes, filename) {
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.send(Buffer.from(bytes))
}

app.get("/api/inscripciones/:id/ficha", requireAdmin, async (req, res) => {
  const alumno = await getById(req.params.id)
  if (!alumno) return res.status(404).json({ error: "No existe la inscripción" })
  try {
    const { campos } = await getFormOptions()
    const bytes = await generarFichaPdf(alumno, campos)
    const nombre = `${(alumno.apellido || "alumno").replace(/[^a-zA-Z0-9]+/g, "_")}_ficha.pdf`
    await sendPdf(res, bytes, nombre)
  } catch (err) {
    // El motivo real (tipografía faltante, error de pdfmake) se queda en el
    // log; el cliente recibe un mensaje genérico.
    console.error("[pdf] no se pudo generar la ficha:", err?.stack || err?.message || err)
    res.status(500).json({ error: "No se pudo generar la ficha" })
  }
})

/* ---------- config de cursos ---------- */

app.get("/api/config", async (_req, res) => {
  const [cursos, formOptions, contract] = await Promise.all([getPublicConfig(), getFormOptions(), getContract()])
  res.json({ cursos, formOptions, contract })
})

/**
 * Contrato personalizado. Lo lee cualquiera (llega en `GET /api/config`, lo
 * necesita el form público para imprimirlo); subirlo o quitarlo es del admin.
 */
app.put("/api/contract", requireAdmin, async (req, res) => {
  try {
    const contract = await updateContract(req.body || {})
    res.json({ contract })
  } catch (err) {
    if (err instanceof PublicError) {
      return res.status(err.status || 400).json({ error: err.message })
    }
    throw err
  }
})

app.delete("/api/contract", requireAdmin, async (_req, res) => {
  try {
    await resetContract()
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof PublicError) {
      return res.status(err.status || 400).json({ error: err.message })
    }
    throw err
  }
})

/**
 * Opciones del formulario de inscripción (los años y divisiones que ofrece el
 * select). El form las lee sin autenticar porque llegan dentro de
 * `GET /api/config`; guardarlas es exclusivo del admin.
 */
app.put("/api/form-options", requireAdmin, async (req, res) => {
  try {
    const options = await updateFormOptions(req.body || {})
    res.json({ options })
  } catch (err) {
    if (err instanceof PublicError) {
      return res.status(err.status || 400).json({ error: err.message })
    }
    throw err
  }
})

const careerUploadMiddleware = (req, res, next) => {
  careerUpload(req, res, (err) => {
    if (err) {
      console.error("[multer error]", err.message)
      return res.status(400).json({
        error: err.code === "LIMIT_FILE_SIZE"
          ? "El archivo supera el tamaño máximo permitido (50MB para videos)."
          : err.message || "No se pudieron adjuntar los archivos.",
      })
    }
    next()
  })
}

/**
 * Borra un curso o una carrera de la configuración y limpia los archivos que
 * había subido el admin: si no, quedan huérfanos en el bucket de por vida.
 *
 * Las imágenes de fábrica (las del repo, servidas como estáticas) no se tocan:
 * `deleteUpload` solo Borra lo que está guardado en Storage.
 */
async function removeConfigItem(id) {
  const item = (await getConfig())[id]
  if (!item) return false

  await deleteUpload(item.image)
  await deleteUpload(item.video)
  for (const teacher of item.teachers || []) {
    await deleteUpload(teacher?.image)
  }
  return deleteItem(id)
}

app.delete("/api/config/:id", requireAdmin, async (req, res) => {
  if (!(await removeConfigItem(req.params.id))) {
    return res.status(404).json({ error: "No existe ese curso o carrera" })
  }
  res.json({ ok: true })
})

app.put("/api/config/:id", requireAdmin, careerUploadMiddleware, async (req, res) => {
  const body = req.body || {}

  /*
   * El panel deployed antes del endpoint DELETE mandaba `delete=true` por el
   * mismo PUT. Se sigue aceptando para que un deploy viejo del front no rompa
   * el botón de eliminar.
   */
  if (body.delete === "true" || body.delete === true) {
    if (!(await removeConfigItem(req.params.id))) {
      return res.status(404).json({ error: "No existe ese curso o carrera" })
    }
    return res.json({ item: null, deleted: true })
  }

  const cfg = await getConfig()
  const existing = cfg[req.params.id] || { image: "", available: true }

  /*
   * Los archivos llegan con el nombre del campo: "image", "video" y
   * "teacherImage_<índice>" para las fotos de los docentes. El índice va en
   * el nombre porque en un multipart no se puede anidar un archivo dentro del
   * JSON del listado.
   */
  const files = { image: [], video: [], teacherImages: [] }
  for (const file of req.files || []) {
    if (file.fieldname === "image") files.image.push(file)
    else if (file.fieldname === "video") files.video.push(file)
    else if (file.fieldname.startsWith("teacherImage_")) {
      const index = Number(file.fieldname.slice("teacherImage_".length))
      if (Number.isInteger(index) && index >= 0) files.teacherImages[index] = file
    }
  }

  const patch = { ...existing }
  if (body.available !== undefined) {
    patch.available = body.available === "true" || body.available === true
  }
  for (const [key, max] of Object.entries(TEXT_LIMITS)) {
    if (typeof body[key] === "string") {
      patch[key] = body[key].trim().slice(0, max)
    }
  }
  if (typeof body.teacher === "string") {
    patch.teacher = body.teacher.trim().slice(0, 120)
  }
  if (body.category !== undefined) {
    patch.category = VALID_CATEGORIES.has(body.category) ? body.category : undefined
  }
  /*
   * Las listas se guardan aunque vengan vacías: si el panel las manda
   * siempre, un array vacío significa "el admin lo borró" y no "no me
   * digas nada". Sin esto no se podría limpiar un campo desde el panel.
   */
  if (body.syllabus !== undefined) patch.syllabus = normalizeSyllabus(body.syllabus)
  if (body.salidaLaboral !== undefined) patch.salidaLaboral = normalizeList(body.salidaLaboral)
  if (body.perfilEgresado !== undefined) patch.perfilEgresado = normalizeList(body.perfilEgresado)
  if (body.cantidadTitulares !== undefined) {
    const cupo = parseCantidadTitulares(body.cantidadTitulares)
    if (cupo === null) {
      return res.status(400).json({
        error: `El cupo de titulares debe ser un número entero entre 0 y ${MAX_CANTIDAD_TITULARES}.`,
      })
    }
    patch.cantidadTitulares = cupo
  }

  /*
   * Docentes: el panel manda el listado ya armado en JSON. Las fotos van en
   * `teacherImages` como archivos sueltos, en el mismo orden, porque no hay
   * forma de meter un archivo adentro de un JSON en un multipart.
   */
  if (body.teachers !== undefined) {
    const teachers = normalizeTeachers(body.teachers)
    const previous = Array.isArray(existing.teachers) ? existing.teachers : []
    const newImages = files.teacherImages

    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i]
      // El admin pidió borrar la foto: se elimina el archivo, no solo el link.
      if (teacher.removeImage) {
        await deleteUpload(teacher.image || previous[i]?.image)
        delete teacher.image
        delete teacher.removeImage
        continue
      }
      const file = newImages[i]
      if (file) {
        await deleteUpload(previous[i]?.image)
        // Los docentes son parte de la página pública, no un documento de
        // identidad: van al bucket público.
        teacher.image = await saveUpload(file, { visibility: "public" })
      }
    }

    // Docentes que quedaron fuera del listado: sus fotos no se usan más, así
    // que se limpian para no dejar archivos huérfanos en el bucket.
    for (let i = teachers.length; i < previous.length; i++) {
      if (previous[i]?.image) await deleteUpload(previous[i].image)
    }

    patch.teachers = teachers
    patch.teacher = teachers[0]?.name || ""
  }

  if (body.removeImage === "true") {
    await deleteUpload(existing.image)
    patch.image = ""
  }
  if (files.image?.[0]) {
    await deleteUpload(existing.image)
    // La imagen de un curso se muestra en el home público: va al bucket
    // público, no al de los documentos de identidad.
    patch.image = await saveUpload(files.image[0], { visibility: "public" })
  }
  if (body.removeVideo === "true") {
    await deleteUpload(existing.video)
    patch.video = ""
  }
  if (files.video?.[0]) {
    await deleteUpload(existing.video)
    patch.video = await saveUpload(files.video[0], { visibility: "public", kind: "video" })
  }

  const updated = await updateItem(req.params.id, patch)
  res.json({ item: updated })
})

/* ---------- produccion ---------- */

const SERVE_STATIC = process.env.SERVE_STATIC === "1" || (!process.env.SERVE_STATIC && fs.existsSync(DIST_DIR))

app.use("/api", apiLimiter, (_req, res) => res.status(404).json({ error: "Endpoint no encontrado" }))

if (SERVE_STATIC) {
  app.use(express.static(DIST_DIR))
  app.get(/.*/, (_req, res) => res.sendFile(path.join(DIST_DIR, "index.html")))
}

/* ---------- errores ---------- */

app.use((err, _req, res, _next) => {
  if (res.headersSent) return
  const status = err?.status || err?.statusCode || (err?.name === "PublicError" ? 400 : 500)

  if (err?.name === "PublicError" || err?.expose === true) {
    const message = err?.message || "Solicitud inválida"
    console.warn(`[error public] ${message}`)
    return res.status(status).json({ error: message })
  }

  // Nunca se filtra el detalle al cliente: se loguea completo para poder
  // investigar en los logs de Render.
  console.error("[error interno]", err?.stack || err?.message || err)
  res.status(500).json({ error: "Error interno del servidor" })
})

/* ---------- arranque ---------- */

await ensureBuckets()

/*
 * Limpieza de fotos subidas a pending/ por formularios que no se terminaron
 * de enviar. Corre al arrancar y cada hora; un fallo solo se loguea.
 */
const limpiarPendientes = () =>
  cleanupPendingUploads().catch((err) => console.warn("[limpieza] falló:", err?.message || err))
limpiarPendientes()
setInterval(limpiarPendientes, 60 * 60 * 1000).unref()

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  console.log(`Datos: ${supabaseEnabled ? "Supabase" : "archivos locales (respaldo)"}`)
})