import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"
import multer from "multer"
import {
    ASSETS_BUCKET,
    UPLOADS_BUCKET,
    supabaseEnabled,
    uploadToStorage,
    removeFromStorage,
    parseStorageKey,
    publicUrlFor,
    signedUrlFor,
    signedUrlsFor,
    createPendingUploadUrl,
    readHeadBytes,
    moveUpload,
    PENDING_PREFIX,
} from "./supabase.mjs"
import { PublicError } from "./errors.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, "data", "uploads")
export const UPLOADS_URL_PREFIX = "/uploads"

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
/*
 * Los videos de las careers pesan bastante más que una foto. 50MB es el
 * mismo techo que impone Supabase Storage: si el multer aceptara más, el
 * archivo pasaría la validación de la API y la rechazaría el bucket.
 */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

const ALLOWED_MIME = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
])

/*
 * Solo los tipos que `VIDEO_SIGNATURES` sabe verificar. Ogg queda fuera a
 * propósito: si se acceptara acá, `assertValidVideoType` lo rechazaría después
 * con un error confuso, cuando el archivo sí pasó el filtro de multer.
 */
const ALLOWED_VIDEO_MIME = new Set([
    "video/webm",
    "video/mp4",
])

/**
 * Firmas de archivo por tipo. `file.mimetype` lo manda el cliente, así que
 * no sirve para decidir nada: alcanza con renombrar un .exe a .png para que
 * pase el filtro. Lo que no se puede falsificar tan fácil son los primeros
 * bytes del archivo.
 */
const SIGNATURES = [
    { ext: ".png", mime: "image/png", test: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
    { ext: ".jpg", mime: "image/jpeg", test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    { ext: ".webp", mime: "image/webp", test: (b) => b.length > 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP" },
    { ext: ".gif", mime: "image/gif", test: (b) => b.length > 6 && (b.toString("latin1", 0, 6) === "GIF87a" || b.toString("latin1", 0, 6) === "GIF89a") },
    { ext: ".pdf", mime: "application/pdf", test: (b) => b.length > 5 && b.toString("latin1", 0, 5) === "%PDF-" },
]

/**
 * Igual que SIGNATURES pero para los videos de las carreras. Mismo motivo: el
 * `mimetype` lo declara el cliente, así que la decisión se toma sobre los
 * primeros bytes.
 */
const VIDEO_SIGNATURES = [
    // EBML: webm y también mkv, que el navegador no reproduce pero al menos
    // no se cuela como otra cosa.
    { ext: ".webm", mime: "video/webm", test: (b) => b.length > 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
    // MP4/MOV: el box "ftyp" va en el cuarto byte.
    { ext: ".mp4", mime: "video/mp4", test: (b) => b.length > 12 && b.toString("latin1", 4, 8) === "ftyp" },
]

const assetFileFilter = (_req, file, cb) => {
    // Chequeo temprano para no gastar ancho de banda con algo que se va a
    // rechazar igual. La verificación real es assertValidFileType().
    if (file.mimetype && !ALLOWED_MIME.has(file.mimetype)) {
        cb(new Error("Solo se admiten imágenes (JPG, PNG, WEBP, GIF) o PDF."))
        return
    }
    cb(null, true)
}

/**
 * Multer en memoria: el archivo va a Supabase Storage, no al disco de Render.
 * El límite de `files` acota los adjuntos por request; el rate limiting de la
 * ruta es lo que acota la memoria total en vuelo.
 */
export const upload = multer({
    storage: multer.memoryStorage(),
    // Tres adjuntos: DNI, certificado y CUIL.
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 3 },
    fileFilter: assetFileFilter,
})

/**
 * Adjuntos de la configuración de un curso o carrera: logo, fotos de los
 * docentes y el video. Necesita más archivos por request y un tope de peso
 * mayor porque los videosWebM del repo rondan los 25MB.
 */
export const careerUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_VIDEO_BYTES, files: 30 },
    fileFilter: (_req, file, cb) => {
        const mimetype = file.mimetype || ""
        if (mimetype.startsWith("video/")) {
            if (!ALLOWED_VIDEO_MIME.has(mimetype)) {
                cb(new Error("El video debe ser WebM, MP4 u OGG."))
                return
            }
            cb(null, true)
            return
        }
        assetFileFilter(_req, file, cb)
    },
}).any()

/**
 * Verifica que el contenido sea realmente una imagen o un PDF y devuelve la
 * extensión correspondiente. Se llama desde saveUpload() porque con
 * memoryStorage() el buffer todavía no está poblado cuando corre fileFilter.
 */
export function assertValidFileType(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new PublicError("El archivo adjunto está vacío.")
    }
    const match = SIGNATURES.find((s) => s.test(buffer))
    if (!match) {
        throw new PublicError("El archivo adjunto no es una imagen ni un PDF válido.")
    }
    return match
}

export function assertValidVideoType(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new PublicError("El video está vacío.")
    }
    const match = VIDEO_SIGNATURES.find((s) => s.test(buffer))
    if (!match) {
        throw new PublicError("El video no es un archivo WebM o MP4 válido.")
    }
    return match
}

/**
 * El nombre se arma del timestamp y un UUID corto. La extensión sale del
 * contenido detectado, nunca de `file.originalname`, que controla el cliente y
 * permitiría crafting de una extensión doble.
 */
function buildName(detected) {
    return `${Date.now()}-${randomUUID().slice(0, 8)}${detected.ext}`
}

/**
 * Guarda un archivo y devuelve la clave que hay que referenciarlo.
 * `visibility: "private"` para documentos de identidad (van al bucket
 * privado y se leen con URL firmada), `"public"` para imágenes de marketing.
 * `kind: "video"` cambia la validación a los firmas de video.
 */
export async function saveUpload(file, { visibility = "private", kind = "image" } = {}) {
    if (!file) return ""

    const detected = kind === "video" ? assertValidVideoType(file.buffer) : assertValidFileType(file.buffer)
    const bucket = visibility === "public" ? ASSETS_BUCKET : UPLOADS_BUCKET
    const filename = buildName(detected)
    const key = `${bucket}/${filename}`

    if (supabaseEnabled) {
        return uploadToStorage(key, file.buffer, detected.mime)
    }

    // El mismo nombre que la clave: antes se generaba otro y el archivo
    // guardado no coincidía con lo que quedaba en la inscripción.
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
    await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer)
    return key
}

/* ---------- subida directa (navegador → Storage) ---------- */

const EXT_BY_MIME = new Map(SIGNATURES.map((s) => [s.mime, s.ext]))

/** Claves que puede reclamar una inscripción: solo lo que emitió `createUploadTickets`. */
const PENDING_KEY_RE = new RegExp(
    `^${UPLOADS_BUCKET}/${PENDING_PREFIX}[0-9a-f-]{36}\\.(png|jpg|webp|gif|pdf)$`,
)

export function isPendingKey(key) {
    return typeof key === "string" && PENDING_KEY_RE.test(key)
}

/**
 * Descarta subidas pendientes de un envío que no prosperó. Solo toca claves de
 * `pending/`: cualquier otra cosa que mande el cliente se ignora, para que no
 * se pueda usar esto para borrar el adjunto de otra inscripción.
 */
export async function discardPendingUploads(keys) {
    const pendientes = keys.filter(isPendingKey)
    await Promise.allSettled(pendientes.map((key) => removeFromStorage(key)))
}

/** La subida directa existe solo con Supabase; en local se usa el multipart. */
export const directUploadsEnabled = supabaseEnabled

/**
 * Emite un permiso de subida por archivo declarado. El tipo y el tamaño los
 * declara el navegador, así que esto es solo un filtro temprano: el bucket
 * vuelve a imponer tipo y tamaño, y `claimDirectUpload` verifica el contenido.
 */
export async function createUploadTickets(files) {
    if (!Array.isArray(files) || files.length === 0 || files.length > 3) {
        throw new PublicError("Solicitud de subida inválida.")
    }
    return Promise.all(
        files.map(async (file) => {
            const type = String(file?.type || "")
            const ext = EXT_BY_MIME.get(type)
            if (!ext) throw new PublicError("Solo se admiten imágenes (JPG, PNG, WEBP, GIF) o PDF.")
            const size = Number(file?.size)
            if (!Number.isFinite(size) || size <= 0) throw new PublicError("El archivo adjunto está vacío.")
            if (size > MAX_UPLOAD_BYTES) throw new PublicError("Cada imagen debe pesar menos de 10MB.")
            return createPendingUploadUrl(`${randomUUID()}${ext}`)
        }),
    )
}

/**
 * Toma un archivo que el navegador subió a `pending/`, verifica por sus
 * primeros bytes que sea de verdad una imagen o un PDF y lo mueve a su lugar
 * definitivo. Devuelve la clave final, la que se guarda en la inscripción.
 *
 * Una vez movido ya no está en `pending/`, así que la misma clave no se puede
 * usar para otra inscripción.
 */
export async function claimDirectUpload(key) {
    if (!isPendingKey(key)) {
        throw new PublicError("El archivo adjunto no es válido. Volvé a adjuntarlo.")
    }
    const parsed = parseStorageKey(key)
    const head = await readHeadBytes(parsed.path)
    if (!head) {
        throw new PublicError("No encontramos el archivo adjunto. Volvé a adjuntarlo e intentá de nuevo.")
    }
    let detected
    try {
        detected = assertValidFileType(head)
    } catch (err) {
        // No sirve para nada: se borra en el acto en vez de esperar la limpieza.
        await removeFromStorage(key).catch(() => {})
        throw err
    }
    const finalName = buildName(detected)
    await moveUpload(parsed.path, finalName)
    return `${UPLOADS_BUCKET}/${finalName}`
}

/** Firma en lote las URLs de los adjuntos privados (listado del panel). */
export async function resolveMediaUrls(values) {
    if (!supabaseEnabled) {
        return new Map(values.filter(Boolean).map((v) => [v, resolveLocalUrl(v)]))
    }
    const firmables = values.filter((v) => v && parseStorageKey(v))
    const firmadas = await signedUrlsFor(firmables)
    // Lo que no es clave de Storage (URLs viejas) se devuelve tal cual.
    for (const v of values) if (v && !firmadas.has(v)) firmadas.set(v, v)
    return firmadas
}

function resolveLocalUrl(value) {
    const parsed = parseStorageKey(value)
    if (!parsed) return value
    return `${UPLOADS_URL_PREFIX}/${parsed.path}`
}

/** Borra el archivo anterior cuando se reemplaza o se quita un adjunto. */
export async function deleteUpload(value) {
    if (!value) return
    if (supabaseEnabled) {
        await removeFromStorage(value)
        return
    }
    const parsed = parseStorageKey(value)
    if (!parsed) return
    const filename = parsed.path
    if (!filename || filename.includes("/") || filename.includes("..")) return
    await fs.rm(path.join(UPLOADS_DIR, filename), { force: true }).catch(() => {})
}

/**
 * URL para mostrar un documento de identidad. Sin Supabase devuelve la ruta
 * local que sirve express.static; con Supabase, una URL firmada de 10 minutos.
 */
export async function resolveMediaUrl(value) {
    if (!value) return value
    if (supabaseEnabled) {
        if (!parseStorageKey(value)) return value
        return signedUrlFor(value)
    }
    const parsed = parseStorageKey(value)
    if (!parsed) return value
    return `${UPLOADS_URL_PREFIX}/${parsed.path}`
}

/**
 * URL para un asset de marketing. Estos son públicos a propósito, así que
 * van por URL pública y no por firma.
 */
export function resolveAssetUrl(value) {
    if (!value) return value
    if (supabaseEnabled) {
        if (!parseStorageKey(value)) return value
        return publicUrlFor(value)
    }
    const parsed = parseStorageKey(value)
    if (!parsed) return value
    return `${UPLOADS_URL_PREFIX}/${parsed.path}`
}

export { UPLOADS_BUCKET, ASSETS_BUCKET }
