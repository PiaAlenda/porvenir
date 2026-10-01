import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { supabase, supabaseEnabled } from "./supabase.mjs"
import { resolveAssetUrl } from "./storage.mjs"
import { PublicError } from "./errors.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "data")
const FILE = path.join(DATA_DIR, "site-config.json")

const TABLE = "site_config"

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

export const MIN_CANTIDAD_TITULARES = 0
export const MAX_CANTIDAD_TITULARES = 999
const DEFAULT_CANTIDAD_TITULARES = 0

/**
 * Normaliza el cupo de titulares guardado en la configuracion.
 * Devuelve null cuando el valor no es un entero dentro del rango permitido.
 */
export function parseCantidadTitulares(raw) {
  if (raw === undefined || raw === null) return null
  if (typeof raw === "string" && !raw.trim()) return null
  const n = typeof raw === "number" ? raw : Number(String(raw).trim())
  if (!Number.isInteger(n)) return null
  if (n < MIN_CANTIDAD_TITULARES || n > MAX_CANTIDAD_TITULARES) return null
  return n
}

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
    out[id] = s ? { ...s } : {}
    // Banners de cursos: públicos a propósito, así que no llevan firma.
    out[id].image = s && typeof s.image === "string" && s.image ? resolveAssetUrl(s.image) : defaults[id].image
    out[id].available = s && typeof s.available === "boolean" ? s.available : defaults[id].available
    if (s && typeof s.title === "string" && s.title) out[id].title = s.title
  }
  for (const id of Object.keys(saved || {})) {
    if (!out[id]) out[id] = saved[id]
  }
  return out
}

function readFile() {
  ensureDir()
  if (!fs.existsSync(FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"))
  } catch {
    return {}
  }
}

function writeFile(map) {
  ensureDir()
  const tmp = FILE + ".tmp"
  fs.writeFileSync(tmp, JSON.stringify(map, null, 2), "utf8")
  fs.renameSync(tmp, FILE)
}

export async function getConfig() {
  if (!supabaseEnabled) {
    if (cache) return cache
    cache = mergeWithDefaults(readFile())
    return cache
  }

  try {
    const { data, error } = await supabase.from(TABLE).select("id, data")
    if (error) {
      console.warn("[supabase] no se pudo leer la tabla site_config, usando configuración por defecto:", error.message)
      return mergeWithDefaults({})
    }
    const saved = {}
    for (const row of data || []) saved[row.id] = row.data || {}
    return mergeWithDefaults(saved)
  } catch (err) {
    console.warn("[supabase] error inesperado en getConfig:", err.message)
    return mergeWithDefaults({})
  }
}

export async function updateItem(id, patch) {
  const cfg = await getConfig()
  const merged = { ...(cfg[id] || {}), ...patch }

  if (!supabaseEnabled) {
    cfg[id] = merged
    cache = cfg
    writeFile(cfg)
    return merged
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ id, data: merged, updated_at: new Date().toISOString() })
    .select("id, data")
    .single()
  if (error) {
    console.error("[supabase] no se pudo guardar la configuración:", error.message)
    throw new PublicError("No se pudo guardar la configuración del sitio.", 503)
  }
  return data?.data || merged
}

export function resetCache() {
  cache = null
}