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

/** Adjuntos de identidad: imágenes o PDF, y nada más. */
const DOCUMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]

/**
 * El bucket de assets además recibe los videos de las carreras, que en el
 * repo rondan los 25MB. Por eso el tope de tamaño no puede ser el mismo que el
 * de los documentos de identidad.
 */
const ASSET_MIME_TYPES = [...DOCUMENT_MIME_TYPES, "video/webm", "video/mp4", "video/ogg"]

/** Cuánto viven las URLs firmadas de los adjuntos privados. */
export const SIGNED_URL_TTL_S = 600

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
/**
 * Storage rechaza con "exceeded the maximum allowed size" cualquier
 * `fileSizeLimit` de más de 50MB, así que ese es el techo duro. Los videos
 * más pesados del repo rondan los 27MB, así que entra comfortably.
 */
const MAX_ASSET_BYTES = 50 * 1024 * 1024

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
const BUCKETS = [
    { name: UPLOADS_BUCKET, public: false, fileSizeLimit: MAX_DOCUMENT_BYTES, allowedMimeTypes: DOCUMENT_MIME_TYPES },
    { name: ASSETS_BUCKET, public: true, fileSizeLimit: MAX_ASSET_BYTES, allowedMimeTypes: ASSET_MIME_TYPES },
]

/** Compara dos listas de mimes sin importar el orden. */
function sameMimeList(a, b) {
    if (!Array.isArray(a) || a.length !== b.length) return false
    const left = new Set(a)
    return b.every((mime) => left.has(mime))
}

export async function ensureBuckets() {
    if (!supabase) return

    for (const bucket of BUCKETS) {
        const { data, error } = await supabase.storage.getBucket(bucket.name)
        if (!error && data) {
            /*
             * El bucket existe: hay que asegurarse de que su política siga
             * siendo la esperada, por si quedó de un deploy anterior. Esto
             * también sube el tope de tamaño y los mimes del bucket de assets
             * cuando se le agregan los videos.
             */
            const stale =
                data.public !== bucket.public ||
                data.file_size_limit !== bucket.fileSizeLimit ||
                !sameMimeList(data.allowed_mime_types, bucket.allowedMimeTypes)
            if (stale) {
                const { error: updateError } = await supabase.storage.updateBucket(bucket.name, {
                    public: bucket.public,
                    fileSizeLimit: bucket.fileSizeLimit,
                    allowedMimeTypes: bucket.allowedMimeTypes,
                })
                if (updateError) {
                    console.warn(
                        `[supabase] No se pudo ajustar la visibilidad de ${bucket.name}:`,
                        updateError.message,
                    )
                }
            }
            continue
        }
        if (error && !/not found/i.test(error.message)) {
            console.warn(`[supabase] No se pudo verificar el bucket ${bucket.name}:`, error.message)
        }
        const { error: createError } = await supabase.storage.createBucket(bucket.name, {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
            allowedMimeTypes: bucket.allowedMimeTypes,
        })
        if (createError) {
            console.warn(`[supabase] No se pudo crear el bucket ${bucket.name}:`, createError.message)
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

/* ---------- subida directa desde el navegador ---------- */
/*
 * Las fotos del formulario ya no pasan por la API: el navegador pide un
 * permiso de subida firmado y las sube directo a Storage. Así la memoria de
 * la instancia de Render no depende de cuánta gente se inscribe a la vez.
 *
 * Lo que sube el navegador cae en `uploads/pending/`. Al confirmar la
 * inscripción la API verifica el contenido y lo mueve a la raíz del bucket;
 * lo que quede en `pending/` sin reclamar lo borra `cleanupPendingUploads`.
 */
export const PENDING_PREFIX = "pending/"

/** Permiso de subida a `uploads/pending/<filename>`. Vale 2 horas (fijo de Supabase). */
export async function createPendingUploadUrl(filename) {
    if (!supabase) throw new Error("Supabase no está configurado")
    const path = `${PENDING_PREFIX}${filename}`
    const { data, error } = await supabase.storage.from(UPLOADS_BUCKET).createSignedUploadUrl(path)
    if (error || !data?.signedUrl) {
        console.error("[supabase] no se pudo firmar la subida:", error?.message || "sin URL")
        throw new PublicError("No se pudo preparar la subida de archivos. Intentá de nuevo.", 503)
    }
    return { key: `${UPLOADS_BUCKET}/${path}`, signedUrl: data.signedUrl }
}

/**
 * Primeros bytes de un archivo privado, para validar su firma sin bajarlo
 * entero a la memoria de la API. Pide un rango y, por si Storage lo ignorara,
 * corta la lectura apenas tiene lo necesario.
 *
 * Devuelve `null` si el archivo no existe.
 */
export async function readHeadBytes(path, bytes = 16) {
    if (!supabase) throw new Error("Supabase no está configurado")
    const { data, error } = await supabase.storage.from(UPLOADS_BUCKET).createSignedUrl(path, 60)
    if (error || !data?.signedUrl) {
        if (/not found/i.test(error?.message || "")) return null
        console.error("[supabase] no se pudo leer el archivo subido:", error?.message || "sin URL")
        throw new PublicError("No se pudo verificar el archivo adjunto. Intentá de nuevo.", 503)
    }

    let res
    try {
        res = await fetch(data.signedUrl, { headers: { Range: `bytes=0-${bytes - 1}` } })
    } catch (err) {
        console.error("[supabase] no se pudo leer el archivo subido:", err?.message || err)
        throw new PublicError("No se pudo verificar el archivo adjunto. Intentá de nuevo.", 503)
    }
    if (res.status === 404 || res.status === 400) return null
    if (!res.ok) {
        console.error("[supabase] lectura del archivo subido respondió", res.status)
        throw new PublicError("No se pudo verificar el archivo adjunto. Intentá de nuevo.", 503)
    }

    const reader = res.body.getReader()
    const chunks = []
    let total = 0
    while (total < bytes) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        total += value.length
    }
    await reader.cancel().catch(() => {})
    return Buffer.concat(chunks).subarray(0, bytes)
}

/** Mueve un archivo dentro del bucket privado. */
export async function moveUpload(fromPath, toPath) {
    if (!supabase) throw new Error("Supabase no está configurado")
    const { error } = await supabase.storage.from(UPLOADS_BUCKET).move(fromPath, toPath)
    if (error) {
        console.error("[supabase] no se pudo mover el archivo subido:", error.message)
        throw new PublicError("No se pudo guardar el archivo adjunto. Intentá de nuevo.", 503)
    }
}

/** Subidas que nadie reclamó después de este tiempo se dan por abandonadas. */
const PENDING_MAX_AGE_MS = 6 * 60 * 60 * 1000

/**
 * Borra de `pending/` lo que quedó de formularios que no se terminaron de
 * enviar. El permiso de subida dura 2 horas, así que 6 horas de margen no
 * pisan a nadie que todavía esté inscribiéndose.
 */
export async function cleanupPendingUploads() {
    if (!supabase) return
    const limite = Date.now() - PENDING_MAX_AGE_MS
    const folder = PENDING_PREFIX.replace(/\/$/, "")
    for (let vuelta = 0; vuelta < 20; vuelta++) {
        const { data, error } = await supabase.storage
            .from(UPLOADS_BUCKET)
            .list(folder, { limit: 500, sortBy: { column: "created_at", order: "asc" } })
        if (error) {
            console.warn("[supabase] no se pudo listar pending/:", error.message)
            return
        }
        const viejos = (data || [])
            .filter((f) => f.id && f.created_at && new Date(f.created_at).getTime() < limite)
            .map((f) => `${PENDING_PREFIX}${f.name}`)
        if (!viejos.length) return
        const { error: rmError } = await supabase.storage.from(UPLOADS_BUCKET).remove(viejos)
        if (rmError) {
            console.warn("[supabase] no se pudo limpiar pending/:", rmError.message)
            return
        }
        console.log(`[supabase] limpieza: ${viejos.length} subidas abandonadas borradas`)
        if (viejos.length < 500) return
    }
}

/**
 * Firma muchas claves de una vez: una llamada por bucket en vez de una por
 * archivo. Devuelve un Map clave → URL firmada (o "" si no se pudo).
 */
export async function signedUrlsFor(keys) {
    const out = new Map()
    if (!supabase) return out
    const porBucket = new Map()
    for (const key of new Set(keys.filter(Boolean))) {
        const parsed = parseStorageKey(key)
        if (!parsed) continue
        if (!porBucket.has(parsed.bucket)) porBucket.set(parsed.bucket, [])
        porBucket.get(parsed.bucket).push({ key, path: parsed.path })
    }
    for (const [bucket, items] of porBucket) {
        for (let i = 0; i < items.length; i += 500) {
            const lote = items.slice(i, i + 500)
            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrls(lote.map((it) => it.path), SIGNED_URL_TTL_S)
            if (error) {
                console.error("[supabase] no se pudieron firmar las URLs:", error.message)
                for (const it of lote) out.set(it.key, "")
                continue
            }
            // La respuesta viene en el mismo orden que los paths pedidos.
            lote.forEach((it, idx) => out.set(it.key, data?.[idx]?.signedUrl || ""))
        }
    }
    return out
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
