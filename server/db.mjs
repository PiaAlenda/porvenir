import fs from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"
import { supabase, supabaseEnabled } from "./supabase.mjs"
import { resolveMediaUrl } from "./storage.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "data")
const FILE = path.join(DATA_DIR, "inscripciones.json")

const TABLE = "inscripciones"

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

function toRecord(row) {
  const record = {
    id: row.id,
    ...row.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  record.fotoDni = resolveMediaUrl(record.fotoDni)
  record.fotoCertificado = resolveMediaUrl(record.fotoCertificado)
  return record
}

function fail(context, error) {
  console.error(`[supabase] ${context}:`, error?.message || error)
  throw new Error("No se pudo completar la operación en la base de datos.")
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
  return (data || []).map(toRecord)
}

export async function getById(id) {
  if (!supabaseEnabled) return readFile().find((r) => r.id === id) || null
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, data, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()
  if (error) fail("no se pudo leer la inscripción", error)
  return data ? toRecord(data) : null
}

export async function createAlumno(data) {
  const payload = normalize(data)
  const now = new Date().toISOString()

  if (!supabaseEnabled) {
    const record = { id: randomUUID(), ...payload, createdAt: now, updatedAt: now }
    const list = readFile()
    list.push(record)
    writeFile(list)
    return record
  }

  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({ data: payload })
    .select("id, data, created_at, updated_at")
    .single()
  if (error) fail("no se pudo guardar la inscripción", error)
  return toRecord(row)
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

  const actual = await getById(id)
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
  return data ? toRecord(data) : null
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