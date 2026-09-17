import fs from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "data")
const FILE = path.join(DATA_DIR, "inscripciones.json")

let cache = null

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function read() {
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

function write(list) {
  ensureDir()
  cache = list
  const tmp = FILE + ".tmp"
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8")
  fs.renameSync(tmp, FILE)
}

export function getAll() {
  return read().slice().sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
}

export function getById(id) {
  return read().find((r) => r.id === id) || null
}

export function createAlumno(data) {
  const list = read()
  const now = new Date().toISOString()
  const record = {
    id: randomUUID(),
    ...data,
    c_pais_nacimiento: data.c_pais_nacimiento ?? "",
    c_provincia_nacimiento: data.c_provincia_nacimiento ?? "",
    lugar_nacimiento: data.lugar_nacimiento ?? "",
    c_nacionalidad: data.c_nacionalidad ?? "",
    domicilio: data.domicilio ?? "",
    departamento: data.departamento ?? "",
    celular: data.celular ?? "",
    celularUrgencia: data.celularUrgencia ?? "",
    email: data.email ?? "",
    especialidad: data.especialidad ?? "",
    c_discapacidad: data.c_discapacidad ?? "",
    cud: data.cud ?? "",
    c_pueblo_indigena: data.c_pueblo_indigena ?? "",
    problematicaIntegrado: data.problematicaIntegrado ?? "",
    fotoDni: data.fotoDni ?? "",
    fotoCertificado: data.fotoCertificado ?? "",
    createdAt: now,
    updatedAt: now,
  }
  list.push(record)
  write(list)
  return record
}

export function updateAlumno(id, patch) {
  const list = read()
  const idx = list.findIndex((r) => r.id === id)
  if (idx === -1) return null
  const { id: _ignored, createdAt, ...rest } = patch
  list[idx] = {
    id,
    createdAt: list[idx].createdAt,
    updatedAt: new Date().toISOString(),
    ...list[idx],
    ...rest,
  }
  write(list)
  return list[idx]
}

export function deleteAlumno(id) {
  const list = read()
  const next = list.filter((r) => r.id !== id)
  if (next.length === list.length) return false
  write(next)
  return true
}