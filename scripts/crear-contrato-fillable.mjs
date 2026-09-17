import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PDFDocument } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE = path.join(__dirname, "..", "server", "template", "CONTRATOS CARRERAS 2026.pdf")
const OUTPUT = path.join(__dirname, "..", "server", "template", "CONTRATOS CARRERAS 2026_FILLABLE.pdf")
const MANIFEST = path.join(__dirname, "..", "server", "template", "contrato-fields.json")

/* Extrae los runs de texto de la primera página y los anchos reales de los
   glifos que usa la plantilla. Exactamente la misma lógica que el código
   de overlay original, para ubicar los campos sobre las líneas punteadas. */
async function extractTemplateInfo(pdfBytes) {
  const task = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBytes),
    useSystemFonts: true,
    isEvalSupported: false,
    verbosity: 0,
  })
  const src = await task.promise
  const page = await src.getPage(1)

  const content = await page.getTextContent()
  const items = content.items
    .filter((i) => i.str && i.str.trim())
    .map((i) => ({
      str: i.str,
      x: i.transform[4],
      y: i.transform[5],
      fs: Math.abs(i.transform[3]) || Math.abs(i.transform[0]),
    }))
    .sort((a, b) => b.y - a.y || a.x - b.x)

  const glyphWidths = new Map()
  try {
    const opList = await page.getOperatorList()
    const OPS = pdfjsLib.OPS
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] !== OPS.showText) continue
      for (const g of opList.argsArray[i][0] || []) {
        if (g.width && !glyphWidths.has(g.unicode)) glyphWidths.set(g.unicode, g.width)
      }
    }
  } catch (err) {
    console.warn("[prep] No se pudieron leer los anchos de la plantilla:", err.message)
  }

  await task.destroy()
  return { items, glyphWidths }
}

const ROW_FS = { fecha: 11, linea: 10.05, curso: 10.05 }
const PAGE_W = 595.44
const RIGHT_MARGIN = 50

function positionFields({ items, glyphWidths }) {
  const tplWidth = (text, fs) => {
    let w = 0
    for (const ch of text) w += ((glyphWidths.get(ch) ?? 500) * fs) / 1000
    return w
  }

  const find = (pred) => items.find(pred)
  const rightLimit = PAGE_W - RIGHT_MARGIN

  const fields = []

  /* ---- FECHA ____/____/_____ ---- */
  const fechaRun = find((it) => it.str.includes("FECHA"))
  if (fechaRun) {
    const x = fechaRun.x + tplWidth("FECHA", fechaRun.fs) + 1.5
    fields.push({
      name: "FECHA",
      x,
      y: fechaRun.y,
      fs: fechaRun.fs,
      width: 120,
      max: "99/99/9999",
    })
  }

  /* ---- Sr/a <nombre> ... DNI <dni> ---- */
  const srRun = find((it) => it.str.includes("Sr/a") && it.str.includes("DNI"))
  if (srRun) {
    const beforeDni = srRun.str.split("DNI")[0]
    const dniAt = srRun.x + tplWidth(beforeDni, srRun.fs)
    const nameX = srRun.x + tplWidth("Sr/a", srRun.fs) + 2
    const dniX = dniAt + tplWidth("DNI", srRun.fs) + 3
    if (nameX < dniAt - 4) {
      fields.push({ name: "NOMBRE", x: nameX, y: srRun.y, fs: srRun.fs, width: dniAt - nameX - 6, max: 130 })
    }
    fields.push({
      name: "DNI",
      x: dniX,
      y: srRun.y,
      fs: srRun.fs,
      width: Math.min(150, rightLimit - dniX),
      max: "99999999",
    })
  }

  /* ---- <domicilio> departamento <dep> Celular N° <cel> ---- */
  const domRun = find((it) => it.str.includes("departamento") && it.str.includes("Celular"))
  if (domRun) {
    const part = domRun.str
    const depIdx = part.indexOf("departamento")
    const celIdx = part.indexOf("Celular N°")
    const depAt = domRun.x + tplWidth(part.slice(0, depIdx), domRun.fs)
    const depEnd = domRun.x + tplWidth(part.slice(0, depIdx + "departamento".length), domRun.fs)
    const celAt = domRun.x + tplWidth(part.slice(0, celIdx), domRun.fs)
    const celEnd = domRun.x + tplWidth(part.slice(0, celIdx + "Celular N°".length), domRun.fs)

    const domX = domRun.x + 2
    fields.push({ name: "DOMICILIO", x: domX, y: domRun.y, fs: domRun.fs, width: Math.max(40, depAt - domX - 6), max: 99999 })
    fields.push({ name: "DEPARTAMENTO", x: depEnd + 3, y: domRun.y, fs: domRun.fs, width: Math.max(40, celAt - depEnd - 6), max: 99999 })
    fields.push({ name: "CELULAR", x: celEnd + 3, y: domRun.y, fs: domRun.fs, width: Math.max(60, rightLimit - celEnd - 3), max: 99999 })
  }

  /* ---- fecha de nacimiento <fecha> Email <email> ---- */
  const nacRun = find((it) => it.str.includes("fecha de nacimiento") && it.str.includes("Email"))
  if (nacRun) {
    const part = nacRun.str
    const emailIdx = part.indexOf("Email")
    const aluIdx = part.indexOf("ALUMNO")
    const nacEnd = nacRun.x + tplWidth(part.slice(0, part.indexOf("fecha de nacimiento") + "fecha de nacimiento".length), nacRun.fs)
    const emailAt = nacRun.x + tplWidth(part.slice(0, emailIdx), nacRun.fs)
    const emailEnd = nacRun.x + tplWidth(part.slice(0, emailIdx + "Email".length), nacRun.fs)
    const aluAt = aluIdx >= 0 ? nacRun.x + tplWidth(part.slice(0, aluIdx), nacRun.fs) : rightLimit

    const nacX = nacEnd + 3
    fields.push({ name: "FECHA_NACIMIENTO", x: nacX, y: nacRun.y, fs: nacRun.fs, width: Math.max(40, emailAt - nacX - 6), max: "99/99/9999" })
    fields.push({ name: "EMAIL", x: emailEnd + 3, y: nacRun.y, fs: nacRun.fs, width: Math.min(220, aluAt - emailEnd - 4), max: 99999 })
  }

  /* ---- CURSO ____ ---- */
  const cursoRun = find((it) => it.str.trim().startsWith("CURSO") && it.str.includes("_"))
  if (cursoRun) {
    const x = cursoRun.x + tplWidth("CURSO", cursoRun.fs) + 3
    fields.push({ name: "CURSO", x, y: cursoRun.y, fs: cursoRun.fs, width: Math.max(200, rightLimit - x), max: 99999 })
  }

  return fields
}

const valuesLabel = {
  FECHA: "dd/mm/yyyy",
  NOMBRE: "APELLIDO, NOMBRE",
  DNI: "35123456",
  DOMICILIO: "Calle 123",
  DEPARTAMENTO: "Capital",
  CELULAR: "264-444-5555",
  FECHA_NACIMIENTO: "dd/mm/yyyy",
  EMAIL: "nombre@gmail.com",
  CURSO: "Nombre del curso seleccionado",
}

async function main() {
  const bytes = fs.readFileSync(TEMPLATE)
  const info = await extractTemplateInfo(bytes)
  const fields = positionFields(info)

  const doc = await PDFDocument.load(bytes, { updateMetadata: false })
  const form = doc.getForm()
  const page = doc.getPage(0)

  for (const f of fields) {
    const field = form.createTextField(f.name)
    field.addToPage(page, {
      x: f.x,
      y: f.y - 3,
      width: f.width,
      height: f.fs * 2,
    })
    field.setFontSize(f.fs - 0.2)
    field.setText(valuesLabel[f.name] ?? "")
  }

  fs.writeFileSync(OUTPUT, await doc.save())
  fs.writeFileSync(
    MANIFEST,
    JSON.stringify(
      fields.map((f) => ({ name: f.name, width: f.width, fs: f.fs })),
      null,
      2
    )
  )
  console.log(`Plantilla rellenable creada: ${OUTPUT}`)
  console.log(`Manifest de campos: ${MANIFEST}`)
  for (const f of fields) {
    console.log(`  ${f.name.padEnd(16)} x=${f.x.toFixed(1).padStart(6)}  y=${f.y.toFixed(1).padStart(6)}  w=${f.width.toFixed(1).padStart(6)}  fs=${f.fs.toFixed(2)}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})