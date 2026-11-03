/**
 * Validación de la ficha médica (DDJJ) del lado del servidor.
 *
 * Copia mínima del esquema de `src/components/features/home/form/fichaMedica.ts`:
 * ids, tipo, opciones permitidas, de qué pregunta dependen y si son
 * obligatorias. Si se agrega o renombra una pregunta allá, hay que reflejarlo acá.
 */

const SI = "Sí"
const SI_NO = [SI, "No"]

/** [id, tipo, opciones | null, dependeDe | null, required] */
const PREGUNTAS = [
  ["vacunaAntitetanica", "sino", SI_NO, null, true],
  ["altura", "numero", null, null, true],
  ["peso", "numero", null, null, true],

  ["enfermedades", "sino", SI_NO, null, true],
  ["enfermedadesTipos", "multi", ["Respiratorias", "Renales", "Cardíacas", "De la vista", "Musculares", "De la sangre", "Digestivas", "Psiquiátricas", "Epilepsia", "Diabetes", "Articulares", "Otra"], "enfermedades", true],
  ["enfermedadesDetalle", "texto", null, "enfermedades", false],
  ["antecedentes", "sino", SI_NO, null, true],
  ["antecedentesDetalle", "texto", null, "antecedentes", true],
  ["alergias", "sino", SI_NO, null, true],
  ["alergiasTipos", "multi", ["Medicamentos", "Penicilina", "Insectos", "Alimentos", "Ambientales", "Otra"], "alergias", true],
  ["alergiasDetalle", "texto", null, "alergias", false],
  ["tratamientos", "sino", SI_NO, null, true],
  ["tratamientosDetalle", "texto", null, "tratamientos", true],
  ["internaciones", "sino", SI_NO, null, true],
  ["internacionesDetalle", "texto", null, "internaciones", true],
  ["atencionEspecial", "sino", SI_NO, null, true],
  ["atencionEspecialDetalle", "texto", null, "atencionEspecial", true],

  ["discapacidad", "sino", SI_NO, null, true],
  ["discapacidadTipos", "multi", ["Motora", "Sensorial", "Intelectual", "Psicosocial", "Cognitiva/Neurodesarrollo", "Otra"], "discapacidad", true],
  ["discapacidadOtra", "texto", null, "discapacidad", false],
  ["discapacidadGrado", "unica", ["Leve", "Moderada", "Severa"], "discapacidad", false],
  ["tieneCud", "sino", SI_NO, "discapacidad", true],
  ["cudNumero", "texto", null, "tieneCud", false],
  ["cudEmision", "fecha", null, "tieneCud", false],
  ["cudVencimiento", "fecha", null, "tieneCud", false],
  ["condicionCognitiva", "sino", SI_NO, null, true],
  ["diagnosticos", "multi", [
    "Trastorno del Espectro Autista (TEA)",
    "Trastorno por Déficit de Atención con o sin Hiperactividad (TDAH)",
    "Dislexia u otra dificultad de aprendizaje específica",
    "Trastorno del Lenguaje",
    "Otro",
  ], "condicionCognitiva", true],
  ["diagnosticoOtro", "texto", null, "condicionCognitiva", false],
  ["tratamientoProfesional", "sino", SI_NO, null, true],
  ["equipoTratante", "texto", null, "tratamientoProfesional", true],
  ["adecuaciones", "sino", SI_NO, null, true],
  ["adecuacionesDetalle", "texto", null, "adecuaciones", true],

  ["otrasEnfermedades", "texto", null, null, false],
  ["aceptaDeclaracion", "acepto", [SI], null, true],
]

const MAX_LARGO = 500
const FALTA = "Completá la ficha médica (DDJJ) antes de enviar la inscripción."

/**
 * Devuelve { ficha } con solo las respuestas válidas de preguntas activas, o
 * { error } si falta algo obligatorio. Las preguntas se recorren en orden, así
 * que las dependencias ya están resueltas cuando se las consulta.
 */
export function resolverFichaMedica(raw) {
  let parsed = raw
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {}
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) parsed = {}

  const ficha = {}
  const activa = new Set()
  for (const [id, tipo, opciones, dependeDe, required] of PREGUNTAS) {
    if (dependeDe && (!activa.has(dependeDe) || ficha[dependeDe] !== SI)) continue
    activa.add(id)

    let valor = String(parsed[id] ?? "").trim().slice(0, MAX_LARGO)
    if (valor && opciones && tipo !== "multi" && !opciones.includes(valor)) valor = ""
    if (valor && tipo === "multi") {
      valor = [...new Set(valor.split("|").map((v) => v.trim()).filter((v) => opciones.includes(v)))].join(" | ")
    }
    if (valor && tipo === "numero" && !Number.isFinite(Number(valor.replace(",", ".")))) valor = ""
    if (valor && tipo === "fecha" && !/^\d{4}-\d{2}-\d{2}$/.test(valor)) valor = ""

    if (!valor) {
      if (required) return { error: FALTA }
      continue
    }
    ficha[id] = valor
  }
  return { ficha }
}

/** Etiquetas para la ficha PDF (las mismas que `ETIQUETAS_CORTAS` del front). */
const ETIQUETAS = {
  vacunaAntitetanica: "Vacuna antitetánica",
  altura: "Altura (cm)",
  peso: "Peso (kg)",
  enfermedades: "Enfermedades",
  enfermedadesTipos: "Tipos de enfermedad",
  enfermedadesDetalle: "Detalle enfermedades",
  antecedentes: "Antecedentes médicos",
  antecedentesDetalle: "Detalle antecedentes",
  alergias: "Alergias",
  alergiasTipos: "Tipos de alergia",
  alergiasDetalle: "Detalle alergias",
  tratamientos: "Tratamiento / medicación",
  tratamientosDetalle: "Detalle tratamiento",
  internaciones: "Internaciones (12 meses)",
  internacionesDetalle: "Detalle internaciones",
  atencionEspecial: "Atención especial en emergencia",
  atencionEspecialDetalle: "Detalle atención especial",
  discapacidad: "Discapacidad reconocida",
  discapacidadTipos: "Tipo de discapacidad",
  discapacidadOtra: "Otra discapacidad",
  discapacidadGrado: "Grado de discapacidad",
  tieneCud: "Tiene CUD",
  cudNumero: "N° de CUD",
  cudEmision: "CUD emisión",
  cudVencimiento: "CUD válido hasta",
  condicionCognitiva: "Condición cognitiva / neurodesarrollo",
  diagnosticos: "Diagnóstico",
  diagnosticoOtro: "Otro diagnóstico",
  tratamientoProfesional: "Tratamiento profesional",
  equipoTratante: "Equipo tratante",
  adecuaciones: "Adecuaciones curriculares",
  adecuacionesDetalle: "Detalle adecuaciones",
  otrasEnfermedades: "Otras enfermedades",
  aceptaDeclaracion: "Acepta DDJJ",
}

/** Filas { label, value } de la ficha guardada, en el orden del formulario. */
export function filasFichaMedica(ficha) {
  if (!ficha || typeof ficha !== "object") return []
  const out = []
  for (const [id, tipo] of PREGUNTAS) {
    const v = String(ficha[id] ?? "").trim()
    if (!v) continue
    let texto = v
    if (tipo === "multi") texto = v.split("|").map((x) => x.trim()).filter(Boolean).join(", ")
    if (tipo === "fecha") {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
      if (m) texto = `${m[3]}/${m[2]}/${m[1]}`
    }
    out.push({ label: `${ETIQUETAS[id] || id}:`, value: texto })
  }
  return out
}
