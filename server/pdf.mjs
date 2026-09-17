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
  { label: "Número de documento:", value: (a) => a.numeroDocumento || "" },
  { label: "CUIL:", value: (a) => a.cuil || "" },
  { label: "Fecha de nacimiento:", value: (a) => formatFecha(a.fechaNacimiento) || "" },
  { label: "Sexo (c_sexo):", value: (a) => a.c_sexo || "" },
  { label: "País de nacimiento:", value: (a) => a.c_pais_nacimiento || "" },
  { label: "Provincia de nacimiento:", value: (a) => a.c_provincia_nacimiento || "" },
  { label: "Lugar de nacimiento:", value: (a) => a.lugar_nacimiento || "" },
  { label: "Nacionalidad:", value: (a) => a.c_nacionalidad || "" },
  { label: "Correo electrónico:", value: (a) => a.email || "" },
  { label: "Celular particular:", value: (a) => a.celular || "" },
  { label: "Celular urgencia:", value: (a) => a.celularUrgencia || "" },
  { label: "Departamento:", value: (a) => a.departamento || "" },
  { label: "Domicilio:", value: (a) => a.domicilio || "" },
  { label: "Curso / Carrera:", value: (a) => a.courseTitle || a.careerTitle || "" },
  { label: "Especialidad:", value: (a) => a.especialidad || "" },
  { label: "Posee discapacidad:", value: (a) => a.c_discapacidad || "" },
  { label: "Número CUD:", value: (a) => a.cud || "" },
  { label: "Pueblo Indígena:", value: (a) => a.c_pueblo_indigena || "" },
  { label: "Problemática integrado:", value: (a) => a.problematicaIntegrado || "" },
]

export async function generarFichaPdf(alumno) {
  const rows = MINISTRY_FIELDS.filter((f) => {
    const val = f.value(alumno)
    return val !== undefined && val !== null && val !== ""
  }).map((f) => [
    { text: f.label, bold: true, fontSize: 10, color: "#2d2d2d" },
    { text: f.value(alumno) || "", fontSize: 10, color: "#1f2937" },
  ])

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content: [
      {
        text: 'ESCUELA DE CAPACITACIÓN LABORAL "OBREROS DEL PORVENIR"',
        bold: true,
        fontSize: 13,
        alignment: "center",
      },
      {
        text: "Av. Alem 527 Sur - Capital - San Juan",
        fontSize: 10,
        alignment: "center",
        margin: [0, 2, 0, 10],
      },
      { text: "FICHA DE INSCRIPCIÓN", bold: true, fontSize: 12, alignment: "center" },
      {
        text: "Datos a presentar ante el Ministerio de Educación",
        fontSize: 9.5,
        alignment: "center",
        color: "#6b7280",
        margin: [0, 2, 0, 12],
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
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 4,
          paddingRight: () => 4,
        },
      },
      { text: `FECHA: ${todayFormatted()}`, bold: true, fontSize: 10, margin: [0, 14, 0, 0] },
    ],
  }

  return pdfMake.createPdf(docDefinition).getBuffer()
}