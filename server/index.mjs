import express from "express"
import cors from "cors"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  getAll,
  getById,
  createAlumno,
  updateAlumno,
  deleteAlumno,
} from "./db.mjs"
import {
  getConfig,
  updateItem,
  parseCantidadTitulares,
  MAX_CANTIDAD_TITULARES,
  normalizeList,
  normalizeSyllabus,
  normalizeTeachers,
  TEXT_LIMITS,
  VALID_CATEGORIES,
} from "./site-config.mjs"
import {
  authenticate,
  changePassword,
  verifyToken,
  isDefaultPassword,
  hasUsableAdminConfig,
} from "./auth.mjs"
import { upload, careerUpload, saveUpload, deleteUpload, UPLOADS_URL_PREFIX } from "./storage.mjs"
import { ensureBuckets, supabaseEnabled } from "./supabase.mjs"
import { generarFichaPdf } from "./pdf.mjs"
import { PublicError } from "./errors.mjs"

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
 * alto. Igual pone un techo al antiflood: cada request puede arrastrar hasta
 * 20MB de adjuntos en memoria.
 */
const inscriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas inscripciones desde esta conexión. Probá más tarde." },
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
    return res.status(401).json({ error: "No autorizado" })
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

  res.json({ token: result.token, email: result.user?.email || String(email).trim().toLowerCase() })
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
  "c_discapacidad",
  "c_pueblo_indigena",
  "cud",
  "problematicaIntegrado",
  "fotoDni",
  "fotoCertificado",
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

const uploader = upload.fields([
  { name: "fotoDni", maxCount: 1 },
  { name: "fotoCertificado", maxCount: 1 },
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

app.post("/api/inscripciones", inscriptionLimiter, inscripcionUpload, async (req, res) => {
  const body = req.body || {}
  const err = validateRequeridos(body)
  if (err) return res.status(400).json({ error: err })

  const email = body.email ? String(body.email).trim() : ""
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Correo electrónico inválido" })
  }

  let fotoDni = ""
  let fotoCertificado = ""

  if (req.files?.fotoDni?.[0]) fotoDni = await saveUpload(req.files.fotoDni[0])
  if (req.files?.fotoCertificado?.[0]) fotoCertificado = await saveUpload(req.files.fotoCertificado[0])
  const record = await createAlumno({
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
    c_discapacidad: body.c_discapacidad ? String(body.c_discapacidad).trim() : "",
    cud: body.cud ? String(body.cud).trim() : "",
    c_pueblo_indigena: body.c_pueblo_indigena ? String(body.c_pueblo_indigena).trim() : "",
    problematicaIntegrado: body.problematicaIntegrado ? String(body.problematicaIntegrado).trim() : "",
    fotoDni,
    fotoCertificado,
  })

  res.status(201).json({
    id: record.id,
    nombre: `${record.apellido} ${record.nombre}`,
    message: "Inscripción registrada correctamente",
  })
})

app.get("/api/inscripciones", requireAdmin, async (_req, res) => {
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

  const updated = await updateAlumno(req.params.id, patch)
  res.json({ inscripcion: updated })
})

app.delete("/api/inscripciones/:id", requireAdmin, async (req, res) => {
  const alumno = await getById(req.params.id)
  if (alumno) {
    await deleteUpload(alumno.fotoDni)
    await deleteUpload(alumno.fotoCertificado)
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
    const bytes = await generarFichaPdf(alumno)
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
  res.json({ cursos: await getConfig() })
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

app.put("/api/config/:id", requireAdmin, careerUploadMiddleware, async (req, res) => {
  const cfg = await getConfig()
  const existing = cfg[req.params.id] || { image: "", available: true }
  const body = req.body || {}

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  console.log(`Datos: ${supabaseEnabled ? "Supabase" : "archivos locales (respaldo)"}`)
})