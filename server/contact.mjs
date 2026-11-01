/*
 * Consultas del formulario de contacto.
 *
 * El correo de la escuela vive solo acá (variable de entorno CONTACT_TO_EMAIL):
 * el sitio no lo muestra ni lo incluye en el bundle, así que los bots que
 * rastrean HTML en busca de direcciones no lo encuentran.
 *
 * Envío vía Resend (https://resend.com), por HTTP: no agrega dependencias.
 *   RESEND_API_KEY     clave de API (obligatoria para enviar)
 *   CONTACT_TO_EMAIL   casilla que recibe las consultas (obligatoria)
 *   CONTACT_FROM_EMAIL remitente verificado en Resend. Por defecto usa el
 *                      remitente de pruebas de Resend, que solo entrega a la
 *                      casilla dueña de la cuenta.
 */

const MAX = { nombre: 100, email: 150, mensaje: 2000 }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isContactConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL)
}

/** Quita saltos de línea y caracteres de control: evita inyección en cabeceras. */
const oneLine = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .trim()

const escapeHtml = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

/** Devuelve `{ ok: true, data }` o `{ ok: false, error }`. */
export function validateContact(body) {
  const nombre = oneLine(body?.nombre)
  const email = oneLine(body?.email)
  const mensaje = String(body?.mensaje ?? "").replace(/\r\n/g, "\n").trim()

  if (nombre.length < 2 || nombre.length > MAX.nombre) return { ok: false, error: "Ingresá tu nombre y apellido." }
  if (!EMAIL_RE.test(email) || email.length > MAX.email) return { ok: false, error: "Ingresá un correo electrónico válido." }
  if (mensaje.length < 10) return { ok: false, error: "El mensaje es muy corto: contanos un poco más." }
  if (mensaje.length > MAX.mensaje) return { ok: false, error: `El mensaje no puede superar los ${MAX.mensaje} caracteres.` }

  return { ok: true, data: { nombre, email, mensaje } }
}

export async function sendContactEmail({ nombre, email, mensaje }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Sitio web <${process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev"}>`,
      to: [process.env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `Consulta desde el sitio web - ${nombre}`,
      text: `${mensaje}\n\n--\n${nombre}\n${email}`,
      html: `<p style="white-space:pre-wrap">${escapeHtml(mensaje)}</p><hr><p><strong>${escapeHtml(nombre)}</strong><br>${escapeHtml(email)}</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Resend respondió ${res.status}: ${detail.slice(0, 300)}`)
  }
}
