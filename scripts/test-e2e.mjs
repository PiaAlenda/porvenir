/**
 * Test end-to-end contra la API: login, alta de inscripcion con archivo,
 * edicion, ficha PDF, cambio de configuracion y limpieza.
 *
 *   pnpm test:e2e                       -> contra http://localhost:3001
 *   pnpm test:e2e https://x.onrender.com
 *
 * Las inscripciones que crea se borran al final. Los cambios de configuracion
 * se revierten al valor original.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")

const BASE = (process.argv[2] || "http://localhost:3001").replace(/\/$/, "")
const EMAIL = process.env.ADMIN_EMAIL
const PASSWORD = process.env.ADMIN_PASSWORD

const IMG = path.join(ROOT, "public", "icons", "escuela.png")
const MARCA = "PRUEBA"

let fallos = 0
function ok(nombre, detalle = "") {
  console.log(`  OK   ${nombre}${detalle ? ` -> ${detalle}` : ""}`)
}
function fallo(nombre, detalle) {
  fallos += 1
  console.log(`  FALLA ${nombre} -> ${detalle}`)
}
async function check(nombre, fn) {
  try {
    const detalle = await fn()
    ok(nombre, detalle)
    return true
  } catch (err) {
    fallo(nombre, err.message)
    return false
  }
}

async function api(pathname, { method = "GET", token, body, raw } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body && !raw) headers["Content-Type"] = "application/json"
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: raw ? body : body ? JSON.stringify(body) : undefined,
  })
  const contentType = res.headers.get("content-type") || ""
  const payload = contentType.includes("application/json") ? await res.json() : await res.arrayBuffer()
  if (!res.ok) {
    const msg = payload instanceof ArrayBuffer ? `HTTP ${res.status}` : payload?.error || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return { res, payload }
}

console.log(`\nProbando ${BASE}\n`)

/* 1. salud */
await check("health dice que usa supabase", async () => {
  const { payload } = await api("/api/health")
  if (payload.storage !== "supabase") throw new Error(`storage=${payload.storage}`)
  return `storage=${payload.storage} auth=${payload.auth}`
})

/* 2. login */
let token = ""
await check("login con supabase auth", async () => {
  const { payload } = await api("/api/auth/login", { method: "POST", body: { email: EMAIL, password: PASSWORD } })
  if (!payload.token) throw new Error("no devolvio token")
  token = payload.token
  return `email=${payload.email}`
})

await check("login con clave incorrecta falla", async () => {
  try {
    await api("/api/auth/login", { method: "POST", body: { email: EMAIL, password: "clave-erronea-123" } })
    throw new Error("acepto una clave incorrecta")
  } catch (err) {
    if (err.message.includes("acepto")) throw err
    return "rechazado"
  }
})

/* 3. token invalido no puede listar */
await check("sin token no se listan inscripciones", async () => {
  try {
    await api("/api/inscripciones")
    throw new Error("permitio listar sin token")
  } catch (err) {
    if (err.message.includes("permitio")) throw err
    return "401"
  }
})

/* 4. configuracion */
let configOriginal = null
let configId = null
await check("GET /api/config devuelve la migracion", async () => {
  const { payload } = await api("/api/config")
  const ids = Object.keys(payload.cursos || {})
  if (!ids.length) throw new Error("sin items")
  configId = ids[0]
  configOriginal = payload.cursos[configId]
  return `${ids.length} items, ejemplo ${configId}`
})

/* 5. alta de inscripcion con archivo */
let inscripcionId = null
await check("alta de inscripcion con foto", async () => {
  const fd = new FormData()
  fd.append("apellido", "PRUEBA")
  fd.append("nombre", "E2E")
  fd.append("c_documento", "DNI")
  fd.append("numeroDocumento", "12345678")
  fd.append("cuil", "20345678901")
  fd.append("fechaNacimiento", "2005-03-14")
  fd.append("c_sexo", "F")
  fd.append("carreraId", "")
  fd.append("cursoId", "")
  fd.append("courseTitle", "PRUEBA E2E")
  fd.append("email", "prueba@example.com")
  fd.append("fotoDni", new Blob([fs.readFileSync(IMG)], { type: "image/png" }), "prueba-dni.png")

  const { payload } = await api("/api/inscripciones", { method: "POST", body: fd, raw: true })
  inscripcionId = payload.id
  return `id=${payload.id}`
})

let fotoUrl = ""
await check("la foto quedo en storage con URL absoluta", async () => {
  const { payload } = await api("/api/inscripciones", { token })
  const found = payload.inscripciones.find((i) => i.id === inscripcionId)
  if (!found) throw new Error("no aparece en el listado")
  fotoUrl = found.fotoDni || ""
  if (!/^https?:\/\//.test(fotoUrl)) throw new Error(`fotoDni no es URL absoluta: ${fotoUrl}`)
  const res = await fetch(fotoUrl)
  if (!res.ok) throw new Error(`la imagen no se puede descargar (${res.status})`)
  return `${fotoUrl.slice(0, 60)}...`
})

await check("validacion rechaza CUIL invalido", async () => {
  const fd = new FormData()
  fd.append("apellido", "PRUEBA")
  fd.append("nombre", "E2E")
  fd.append("c_documento", "DNI")
  fd.append("numeroDocumento", "12345678")
  fd.append("cuil", "123")
  fd.append("fechaNacimiento", "2005-03-14")
  fd.append("c_sexo", "F")
  try {
    await api("/api/inscripciones", { method: "POST", body: fd, raw: true })
    throw new Error("acepto un CUIL invalido")
  } catch (err) {
    if (err.message.includes("acepto")) throw err
    return "rechazado"
  }
})

/* 6. edicion */
await check("editar la inscripcion", async () => {
  const { payload } = await api(`/api/inscripciones/${inscripcionId}`, {
    method: "PUT",
    token,
    body: { domicilio: "Calle PRUEBA 123", especialidad: "E2E" },
  })
  if (payload.inscripcion.domicilio !== "Calle PRUEBA 123") throw new Error("no guardo el domicilio")
  return payload.inscripcion.domicilio
})

/* 7. ficha PDF */
await check("descargar ficha PDF", async () => {
  const { payload } = await api(`/api/inscripciones/${inscripcionId}/ficha?token=${encodeURIComponent(token)}`)
  if (!(payload instanceof ArrayBuffer) || payload.byteLength < 1000) throw new Error("PDF vacio")
  return `${payload.byteLength} bytes`
})

/* 8. configuracion persistente */
await check("cambiar disponibilidad de un curso", async () => {
  const fd = new FormData()
  fd.append("available", String(!configOriginal.available))
  await api(`/api/config/${configId}`, { method: "PUT", token, body: fd, raw: true })

  const { payload } = await api("/api/config")
  if (payload.cursos[configId].available !== !configOriginal.available) {
    throw new Error("el cambio no se lee")
  }
  return `${configId} ahora available=${payload.cursos[configId].available}`
})

/* 9. limpieza: revertir configuracion y borrar la inscripcion */
await check("revertir la configuracion", async () => {
  const fd = new FormData()
  fd.append("available", String(configOriginal.available))
  await api(`/api/config/${configId}`, { method: "PUT", token, body: fd, raw: true })
  const { payload } = await api("/api/config")
  if (payload.cursos[configId].available !== configOriginal.available) throw new Error("no se revirtio")
  return "ok"
})

await check("borrar la inscripcion de prueba", async () => {
  await api(`/api/inscripciones/${inscripcionId}`, { method: "DELETE", token })
  const { payload } = await api("/api/inscripciones", { token })
  if (payload.inscripciones.some((i) => i.id === inscripcionId)) throw new Error("sigue en el listado")
  return "eliminada"
})

console.log(fallos === 0 ? "\nTodo OK\n" : `\n${fallos} prueba(s) fallaron\n`)
process.exit(fallos === 0 ? 0 : 1)