import { createClient } from "@supabase/supabase-js"
import { PublicError } from "./errors.mjs"

const URL = process.env.SUPABASE_URL?.trim() || ""
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ""
const ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || ""

/**
 * Dos buckets con requisitos opuestos:
 *  - `uploads`: DNI y certificados de nacimiento. Documentos de menores, nunca
 *    públicos. Se leen con URLs firmadas de corta duración.
 *  - `public-assets`: banners de cursos y carreras, que se muestran en el
 *    home público. Estos sí son públicos por diseño.
 */
export const UPLOADS_BUCKET = "uploads"
export const ASSETS_BUCKET = "public-assets"

/** El tipo de contenido que la API acepta para cualquier adjunto. */
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]

/** Cuánto viven las URLs firmadas de los adjuntos privados. */
export const SIGNED_URL_TTL_S = 600

const MAX_FILE_BYTES = 10 * 1024 * 1024

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
 * Crea los buckets si no existen. Corre en el arranque y es inocuo cuando ya
 * están. `uploads` nace privado: los adjuntos de identidad no pueden quedar
 * accesibles por URL pública bajo ningún concepto.
 */
export async function ensureBuckets() {
    if (!supabase) return

    for (const [bucket, isPublic] of [[UPLOADS_BUCKET, false], [ASSETS_BUCKET, true]]) {
        const { data, error } = await supabase.storage.getBucket(bucket)
        if (!error && data) {
            // El bucket existe: hay que asegurarse de que su política siga
            // siendo la esperada, por si quedó de un deploy anterior.
            if (data.public !== isPublic) {
                const { error: updateError } = await supabase.storage.updateBucket(bucket, {
                    public: isPublic,
                    fileSizeLimit: MAX_FILE_BYTES,
                    allowedMimeTypes: ALLOWED_MIME_TYPES,
                })
                if (updateError) {
                    console.warn(`[supabase] No se pudo ajustar la visibilidad de ${bucket}:`, updateError.message)
                }
            }
            continue
        }
        if (error && !/not found/i.test(error.message)) {
            console.warn(`[supabase] No se pudo verificar el bucket ${bucket}:`, error.message)
        }
        const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: isPublic,
            fileSizeLimit: MAX_FILE_BYTES,
            allowedMimeTypes: ALLOWED_MIME_TYPES,
        })
        if (createError) {
            console.warn(`[supabase] No se pudo crear el bucket ${bucket}:`, createError.message)
        }
    }
}

/** Arma la clave que se persiste en la base: "<bucket>/<archivo>". */
export function storageKey(bucket, filename) {
    return `${bucket}/${filename}`
}

/**
 * Separa una clave persistida en { bucket, path }.
 * Acepta también URLs completas por si quedara alguna de una versión anterior.
 */
export function parseStorageKey(value) {
    if (!value || typeof value !== "string") return null

    if (value.startsWith(`${UPLOADS_BUCKET}/`)) {
        return { bucket: UPLOADS_BUCKET, path: value.slice(UPLOADS_BUCKET.length + 1) }
    }
    if (value.startsWith(`${ASSETS_BUCKET}/`)) {
        return { bucket: ASSETS_BUCKET, path: value.slice(ASSETS_BUCKET.length + 1) }
    }

    // URLs públicas heredadas: ".../object/public/<bucket>/<path>".
    for (const bucket of [UPLOADS_BUCKET, ASSETS_BUCKET]) {
        const marker = `/${bucket}/`
        const idx = value.indexOf(marker)
        if (idx !== -1) {
            return { bucket, path: value.slice(idx + marker.length) }
        }
    }
    return null
}

/** Sube un buffer a Storage. La clave ya incluye el bucket. */
export async function uploadToStorage(key, body, contentType) {
    if (!supabase) throw new Error("Supabase no está configurado")
    const parsed = parseStorageKey(key)
    if (!parsed) throw new Error("Clave de almacenamiento inválida")

    const { error } = await supabase.storage.from(parsed.bucket).upload(parsed.path, body, {
        contentType,
        upsert: true,
    })
    if (error) {
        // El mensaje de Supabase puede traer nombres de bucket, tabla o
        // columna: se registra, pero no se le devuelve al cliente.
        console.error("[supabase] no se pudo subir el archivo:", error.message)
        throw new PublicError("No se pudo guardar el archivo adjunto. Intentá de nuevo.", 503)
    }
    return key
}

/** Borra un archivo de Storage a partir de la clave persistida. */
export async function removeFromStorage(value) {
    if (!supabase || !value) return
    const parsed = parseStorageKey(value)
    if (!parsed) return
    await supabase.storage.from(parsed.bucket).remove([parsed.path])
}

/** URL pública, solo para el bucket de assets de marketing. */
export function publicUrlFor(key) {
    if (!supabase) return key
    const parsed = parseStorageKey(key)
    if (!parsed) return key
    return supabase.storage.from(parsed.bucket).getPublicUrl(parsed.path).data.publicUrl
}

/**
 * URL firmada para los adjuntos privados. Expira en SIGNED_URL_TTL_S: el
 * listado del panel la regenera en cada carga, así que alcanza para ver y
 * descargar la imagen desde el detalle.
 */
export async function signedUrlFor(key) {
    if (!supabase) return key
    const parsed = parseStorageKey(key)
    if (!parsed) return key
    const { data, error } = await supabase.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, SIGNED_URL_TTL_S)
    if (error) {
        console.error("[supabase] no se pudo firmar la URL:", error.message)
        return ""
    }
    return data?.signedUrl || ""
}
