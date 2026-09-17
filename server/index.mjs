import express from "express"
import cors from "cors"
import multer from "multer"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"
import {
  getAll,
  getById,
  createAlumno,
  updateAlumno,
  deleteAlumno,
} from "./db.mjs"
import { getConfig, updateItem } from "./site-config.mjs"
import {
  changePassword,
  checkCredentials,
  issueToken,
  verifyToken,
  isDefaultPassword,
  isLocked,
  lockRemainingMs,
  registerFailure,
  resetFailures,
} from "./auth.mjs"
import { generarFichaPdf } from "./pdf.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, "data", "uploads")
const DIST_DIR = path.join(__dirname, "..", "dist")

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg"
    cb(null, `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

app.use("/uploads", express.static(UPLOADS_DIR))

/* ---------- auth ---------- */

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token
  if (!verifyToken(token)) {
    return res.status(401).json({ error: "No autorizado" })
  }
  next()
}

app.post("/api/auth/login", (req, res) => {
  const ip = req.ip || (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown"
  if (isLocked(ip)) {
    const mins = Math.max(1, Math.ceil(lockRemainingMs(ip) / 60000))
    return res.status(429).json({ error: `Demasiados intentos fallidos. Probá de nuevo en ${mins} min.` })
  }

  const { email, password } = req.body || {}
  if (!checkCredentials(email, password)) {
    registerFailure(ip)
    return res.status(401).json({ error: "Credenciales incorrectas" })
  }

  resetFailures(ip)
  res.json({ token: issueToken() })
})

app.post("/api/auth/password", requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  const result = changePassword(currentPassword, newPassword)
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
      console.error("[multer error]", err)
      return res.status(400).json({ error: "No se pudieron adjuntar los archivos. Verificá que las imágenes pesen menos de 10MB." })
    }
    next()
  })
}

app.post("/api/inscripciones", inscripcionUpload, (req, res) => {
  const body = req.body || {}
  const err = validateRequeridos(body)
  if (err) return res.status(400).json({ error: err })

  const email = body.email ? String(body.email).trim() : ""
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Correo electrónico inválido" })
  }

  let fotoDni = ""
  let fotoCertificado = ""

  if (req.files?.fotoDni?.[0]) {
    fotoDni = `/uploads/${req.files.fotoDni[0].filename}`
  }
  if (req.files?.fotoCertificado?.[0]) {
    fotoCertificado = `/uploads/${req.files.fotoCertificado[0].filename}`
  }

  const record = createAlumno({
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

app.get("/api/inscripciones", requireAdmin, (_req, res) => {
  res.json({ inscripciones: getAll() })
})

app.put("/api/inscripciones/:id", requireAdmin, (req, res) => {
  const body = req.body || {}
  const patch = {}
  for (const f of [...FIELDS_7, ...INTERNAL_FIELDS]) {
    if (body[f] !== undefined) patch[f] = typeof body[f] === "string" ? body[f].trim() : body[f]
  }
  const updated = updateAlumno(req.params.id, patch)
  if (!updated) return res.status(404).json({ error: "No existe la inscripción" })
  res.json({ inscripcion: updated })
})

app.post("/api/inscripciones/:id/archivos", requireAdmin, inscripcionUpload, (req, res) => {
  const alumno = getById(req.params.id)
  if (!alumno) return res.status(404).json({ error: "No existe la inscripción" })

  const patch = {}
  if (req.files?.fotoDni?.[0]) {
    patch.fotoDni = `/uploads/${req.files.fotoDni[0].filename}`
  } else if (req.body?.removeFotoDni === "true") {
    patch.fotoDni = ""
  }

  if (req.files?.fotoCertificado?.[0]) {
    patch.fotoCertificado = `/uploads/${req.files.fotoCertificado[0].filename}`
  } else if (req.body?.removeFotoCertificado === "true") {
    patch.fotoCertificado = ""
  }

  const updated = updateAlumno(req.params.id, patch)
  res.json({ inscripcion: updated })
})

app.delete("/api/inscripciones/:id", requireAdmin, (req, res) => {
  if (!deleteAlumno(req.params.id)) return res.status(404).json({ error: "No existe la inscripción" })
  res.json({ ok: true })
})

/* ---------- PDFs ---------- */

async function sendPdf(res, bytes, filename) {
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.send(Buffer.from(bytes))
}

app.get("/api/inscripciones/:id/ficha", requireAdmin, async (req, res) => {
  const alumno = getById(req.params.id)
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

app.get("/api/config", (_req, res) => {
  res.json({ cursos: getConfig() })
})

app.put("/api/config/:id", requireAdmin, upload.single("image"), (req, res) => {
  const cfg = getConfig()
  const existing = cfg[req.params.id] || { image: "", available: true }

  const patch = { ...existing }
  if (req.body.available !== undefined) {
    patch.available = req.body.available === "true" || req.body.available === true
  }
  if (req.body.removeImage === "true") {
    patch.image = ""
  }
  if (req.file) {
    patch.image = `/uploads/${req.file.filename}`
  }

  const updated = updateItem(req.params.id, patch)
  res.json({ item: updated })
})

/* ---------- produccion ---------- */

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get(/.*/, (_req, res) => res.sendFile(path.join(DIST_DIR, "index.html")))
}

app.listen(PORT, () => {
  console.log(`Servidor corrriendo en http://localhost:${PORT}`)
  if (isDefaultPassword()) {
    console.warn("[aviso] Se está usando la contraseña por defecto. Creá la variable ADMIN_PASSWORD en el archivo .env")
  }
})