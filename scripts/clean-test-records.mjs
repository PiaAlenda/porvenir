/**
 * Busca y borra inscripciones de prueba (SmokeTest / Temporal) que quedaron de
 * corridas de humo anteriores. Ejecutalo con credenciales reales de admin.

    node scripts/clean-test-records.mjs [--dry-run]
*/
const DRY = process.argv.includes("--dry-run")
const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3001"
const MARCADORES = ["SmokeTest", "smoketest", "Temporal", "Prueba"]

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
if (!email || !password) {
  console.error("Faltan ADMIN_EMAIL / ADMIN_PASSWORD en el entorno.")
  process.exit(2)
}

const res = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const { token } = await res.json()
if (!token) {
  console.error("No se pudo iniciar sesión.")
  process.exit(2)
}

const list = await fetch(`${BASE}/api/inscripciones`, {
  headers: { Authorization: `Bearer ${token}` },
})
const { inscripciones = [] } = await list.json()

const sospechosos = inscripciones.filter((i) => {
  const texto = `${i.apellido} ${i.nombre} ${i.email || ""}`.toLowerCase()
  return MARCADORES.some((m) => texto.includes(m.toLowerCase()))
})

if (!sospechosos.length) {
  console.log(`Sin registros de prueba. Total en la base: ${inscripciones.length}`)
  process.exit(0)
}

console.log(`Encontrados ${sospechosos.length} registro(s) de prueba:\n`)
for (const s of sospechosos) {
  console.log(`  ${s.id}  ${s.apellido}, ${s.nombre}  (${s.email || "sin email"})`)
}
console.log("")

for (const s of sospechosos) {
  if (DRY) {
    console.log(`[dry-run] se borraría ${s.id}`)
    continue
  }
  const del = await fetch(`${BASE}/api/inscripciones/${s.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  console.log(`${del.ok ? "borrado" : "FALLO"}  ${s.id} (status ${del.status})`)
}

console.log(`\nTotal que queda en la base: ${inscripciones.length - (DRY ? 0 : sospechosos.length)}`)
