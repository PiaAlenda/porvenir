import fs from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"
import { supabase, supabaseEnabled } from "./supabase.mjs"
import { resolveMediaUrl, resolveMediaUrls } from "./storage.mjs"
import { PublicError } from "./errors.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "data")
const FILE = path.join(DATA_DIR, "inscripciones.json")

const TABLE = "inscripciones"

export const DUPLICATE_MESSAGE =
  "Ya existe una inscripción registrada con este número de documento. " +
  "No se puede realizar otra inscripción. Si necesitás modificar tus datos, " +
  "comunicate con la administración de la escuela."

const CAMPOS = [
  "apellido",
  "nombre",
  "c_documento",
  "numeroDocumento",
  "cuil",
  "fechaNacimiento",
  "c_sexo",
  "c_pais_nacimiento",
  "c_provincia_nacimiento",
  "lugar_nacimiento",
  "c_nacionalidad",
  "domicilio",
  "departamento",
  "celular",
  "celularUrgencia",
  "email",
  "careerId",
  "courseTitle",
  "especialidad",
  "anioDivision",
  "c_discapacidad",
  "cud",
  "c_pueblo_indigena",
  "problematicaIntegrado",
  "fotoDni",
  "fotoCertificado",
]

/* ---------- almacenamiento local (respaldo para desarrollo) ---------- */

let cache = null

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readFile() {
  if (cache) return cache
  ensureDir()
  if (!fs.existsSync(FILE)) {
    cache = []
  } else {
    try {
      cache = JSON.parse(fs.readFileSync(FILE, "utf8"))
    } catch {
      cache = []
    }
  }
  return cache
}

function writeFile(list) {
  ensureDir()
  cache = list
  const tmp = FILE + ".tmp"
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8")
  fs.renameSync(tmp, FILE)
}

/* ---------- helpers ---------- */

function normalize(data) {
  const out = {}
  for (const campo of CAMPOS) {
    out[campo] = data[campo] ?? ""
  }
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && !(key in out)) out[key] = value
  }
  return out
}

/** Record tal como está persistido, con las claves crudas de los adjuntos. */
function toRawRecord(row) {
  return {
    id: row.id,
    ...row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Record listo para la API: los adjuntos de identidad se sirven con URL firmada
 * de corta duración. Nunca usar esto para volver a escribir en la base, porque
 * la URL firmada expira en 10 minutos.
 */
async function toRecord(row) {
  const record = toRawRecord(row)
  record.fotoDni = await resolveMediaUrl(record.fotoDni)
  record.fotoCertificado = await resolveMediaUrl(record.fotoCertificado)
  return record
}

function fail(context, error) {
  console.error(`[supabase] ${context}:`, error?.message || error)
  // El detalle de Supabase se queda en el log; el cliente recibe un mensaje
  // genérico para no filtrar nombres de tablas ni de columnas.
  throw new PublicError("No se pudo completar la operación en la base de datos.", 503)
}

/* ---------- API pública ---------- */

export async function getAll() {
  if (!supabaseEnabled) {
    return readFile().slice().sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, data, created_at, updated_at")
    .order("created_at", { ascending: false })
  if (error) fail("no se pudieron leer las inscripciones", error)

  /*
   * Las URLs de los adjuntos se firman todas juntas: antes eran dos llamadas a
   * Storage por inscripción, así que con 300 inscriptos el panel hacía 600
   * pedidos cada vez que se abría.
   */
  const records = (data || []).map(toRawRecord)
  const urls = await resolveMediaUrls(records.flatMap((r) => [r.fotoDni, r.fotoCertificado]))
  for (const r of records) {
    if (r.fotoDni) r.fotoDni = urls.get(r.fotoDni) ?? ""
    if (r.fotoCertificado) r.fotoCertificado = urls.get(r.fotoCertificado) ?? ""
  }
  return records
}

export const SIN_ASIGNAR = "__sin_asignar__"

/** Quita caracteres que rompen la sintaxis de filtros `or()` de PostgREST. */
function sanitizeSearch(q) {
  return String(q || "").replace(/[,()*%\\]/g, " ").trim()
}

/**
 * Página de inscripciones para el panel. Filtra y pagina en la base y firma
 * las URLs de los adjuntos solo de las filas que se devuelven. Además entrega
 * los totales y las carreras con inscriptos, que el panel muestra aparte.
 */
export async function getPage({ page = 1, pageSize = 10, q = "", career = "" } = {}) {
  const size = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100)
  const pageNum = Math.max(parseInt(page, 10) || 1, 1)
  const from = (pageNum - 1) * size
  const search = String(q || "").toLowerCase().trim()

  if (!supabaseEnabled) {
    const all = await getAll()
    const filtered = all.filter((a) => {
      const titulo = String(a.courseTitle || "").trim()
      if (career === SIN_ASIGNAR && titulo) return false
      if (career && career !== SIN_ASIGNAR && titulo !== career) return false
      if (!search) return true
      return [a.apellido, a.nombre, a.numeroDocumento, a.cuil, titulo].some((v) =>
        String(v || "").toLowerCase().includes(search),
      )
    })
    const titles = all.map((a) => String(a.courseTitle || "").trim())
    return {
      items: filtered.slice(from, from + size),
      total: filtered.length,
      totalAll: all.length,
      unassigned: titles.filter((t) => !t).length,
      careers: [...new Set(titles.filter(Boolean))],
    }
  }

  // Resumen liviano: una sola columna por fila, sin adjuntos.
  const { data: light, error: lightError } = await supabase
    .from(TABLE)
    .select("title:data->>courseTitle")
  if (lightError) fail("no se pudo leer el resumen de inscripciones", lightError)
  const titles = (light || []).map((r) => String(r.title || "").trim())

  let query = supabase
    .from(TABLE)
    .select("id, data, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + size - 1)

  if (career === SIN_ASIGNAR) {
    query = query.or("data->>courseTitle.is.null,data->>courseTitle.eq.")
  } else if (career) {
    query = query.eq("data->>courseTitle", career)
  }
  const clean = sanitizeSearch(search)
  if (clean) {
    const like = `%${clean}%`
    query = query.or(
      ["apellido", "nombre", "numeroDocumento", "cuil", "courseTitle"]
        .map((f) => `data->>${f}.ilike.${like}`)
        .join(","),
    )
  }

  const { data, count, error } = await query
  if (error) fail("no se pudieron leer las inscripciones", error)

  const records = (data || []).map(toRawRecord)
  const urls = await resolveMediaUrls(records.flatMap((r) => [r.fotoDni, r.fotoCertificado]))
  for (const r of records) {
    if (r.fotoDni) r.fotoDni = urls.get(r.fotoDni) ?? ""
    if (r.fotoCertificado) r.fotoCertificado = urls.get(r.fotoCertificado) ?? ""
  }

  return {
    items: records,
    total: count ?? records.length,
    totalAll: titles.length,
    unassigned: titles.filter((t) => !t).length,
    careers: [...new Set(titles.filter(Boolean))],
  }
}

/** Lectura interna: devuelve las claves crudas, sin firmar URLs. */
async function getRawById(id) {
  if (!supabaseEnabled) return readFile().find((r) => r.id === id) || null
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, data, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()
  if (error) fail("no se pudo leer la inscripción", error)
  return data ? toRawRecord(data) : null
}

/**
 * Busca una inscripción previa por número de documento. Se usa para impedir
 * que la misma persona se inscriba más de una vez.
 */
export async function findByDocumento(numeroDocumento) {
  const doc = String(numeroDocumento || "").trim()
  if (!doc) return null
  if (!supabaseEnabled) {
    return readFile().find((r) => String(r.numeroDocumento || "").trim() === doc) || null
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, data, created_at, updated_at")
    .eq("data->>numeroDocumento", doc)
    .limit(1)
  if (error) fail("no se pudo buscar la inscripción", error)
  return data && data.length ? toRawRecord(data[0]) : null
}

/**
 * Posición de una inscripción dentro de su carrera: cuántas hay registradas
 * hasta ese instante, ella incluida. Es el mismo orden que usa el panel para
 * repartir titulares y suplentes, así que el mensaje que recibe la persona
 * coincide con lo que después ve la administración.
 *
 * Se calcula *después* de insertar: contar antes y guardar después dejaba que
 * diez inscripciones simultáneas vieran el mismo "queda un lugar".
 */
export async function positionInCareer(careerId, createdAt) {
  const id = String(careerId || "").trim()
  if (!id || !createdAt) return 0
  if (!supabaseEnabled) {
    return readFile().filter((r) => String(r.careerId || "") === id && r.createdAt <= createdAt).length
  }
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("data->>careerId", id)
    .lte("created_at", createdAt)
  if (error) fail("no se pudieron contar las inscripciones", error)
  return count || 0
}

export async function getById(id) {
  if (!supabaseEnabled) return readFile().find((r) => r.id === id) || null
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, data, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()
  if (error) fail("no se pudo leer la inscripción", error)
  return data ? await toRecord(data) : null
}

export async function createAlumno(data) {
  const payload = normalize(data)
  const now = new Date().toISOString()

  if (!supabaseEnabled) {
    const record = { id: randomUUID(), ...payload, createdAt: now, updatedAt: now }
    const list = readFile()
    // Equivalente local del índice único: leer y escribir es síncrono, así
    // que no se puede colar otro envío entre el chequeo y el push.
    const doc = String(payload.numeroDocumento || "").trim()
    if (doc && list.some((r) => String(r.numeroDocumento || "").trim() === doc)) {
      throw new PublicError(DUPLICATE_MESSAGE, 409)
    }
    list.push(record)
    writeFile(list)
    return record
  }

  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({ data: payload })
    .select("id, data, created_at, updated_at")
    .single()
  if (error) {
    /*
     * 23505 = violación de índice único. Con el índice de
     * `supabase/optimizaciones.sql` es lo que pasa cuando dos envíos del mismo
     * documento llegan a la vez y los dos pasaron el chequeo previo.
     */
    if (error.code === "23505") throw new PublicError(DUPLICATE_MESSAGE, 409)
    fail("no se pudo guardar la inscripción", error)
  }
  // Crudo a propósito: quien crea la inscripción no necesita las URLs de los
  // adjuntos, y firmarlas eran dos llamadas extra a Storage por envío.
  return toRawRecord(row)
}
export async function updateAlumno(id, patch) {
  if (!supabaseEnabled) {
    const list = readFile()
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) return null
    const { id: _ignored, createdAt: _created, updatedAt: _updated, ...rest } = patch
    const record = list[idx]
    list[idx] = {
      ...record,
      ...rest,
      id,
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString(),
    }
    writeFile(list)
    return list[idx]
  }

  // El merge parte del record CRUDO: si se usara getById() se persistirían
  // las URLs firmadas de los adjuntos, que expiran a los 10 minutos.
  const actual = await getRawById(id)
  if (!actual) return null
  const { id: _ignored, createdAt: _created, updatedAt: _updated, ...rest } = patch
  const merged = normalize({ ...actual, ...rest })

  const { data, error } = await supabase
    .from(TABLE)
    .update({ data: merged, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, data, created_at, updated_at")
    .maybeSingle()
  if (error) fail("no se pudo actualizar la inscripción", error)
  return data ? await toRecord(data) : null
}

export async function deleteAlumno(id) {
  if (!supabaseEnabled) {
    const list = readFile()
    const next = list.filter((r) => r.id !== id)
    if (next.length === list.length) return false
    writeFile(next)
    return true
  }
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id")
  if (error) fail("no se pudo eliminar la inscripción", error)
  return Boolean(data && data.length)
}