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
  checkPassword,
  issueToken,
  verifyToken,
  isDefaultPassword,
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
  const { password } = req.body || {}
  if (!checkPassword(password)) {
    return res.status(401).json({ error: "Contraseña incorrecta" })
  }
  res.json({ token: issueToken() })
})

/* ---------- inscripciones ---------- */

const FIELDS_7 = ["apellido", "nombre", "c_documento", "numeroDocumento", "cuil", "fechaNacimiento", "c_sexo"]
const INTERNAL_FIELDS = ["domicilio", "departamento", "celular", "email", "careerId", "courseTitle"]

function validateRequeridos(body) {
  const faltantes = FIELDS_7.filter((f) => !body[f] || !String(body[f]).trim())
  if (faltantes.length) return `Faltan datos: ${faltantes.join(", ")}`
  if (!/^\d{11}$/.test(String(body.cuil))) return "El CUIL debe tener 11 dígitos"
  if (!/^\d+$/.test(String(body.numeroDocumento))) return "El número de documento debe ser numérico"
  const fecha = String(body.fechaNacimiento)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "Fecha de nacimiento inválida"
  if (!["M", "F", "X"].includes(String(body.c_sexo).toUpperCase())) return "Sexo inválido"
  return null
}

app.post("/api/inscripciones", (req, res) => {
  const body = req.body || {}
  const err = validateRequeridos(body)
  if (err) return res.status(400).json({ error: err })

  const email = body.email ? String(body.email).trim() : ""
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Correo electrónico inválido" })
  }

  const record = createAlumno({
    apellido: String(body.apellido).trim(),
    nombre: String(body.nombre).trim(),
    c_documento: String(body.c_documento).trim(),
    numeroDocumento: String(body.numeroDocumento).trim(),
    cuil: String(body.cuil).trim(),
    fechaNacimiento: String(body.fechaNacimiento).trim(),
    c_sexo: String(body.c_sexo).toUpperCase(),
    email,
    careerId: body.careerId ? String(body.careerId) : "",
    courseTitle: body.courseTitle ? String(body.courseTitle) : "",
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