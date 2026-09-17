import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "data")
const FILE = path.join(DATA_DIR, "site-config.json")

const COURSE_DEFAULT_IMAGES = {
  "curso-danza": "/img/cursos/CURSO DE DANZA.webp",
  "curso-estilismo-moda": "/img/cursos/ESTILISMO DE MODA.webp",
  "curso-franquicia-septiembre": "/img/cursos/franquicia septiembre.webp",
  "curso-higiene-seguridad": "/img/cursos/higiene y seguridad 2 SEPTIEMBRE NUEVO.webp",
  "curso-maquillaje-profesional": "/img/cursos/mAQUILLAJE PROFESIONAL AGOSTO.webp",
  "curso-peinado-profesional": "/img/cursos/peinadp profesional AGOSTO.webp",
  "curso-plomero-cloaquista": "/img/cursos/Plomero cloaquista SEPTIEMBRE.webp",
  "curso-secretariado-administrativo": "/img/cursos/secretariado administrativo.webp",
  "curso-soldadura": "/img/cursos/soldadura SEPTIEMBRE -.webp",
  "curso-instalacion-paneles": "/img/cursos/Instalacion paneles 2026- 2 QR AGOSTO ----.webp",
}

const CAREER_IDS = [
  "tec-mecanica-automotor",
  "tec-metalmecanica",
  "tec-torneria-mecanica",
  "tec-dibujo-publicitario",
  "tec-administracion-contable",
  "tec-refrigeracion-aire-acondicionado",
  "tec-industria-madera",
  "tec-gastronomia-profesional",
  "tec-electronica-general-industrial",
  "tec-electronica-domiciliaria",
  "tec-reparacion-pc",
]

function buildDefaults() {
  const map = {}
  for (const id of Object.keys(COURSE_DEFAULT_IMAGES)) {
    map[id] = { image: COURSE_DEFAULT_IMAGES[id], available: true }
  }
  for (const id of CAREER_IDS) {
    map[id] = { image: `/icons/${id}.webp`, available: true }
  }
  return map
}

let cache = null

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function mergeWithDefaults(saved) {
  const defaults = buildDefaults()
  const out = {}
  for (const id of Object.keys(defaults)) {
    const s = saved && saved[id]
    out[id] = {
      image: s && typeof s.image === "string" && s.image ? s.image : defaults[id].image,
      available: s && typeof s.available === "boolean" ? s.available : defaults[id].available,
    }
  }
  for (const id of Object.keys(saved || {})) {
    if (!out[id]) out[id] = saved[id]
  }
  return out
}

export function getConfig() {
  if (cache) return cache
  ensureDir()
  let saved = null
  if (fs.existsSync(FILE)) {
    try {
      saved = JSON.parse(fs.readFileSync(FILE, "utf8"))
    } catch {
      saved = null
    }
  }
  cache = mergeWithDefaults(saved)
  return cache
}

function persist() {
  ensureDir()
  const tmp = FILE + ".tmp"
  fs.writeFileSync(tmp, JSON.stringify(getConfig(), null, 2), "utf8")
  fs.renameSync(tmp, FILE)
}

export function updateItem(id, patch) {
  const cfg = getConfig()
  cfg[id] = { ...(cfg[id] || {}), ...patch }
  persist()
  return cfg[id]
}

export function resetCache() {
  cache = null
}