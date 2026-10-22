/**
 * Limpieza de lo que se escribe en los campos del panel. La idea no es validar
 * el formato final (eso lo hace cada campo), sino no dejar entrar caracteres
 * que no corresponden al tipo de dato.
 */

/* Letras (con acentos), números, espacios y puntuación habitual en español. */
const TEXTO_NO_PERMITIDO = /[^\p{L}\p{N}\s.,;:()¡!¿?'"“”‘’\-–—_/&%°ºª#+*]/gu

/** Textos, nombres, cargos, descripciones, ejes, etc. */
export function limpiarTexto(value: string): string {
    return value.replace(TEXTO_NO_PERMITIDO, "")
}

/* Un arancel solo puede tener dígitos, separadores y el signo $. */
const ARANCEL_NO_PERMITIDO = /[^\d.,$\s]/g

export function limpiarArancel(value: string): string {
    return value.replace(ARANCEL_NO_PERMITIDO, "")
}

/* Legajos y matrículas: combinaciones de letras, números y separadores. */
const LEGAJO_NO_PERMITIDO = /[^\p{L}\p{N}\s.\-/°ºª]/gu

export function limpiarLegajo(value: string): string {
    return value.replace(LEGAJO_NO_PERMITIDO, "")
}

/** Solo dígitos (cupos, cantidades). */
export function soloDigitos(value: string): string {
    return value.replace(/\D/g, "")
}
