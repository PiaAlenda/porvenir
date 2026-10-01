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

/**
 * Tope por campo de texto libre del panel. La config se guarda en un JSON
 * (o en una columna `jsonb`), así que sin un límite cada tecla que escribe un
 * admin se convierte en payload grande de la API pública.
 */
const TEXT_LIMITS = {
  title: 120,
  description: 400,
  longDescription: 3000,
  duration: 60,
  modality: 40,
  icon: 40,
  inscriptionDate: 60,
  month: 40,
  schedule: 200,
  inscriptionFee: 60,
  inscriptionDocs: 300,
  video: 500,
  ejes: 2000,
}

const VALID_CATEGORIES = new Set(["carrera", "curso-presencial", "curso-virtual"])
const MAX_LIST_ITEMS = 40
const MAX_ITEM_LENGTH = 300
const MAX_TEACHERS = 25
const MAX_SYLLABUS_ENTRIES = 10
const MAX_SUBJECTS_PER_ENTRY = 30

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

/** Parte un valor en líneas, descarta vacíos y corta cada una. */
function splitLines(value) {
  return (value || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Normaliza una lista de textos (salida laboral, perfil del egresado).
 * Acepta newline en texto plano o un JSON array: el panel antes mandaba el
 * campo como string y ahora lo manda como array.
 */
function normalizeList(raw) {
  let items = []
  if (Array.isArray(raw)) {
    items = raw
  } else if (typeof raw === "string" && raw.trim()) {
    const trimmed = raw.trim()
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) items = parsed
      } catch {
        items = splitLines(raw)
      }
    } else {
      items = splitLines(raw)
    }
  }
  return items
    .map((s) => String(s ?? "").trim().slice(0, MAX_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS)
}

function normalizeSyllabus(raw) {
  const entries = []
  const push = (year, subjects) => {
    const list = normalizeList(subjects).slice(0, MAX_SUBJECTS_PER_ENTRY)
    if (!list.length) return
    const cleanYear = String(year ?? "").trim().slice(0, 60)
    entries.push({ year: cleanYear || "Nivel Único", subjects: list })
  }

  let source = raw
  if (typeof raw === "string" && raw.trim()) {
    const trimmed = raw.trim()
    if (trimmed.startsWith("[")) {
      try {
        source = JSON.parse(trimmed)
      } catch {
        // No era JSON: se trata como el campo plano de siempre.
        push("", trimmed)
        return entries
      }
    } else {
      push("", trimmed)
      return entries
    }
  }

  if (!Array.isArray(source)) return entries
  for (const entry of source.slice(0, MAX_SYLLABUS_ENTRIES)) {
    if (!entry || typeof entry !== "object") continue
    // `subjects` llega como array desde el panel, pero tolerate un string con
    // un eje por línea antes que descartar la carga completa.
    const { subjects, ...rest } = entry
    if (Array.isArray(subjects) || typeof subjects === "string") push(rest.year, subjects)
  }
  return entries
}

function normalizeTeachers(raw) {
  let source = raw
  if (typeof raw === "string" && raw.trim()) {
    try {
      source = JSON.parse(raw.trim())
    } catch {
      return []
    }
  }
  if (!Array.isArray(source)) return []

  const out = []
  for (const t of source.slice(0, MAX_TEACHERS)) {
    if (!t || typeof t !== "object") continue
    const name = String(t.name ?? "").trim().slice(0, 120)
    if (!name) continue
    const teacher = { name }
    const title = String(t.title ?? "").trim().slice(0, 160)
    if (title) teacher.title = title
    const legajo = String(t.legajo ?? "").trim().slice(0, 80)
    if (legajo) teacher.legajo = legajo
    // La URL de la foto solo se pisa si viene una; si el admin la borró a
    // propósito llega vacía y se respeta como tal.
    const image = String(t.image ?? "").trim().slice(0, 500)
    if (image) teacher.image = image
    if (t.removeImage === true) teacher.removeImage = true
    out.push(teacher)
  }
  return out
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

/**
 * Pasa un ítem de la config por los mismos filtros que la entrada del panel.
 * Sirve para los ítems que nunca pasaron por `updateItem` (por ejemplo los
 * que ya estaban guardados antes de que existieran estos campos) y para
 * dejar de exponer al cliente datos con formato raro.
 */
function sanitizeItem(item) {
  const out = { ...item }
  for (const [key, max] of Object.entries(TEXT_LIMITS)) {
    if (typeof out[key] === "string") out[key] = out[key].trim().slice(0, max)
    else if (out[key] === undefined || out[key] === null) delete out[key]
  }
  if (out.category !== undefined && !VALID_CATEGORIES.has(out.category)) delete out.category
  if (Array.isArray(out.syllabus)) out.syllabus = normalizeSyllabus(out.syllabus)
  if (Array.isArray(out.teachers)) out.teachers = normalizeTeachers(out.teachers)
  if (Array.isArray(out.salidaLaboral)) out.salidaLaboral = normalizeList(out.salidaLaboral)
  if (Array.isArray(out.perfilEgresado)) out.perfilEgresado = normalizeList(out.perfilEgresado)
  return out
}

/**
 * Las fotos de los docentes y el video van al bucket público, así que
 * necesitan la URL pública y no la clave cruda que se guarda.
 */
function resolveItemAssets(item) {
  const out = { ...item }
  if (typeof out.image === "string" && out.image) out.image = resolveAssetUrl(out.image)
  if (typeof out.video === "string" && out.video) out.video = resolveAssetUrl(out.video)
  if (Array.isArray(out.teachers)) {
    out.teachers = out.teachers.map((t) =>
      t && typeof t.image === "string" && t.image ? { ...t, image: resolveAssetUrl(t.image) } : t,
    )
  }
  return out
}

function mergeWithDefaults(saved) {
  const defaults = buildDefaults()
  const out = {}
  for (const id of Object.keys(defaults)) {
    const s = saved && saved[id]
    const item = sanitizeItem(s || {})
    // Banners de cursos: públicos a propósito, así que no llevan firma.
    item.image = s && typeof s.image === "string" && s.image ? item.image : defaults[id].image
    item.available = s && typeof s.available === "boolean" ? s.available : defaults[id].available
    out[id] = resolveItemAssets(item)
  }
  for (const id of Object.keys(saved || {})) {
    // Las carreras y cursos que se agregaron desde el panel no están en los
    // defaults, así que se mergean tal cual vinieron.
    if (!out[id]) out[id] = resolveItemAssets(sanitizeItem(saved[id]))
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

export { normalizeList, normalizeSyllabus, normalizeTeachers, TEXT_LIMITS, VALID_CATEGORIES }

export function resetCache() {
  cache = null
}