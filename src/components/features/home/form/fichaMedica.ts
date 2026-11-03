/**
 * Ficha médica (DDJJ - Médica 2027). Las preguntas salen de la declaración
 * jurada en papel de la escuela. Las respuestas viajan como un objeto plano
 * { [idPregunta]: texto } en `fichaMedica`; las de selección múltiple van
 * unidas con " | ", igual que los campos personalizados.
 *
 * IMPORTANTE: el servidor valida contra una copia de estos ids y opciones en
 * `server/ficha-medica.mjs`. Si se agrega o renombra una pregunta, hay que
 * actualizar los dos archivos.
 */
import { separarMultiple } from "./formSchema"

export type TipoPregunta = "sino" | "texto" | "numero" | "textarea" | "multi" | "unica" | "fecha" | "acepto"

export interface PreguntaFicha {
    id: string
    label: string
    tipo: TipoPregunta
    opciones?: string[]
    /** Solo se muestra (y se valida) si otra pregunta tiene este valor. */
    dependeDe?: { id: string; valor: string }
    required?: boolean
    placeholder?: string
    hint?: string
    /** Unidad que se muestra al lado del número (cm, kg). */
    unidad?: string
    min?: number
    max?: number
    /** Ocupa las dos columnas en pantallas anchas. */
    ancho?: boolean
}

export interface SeccionFicha {
    id: string
    titulo: string
    descripcion?: string
    nota?: string
    preguntas: PreguntaFicha[]
}

export type FichaMedicaValues = Record<string, string>

export const SI = "Sí"
export const NO = "No"
const SI_NO = [SI, NO]

const si = (id: string) => ({ id, valor: SI })

export const TEXTO_DECLARACION =
    "El abajo firmante declara haber completado en forma veraz los datos consignados en la presente, " +
    "liberando expresamente a la Escuela y Sociedad de toda responsabilidad por cualquier perjuicio " +
    "derivado de la asistencia o práctica médica que tome como referencia los datos aquí manifestados."

export const SECCIONES_FICHA: SeccionFicha[] = [
    {
        id: "generales",
        titulo: "Datos de salud",
        preguntas: [
            { id: "vacunaAntitetanica", label: "Vacuna antitetánica", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            { id: "altura", label: "Altura", tipo: "numero", unidad: "cm", placeholder: "Ej.: 170", min: 50, max: 250, required: true },
            { id: "peso", label: "Peso", tipo: "numero", unidad: "kg", placeholder: "Ej.: 65", min: 10, max: 300, required: true },
        ],
    },
    {
        id: "salud",
        titulo: "I. Condición de salud",
        preguntas: [
            { id: "enfermedades", label: "¿Tiene alguna enfermedad?", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            {
                id: "enfermedadesTipos",
                label: "¿Cuáles?",
                tipo: "multi",
                opciones: [
                    "Respiratorias", "Renales", "Cardíacas", "De la vista", "Musculares", "De la sangre",
                    "Digestivas", "Psiquiátricas", "Epilepsia", "Diabetes", "Articulares", "Otra",
                ],
                dependeDe: si("enfermedades"),
                required: true,
                ancho: true,
            },
            { id: "enfermedadesDetalle", label: "Detalle", tipo: "textarea", dependeDe: si("enfermedades"), placeholder: "Contanos más sobre la enfermedad...", ancho: true },

            { id: "antecedentes", label: "Antecedentes médicos relevantes", hint: "Intervenciones, internaciones, enfermedades crónicas, etc.", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            { id: "antecedentesDetalle", label: "Detalle de los antecedentes", tipo: "textarea", dependeDe: si("antecedentes"), required: true, ancho: true },

            { id: "alergias", label: "¿Tiene alergias?", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            {
                id: "alergiasTipos",
                label: "¿A qué?",
                tipo: "multi",
                opciones: ["Medicamentos", "Penicilina", "Insectos", "Alimentos", "Ambientales", "Otra"],
                dependeDe: si("alergias"),
                required: true,
                ancho: true,
            },
            { id: "alergiasDetalle", label: "Detalle de las alergias", tipo: "textarea", dependeDe: si("alergias"), placeholder: "Ej.: alergia a la penicilina, picadura de abeja...", ancho: true },

            { id: "tratamientos", label: "Tratamientos médicos actuales o medicación crónica", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            { id: "tratamientosDetalle", label: "Detalle", hint: "Nombre del medicamento, dosis, frecuencia y diagnóstico", tipo: "textarea", dependeDe: si("tratamientos"), required: true, ancho: true },

            { id: "internaciones", label: "Internaciones recientes (últimos 12 meses)", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            { id: "internacionesDetalle", label: "Motivo y fecha", tipo: "textarea", dependeDe: si("internaciones"), required: true, ancho: true },

            { id: "atencionEspecial", label: "¿Presenta alguna condición que pueda requerir atención especial en caso de emergencia?", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            { id: "atencionEspecialDetalle", label: "Detalle", tipo: "textarea", dependeDe: si("atencionEspecial"), required: true, ancho: true },
        ],
    },
    {
        id: "discapacidad",
        titulo: "II. Condiciones especiales / Discapacidad / Necesidades educativas",
        nota: "La presentación de las certificaciones correspondientes es condición necesaria para la matriculación definitiva del alumno.",
        preguntas: [
            { id: "discapacidad", label: "¿El/la estudiante posee alguna discapacidad reconocida?", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            {
                id: "discapacidadTipos",
                label: "Tipo de discapacidad",
                tipo: "multi",
                opciones: ["Motora", "Sensorial", "Intelectual", "Psicosocial", "Cognitiva/Neurodesarrollo", "Otra"],
                dependeDe: si("discapacidad"),
                required: true,
                ancho: true,
            },
            { id: "discapacidadOtra", label: "Si marcaste «Otra», especificá", tipo: "texto", dependeDe: si("discapacidad"), ancho: true },
            { id: "discapacidadGrado", label: "Grado de discapacidad (si tiene certificado vigente)", tipo: "unica", opciones: ["Leve", "Moderada", "Severa"], dependeDe: si("discapacidad"), ancho: true },
            { id: "tieneCud", label: "¿Cuenta con Certificado Único de Discapacidad (CUD)?", tipo: "sino", opciones: SI_NO, dependeDe: si("discapacidad"), required: true, ancho: true },
            { id: "cudNumero", label: "N° de CUD", tipo: "texto", dependeDe: si("tieneCud"), placeholder: "Ej.: 12345678", ancho: true },
            { id: "cudEmision", label: "Fecha de emisión", tipo: "fecha", dependeDe: si("tieneCud") },
            { id: "cudVencimiento", label: "Válido hasta", tipo: "fecha", dependeDe: si("tieneCud") },

            { id: "condicionCognitiva", label: "¿Tiene alguna condición cognitiva o del neurodesarrollo diagnosticada?", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            {
                id: "diagnosticos",
                label: "Diagnóstico",
                tipo: "multi",
                opciones: [
                    "Trastorno del Espectro Autista (TEA)",
                    "Trastorno por Déficit de Atención con o sin Hiperactividad (TDAH)",
                    "Dislexia u otra dificultad de aprendizaje específica",
                    "Trastorno del Lenguaje",
                    "Otro",
                ],
                dependeDe: si("condicionCognitiva"),
                required: true,
                ancho: true,
            },
            { id: "diagnosticoOtro", label: "Si marcaste «Otro», especificá", tipo: "texto", dependeDe: si("condicionCognitiva"), ancho: true },

            { id: "tratamientoProfesional", label: "¿Está bajo tratamiento o seguimiento profesional?", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            { id: "equipoTratante", label: "Equipo tratante", hint: "Médico, psicopedagogo, psicólogo, fonoaudiólogo, psiquiatra, etc.", tipo: "textarea", dependeDe: si("tratamientoProfesional"), required: true, ancho: true },

            { id: "adecuaciones", label: "¿Requiere adecuaciones curriculares o apoyos escolares específicos?", tipo: "sino", opciones: SI_NO, required: true, ancho: true },
            { id: "adecuacionesDetalle", label: "Detalle", tipo: "textarea", dependeDe: si("adecuaciones"), required: true, ancho: true },
        ],
    },
    {
        id: "otros",
        titulo: "Otras enfermedades o padecimientos",
        preguntas: [
            {
                id: "otrasEnfermedades",
                label: "Declare aquí si posee alguna enfermedad o padecimiento que no se encuentre entre las mencionadas anteriormente",
                tipo: "textarea",
                placeholder: "Opcional",
                ancho: true,
            },
        ],
    },
    {
        id: "declaracion",
        titulo: "Declaración jurada",
        preguntas: [
            { id: "aceptaDeclaracion", label: TEXTO_DECLARACION, tipo: "acepto", required: true, ancho: true },
        ],
    },
]

export const PREGUNTAS_FICHA: PreguntaFicha[] = SECCIONES_FICHA.flatMap((s) => s.preguntas)

const MAX_LARGO = 500

/** Una pregunta está activa si no depende de nada o si su condición se cumple (en cadena). */
export function preguntaActiva(p: PreguntaFicha, ficha: FichaMedicaValues): boolean {
    if (!p.dependeDe) return true
    const padre = PREGUNTAS_FICHA.find((q) => q.id === p.dependeDe!.id)
    if (padre && !preguntaActiva(padre, ficha)) return false
    return (ficha[p.dependeDe.id] ?? "") === p.dependeDe.valor
}

export function validarPregunta(p: PreguntaFicha, ficha: FichaMedicaValues): string | undefined {
    if (!preguntaActiva(p, ficha)) return undefined
    const v = (ficha[p.id] ?? "").trim()
    if (!v) {
        if (!p.required) return undefined
        if (p.tipo === "acepto") return "Tenés que aceptar la declaración jurada para continuar"
        if (p.tipo === "multi") return "Elegí al menos una opción"
        if (p.tipo === "sino" || p.tipo === "unica") return "Elegí una opción"
        return "Completá este campo"
    }
    if (v.length > MAX_LARGO) return `Máximo ${MAX_LARGO} caracteres`
    if (p.tipo === "numero") {
        const n = Number(v.replace(",", "."))
        if (!Number.isFinite(n)) return "Ingresá solo números"
        if ((p.min !== undefined && n < p.min) || (p.max !== undefined && n > p.max)) return "Revisá el valor ingresado"
    }
    if ((p.tipo === "sino" || p.tipo === "unica") && !(p.opciones ?? []).includes(v)) return "Opción inválida"
    if (p.tipo === "multi" && separarMultiple(v).some((o) => !(p.opciones ?? []).includes(o))) return "Opción inválida"
    return undefined
}

/** Errores de toda la ficha, con clave `med_<id>` para no chocar con otros campos. */
export function validarFicha(ficha: FichaMedicaValues): Record<string, string> {
    const errores: Record<string, string> = {}
    for (const p of PREGUNTAS_FICHA) {
        const e = validarPregunta(p, ficha)
        if (e) errores[claveError(p.id)] = e
    }
    return errores
}

export const claveError = (id: string) => `med_${id}`

/** Solo las respuestas de preguntas activas (lo que se oculta no viaja). */
export function fichaParaEnviar(ficha: FichaMedicaValues): FichaMedicaValues {
    const out: FichaMedicaValues = {}
    for (const p of PREGUNTAS_FICHA) {
        const v = (ficha[p.id] ?? "").trim()
        if (v && preguntaActiva(p, ficha)) out[p.id] = v
    }
    return out
}

/** Etiqueta corta para tablas y Excel (la del formulario puede ser una oración larga). */
export const ETIQUETAS_CORTAS: Record<string, string> = {
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

/** Texto legible de una respuesta (fechas a dd/mm/aaaa, múltiples con coma). */
export function textoRespuesta(id: string, valor: string | undefined): string {
    const v = (valor ?? "").trim()
    if (!v) return ""
    const p = PREGUNTAS_FICHA.find((q) => q.id === id)
    if (p?.tipo === "multi") return separarMultiple(v).join(", ")
    if (p?.tipo === "fecha") {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
        if (m) return `${m[3]}/${m[2]}/${m[1]}`
    }
    return v
}
