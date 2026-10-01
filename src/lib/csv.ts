/**
 * Exportación a CSV.
 *
 * Reemplaza a `xlsx`, que quedó sin parches de seguridad en npm (0.18.5 es la
 * última versión publicada) y arrastraba prototype pollution y ReDoS sin
 * corregir. Para una fila plana de la inscripción, CSV alcanza y sobra.
 */

/**
 * Excel y Google Sheets ejecutan como fórmula cualquier celda que empiece con
 * uno de estos caracteres. Como la exportación incluye texto libre del alumno
 * (apellido, domicilio, especialidad), un valor como `=cmd|'/c calc'!A1` se
 * ejecutaría al abrir el archivo. Anteponemos un apóstrofo para forzar que se
 * lea como texto.
 */
const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"]

function escapeCell(value: unknown): string {
    if (value === null || value === undefined) return ""

    let str = value instanceof Date ? value.toISOString() : String(value)
    if (str && FORMULA_TRIGGERS.includes(str[0])) str = `'${str}`

    // El separador de campos es la coma, así que cualquier coma o salto de
    // línea obliga a entrecomillar.
    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

function escapeHeader(value: string): string {
    return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Serializa un objeto plano como una fila CSV con encabezado. */
export function toCsv(row: Record<string, unknown>): string {
    const headers = Object.keys(row)
    const cells = headers.map((h) => escapeCell(row[h]))
    return [headers.map(escapeHeader).join(","), cells.join(",")].join("\r\n")
}

/**
 * Descarga una fila como CSV. El BOM hace que Excel reconozca UTF-8 y no
 * revuelva los acentos, que es el problema clásico al abrir estos archivos en
 * Excel en Windows.
 */
export function downloadCsv(row: Record<string, unknown>, filename: string): void {
    const blob = new Blob([`\uFEFF${toCsv(row)}`], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
