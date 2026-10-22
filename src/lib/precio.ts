/** Formatea un número o string con separador de miles usando puntos (ej: 50000 -> 50.000). */
export function formatearImporteConPuntos(value: string): string {
    const digitos = value.replace(/\D/g, "")
    if (!digitos) return ""
    return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

/**
 * Texto que se muestra dentro del input de arancel: la UI dibuja el "$" fijo,
 * así que no hace falta duplicarlo cuando ya viene incluido.
 * Si es un importe numérico, formatea automáticamente con puntos de miles.
 */
export function arancelParaInput(value: string): string {
    const sinSigno = value.replace(/^\$\s?/, "").trim()
    if (!sinSigno) return ""
    // Si contiene solo dígitos y posibles separadores existentes
    if (/^[\d.\s]+$/.test(sinSigno)) {
        return formatearImporteConPuntos(sinSigno)
    }
    return sinSigno
}

/**
 * Arancel tal como se guarda: si es un importe numérico se le agrega el "$" y formato con puntos;
 * cualquier otro texto ("Consultar", "2 cuotas de $20.000") queda igual.
 */
export function normalizarArancel(value: string): string {
    const texto = value.trim()
    if (!texto) return ""
    const sinSigno = texto.replace(/^\$\s?/, "").trim()
    if (/^[\d.\s]+$/.test(sinSigno)) {
        const formateado = formatearImporteConPuntos(sinSigno)
        return formateado ? `$${formateado}` : ""
    }
    if (/^\$/.test(texto)) return texto
    return /^[\d.,\s]+$/.test(texto) ? `$${texto}` : texto
}

/** Muestra el "$" fijo solo cuando el contenido es (o empieza con) un importe. */
export function mostrarSignoArancel(value: string): boolean {
    const texto = value.trim()
    return !texto || /^\$/.test(texto) || /^[\d.,\s]+$/.test(texto)
}

