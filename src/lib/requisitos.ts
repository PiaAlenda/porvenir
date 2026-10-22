/** Requisitos de inscripción que se cargan por defecto en carreras y cursos. */
export const REQUISITOS_GENERALES = ["DNI", "Copia de CUIL", "Analítico"] as const

/** Mismo listado en el formato en que se guarda: un requisito por línea. */
export const REQUISITOS_GENERALES_TEXTO = REQUISITOS_GENERALES.join("\n")

/**
 * Convierte el texto guardado en una lista de requisitos. Acepta saltos de
 * línea o punto y coma como separadores. Si no hay nada cargado se devuelven
 * los generales, para que la página nunca quede sin requisitos.
 */
export function parseRequisitos(value?: string): string[] {
    const items = (value || "")
        .split(/\r?\n|;/)
        .map((s) => s.trim())
        .filter(Boolean)
    return items.length ? items : [...REQUISITOS_GENERALES]
}

/** true si el texto guardado coincide con el listado general (sin importar el orden). */
export function sonRequisitosGenerales(value?: string): boolean {
    const items = (value || "")
        .split(/\r?\n|;/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    const generales = REQUISITOS_GENERALES.map((r) => r.toLowerCase())
    return items.length === generales.length && generales.every((r) => items.includes(r))
}
