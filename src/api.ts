import {
    expireAdminSession,
    getAdminRefreshToken,
    getAdminToken,
    updateAdminSession,
} from "@/lib/adminSession"

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

/**
 * Mensaje de sesión vencida. Es el mismo que devuelve el servidor, para que el
 * panel no muestre nunca un "No autorizado" crudo: la persona admin necesita
 * saber qué hacer, no que algo falló.
 */
const SESION_VENCIDA = "Tu sesión expiró. Volvé a iniciar sesión para continuar."

export interface FormFieldOption {
    value: string
    label: string
}

/**
 * Configuración de una casilla del formulario de inscripción. El panel de
 * administración puede cambiar la etiqueta, el texto de ayuda, si es
 * obligatoria, si se muestra y (en los desplegables) las opciones.
 */
export interface FormFieldConfig {
    id: string
    kind: string
    step: number
    label: string
    placeholder?: string
    placeholderOption?: string
    hint?: string
    required: boolean
    visible: boolean
    options?: FormFieldOption[]
    span?: 1 | 2
}

export interface FormOptions {
    campos: FormFieldConfig[]
    /** Legado: opciones sueltas de "Año / División" antes de existir `campos`. */
    aniosDivisiones?: string[]
}

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
    /** Campo histórico; se mantiene para no perder inscripciones viejas. */
    especialidad?: string
    anioDivision?: string
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
    /** El admin lo eliminó: el ítem vuelve como lápida y no se ofrece más. */
    removed?: true
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
    anioDivision?: string
    c_discapacidad?: string
    cud?: string
    c_pueblo_indigena?: string
    problematicaIntegrado?: string
}

function errorDeRed(): Error {
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
    return new Error(
        `No se pudo contactar con ${destino}. Si es un problema de CORS o la API está caída, el navegador no muestra el detalle: revisá que VITE_API_URL apunte a la API y que su ALLOWED_ORIGIN incluya este dominio.`
    )
}

function errorDeRespuesta(res: Response): Promise<Error> {
    return res
        .json()
        .catch(() => ({}))
        .then((body) => new Error(body?.error || `Error en el servidor (${res.status})`))
}

/** Llamadas públicas: sin Authorization y sin renovación de sesión. */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response
    try {
        res = await fetch(`${API_BASE}${path}`, options)
    } catch {
        throw errorDeRed()
    }
    if (!res.ok) throw await errorDeRespuesta(res)
    return (await res.json()) as T
}

/**
 * Renueva el access token una sola vez, aunque varias llamadas del panel
 * fallen en paralelo: todas comparten la misma promesa y con el token nuevo
 * vuelven a intentar lo que estaban haciendo.
 *
 * Devuelve el token nuevo, o `null` si la sesión no tiene arreglo (ahí la
 * borra, para que el panel deje de reintentar con un token muerto). Un fallo
 * de red tira el error de red en vez de fingir que la sesión venció.
 */
let renovando: Promise<string | null> | null = null

function renovarSesion(): Promise<string | null> {
    if (!renovando) {
        renovando = (async () => {
            const sinArreglo = () => {
                // Se borra la sesión para que el panel no siga reintentando y
                // para que el login sepa que el cierre fue por vencimiento.
                expireAdminSession()
                return null
            }

            const refreshToken = getAdminRefreshToken()
            if (!refreshToken) return sinArreglo()

            let res: Response
            try {
                res = await fetch(`${API_BASE}/api/auth/refresh`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken }),
                })
            } catch {
                throw errorDeRed()
            }

            // Un 5xx o el rate limit no dicen nada de la sesión: son un
            // problema del servidor y se reportan como tal, sin deslogear.
            if (res.status === 429 || res.status >= 500) throw await errorDeRespuesta(res)
            if (!res.ok) return sinArreglo()

            const data = await res.json().catch(() => ({}))
            if (!data?.token) return sinArreglo()

            // Supabase rota el refresh token en cada renovación: hay que
            // guardarlo, si no la próxima se usa uno ya revocado y la sesión
            // se corta igual, pero en el segundo intento.
            updateAdminSession(data.token, data.refreshToken || undefined)
            return data.token as string
        })().finally(() => {
            renovando = null
        })
    }
    return renovando
}

/**
 * `fetch` para todo lo que pide token.
 *
 * El Authorization sale de la sesión vigente: así una sesión recién renovada
 * se aplica sola, sin que cada panel tenga que volver a cargar sus datos. El
 * token que el componente le pasó al método queda como respaldo, por si no
 * hay sesión en el storage.
 */
async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const encabezados = (options.headers as Record<string, string> | undefined) || {}
    const declarado = (encabezados.Authorization || "").replace(/^Bearer\s+/i, "")
    const token = getAdminToken() || declarado

    const armar = (): RequestInit => ({
        ...options,
        headers: { ...encabezados, Authorization: `Bearer ${token}` },
    })

    let res: Response
    try {
        res = await fetch(`${API_BASE}${path}`, armar())
    } catch {
        throw errorDeRed()
    }

    if (res.status === 401) {
        const renovado = await renovarSesion()
        if (!renovado) throw new Error(SESION_VENCIDA)
        try {
            res = await fetch(`${API_BASE}${path}`, armar())
        } catch {
            throw errorDeRed()
        }
        if (res.status === 401) throw new Error(SESION_VENCIDA)
    }

    return res
}

async function authedRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await authedFetch(path, options)
    if (!res.ok) throw await errorDeRespuesta(res)
    return (await res.json()) as T
}

function auth(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` }
}

export interface InscripcionResult {
    id: string
    nombre: string
    message: string
    /** false cuando la carrera/curso estaba completa y la persona quedó suplente. */
    hayCupo?: boolean
}

export const api = {
    async postInscripcion(data: FormData | InscripcionPayload) {
        if (data instanceof FormData) {
            return request<InscripcionResult>("/api/inscripciones", {
                method: "POST",
                body: data,
            })
        }
        return request<InscripcionResult>("/api/inscripciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        })
    },

    async uploadArchivos(token: string, id: string, form: FormData) {
        return authedRequest<{ inscripcion: Alumno }>(`/api/inscripciones/${id}/archivos`, {
            method: "POST",
            headers: auth(token),
            body: form,
        })
    },

    async login(email: string, password: string) {
        return request<{ token: string; refreshToken?: string }>("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        })
    },

    async changePassword(token: string, currentPassword: string, newPassword: string) {
        return authedRequest<{ ok: boolean; message: string }>("/api/auth/password", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...auth(token) },
            body: JSON.stringify({ currentPassword, newPassword }),
        })
    },

    async listInscripciones(token: string) {
        return authedRequest<{ inscripciones: Alumno[] }>("/api/inscripciones", { headers: auth(token) })
    },

    async updateInscripcion(token: string, id: string, patch: Partial<Alumno>) {
        return authedRequest<{ inscripcion: Alumno }>(`/api/inscripciones/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...auth(token) },
            body: JSON.stringify(patch),
        })
    },

    async deleteInscripcion(token: string, id: string) {
        return authedRequest<{ ok: boolean }>(`/api/inscripciones/${id}`, { method: "DELETE", headers: auth(token) })
    },

    async getConfig() {
        return request<{ cursos: SiteConfigMap; formOptions: FormOptions }>("/api/config")
    },

    async updateFormOptions(token: string, campos: FormFieldConfig[]) {
        return authedRequest<{ options: FormOptions }>("/api/form-options", {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...auth(token) },
            body: JSON.stringify({ campos }),
        })
    },

    async updateCurso(token: string, id: string, form: FormData) {
        return authedRequest<{ item: CursoConfig }>(`/api/config/${id}`, {
            method: "PUT",
            headers: auth(token),
            body: form,
        })
    },

    async updateCantidadTitulares(token: string, id: string, cantidadTitulares: number) {
        const form = new FormData()
        form.append("cantidadTitulares", String(cantidadTitulares))
        return authedRequest<{ item: CursoConfig }>(`/api/config/${id}`, {
            method: "PUT",
            headers: auth(token),
            body: form,
        })
    },

    /** Elimina un curso o una carrera del sitio y borra sus archivos. */
    async deleteCurso(token: string, id: string) {
        return authedRequest<{ ok: boolean }>(`/api/config/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: auth(token),
        })
    },

    /**
     * Descarga la ficha PDF del alumno. Va con `Authorization` por header en
     * lugar de `?token=`: una query string deja el JWT en los logs del
     * servidor, en el Referer y en el historial del navegador.
     */
    async downloadFicha(token: string, id: string) {
        const res = await authedFetch(`/api/inscripciones/${id}/ficha`, {
            headers: auth(token),
        })
        if (!res.ok) throw await errorDeRespuesta(res)

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