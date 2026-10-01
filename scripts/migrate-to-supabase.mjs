/**
 * Migra los datos locales (server/data) a Supabase.
 *
 *   node --env-file=.env scripts/migrate-to-supabase.mjs
 *
 * - Sube los adjuntos de server/data/uploads al bucket "uploads"
 * - Inserta las inscripciones en la tabla public.inscripciones
 * - Copia la configuracion de cursos a public.site_config
 *
 * Es seguro volver a correrlo: no duplica inscripciones ni archivos.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const DATA_DIR = path.join(ROOT, "server", "data")
const UPLOADS_DIR = path.join(DATA_DIR, "uploads")

const URL = process.env.SUPABASE_URL?.trim()
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const BUCKET = "uploads"

if (!URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.")
  process.exit(1)
}

const supabase = createClient(URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    console.warn(`No se pudo leer ${path.basename(file)}, se omite.`)
    return fallback
  }
}

function mimeFor(name) {
  const ext = path.extname(name).toLowerCase()
  if (ext === ".png") return "image/png"
  if (ext === ".webp") return "image/webp"
  if (ext === ".gif") return "image/gif"
  if (ext === ".pdf") return "application/pdf"
  return "image/jpeg"
}

/** Sube todos los adjuntos locales y devuelve un mapa nombre -> URL publica. */
async function uploadArchivos() {
  const mapa = new Map()
  if (!fs.existsSync(UPLOADS_DIR)) return mapa

  const archivos = fs.readdirSync(UPLOADS_DIR).filter((f) => !f.startsWith("."))
  console.log(`Subiendo ${archivos.length} archivos a Storage...`)

  for (const nombre of archivos) {
    const buffer = fs.readFileSync(path.join(UPLOADS_DIR, nombre))
    const { error } = await supabase.storage.from(BUCKET).upload(nombre, buffer, {
      contentType: mimeFor(nombre),
      upsert: true,
    })
    if (error) {
      console.warn(`  ! ${nombre}: ${error.message}`)
      continue
    }
    mapa.set(nombre, supabase.storage.from(BUCKET).getPublicUrl(nombre).data.publicUrl)
  }
  return mapa
}

function resolver(valor, mapa) {
  if (!valor || typeof valor !== "string") return valor ?? ""
  if (/^https?:\/\//i.test(valor)) return valor
  const nombre = valor.replace(/^\/?uploads\//, "")
  return mapa.get(nombre) || valor
}

async function migrarInscripciones(mapa) {
  const lista = readJson(path.join(DATA_DIR, "inscripciones.json"), [])
  if (!Array.isArray(lista) || !lista.length) {
    console.log("No hay inscripciones locales para migrar.")
    return
  }

  const { data: existentes, error } = await supabase
    .from("inscripciones")
    .select("id, created_at")
    .limit(1)
  if (error) {
    console.error("No se pudo leer la tabla inscripciones. ¿Corriste supabase/schema.sql?", error.message)
    process.exit(1)
  }
  if (existentes?.length) {
    console.log("La tabla inscripciones ya tiene datos. No se inserta nada para no duplicar.")
    console.log("Si igual querés importarlos, vaciala desde el SQL Editor antes de correr esto.")
    return
  }

  const filas = lista.map((r) => {
    const { id, createdAt, updatedAt, ...data } = r
    data.fotoDni = resolver(data.fotoDni, mapa)
    data.fotoCertificado = resolver(data.fotoCertificado, mapa)
    return {
      data,
      created_at: createdAt || new Date().toISOString(),
      updated_at: updatedAt || createdAt || new Date().toISOString(),
    }
  })

  const { error: insertError } = await supabase.from("inscripciones").insert(filas)
  if (insertError) {
    console.error("Falló la inserción:", insertError.message)
    process.exit(1)
  }
  console.log(`Inscripciones migradas: ${filas.length}`)
}

async function migrarConfig(mapa) {
  const config = readJson(path.join(DATA_DIR, "site-config.json"), {})
  const entradas = Object.entries(config || {})
  if (!entradas.length) {
    console.log("No hay configuracion local para migrar.")
    return
  }

  const filas = entradas.map(([id, data]) => ({
    id,
    data: { ...data, image: resolver(data?.image, mapa) || data?.image || "" },
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from("site_config").upsert(filas)
  if (error) {
    console.error("Falló la migracion de la configuracion:", error.message)
    process.exit(1)
  }
  console.log(`Configuracion migrada: ${filas.length} items`)
}

const mapa = await uploadArchivos()
await migrarInscripciones(mapa)
await migrarConfig(mapa)
console.log("Listo. Recordá definir ALLOWED_ORIGIN y VITE_API_URL en Render y Vercel.")