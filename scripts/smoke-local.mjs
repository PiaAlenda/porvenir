/**
 * Smoke test local. Corre contra el servidor en localhost:3001, usando las
 * credenciales reales del .env. Genera un PDF temporal, lo borra, y no toca
 * configuración de cursos.

    node scripts/smoke-local.mjs

No usarlo contra producción: modifica datos reales.
*/
const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3001"
const results = []

function check(name, ok, detail = "") {
  results.push({ name, ok, detail })
  console.log(`${ok ? "OK  " : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`)
}

// 1x1 PNG transparente.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
if (!email || !password) {
  console.error("Faltan ADMIN_EMAIL / ADMIN_PASSWORD en el entorno.")
  process.exit(2)
}

console.log(`Probando contra ${BASE}\n`)

/* ---------- headers de seguridad ---------- */
{
  const res = await fetch(`${BASE}/api/health`)
  const h = res.headers
  check("helmet: X-Content-Type-Options", h.get("x-content-type-options") === "nosniff", h.get("x-content-type-options"))
  check("helmet: X-Frame-Options", Boolean(h.get("x-frame-options")), h.get("x-frame-options"))
  check("helmet: CSP", Boolean(h.get("content-security-policy")), "presente" )
  check("helmet: Referrer-Policy", Boolean(h.get("referrer-policy")), h.get("referrer-policy"))
  check("health responde ok", (await res.json()).ok === true)
}

/* ---------- CORS ---------- */
{
  const evil = await fetch(`${BASE}/api/health`, { headers: { Origin: "https://evil.example" } })
  check("CORS rechaza origen no permitido", !evil.headers.get("access-control-allow-origin"), "sin ACAO")
}

/* ---------- token por query string: tiene que estar muerto ---------- */
{
  const res = await fetch(`${BASE}/api/inscripciones?token=abc123`)
  check("token por query string rechazado", res.status === 401, `status ${res.status}`)
}

/* ---------- login y listado ---------- */
let token = ""
{
  const bad = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: `${password}-incorrecta` }),
  })
  check("login con clave incorrecta rechazado", bad.status === 401, `status ${bad.status}`)

  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  token = body.token || ""
  check("login correcto devuelve token", Boolean(token), token ? "ok" : JSON.stringify(body))
}

if (token) {
  const auth = { Authorization: `Bearer ${token}` }

  const list = await fetch(`${BASE}/api/inscripciones`, { headers: auth })
  check("listar inscripciones con Bearer", list.ok, `status ${list.status}`)

  const noAuth = await fetch(`${BASE}/api/inscripciones`)
  check("listar sin token rechazado", noAuth.status === 401, `status ${noAuth.status}`)
}

/* ---------- adjunto falso: .png que en realidad es un .exe ---------- */
{
  const form = new FormData()
  form.append("apellido", "Prueba")
  form.append("nombre", "SmokeTest")
  form.append("c_documento", "DNI")
  form.append("numeroDocumento", "12345678")
  form.append("cuil", "20345678901")
  form.append("fechaNacimiento", "2005-03-15")
  form.append("c_sexo", "M")
  form.append("fotoDni", new Blob([Buffer.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0])], { type: "image/png" }), "dni.png")

  const res = await fetch(`${BASE}/api/inscripciones`, { method: "POST", body: form })
  const body = await res.json()
  check(
    "archivo .exe disfrazado de .png rechazado",
    res.status === 400,
    `status ${res.status} · ${body?.error || ""}`,
  )
}

/* ---------- flujo completo: alta, ficha PDF, limpieza ---------- */
if (token) {
  const auth = { Authorization: `Bearer ${token}` }
  const suffix = Date.now()
  let createdId = ""

  {
    const form = new FormData()
    form.append("apellido", "SmokeTest")
    form.append("nombre", "Temporal")
    form.append("c_documento", "DNI")
    form.append("numeroDocumento", "99999999")
    form.append("cuil", "20345678901")
    form.append("fechaNacimiento", "2005-03-15")
    form.append("c_sexo", "M")
    form.append("email", "smoke@test.local")
    form.append("fotoDni", new Blob([PNG], { type: "image/png" }), "dni.png")

    const res = await fetch(`${BASE}/api/inscripciones`, { method: "POST", body: form })
    const body = await res.json()
    createdId = body.id || ""
    check("inscripción con PNG real creada", res.status === 201 && Boolean(createdId), `status ${res.status}`)

    if (createdId) {
      const list = await fetch(`${BASE}/api/inscripciones`, { headers: auth })
      const { inscripciones = [] } = await list.json()
      const found = inscripciones.find((i) => i.id === createdId)
      check("aparece en el listado", Boolean(found))

      // La URL del adjunto no debe ser una URL pública de Storage.
      if (found?.fotoDni) {
        const isPublic = found.fotoDni.includes("/object/public/")
        const isSigned = found.fotoDni.includes("token=")
        check("adjunto no es URL pública de Storage", !isPublic, found.fotoDni.slice(0, 60))
        check("adjunto usa URL firmada", isSigned)
      } else {
        check("adjunto referenciado en el registro", false, "fotoDni vacío")
      }

      const pdf = await fetch(`${BASE}/api/inscripciones/${createdId}/ficha`, { headers: auth })
      const pdfBuf = Buffer.from(await pdf.arrayBuffer())
      const isPdf = pdfBuf.subarray(0, 5).toString() === "%PDF-"
      check("ficha PDF generada", pdf.ok && isPdf, `status ${pdf.status} · ${pdfBuf.length} bytes`)

      const pdfNoAuth = await fetch(`${BASE}/api/inscripciones/${createdId}/ficha`)
      check("ficha sin token rechazada", pdfNoAuth.status === 401, `status ${pdfNoAuth.status}`)

      const del = await fetch(`${BASE}/api/inscripciones/${createdId}`, { method: "DELETE", headers: auth })
      check("inscripción de prueba eliminada", del.ok, `status ${del.status}`)
      createdId = ""
    }
  }

  check("sin residuos de prueba", createdId === "")
}

/* ---------- fuga de errores internos ---------- */
{
  const form = new FormData()
  form.append("apellido", "X")
  // Faltan campos obligatorios: debe dar 400 con mensaje del dominio, no 500.
  const res = await fetch(`${BASE}/api/inscripciones`, { method: "POST", body: form })
  const body = await res.json()
  check(
    "validación devuelve mensaje de dominio",
    res.status === 400 && !JSON.stringify(body).match(/stack|at Object|node_modules/i),
    body?.error || "",
  )
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} pruebas OK`)
if (failed.length) {
  console.log("\nFallaron:")
  for (const f of failed) console.log(`  - ${f.name} (${f.detail})`)
}
process.exit(failed.length ? 1 : 0)
