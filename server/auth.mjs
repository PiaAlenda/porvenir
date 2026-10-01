import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { supabase, supabaseAnon, supabaseEnabled } from "./supabase.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@escuela.com"
let PASSWORD = process.env.ADMIN_PASSWORD || "admin"

/**
 * Correos con acceso al panel. Si se especifica ADMIN_EMAILS o ADMIN_EMAIL en el entorno,
 * se filtrará por ellos. Si se usa Supabase y no se define un whitelist,
 * cualquier usuario creado en Supabase Auth tiene acceso.
 */
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || (supabaseEnabled ? process.env.ADMIN_EMAIL : ADMIN_EMAIL) || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
)

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000 // 8 horas

const tokens = new Map() // token -> expiración (ms), solo en modo local

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ""))
  const bufB = Buffer.from(String(b ?? ""))
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function isAdminEmail(email) {
  if (!ADMIN_EMAILS.size) return true // Si no hay whitelist configurada, cualquier usuario de Supabase es admitido
  return ADMIN_EMAILS.has(String(email ?? "").trim().toLowerCase())
}

export function isDefaultPassword() {
  return !supabaseEnabled && PASSWORD === "admin"
}

/** ¿La configuración de acceso del panel es la de desarrollo? */
export function hasUsableAdminConfig() {
  return supabaseEnabled || ADMIN_EMAILS.size > 0
}


/* ---------- Supabase Auth ---------- */

/**
 * Valida las credenciales contra Supabase Auth.
 * Devuelve { token, user } o { error }.
 */
export async function authenticate(email, password) {
  if (supabaseEnabled) {
    if (!supabaseAnon) {
      return { error: "Falta configurar SUPABASE_ANON_KEY en el servidor." }
    }
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: String(email ?? "").trim().toLowerCase(),
      password: String(password ?? ""),
    })
    if (error || !data?.session) {
      console.warn("[supabase auth] Error de login:", error?.message || "Sin sesión")
      return { error: error?.message || "Credenciales incorrectas" }
    }
    // Si se definió ADMIN_EMAILS o ADMIN_EMAIL explícito y no coincide, filtrar; si no, permitir
    if (!isAdminEmail(data.user?.email)) {
      console.warn(`[supabase auth] El usuario ${data.user?.email} no está en la lista de administradores`)
      return { error: "Usuario no autorizado como administrador" }
    }
    return {
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email },
    }
  }

  const okEmail = safeEqual(String(email ?? "").trim().toLowerCase(), ADMIN_EMAIL.toLowerCase())
  const okPass = safeEqual(password, PASSWORD)
  if (!okEmail || !okPass) return { error: "Credenciales incorrectas" }
  return {
    token: issueLocalToken(),
    user: { id: "local", email: ADMIN_EMAIL },
  }
}

/** Valida un access token de Supabase (o del modo local). */
export async function verifyToken(token) {
  if (!token) return false
  if (supabaseEnabled) {
    if (!supabase) return false
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return false
    return isAdminEmail(data.user.email)
  }

  const exp = tokens.get(token)
  if (!exp) return false
  if (Date.now() > exp) {
    tokens.delete(token)
    return false
  }
  return true
}

/** Datos del usuario dueño del token, para el cambio de contraseña. */
async function userFromToken(token) {
  if (!supabaseEnabled) return { id: "local", email: ADMIN_EMAIL }
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return { id: data.user.id, email: data.user.email }
}

/* ---------- cambio de contraseña ---------- */

export async function changePassword(token, currentPassword, newPassword) {
  if (String(newPassword ?? "").length < 8) {
    return { ok: false, message: "La nueva contraseña debe tener al menos 8 caracteres." }
  }
  if (safeEqual(newPassword, currentPassword)) {
    return { ok: false, message: "La nueva contraseña debe ser distinta a la actual." }
  }

  if (supabaseEnabled) {
    const user = await userFromToken(token)
    if (!user) return { ok: false, message: "La sesión venció. Volvé a iniciar sesión." }

    if (!supabaseAnon) {
      return { ok: false, message: "Falta configurar SUPABASE_ANON_KEY en el servidor." }
    }
    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: user.email,
      password: String(currentPassword ?? ""),
    })
    if (signInError) {
      return { ok: false, message: "La contraseña actual no es correcta." }
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: String(newPassword),
    })
    if (error) {
      console.error("[supabase] no se pudo actualizar la contraseña:", error.message)
      return { ok: false, message: "No se pudo actualizar la contraseña." }
    }
    return { ok: true }
  }

  if (!safeEqual(currentPassword, PASSWORD)) {
    return { ok: false, message: "La contraseña actual no es correcta." }
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

/* ---------- modo local ---------- */

function issueLocalToken() {
  const token = crypto.randomBytes(24).toString("hex")
  tokens.set(token, Date.now() + TOKEN_TTL_MS)
  return token
}

export function isValidPassword() {
  return !isDefaultPassword()
}