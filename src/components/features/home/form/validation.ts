import { parsePhoneNumber } from "libphonenumber-js"
import type { FormFieldConfig } from "./formSchema"

export interface InscriptionFormValues {
    tipoPropuesta: "curso" | "carrera" | ""
    apellido: string
    nombre: string
    numeroDocumento: string
    cuil: string
    fechaNacimiento: string
    c_sexo: string
    c_pais_nacimiento: string
    c_provincia_nacimiento: string
    lugar_nacimiento: string
    c_nacionalidad: string
    email: string
    celular: string
    celularUrgencia: string
    domicilio: string
    departamento: string
    careerId: string
    anioDivision: string
    c_discapacidad: string
    cud: string
    c_pueblo_indigena: string
    problematicaIntegrado: string
    fotoDni: File | null
    fotoCertificado: File | null
}

export type FormErrors = Partial<Record<keyof InscriptionFormValues, string>>

export const STEP1_FIELDS: (keyof InscriptionFormValues)[] = [
    "tipoPropuesta",
    "apellido",
    "nombre",
    "numeroDocumento",
    "cuil",
    "fechaNacimiento",
    "c_sexo",
    "c_pais_nacimiento",
    "c_provincia_nacimiento",
    "lugar_nacimiento",
    "c_nacionalidad",
]

export const STEP2_FIELDS: (keyof InscriptionFormValues)[] = [
    "email",
    "celular",
    "celularUrgencia",
    "domicilio",
    "departamento",
]

export const STEP3_FIELDS: (keyof InscriptionFormValues)[] = [
    "careerId",
    "anioDivision",
]

export const STEP4_FIELDS: (keyof InscriptionFormValues)[] = [
    "c_discapacidad",
    "cud",
    "c_pueblo_indigena",
    "problematicaIntegrado",
    "fotoDni",
    "fotoCertificado",
]

const NAME_RE = /^[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ' .-]{2,60}$/
const EMAIL_BASE_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_GMAIL_RE = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i
const TIPOS_PROPUESTA = ["curso", "carrera"]

/**
 * Tipo efectivo de la propuesta elegida: si el usuario todavía no respondió
 * la pregunta inicial, se deduce del `careerId` preseleccionado (los ids de
 * carreras empiezan con "tec-"). Sin nada definido devuelve "".
 */
export function tipoEfectivoDe(values?: InscriptionFormValues): "curso" | "carrera" | "" {
    if (!values) return ""
    if (values.tipoPropuesta === "curso" || values.tipoPropuesta === "carrera") return values.tipoPropuesta
    if (values.careerId.startsWith("tec-")) return "carrera"
    if (values.careerId) return "curso"
    return ""
}

const requiredMsg = (label: string) => `Completá el campo ${label}`

/**
 * Obligatoriedad por defecto de cada campo, tal como estaba antes de que el
 * esquema existiera. Solo se usa cuando el esquema no trae el campo.
 */
function defaultRequired(name: keyof InscriptionFormValues): boolean {
    switch (name) {
        case "problematicaIntegrado":
        case "fotoDni":
        case "fotoCertificado":
            return false
        default:
            return true
    }
}

/** Obligatoriedad efectiva: manda el esquema si está, si no el default. */
function requiredOf(name: keyof InscriptionFormValues, campos?: FormFieldConfig[]): boolean {
    const campo = campos?.find((c) => c.id === name)
    return campo ? campo.required : defaultRequired(name)
}

export function formatCuil(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

export function formatDoc(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    const parts: string[] = []
    let rest = digits
    while (rest.length > 3) {
        parts.unshift(rest.slice(-3))
        rest = rest.slice(0, -3)
    }
    if (rest) parts.unshift(rest)
    return parts.join(".")
}

export function isValidCuil(cuil: string): boolean {
    if (!/^\d{11}$/.test(cuil)) return false
    const prefixes = ["20", "23", "24", "27"]
    if (!prefixes.includes(cuil.slice(0, 2))) return false
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 10; i++) sum += Number(cuil[i]) * weights[i]
    let check = (11 - (sum % 11)) % 11
    if (check === 10) check = 9
    return check === Number(cuil[10])
}

function isValidDate(s: string): boolean {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
    if (!m) return false
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    const date = new Date(y, mo - 1, d)
    return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
}

function getAge(birth: Date, today: Date): number {
    let age = today.getFullYear() - birth.getFullYear()
    const beforeBirthday =
        birth.getMonth() > today.getMonth() ||
        (birth.getMonth() === today.getMonth() && birth.getDate() > today.getDate())
    if (beforeBirthday) age -= 1
    return age
}

export function validateField(
    name: keyof InscriptionFormValues,
    value: string | File | null,
    values?: InscriptionFormValues,
    campos?: FormFieldConfig[],
): string | undefined {
    const req = requiredOf(name, campos)

    if (name === "fotoDni" || name === "fotoCertificado") {
        if (req && !value) {
            return requiredMsg(name === "fotoDni" ? "la foto del DNI" : "la foto del certificado")
        }
        return undefined
    }

    const v = typeof value === "string" ? value.trim() : ""

    switch (name) {
        case "tipoPropuesta":
            if (!v) return "Elegí si es un curso o una carrera"
            if (!TIPOS_PROPUESTA.includes(v)) return "Opción inválida"
            return undefined
        case "apellido":
        case "nombre": {
            const label = name === "apellido" ? "Apellido" : "Nombre"
            if (!v) return req ? requiredMsg(label) : undefined
            if (v.length < 2) return `${label}: ingresá al menos 2 caracteres`
            if (!NAME_RE.test(v)) return `${label}: usá solo letras`
            return undefined
        }
        case "numeroDocumento": {
            if (!v) return req ? requiredMsg("el número de documento") : undefined
            if (!/^\d+$/.test(v)) return "Solo se admiten números"
            if (v.length < 6 || v.length > 8) return "Debe tener entre 6 y 8 dígitos"
            return undefined
        }
        case "cuil": {
            if (!v) return req ? requiredMsg("el CUIL") : undefined
            if (!/^\d{11}$/.test(v)) return "El CUIL debe tener 11 dígitos"
            if (!isValidCuil(v)) return "El CUIL ingresado no es válido"
            return undefined
        }
        case "c_sexo":
            if (!v) return req ? "Seleccioná un sexo" : undefined
            return undefined
        case "fechaNacimiento": {
            if (!v) return req ? requiredMsg("la fecha de nacimiento") : undefined
            if (!isValidDate(v)) return "Fecha de nacimiento inválida"
            const today = new Date()
            const birth = new Date(`${v}T00:00:00`)
            if (birth > today) return "La fecha no puede ser futura"
            const age = getAge(birth, today)
            // En cursos puede inscribirse cualquier edad; en carreras rige la
            // edad mínima. Sin tipo definido se aplica el requisito estricto.
            if (tipoEfectivoDe(values) !== "curso" && age < 17) return "La edad mínima es de 17 años"
            if (age > 110) return "Revisá la fecha ingresada"
            return undefined
        }
        case "c_pais_nacimiento":
            if (!v) return req ? requiredMsg("el país de nacimiento") : undefined
            return undefined
        case "c_provincia_nacimiento":
            if (req && values?.c_pais_nacimiento === "Argentina" && !v) {
                return requiredMsg("la provincia de nacimiento")
            }
            return undefined
        case "lugar_nacimiento":
            if (!v) return req ? requiredMsg("el lugar de nacimiento") : undefined
            return undefined
        case "c_nacionalidad":
            if (!v) return req ? requiredMsg("la nacionalidad") : undefined
            return undefined
        case "email": {
            if (!v) return req ? requiredMsg("el correo electrónico") : undefined
            if (!EMAIL_BASE_RE.test(v)) return "Ingresá un correo válido"
            if (!EMAIL_GMAIL_RE.test(v)) return "El correo debe ser @gmail.com"
            return undefined
        }
        case "celular":
        case "celularUrgencia": {
            const label = name === "celular" ? "el celular particular" : "el celular de urgencia"
            if (!v) return req ? requiredMsg(label) : undefined
            let nationalDigits = v.replace(/\D/g, "")
            try {
                const parsed = parsePhoneNumber(v)
                if (parsed) nationalDigits = parsed.nationalNumber
            } catch {
                // keep raw digits fallback
            }
            if (nationalDigits.length < 8) return "El número debe tener al menos 8 dígitos"
            return undefined
        }
        case "domicilio":
            if (!v) return req ? requiredMsg("el domicilio") : undefined
            return undefined
        case "departamento":
            if (!v) return req ? requiredMsg("el departamento") : undefined
            return undefined
        case "careerId":
            if (!v) return req ? "Seleccioná una carrera o curso" : undefined
            return undefined
        case "anioDivision":
            if (!v) return req ? "Seleccioná un año o división" : undefined
            return undefined
        case "c_discapacidad":
            if (!v) return req ? requiredMsg("si posee discapacidad") : undefined
            return undefined
        case "cud":
            if (req && values?.c_discapacidad === "Sí" && !v) {
                return requiredMsg("el número de CUD")
            }
            return undefined
        case "c_pueblo_indigena":
            if (!v) return req ? requiredMsg("la pertenencia a pueblo indígena") : undefined
            return undefined
        case "problematicaIntegrado":
            return undefined
        default:
            return undefined
    }
}

export function validateStep(
    step: 1 | 2 | 3 | 4,
    values: InscriptionFormValues,
    campos?: FormFieldConfig[],
): FormErrors {
    let fields: (keyof InscriptionFormValues)[] = []
    if (step === 1) fields = STEP1_FIELDS
    else if (step === 2) fields = STEP2_FIELDS
    else if (step === 3) fields = STEP3_FIELDS
    else if (step === 4) fields = STEP4_FIELDS

    const errors: FormErrors = {}
    for (const field of fields) {
        // Un campo oculto no se valida: si el admin lo apagó, no puede frenar
        // el envío.
        const campo = campos?.find((c) => c.id === field)
        if (campo && !campo.visible) continue

        const val = values[field]
        const error = validateField(field, val, values, campos)
        if (error) errors[field] = error
    }
    return errors
}
