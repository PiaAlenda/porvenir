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
    try {
        const res = await fetch(`${API_BASE}${path}`, options)
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error || `Error en el servidor (${res.status})`)
        }
        return (await res.json()) as T
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.message.includes("fetch")) {
                throw new Error("No se pudo conectar con el servidor. Por favor, comprobá tu conexión a internet e intentá de nuevo.")
            }
            throw err
        }
        throw new Error("Ocurrió un error inesperado. Por favor, intentá nuevamente.")
    }
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

    urls: {
        ficha(id: string, token: string) {
            return `/api/inscripciones/${id}/ficha?token=${encodeURIComponent(token)}`
        },
    },
}