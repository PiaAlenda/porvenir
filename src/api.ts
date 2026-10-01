const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

export interface Alumno {
    id: string
    apellido: string
    nombre: string
    c_documento: string
    numeroDocumento: string
    cuil: string
    fechaNacimiento: string
    c_sexo: string
    c_pais_nacimiento?: string
    c_provincia_nacimiento?: string
    lugar_nacimiento?: string
    c_nacionalidad?: string
    domicilio?: string
    departamento?: string
    celular?: string
    celularUrgencia?: string
    email?: string
    careerId?: string
    courseTitle?: string
    especialidad?: string
    c_discapacidad?: string
    cud?: string
    c_pueblo_indigena?: string
    problematicaIntegrado?: string
    fotoDni?: string
    fotoCertificado?: string
    createdAt?: string
    updatedAt?: string
}

export interface ConfigTeacher {
    name: string
    title?: string
    legajo?: string
    image?: string
    /** El admin pidió borrar la foto actual de este docente. */
    removeImage?: boolean
}

export interface ConfigSyllabusEntry {
    year: string
    subjects: string[]
}

export interface CursoConfig {
    image?: string
    available: boolean
    title?: string
    cantidadTitulares?: number
    /* hero / encabezado */
    description?: string
    longDescription?: string
    duration?: string
    modality?: string
    icon?: string
    category?: "carrera" | "curso-presencial" | "curso-virtual"
    video?: string
    /* inscripción */
    inscriptionDate?: string
    month?: string
    schedule?: string
    inscriptionFee?: string
    inscriptionDocs?: string
    /* cuerpo */
    syllabus?: ConfigSyllabusEntry[]
    teachers?: ConfigTeacher[]
    /** Nombre del primer docente, redundante con teachers[0]. Se mantiene por compatibilidad. */
    teacher?: string
    salidaLaboral?: string[]
    perfilEgresado?: string[]
    /** Campo plano anterior; se sigue aceptando y se deriva de syllabus[0]. */
    ejes?: string
}

export type SiteConfigMap = Record<string, CursoConfig>

export interface InscripcionPayload {
    apellido: string
    nombre: string
    c_documento: string
    numeroDocumento: string
    cuil: string
    fechaNacimiento: string
    c_sexo: string
    c_pais_nacimiento?: string
    c_provincia_nacimiento?: string
    lugar_nacimiento?: string
    c_nacionalidad?: string
    domicilio?: string
    departamento?: string
    celular?: string
    celularUrgencia?: string
    email?: string
    careerId?: string
    courseTitle?: string
    especialidad?: string
    c_discapacidad?: string
    cud?: string
    c_pueblo_indigena?: string
    problematicaIntegrado?: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response
    try {
        res = await fetch(`${API_BASE}${path}`, options)
    } catch {
        /*
         * `fetch` solo rechaza cuando no hubo respuesta: CORS bloqueado por el
         * navegador, API caída, DNS roto, o la API dormida. Eso tiene causas
         * muy distintas entre sí, pero ninguna es "se cayó el wifi del
         * usuario", así que el mensaje no puede seguir mandándolo a revisar
         * su conexión.
         *
         * El `try` envuelve únicamente el fetch a propósito: si envolviera toda
         * la función, un `body.error` del servidor que contenga la palabra
         * "fetch" se reportaría como si fuera un problema de red.
         */
        const destino = API_BASE
            ? `la API en ${API_BASE}`
            : "la API (VITE_API_URL no está definida en este build, por eso se pidió al propio dominio)"
        throw new Error(
            `No se pudo contactar con ${destino}. Si es un problema de CORS o la API está caída, el navegador no muestra el detalle: revisá que VITE_API_URL apunte a la API y que su ALLOWED_ORIGIN incluya este dominio.`
        )
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Error en el servidor (${res.status})`)
    }
    return (await res.json()) as T
}

function auth(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` }
}

export const api = {
    async postInscripcion(data: FormData | InscripcionPayload) {
        if (data instanceof FormData) {
            return request<{ id: string; nombre: string; message: string }>("/api/inscripciones", {
                method: "POST",
                body: data,
            })
        }
        return request<{ id: string; nombre: string; message: string }>("/api/inscripciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
    },

    async uploadArchivos(token: string, id: string, form: FormData) {
        return request<{ inscripcion: Alumno }>(`/api/inscripciones/${id}/archivos`, {
            method: "POST",
            headers: auth(token),
            body: form,
        })
    },

    async login(email: string, password: string) {
        return request<{ token: string }>("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })
    },

    async changePassword(token: string, currentPassword: string, newPassword: string) {
        return request<{ ok: boolean; message: string }>("/api/auth/password", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...auth(token) },
            body: JSON.stringify({ currentPassword, newPassword }),
        })
    },

    async listInscripciones(token: string) {
        return request<{ inscripciones: Alumno[] }>("/api/inscripciones", { headers: auth(token) })
    },

    async updateInscripcion(token: string, id: string, patch: Partial<Alumno>) {
        return request<{ inscripcion: Alumno }>(`/api/inscripciones/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...auth(token) },
            body: JSON.stringify(patch),
        })
    },

    async deleteInscripcion(token: string, id: string) {
        return request<{ ok: boolean }>(`/api/inscripciones/${id}`, { method: "DELETE", headers: auth(token) })
    },

    async getConfig() {
        return request<{ cursos: SiteConfigMap }>("/api/config")
    },

    async updateCurso(token: string, id: string, form: FormData) {
        return request<{ item: CursoConfig }>(`/api/config/${id}`, {
            method: "PUT",
            headers: auth(token),
            body: form,
        })
    },

    async updateCantidadTitulares(token: string, id: string, cantidadTitulares: number) {
        const form = new FormData()
        form.append("cantidadTitulares", String(cantidadTitulares))
        return request<{ item: CursoConfig }>(`/api/config/${id}`, {
            method: "PUT",
            headers: auth(token),
            body: form,
        })
    },

    /**
     * Descarga la ficha PDF del alumno. Va con `Authorization` por header en
     * lugar de `?token=`: una query string deja el JWT en los logs del
     * servidor, en el Referer y en el historial del navegador.
     */
    async downloadFicha(token: string, id: string) {
        const res = await fetch(`${API_BASE}/api/inscripciones/${id}/ficha`, {
            headers: auth(token),
        })
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error || `Error en el servidor (${res.status})`)
        }

        const disposition = res.headers.get("Content-Disposition") || ""
        const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
        const filename = match
            ? decodeURIComponent(match[1].replace(/^"|"$/g, ""))
            : "ficha.pdf"

        const url = URL.createObjectURL(await res.blob())
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    },
}