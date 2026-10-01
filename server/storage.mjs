import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"
import multer from "multer"
import { supabaseEnabled, uploadToStorage, removeFromStorage, storagePathFromUrl, publicUrlFor } from "./supabase.mjs"

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

/** Multer en memoria: el archivo va a Supabase Storage, no al disco de Render. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && !ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Solo se admiten imágenes (JPG, PNG, WEBP, GIF) o PDF."))
      return
    }
    cb(null, true)
  },
})

function buildName(file) {
  const ext = path.extname(file.originalname || "").toLowerCase() || guessExt(file.mimetype)
  return `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
}

function guessExt(mime) {
  if (mime === "application/pdf") return ".pdf"
  if (mime === "image/png") return ".png"
  if (mime === "image/webp") return ".webp"
  if (mime === "image/gif") return ".gif"
  return ".jpg"
}

/**
 * Guarda un archivo y devuelve la URL con la que hay que referenciarlo.
 * Con Supabase devuelve la URL pública de Storage; sin Supabase, la ruta local.
 */
export async function saveUpload(file) {
  if (!file) return ""
  const filename = buildName(file)

  if (supabaseEnabled) {
    return uploadToStorage(filename, file.buffer, file.mimetype || "application/octet-stream")
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer)
  return `${UPLOADS_URL_PREFIX}/${filename}`
}

/** Borra el archivo anterior cuando se reemplaza o se quita un adjunto. */
export async function deleteUpload(value) {
  if (!value) return
  if (supabaseEnabled) {
    await removeFromStorage(value)
    return
  }
  if (!value.startsWith(`${UPLOADS_URL_PREFIX}/`)) return
  const filename = value.slice(UPLOADS_URL_PREFIX.length + 1)
  if (!filename || filename.includes("/") || filename.includes("..")) return
  await fs.rm(path.join(UPLOADS_DIR, filename), { force: true }).catch(() => {})
}

/**
 * Las inscripciones guardaban "/uploads/archivo.png", una ruta relativa que en
 * Vercel apunta al dominio equivocado. Se convierte a la URL pública de
 * Storage para que las fotos se vean desde el panel.
 */
export function resolveMediaUrl(value) {
  if (!value) return value
  if (/^https?:\/\//i.test(value)) return value
  if (supabaseEnabled && value.startsWith(`${UPLOADS_URL_PREFIX}/`)) {
    const filePath = storagePathFromUrl(value)
    if (!filePath) return value
    return publicUrlFor(filePath)
  }
  return value
}