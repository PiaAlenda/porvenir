/**
 * Prueba de carga de la inscripción pública.
 *
 *   node scripts/load-test.mjs [cantidad] [MB por foto]
 *   LOAD_TEST_URL=http://localhost:3001 node scripts/load-test.mjs 150 0.4
 *
 * Manda `cantidad` inscripciones a la vez (documentos distintos) y, además,
 * 5 envíos simultáneos con el MISMO documento: de esos tiene que entrar uno
 * solo y el resto recibir 409.
 *
 * Crea inscripciones de verdad. Por eso se niega a apuntar a algo que no sea
 * localhost salvo con LOAD_TEST_ALLOW_REMOTE=1 (y ahí hay que borrarlas
 * después desde el panel o con scripts/clean-test-records.mjs).
 */

const BASE = (process.env.LOAD_TEST_URL || "http://localhost:3001").replace(/\/$/, "")
const CANTIDAD = Number(process.argv[2] || 100)
const MB_POR_FOTO = Number(process.argv[3] || 0.4)

const esLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)
if (!esLocal && process.env.LOAD_TEST_ALLOW_REMOTE !== "1") {
  console.error(`Esto crea inscripciones reales en ${BASE}. Si es a propósito, usá LOAD_TEST_ALLOW_REMOTE=1.`)
  process.exit(1)
}

/** JPEG falso: la API solo valida la firma de los primeros bytes. */
function fotoFalsa(bytes) {
  const buf = Buffer.alloc(Math.max(16, Math.round(bytes)), 0x41)
  buf[0] = 0xff
  buf[1] = 0xd8
  buf[2] = 0xff
  return new Blob([buf], { type: "image/jpeg" })
}

const FOTO = fotoFalsa(MB_POR_FOTO * 1024 * 1024)
const prefijo = String(Date.now()).slice(-5)

function formulario(documento) {
  const fd = new FormData()
  fd.append("apellido", "Carga")
  fd.append("nombre", `Prueba ${documento}`)
  fd.append("c_documento", "DNI")
  fd.append("numeroDocumento", documento)
  fd.append("cuil", `20${documento.padStart(8, "0").slice(-8)}1`)
  fd.append("fechaNacimiento", "2008-05-10")
  fd.append("c_sexo", "M")
  fd.append("email", "prueba@example.com")
  fd.append("fotoDni", FOTO, "dni.jpg")
  fd.append("fotoCertificado", FOTO, "cert.jpg")
  return fd
}

async function enviar(documento) {
  const t0 = performance.now()
  try {
    const res = await fetch(`${BASE}/api/inscripciones`, { method: "POST", body: formulario(documento) })
    await res.text()
    return { status: res.status, ms: performance.now() - t0 }
  } catch (err) {
    return { status: "red", ms: performance.now() - t0, error: err.message }
  }
}

function resumen(nombre, resultados) {
  const porStatus = {}
  for (const r of resultados) porStatus[r.status] = (porStatus[r.status] || 0) + 1
  const ms = resultados.map((r) => r.ms).sort((a, b) => a - b)
  const p = (q) => Math.round(ms[Math.min(ms.length - 1, Math.floor(q * ms.length))])
  console.log(`\n${nombre}`)
  console.log("  respuestas:", porStatus)
  console.log(`  latencia: p50 ${p(0.5)}ms · p95 ${p(0.95)}ms · máx ${p(1)}ms`)
  return porStatus
}

console.log(`Destino: ${BASE} · ${CANTIDAD} inscripciones simultáneas · ${MB_POR_FOTO}MB por foto`)

const docs = Array.from({ length: CANTIDAD }, (_, i) => `${prefijo}${String(i).padStart(3, "0")}`)
const t0 = performance.now()
const carga = await Promise.all(docs.map(enviar))
const totalS = ((performance.now() - t0) / 1000).toFixed(1)
const estados = resumen(`Carga (${totalS}s en total)`, carga)

const docRepetido = `${prefijo}999`
const repetidos = await Promise.all(Array.from({ length: 5 }, () => enviar(docRepetido)))
const estadosRep = resumen("Mismo documento ×5 a la vez", repetidos)

const health = await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false)
console.log(`\nServidor sigue respondiendo: ${health ? "sí" : "NO"}`)

const okCarga = estados[201] === CANTIDAD
const okRep = estadosRep[201] === 1 && estadosRep[409] === 4
console.log(okCarga ? "✔ todas las inscripciones entraron" : "✘ hubo inscripciones rechazadas o fallidas")
console.log(okRep ? "✔ el documento repetido entró una sola vez" : "✘ el control de duplicados falló")
process.exit(okCarga && okRep && health ? 0 : 1)
