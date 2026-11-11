import type { Alumno } from "@/api"

export const MIN_CUPO_TITULARES = 0
export const MAX_CUPO_TITULARES = 999

export interface ParticipanteClasificado {
    alumno: Alumno
    posicion: number
    titular: boolean
}

export interface ResumenCupo {
    total: number
    titulares: number
    suplentes: number
}

/** Copia ordenada por `createdAt` ascendente; los registros sin fecha van al final. */
function porOrdenDeLlegada(participantes: Alumno[]): Alumno[] {
    return [...participantes].sort((a, b) => {
        const fa = a.createdAt || ""
        const fb = b.createdAt || ""
        if (!fa || !fb) return fa ? -1 : fb ? 1 : 0
        return fa < fb ? -1 : fa > fb ? 1 : 0
    })
}

function normalizarCupo(cupo: number): number {
    if (!Number.isFinite(cupo)) return MIN_CUPO_TITULARES
    return Math.min(MAX_CUPO_TITULARES, Math.max(MIN_CUPO_TITULARES, Math.trunc(cupo)))
}

/**
 * Deriva la condición de titular/suplente a partir de la posición del participante
 * y del cupo configurado para la carrera. No se guarda estado por participante.
 *
 * La posición es por orden de llegada (el más viejo primero), el mismo criterio
 * que usa el servidor (`positionInCareer`) para avisarle a la persona si quedó
 * titular o suplente. La API devuelve la lista del más nuevo al más viejo, así
 * que se ordena acá en vez de confiar en el orden recibido.
 *
 * Los que se inscribieron con la carrera "Sin cupo" ocupan su posición (el
 * servidor también los cuenta) pero nunca son titulares.
 */
export function clasificarParticipantes(participantes: Alumno[], cupo: number): ParticipanteClasificado[] {
    const limite = normalizarCupo(cupo)
    return porOrdenDeLlegada(participantes).map((alumno, i) => {
        const posicion = i + 1
        // Igual que el servidor: quien se inscribió con la carrera cerrada
        // ("Sin cupo") recibió el aviso de suplente y sigue siéndolo.
        const titular = posicion <= limite && alumno.sinCupoAlInscribirse !== true
        return { alumno, posicion, titular }
    })
}

export function resumenCupo(clasificados: ParticipanteClasificado[]): ResumenCupo {
    const titulares = clasificados.reduce((acc, p) => acc + (p.titular ? 1 : 0), 0)
    return { total: clasificados.length, titulares, suplentes: clasificados.length - titulares }
}