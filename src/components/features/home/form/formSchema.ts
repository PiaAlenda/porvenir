import type { FormFieldConfig as ApiCampo, FormFieldOption, FormOptions as ApiFormOptions } from "@/api"
import type { InscriptionFormValues } from "./validation"
import {
    PAISES,
    NACIONALIDADES,
    PROVINCIAS_ARGENTINA,
    DEPARTAMENTOS_SAN_JUAN,
    DISCAPACIDAD,
    PUEBLOS_INDIGENAS,
    DEFAULT_ANIOS_DIVISIONES,
    SEXO_LABELS,
} from "./options"

export type { FormFieldOption }
export type FieldKind =
    | "text"
    | "email"
    | "textarea"
    | "date"
    | "doc"
    | "cuil"
    | "phone"
    | "select"
    | "radio"
    | "checkbox"
    | "career"
    | "city"
    | "file"

export type FieldId = keyof InscriptionFormValues

/**
 * Campos que agrega el admin desde el panel. Sus respuestas no son columnas
 * fijas: se guardan en `extras` de la inscripción, indexadas por este id.
 */
export type CustomFieldId = `x_${string}`

export const CUSTOM_KINDS = ["text", "textarea", "select", "radio", "checkbox", "date"] as const satisfies readonly FieldKind[]

export type CustomKind = (typeof CUSTOM_KINDS)[number]

export const CUSTOM_KIND_LABELS: Record<CustomKind, string> = {
    text: "Texto corto",
    textarea: "Texto largo",
    select: "Desplegable",
    radio: "Opción única",
    checkbox: "Selección múltiple",
    date: "Fecha",
}

export const CUSTOM_KIND_DESCRIPTIONS: Record<CustomKind, string> = {
    text: "Una línea de texto libre",
    textarea: "Un párrafo de texto libre",
    select: "Lista desplegable, se elige una",
    radio: "Botones a la vista, se elige una",
    checkbox: "Casillas, se pueden elegir varias",
    date: "Selector de fecha",
}

/** Tipos cuyo valor sale de una lista de opciones cargada por el admin. */
export const KINDS_CON_OPCIONES: readonly FieldKind[] = ["select", "radio", "checkbox"]

export const tieneOpciones = (kind: FieldKind): boolean => KINDS_CON_OPCIONES.includes(kind)

/**
 * Las respuestas de selección múltiple se guardan como un solo texto, con los
 * valores elegidos separados por este separador (las opciones no pueden contenerlo).
 */
export const MULTI_SEPARATOR = " | "

export const separarMultiple = (value: string): string[] =>
    value.split("|").map((v) => v.trim()).filter(Boolean)

export const unirMultiple = (values: string[]): string => values.join(MULTI_SEPARATOR)

export const esPersonalizado = (c: { id: string }): boolean => c.id.startsWith("x_")

export function nuevoIdPersonalizado(): CustomFieldId {
    return `x_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export interface FormFieldConfig extends Omit<ApiCampo, "id" | "kind" | "step"> {
    id: FieldId | CustomFieldId
    kind: FieldKind
    step: 1 | 2 | 3 | 4
}

export interface FormOptions {
    campos: FormFieldConfig[]
}

const opciones = (valores: string[]): FormFieldOption[] => valores.map((v) => ({ value: v, label: v }))

const SEXO_OPTIONS: FormFieldOption[] = Object.entries(SEXO_LABELS).map(([value, label]) => ({ value, label }))
export const DEFAULT_FORM_OPTIONS: FormOptions = {
    campos: [
        // ── Paso 1 · Datos personales ──
        { id: "apellido", kind: "text", step: 1, label: "Apellido", placeholder: "Ej.: González", hint: "Tal cual está en el DNI", required: true, visible: true, span: 1 },
        { id: "nombre", kind: "text", step: 1, label: "Nombre", placeholder: "Ej.: María", hint: "Tal cual está en el DNI", required: true, visible: true, span: 1 },
        { id: "numeroDocumento", kind: "doc", step: 1, label: "N° de documento (DNI)", placeholder: "00.000.000", required: true, visible: true, span: 1 },
        { id: "cuil", kind: "cuil", step: 1, label: "CUIL", placeholder: "XX-XXXXXXXX-X", required: true, visible: true, span: 1 },
        { id: "c_sexo", kind: "select", step: 1, label: "Sexo", required: true, visible: true, span: 1, options: SEXO_OPTIONS },
        { id: "fechaNacimiento", kind: "date", step: 1, label: "Fecha de nacimiento", required: true, visible: true, span: 1 },
        { id: "c_nacionalidad", kind: "select", step: 1, label: "Nacionalidad", placeholderOption: "Seleccioná nacionalidad", required: true, visible: true, span: 1, options: opciones(NACIONALIDADES) },
        { id: "c_pais_nacimiento", kind: "select", step: 1, label: "País de nacimiento", placeholderOption: "Seleccioná país", required: true, visible: true, span: 1, options: opciones(PAISES) },
        { id: "c_provincia_nacimiento", kind: "select", step: 1, label: "Provincia de nacimiento", placeholderOption: "Seleccioná provincia", required: true, visible: true, span: 1, options: opciones(PROVINCIAS_ARGENTINA) },
        { id: "lugar_nacimiento", kind: "city", step: 1, label: "Ciudad de nacimiento", placeholder: "Ej.: Capital, Caucete, Jáchal...", required: true, visible: true, span: 1 },

        // ── Paso 2 · Contacto ──
        { id: "email", kind: "email", step: 2, label: "Correo electrónico", placeholder: "nombre@correo.com", hint: "Ingresá un correo válido (Gmail, Hotmail, Yahoo, etc.)", required: true, visible: true, span: 2 },
        { id: "celular", kind: "phone", step: 2, label: "Celular particular", hint: "Mínimo 8 dígitos", required: true, visible: true, span: 1 },
        { id: "celularUrgencia", kind: "phone", step: 2, label: "Celular de urgencia", hint: "Contacto ante emergencias", required: true, visible: true, span: 1 },
        { id: "domicilio", kind: "text", step: 2, label: "Domicilio (calle y número)", placeholder: "Ej.: Av. Libertador 250, Piso 2", required: true, visible: true, span: 2 },
        { id: "departamento", kind: "select", step: 2, label: "Departamento de residencia (San Juan)", placeholderOption: "Seleccioná un departamento", required: true, visible: true, span: 2, options: opciones(DEPARTAMENTOS_SAN_JUAN) },

        // ── Paso 3 · Inscripción ──
        { id: "careerId", kind: "career", step: 3, label: "Carrera / Curso", placeholderOption: "Buscá y seleccioná una opción", hint: "Elegí la propuesta a la que querés inscribirte", required: true, visible: true, span: 2 },
        { id: "anioDivision", kind: "select", step: 3, label: "Año / División", placeholderOption: "Seleccioná un año o división", required: true, visible: true, span: 2, options: opciones(DEFAULT_ANIOS_DIVISIONES) },

        // ── Paso 4 · Documentación y datos complementarios ──
        { id: "c_discapacidad", kind: "select", step: 4, label: "¿Posee discapacidad?", placeholderOption: "Seleccioná opción", required: true, visible: true, span: 1, options: opciones(DISCAPACIDAD) },
        { id: "cud", kind: "text", step: 4, label: "Número de CUD (Certificado)", placeholder: "Ej.: 12345678", required: false, visible: true, span: 1 },
        { id: "c_pueblo_indigena", kind: "select", step: 4, label: "Pueblo Indígena u originario", placeholderOption: "Seleccioná un pueblo u originario", required: true, visible: true, span: 2, options: opciones(PUEBLOS_INDIGENAS) },
        { id: "problematicaIntegrado", kind: "textarea", step: 4, label: "Problemática integrado / Observaciones (opcional)", placeholder: "Detallá cualquier observación o necesidad específica...", required: false, visible: true, span: 2 },
        { id: "fotoDni", kind: "file", step: 4, label: "Foto de DNI", required: true, visible: true, span: 1 },
        { id: "fotoCertificado", kind: "file", step: 4, label: "Foto Certificado Estudios", required: true, visible: true, span: 1 },
    ],
}

export function campoPorId(campos: FormFieldConfig[] | undefined, id: FormFieldConfig["id"]): FormFieldConfig | undefined {
    return campos?.find((c) => c.id === id)
}

export function mergeFormOptions(saved?: ApiFormOptions | null): FormOptions {
    const base = structuredClone(DEFAULT_FORM_OPTIONS)
    if (!saved?.campos?.length) {
        if (saved?.aniosDivisiones?.length) {
            const anio = base.campos.find((c) => c.id === "anioDivision")
            if (anio) anio.options = saved.aniosDivisiones.map((v) => ({ value: v, label: v }))
        }
        return base
    }

    const byId = new Map<string, FormFieldConfig>(base.campos.map((c) => [c.id, c]))
    const vistos = new Set<string>()
    const campos: FormFieldConfig[] = []

    for (const s of saved.campos) {
        const def = byId.get(s.id)

        if (!def && esPersonalizado(s) && !vistos.has(s.id)) {
            const kind = CUSTOM_KINDS.find((k) => k === s.kind)
            const step = Number(s.step)
            if (kind && step >= 1 && step <= 4) {
                vistos.add(s.id)
                campos.push({
                    id: s.id as CustomFieldId,
                    kind,
                    step: step as 1 | 2 | 3 | 4,
                    label: s.label,
                    placeholder: s.placeholder,
                    placeholderOption: s.placeholderOption,
                    hint: s.hint,
                    required: s.required,
                    visible: s.visible,
                    span: s.span === 2 ? 2 : 1,
                    ...(tieneOpciones(kind) ? { options: s.options ?? [] } : {}),
                })
            }
            continue
        }

        if (!def || vistos.has(def.id)) continue
        vistos.add(def.id)

        // Limpieza de compatibilidad para datos previamente guardados en base de datos
        let label = s.label || def.label
        if (def.id === "lugar_nacimiento" && (label.includes("Lugar de nacimiento") || label.includes("Ciudad/Localidad"))) {
            label = "Ciudad de nacimiento"
        }
        let hint = s.hint ?? def.hint
        if (def.id === "fechaNacimiento" && hint && hint.toLowerCase().includes("17")) {
            hint = ""
        }
        // Las fotos (DNI y certificado) son siempre obligatorias, aunque la
        // config guardada las tenga como opcionales.
        const esFoto = def.id === "fotoDni" || def.id === "fotoCertificado"
        if (esFoto) label = label.replace(/\s*\(opcional\)\s*/i, "").trim() || def.label

        campos.push({
            ...def,
            ...s,
            id: def.id,
            kind: def.kind,
            step: def.step,
            label,
            hint,
            options: s.options ?? def.options,
            ...(esFoto ? { required: true, visible: true } : {}),
        })
    }

    for (const def of base.campos) {
        if (!vistos.has(def.id)) campos.push(def)
    }

    return { campos }
}

/**
 * Respuestas de campos personalizados con su etiqueta actual. Las de campos que
 * el admin ya eliminó siguen apareciendo (no se pierden datos ya cargados).
 */
export function extrasConEtiqueta(
    campos: FormFieldConfig[] | undefined,
    extras: Record<string, string> | undefined,
): { id: string; label: string; value: string }[] {
    if (!extras) return []
    const out: { id: string; label: string; value: string }[] = []
    const vistos = new Set<string>()
    for (const c of campos ?? []) {
        const value = extras[c.id]
        if (esPersonalizado(c) && value) {
            vistos.add(c.id)
            const etiqueta = (v: string) => c.options?.find((o) => o.value === v)?.label ?? v
            const texto = c.kind === "checkbox" ? separarMultiple(value).map(etiqueta).join(", ") : etiqueta(value)
            out.push({ id: c.id, label: c.label || c.id, value: texto })
        }
    }
    for (const [id, value] of Object.entries(extras)) {
        if (!vistos.has(id) && value) out.push({ id, label: "Campo eliminado", value })
    }
    return out
}

export function opcionesDe(campos: FormFieldConfig[] | undefined, id: FormFieldConfig["id"]): FormFieldOption[] {
    return campoPorId(campos, id)?.options ?? []
}
