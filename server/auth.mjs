import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { supabase, supabaseAnon, supabaseEnabled } from "./supabase.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@escuela.com"
let PASSWORD = process.env.ADMIN_PASSWORD || "admin"

/**
 * Allow-list de administradores tal como vino del entorno, antes de aplicarle
 * el default. El default se conserva para que `pnpm dev` funcione sin
 * configurar nada, pero distinguir "vino del entorno" de "se inventó acá" es
 * lo que separa un arranque sano de uno que rechaza todos los logins.
 */
const ADMIN_EMAILS_RAW = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").trim()

/**
 * Correos con acceso al panel. `ADMIN_EMAILS` acepta varios separados por
 * coma; si no está, se usa el `ADMIN_EMAIL` de siempre.
 *
 * Fail-closed a propósito: en modo Supabase, `verifyToken` solo comprobaba que
 * el token fuera de un usuario válido, así que cualquier cuenta creada en el
 * proyecto entraba como administrador. Con el alta por email abierta, eso
 * alcanzaba para que cualquiera se metiera al panel. Por eso una allow-list
 * vacía ya no significa "cualquiera es admin" sino "nadie entra", y el
 * arranque en producción se niega a seguir sin allow-list.
 */
const ADMIN_EMAILS = new Set(
  (ADMIN_EMAILS_RAW || ADMIN_EMAIL)
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
  return ADMIN_EMAILS.has(String(email ?? "").trim().toLowerCase())
}

/** Allow-list efectiva, para que el log diga cuál se comparó contra el login. */
function adminAllowListForLog() {
  if (!ADMIN_EMAILS_RAW) {
    return "(sin definir en el entorno, se comparó contra el default de desarrollo)"
  }
  return [...ADMIN_EMAILS].join(", ")
}

export function isDefaultPassword() {
  return !supabaseEnabled && PASSWORD === "admin"
}

/**
 * ¿Hay una allow-list de administradores definida en el entorno?
 *
 * Lee `ADMIN_EMAILS_RAW` y no `ADMIN_EMAILS.size` a propósito. El Set cae al
 * `admin@escuela.com` por defecto, así que su tamaño era siempre mayor a cero
 * y el guard de arranque de `index.mjs` no detectaba nunca una configuración
 * ausente: Render levantaba la API "sana" y rechazaba todos los logins con un
 * 401 indistinguible de una contraseña incorrecta.
 */
export function hasUsableAdminConfig() {
  return ADMIN_EMAILS_RAW.length > 0
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
      // El mensaje crudo de Supabase no vuelve al cliente: decir "invalid
      // login credentials" frente a "user not found" convierte el login en un
      // oráculo para enumerar cuentas. El detalle queda en el log del
      // servidor, que es donde hay que mirar cuando el panel devuelve 401.
      console.warn(
        `[supabase auth] login RECHAZADO: credenciales inválidas para "${String(email ?? "").trim().toLowerCase()}" (${error?.message || "sin sesión"})`,
      )
      return { error: "Credenciales incorrectas" }
    }
    if (!isAdminEmail(data.user?.email)) {
      console.warn(
        `[supabase auth] login RECHAZADO: "${data.user?.email}" autenticó bien pero NO está en la allow-list. ADMIN_EMAIL/ADMIN_EMAILS = ${adminAllowListForLog()}`,
      )
      return { error: "Credenciales incorrectas" }
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