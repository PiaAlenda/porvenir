const API_BASE = ""

export interface Alumno {
    id: string
    apellido: string
    nombre: string
    c_documento: string
    numeroDocumento: string
    cuil: string
    fechaNacimiento: string
    c_sexo: string
    careerId?: string
    courseTitle?: string
    domicilio?: string
    departamento?: string
    celular?: string
    email?: string
    createdAt?: string
    updatedAt?: string
}

export interface CursoConfig {
    image?: string
    available: boolean
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
    email?: string
    careerId?: string
    courseTitle?: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, options)
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Error ${res.status}`)
    }
    return res.json() as Promise<T>
}

function auth(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` }
}

export const api = {
    async postInscripcion(data: InscripcionPayload) {
        return request<{ id: string; nombre: string; message: string }>("/api/inscripciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
    },

    async login(password: string) {
        return request<{ token: string }>("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
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

    urls: {
        ficha(id: string, token: string) {
            return `/api/inscripciones/${id}/ficha?token=${encodeURIComponent(token)}`
        },
    },
}