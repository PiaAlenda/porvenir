import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@escuela.com"
let PASSWORD = process.env.ADMIN_PASSWORD || "admin"

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000 // 8 horas
const MAX_FAILURES = 5
const LOCK_MS = 15 * 60 * 1000 // 15 minutos

const tokens = new Map() // token -> expiración (ms)
const failures = new Map() // ip -> { count, lockUntil }

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ""))
  const bufB = Buffer.from(String(b ?? ""))
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export function isDefaultPassword() {
  return PASSWORD === "admin"
}

export function checkCredentials(email, password) {
  const okEmail = safeEqual(String(email ?? "").trim().toLowerCase(), ADMIN_EMAIL.toLowerCase())
  const okPass = safeEqual(password, PASSWORD)
  return okEmail && okPass
}

export function isLocked(ip) {
  const f = failures.get(ip)
  if (!f || !f.lockUntil) return false
  if (Date.now() >= f.lockUntil) {
    failures.delete(ip)
    return false
  }
  return true
}

export function lockRemainingMs(ip) {
  const f = failures.get(ip)
  if (!f?.lockUntil) return 0
  return Math.max(0, f.lockUntil - Date.now())
}

export function registerFailure(ip) {
  const f = failures.get(ip) || { count: 0, lockUntil: 0 }
  f.count += 1
  if (f.count >= MAX_FAILURES) {
    f.lockUntil = Date.now() + LOCK_MS
    f.count = 0
  }
  failures.set(ip, f)
}

export function resetFailures(ip) {
  failures.delete(ip)
}

export function changePassword(currentPassword, newPassword) {
  if (!safeEqual(currentPassword, PASSWORD)) {
    return { ok: false, message: "La contraseña actual no es correcta." }
  }
  if (String(newPassword ?? "").length < 8) {
    return { ok: false, message: "La nueva contraseña debe tener al menos 8 caracteres." }
  }
  if (safeEqual(newPassword, currentPassword)) {
    return { ok: false, message: "La nueva contraseña debe ser distinta a la actual." }
  }

  PASSWORD = String(newPassword)
  persistEnvPassword(PASSWORD)
  return { ok: true }
}

function persistEnvPassword(password) {
  try {
    const envPath = path.join(__dirname, "..", ".env")
    if (!fs.existsSync(envPath)) return
    const raw = fs.readFileSync(envPath, "utf8")
    const lines = raw.split(/\r?\n/)
    const idx = lines.findIndex((l) => /^\s*ADMIN_PASSWORD\s*=/.test(l))
    if (idx !== -1) {
      lines[idx] = `ADMIN_PASSWORD=${password}`
    } else {
      lines.push(`ADMIN_PASSWORD=${password}`)
    }
    fs.writeFileSync(envPath, lines.join("\n"), "utf8")
  } catch {
    // El cambio queda vigente en memoria aunque no se pueda persistir al .env.
  }
}

export function issueToken() {
  const token = crypto.randomBytes(24).toString("hex")
  tokens.set(token, Date.now() + TOKEN_TTL_MS)
  return token
}

export function verifyToken(token) {
  if (!token) return false
  const exp = tokens.get(token)
  if (!exp) return false
  if (Date.now() > exp) {
    tokens.delete(token)
    return false
  }
  return true
}

export function isValidPassword() {
  return !isDefaultPassword()
}