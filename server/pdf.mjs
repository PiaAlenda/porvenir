import path from "node:path"
import { createRequire } from "node:module"
import pdfMake from "pdfmake"

const require = createRequire(import.meta.url)

const ROBOTO_DIR = path.join(path.dirname(require.resolve("pdfmake/package.json")), "fonts", "Roboto")
pdfMake.setFonts({
  Roboto: {
    normal: path.join(ROBOTO_DIR, "Roboto-Regular.ttf"),
    bold: path.join(ROBOTO_DIR, "Roboto-Medium.ttf"),
    italics: path.join(ROBOTO_DIR, "Roboto-Italic.ttf"),
    bolditalics: path.join(ROBOTO_DIR, "Roboto-MediumItalic.ttf"),
  },
})
pdfMake.setUrlAccessPolicy(() => false)
pdfMake.setLocalAccessPolicy(() => true)

function pad(n) {
  return String(n).padStart(2, "0")
}

function formatFecha(value) {
  if (!value) return ""
  const d = new Date(value + (value.length === 10 ? "T12:00:00" : ""))
  if (Number.isNaN(d.getTime())) return String(value)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

function todayFormatted() {
  const d = new Date()
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/* ------------------------------------------------------------------ */
/*  Ficha para el ministerio.                                          */
/* ------------------------------------------------------------------ */

const MINISTRY_FIELDS = [
  { label: "Apellido:", value: (a) => a.apellido || "" },
  { label: "Nombre:", value: (a) => a.nombre || "" },
  { label: "Tipo de documento (c_documento):", value: (a) => a.c_documento || "" },
  { label: "N\u00famero de documento:", value: (a) => a.numeroDocumento || "" },
  { label: "CUIL:", value: (a) => a.cuil || "" },
  { label: "Fecha de nacimiento:", value: (a) => formatFecha(a.fechaNacimiento) || "" },
  { label: "Sexo (c_sexo):", value: (a) => a.c_sexo || "" },
  { label: "Curso / Carrera:", value: (a) => a.courseTitle || a.careerTitle || "" },
]

export async function generarFichaPdf(alumno) {
  const rows = MINISTRY_FIELDS.map((f) => [
    { text: f.label, bold: true, fontSize: 10.5, color: "#2d2d2d" },
    { text: f.value(alumno) || "", fontSize: 10.5, color: "#1f2937" },
  ])

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [50, 50, 50, 50],
    content: [
      {
        text: 'ESCUELA DE CAPACITACI\u00d3N LABORAL "OBREROS DEL PORVENIR"',
        bold: true,
        fontSize: 13,
        alignment: "center",
      },
      {
        text: "Av. Alem 527 Sur - Capital - San Juan",
        fontSize: 10,
        alignment: "center",
        margin: [0, 2, 0, 12],
      },
      { text: "FICHA DE INSCRIPCI\u00d3N", bold: true, fontSize: 12, alignment: "center" },
      {
        text: "Datos a presentar ante el Ministerio de Educaci\u00f3n",
        fontSize: 9.5,
        alignment: "center",
        color: "#6b7280",
        margin: [0, 2, 0, 14],
      },
      {
        table: {
          widths: ["auto", "*"],
          body: rows,
        },
        layout: {
          hLineWidth: (i) => (i === 0 || i === rows.length ? 0.8 : 0.4),
          hLineColor: () => "#bfbfbf",
          vLineWidth: () => 0,
          paddingTop: () => 8,
          paddingBottom: () => 8,
          paddingLeft: () => 4,
          paddingRight: () => 4,
        },
      },
      { text: `FECHA: ${todayFormatted()}`, bold: true, fontSize: 10, margin: [0, 18, 0, 0] },
    ],
  }

  return pdfMake.createPdf(docDefinition).getBuffer()
}