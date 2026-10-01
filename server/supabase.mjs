import { createClient } from "@supabase/supabase-js"

const URL = process.env.SUPABASE_URL?.trim() || ""
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ""
const ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || ""

export const UPLOADS_BUCKET = "uploads"

/**
 * La app usa Supabase cuando están las credenciales en el entorno.
 * Sin ellas vuelve al almacenamiento local en JSON, para poder seguir
 * desarrollando en la máquina sin conexión.
 */
export const supabaseEnabled = Boolean(URL && SERVICE_ROLE_KEY)

if (URL && !SERVICE_ROLE_KEY) {
  console.warn("[supabase] Falta SUPABASE_SERVICE_ROLE_KEY. Se usará almacenamiento local.")
}

const AUTH_OPTS = { auth: { persistSession: false, autoRefreshToken: false } }

export const supabase = supabaseEnabled ? createClient(URL, SERVICE_ROLE_KEY, AUTH_OPTS) : null

/** Cliente sin privilegios, usado para validar la contraseña del admin. */
export const supabaseAnon = supabaseEnabled && ANON_KEY
  ? createClient(URL, ANON_KEY, AUTH_OPTS)
  : null

/**
 * Crea el bucket de uploads si no existe. Corre en el arranque y es inocuo
 * cuando el bucket ya está.
 */
export async function ensureUploadsBucket() {
  if (!supabase) return
  const { data, error } = await supabase.storage.getBucket(UPLOADS_BUCKET)
  if (!error && data) return
  if (error && !/not found/i.test(error.message)) {
    console.warn("[supabase] No se pudo verificar el bucket:", error.message)
  }
  const { error: createError } = await supabase.storage.createBucket(UPLOADS_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"],
  })
  if (createError) console.warn("[supabase] No se pudo crear el bucket:", createError.message)
}

/** Sube un buffer a Storage y devuelve la URL publica. */
export async function uploadToStorage(path, body, contentType) {
  if (!supabase) throw new Error("Supabase no está configurado")
  const { error } = await supabase.storage.from(UPLOADS_BUCKET).upload(path, body, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`No se pudo guardar el archivo: ${error.message}`)
  return publicUrlFor(path)
}

/** Borra un archivo de Storage a partir de su URL publica o de su path. */
export async function removeFromStorage(value) {
  if (!supabase || !value) return
  const path = storagePathFromUrl(value)
  if (!path) return
  await supabase.storage.from(UPLOADS_BUCKET).remove([path])
}

export function publicUrlFor(path) {
  if (!supabase) return path
  return supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Convierte "/uploads/archivo.png" o una URL completa en "archivo.png". */
export function storagePathFromUrl(value) {
  if (!value) return ""
  if (value.startsWith(`${UPLOADS_BUCKET}/`)) return value.slice(UPLOADS_BUCKET.length + 1)
  const marker = `/${UPLOADS_BUCKET}/`
  const idx = value.indexOf(marker)
  if (idx !== -1) return value.slice(idx + marker.length)
  return value
}