import express from "express"
import cors from "cors"
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
import { getConfig, updateItem, parseCantidadTitulares, MAX_CANTIDAD_TITULARES } from "./site-config.mjs"
import {
  authenticate,
  changePassword,
  verifyToken,
  isDefaultPassword,
  isLocked,
  lockRemainingMs,
  registerFailure,
  resetFailures,
} from "./auth.mjs"
import { upload, saveUpload, deleteUpload, UPLOADS_URL_PREFIX } from "./storage.mjs"
import { ensureUploadsBucket, supabaseEnabled } from "./supabase.mjs"
import { generarFichaPdf } from "./pdf.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, "data", "uploads")
const DIST_DIR = path.join(__dirname, "..", "dist")

const app = express()
const PORT = process.env.PORT || 3001

/* ---------- CORS ---------- */
/* El frontend vive en Vercel, la API en Render: hay que permitir ese origen. */

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean)

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      if (!ALLOWED_ORIGINS.length) return cb(null, true)
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
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token
  if (!(await verifyToken(token))) {
    return res.status(401).json({ error: "No autorizado" })
  }
  req.adminToken = token
  next()
}

app.post("/api/auth/login", async (req, res) => {
  const ip = req.ip || (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown"
  if (isLocked(ip)) {
    const mins = Math.max(1, Math.ceil(lockRemainingMs(ip) / 60000))
    return res.status(429).json({ error: `Demasiados intentos fallidos. Probá de nuevo en ${mins} min.` })
  }

  const { email, password } = req.body || {}
  const result = await authenticate(email, password)
  if (result.error) {
    registerFailure(ip)
    return res.status(401).json({ error: result.error })
  }

  resetFailures(ip)
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

app.post("/api/inscripciones", inscripcionUpload, async (req, res) => {
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
    res.status(500).json({ error: "No se pudo generar la ficha", detalle: err.message })
  }
})

/* ---------- config de cursos ---------- */

app.get("/api/config", async (_req, res) => {
  res.json({ cursos: await getConfig() })
})

app.put("/api/config/:id", requireAdmin, upload.single("image"), async (req, res) => {
  const cfg = await getConfig()
  const existing = cfg[req.params.id] || { image: "", available: true }

  const patch = { ...existing }
  if (req.body.available !== undefined) {
    patch.available = req.body.available === "true" || req.body.available === true
  }
  const textFields = { title: 120, inscriptionDate: 60, month: 40, schedule: 200, teacher: 120, ejes: 2000 }
  for (const [key, max] of Object.entries(textFields)) {
    if (typeof req.body[key] === "string") {
      patch[key] = req.body[key].trim().slice(0, max)
    }
  }
  if (req.body.cantidadTitulares !== undefined) {
    const cupo = parseCantidadTitulares(req.body.cantidadTitulares)
    if (cupo === null) {
      return res.status(400).json({
        error: `El cupo de titulares debe ser un número entero entre 0 y ${MAX_CANTIDAD_TITULARES}.`,
      })
    }
    patch.cantidadTitulares = cupo
  }
  if (req.body.removeImage === "true") {
    await deleteUpload(existing.image)
    patch.image = ""
  }
  if (req.file) {
    await deleteUpload(existing.image)
    patch.image = await saveUpload(req.file)
  }

  const updated = await updateItem(req.params.id, patch)
  res.json({ item: updated })
})

/* ---------- produccion ---------- */

const SERVE_STATIC = process.env.SERVE_STATIC === "1" || (!process.env.SERVE_STATIC && fs.existsSync(DIST_DIR))

app.use("/api", (_req, res) => res.status(404).json({ error: "Endpoint no encontrado" }))

if (SERVE_STATIC) {
  app.use(express.static(DIST_DIR))
  app.get(/.*/, (_req, res) => res.sendFile(path.join(DIST_DIR, "index.html")))
}

/* ---------- errores ---------- */

app.use((err, _req, res, _next) => {
  console.error("[error]", err?.message || err)
  if (res.headersSent) return
  const status = err?.status || err?.statusCode || 500
  res.status(status).json({ error: err?.message || "Error interno del servidor" })
})

/* ---------- arranque ---------- */

await ensureUploadsBucket()

app.listen(PORT, () => {
  console.log(`Servidor corrriendo en http://localhost:${PORT}`)
  console.log(`Datos: ${supabaseEnabled ? "Supabase" : "archivos locales (respaldo)"}`)
  if (isDefaultPassword()) {
    console.warn("[aviso] Se está usando la contraseña por defecto. Creá la variable ADMIN_PASSWORD en el archivo .env")
  }
  if (supabaseEnabled && !ALLOWED_ORIGINS.length) {
    console.warn("[aviso] No definiste ALLOWED_ORIGIN: la API aceptará requests desde cualquier origen.")
  }
})