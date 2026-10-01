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

function normalizarCupo(cupo: number): number {
    if (!Number.isFinite(cupo)) return MIN_CUPO_TITULARES
    return Math.min(MAX_CUPO_TITULARES, Math.max(MIN_CUPO_TITULARES, Math.trunc(cupo)))
}

/**
 * Deriva la condición de titular/suplente a partir de la posición del participante
 * y del cupo configurado para la carrera. No se guarda estado por participante.
 */
export function clasificarParticipantes(participantes: Alumno[], cupo: number): ParticipanteClasificado[] {
    const limite = normalizarCupo(cupo)
    return participantes.map((alumno, i) => {
        const posicion = i + 1
        return { alumno, posicion, titular: posicion <= limite }
    })
}

export function resumenCupo(clasificados: ParticipanteClasificado[]): ResumenCupo {
    const titulares = clasificados.reduce((acc, p) => acc + (p.titular ? 1 : 0), 0)
    return { total: clasificados.length, titulares, suplentes: clasificados.length - titulares }
}