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
} from "./supabase.mjs"
import { PublicError } from "./errors.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, "data", "uploads")
export const UPLOADS_URL_PREFIX = "/uploads"

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
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
 * Multer en memoria: el archivo va a Supabase Storage, no al disco de Render.
 * El límite de `files` acota los adjuntos por request; el rate limiting de la
 * ruta es lo que acota la memoria total en vuelo.
 */
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 2 },
    fileFilter: (_req, file, cb) => {
        // Chequeo temprano para no gastar ancho de banda con algo que se va a
        // rechazar igual. La verificación real es assertValidFileType().
        if (file.mimetype && !ALLOWED_MIME.has(file.mimetype)) {
            cb(new Error("Solo se admiten imágenes (JPG, PNG, WEBP, GIF) o PDF."))
            return
        }
        cb(null, true)
    },
})

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
 */
export async function saveUpload(file, { visibility = "private" } = {}) {
    if (!file) return ""

    const detected = assertValidFileType(file.buffer)
    const bucket = visibility === "public" ? ASSETS_BUCKET : UPLOADS_BUCKET
    const key = `${bucket}/${buildName(detected)}`

    if (supabaseEnabled) {
        return uploadToStorage(key, file.buffer, detected.mime)
    }

    await fs.mkdir(UPLOADS_DIR, { recursive: true })
    await fs.writeFile(path.join(UPLOADS_DIR, buildName(detected)), file.buffer)
    return key
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
