import type { ContractContent } from "@/pdf/contractContent"

/** Borrador del contrato mientras se edita en el panel. */

export interface DraftClause {
    id: string
    heading: string
    items: string[]
    body: string
}

export interface Draft {
    header: [string, string, string]
    intro: string
    clauses: DraftClause[]
    firmaLines: string[]
}

export const MAX_TEXT = 6000
const STORAGE_KEY = "admin-contrato-borrador"

/** Alumno de ejemplo para el PDF de prueba y para los ejemplos de cada dato. */
export const SAMPLE = {
    fullName: "Pérez Juan Carlos",
    dni: "30.123.456",
    edad: "35",
    cuil: "20-30123456-7",
    address: "Calle Falsa 123",
    departamento: "Capital",
    celular: "264 555-0000",
    birthDate: "15/03/1990",
    email: "juan@ejemplo.com",
    courseName: "Curso de ejemplo",
    currentDate: new Date().toLocaleDateString("es-AR"),
    values: {
        APELLIDO: "Pérez",
        NOMBRE: "Juan Carlos",
        SEXO: "Masculino",
        NACIONALIDAD: "Argentina",
        LUGAR_NACIMIENTO: "Capital",
        CELULAR_URGENCIA: "264 555-1111",
        ANIO_DIVISION: "1° A",
    } as Record<string, string>,
}

/** Lo que imprime cada dato con el alumno de ejemplo. */
export const SAMPLE_BY_MARKER: Record<string, string> = {
    ALUMNO: SAMPLE.fullName,
    DNI: SAMPLE.dni,
    EDAD: SAMPLE.edad,
    CUIL: SAMPLE.cuil,
    DOMICILIO: SAMPLE.address,
    DEPARTAMENTO: SAMPLE.departamento,
    CELULAR: SAMPLE.celular,
    FECHA_NACIMIENTO: SAMPLE.birthDate,
    EMAIL: SAMPLE.email,
    CURSO: SAMPLE.courseName,
    FECHA_HOY: SAMPLE.currentDate,
    BLANCO: "__________ (para completar con lapicera)",
    ...SAMPLE.values,
}

let idSeq = 0
export const newId = () => `c${Date.now().toString(36)}${(idSeq++).toString(36)}`

export function toDraft(c: ContractContent): Draft {
    return {
        header: [c.header[0] ?? "", c.header[1] ?? "", c.header[2] ?? ""],
        intro: c.intro,
        clauses: c.clauses.map((cl) => ({ id: newId(), heading: cl.heading, items: cl.items ?? [], body: cl.body ?? "" })),
        firmaLines: c.firmaLines,
    }
}

/** Una cláusula que quedó solo con "4)" (o vacía) no tiene contenido. */
export const isEmptyClause = (c: DraftClause) =>
    /^\s*(\d+\s*[).-]?)?\s*$/.test(c.heading) && !c.items.some((i) => i.trim()) && !c.body.trim()

export function toContent(d: Draft): ContractContent {
    return {
        header: d.header.map((h) => h.trim()) as Draft["header"],
        intro: d.intro.replace(/\s+/g, " ").trim(),
        clauses: d.clauses
            .filter((c) => !isEmptyClause(c))
            .map((c) => {
                const items = c.items.map((i) => i.trim()).filter(Boolean)
                const body = c.body.replace(/\r/g, "").trim()
                return { heading: c.heading.trim(), ...(items.length ? { items } : {}), ...(body ? { body } : {}) }
            }),
        firmaLines: d.firmaLines,
    }
}

export const snapshot = (d: Draft) => JSON.stringify(toContent(d))

/** Si el título empieza con "3)" o "3-", lo corrige según la posición. */
export function renumber(clauses: DraftClause[]): DraftClause[] {
    return clauses.map((c, i) => {
        const heading = c.heading.replace(/^(\s*)\d+(\s*[).-])/, `$1${i + 1}$2`)
        return heading === c.heading ? c : { ...c, heading }
    })
}

/** Título sin el "3)" del principio, para mostrarlo en listas. */
export const clauseTitle = (c: DraftClause) => c.heading.replace(/^\s*\d+\s*[).-]\s*/, "").trim()

export interface StoredDraft {
    base: string
    draft: Draft
}

export function readStored(): StoredDraft | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as StoredDraft) : null
    } catch {
        return null
    }
}

export function writeStored(value: StoredDraft | null): void {
    try {
        if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
        else localStorage.removeItem(STORAGE_KEY)
    } catch {
        /* sin acceso a localStorage: no pasa nada */
    }
}
