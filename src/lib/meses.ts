/** Meses del año en el orden en que se muestran en el selector. */
export const MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
] as const

/** Mes en curso, por ejemplo "Octubre". */
export function mesActual(): string {
    return MESES[new Date().getMonth()]
}

export function esMes(value: string): boolean {
    return (MESES as readonly string[]).includes(value)
}
