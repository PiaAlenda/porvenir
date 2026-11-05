import {
    expireAdminSession,
    getAdminRefreshToken,
    getAdminToken,
    updateAdminSession,
} from "@/lib/adminSession"

import type { ContractContent } from "@/pdf/contractContent"

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
    /** Respuestas a los campos personalizados del formulario, por id de campo. */
    extras?: Record<string, string>
    /** Respuestas de la ficha médica (DDJJ), indexadas por id de pregunta. */
    fichaMedica?: Record<string, string>
    fotoDni?: string
    fotoCertificado?: string
    fotoCuil?: string
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
    /** JSON con las respuestas a los campos personalizados ({ [idCampo]: valor }). */
    extras?: string
    /** JSON con las respuestas de la ficha médica ({ [idPregunta]: valor }). */
    fichaMedica?: string
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

/** Error de una respuesta HTTP, con el status para poder decidir reintentos. */
export class HttpError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.name = "HttpError"
        this.status = status
    }
}

function errorDeRespuesta(res: Response): Promise<Error> {
    return res
        .json()
        .catch(() => ({}))
        .then((body) => new HttpError(body?.error || `Error en el servidor (${res.status})`, res.status))
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Reintenta solo ante un 503. Es el único caso seguro: la API responde 503
 * cuando falló la base o Storage *antes* de guardar la inscripción, y el
 * proxy de Render lo responde cuando la instancia está reiniciando (el pedido
 * ni llegó). Un error de red no se reintenta: el servidor pudo haber guardado
 * y el reintento chocaría con "ya existe una inscripción".
 */
async function conReintentos<T>(fn: () => Promise<T>, intentos = 3): Promise<T> {
    for (let i = 1; ; i++) {
        try {
            return await fn()
        } catch (err) {
            const reintentable = err instanceof HttpError && err.status === 503
            if (!reintentable || i >= intentos) throw err
            // 1.5s, 3s... con algo de azar para que no reintenten todos juntos.
            await esperar(1500 * i + Math.random() * 1000)
        }
    }
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

interface UploadTicket {
    key: string
    signedUrl: string
}

/**
 * Sube un archivo directo a Supabase Storage con un permiso firmado, sin
 * pasar por la API. Mismo formato que `uploadToSignedUrl` de supabase-js.
 */
async function subirConPermiso(ticket: UploadTicket, file: File): Promise<void> {
    const body = new FormData()
    body.append("cacheControl", "3600")
    body.append("", file)

    let res: Response
    try {
        res = await fetch(ticket.signedUrl, { method: "PUT", body, headers: { "x-upsert": "false" } })
    } catch {
        // Corte de red durante la subida: no se guardó nada todavía (la
        // inscripción se manda recién después), así que es seguro reintentar.
        throw new HttpError("No se pudo subir el archivo adjunto. Revisá tu conexión e intentá de nuevo.", 503)
    }
    if (res.ok) return
    if (res.status >= 500) {
        throw new HttpError("No se pudo subir el archivo adjunto. Intentá de nuevo.", 503)
    }
    if (res.status === 413) throw new HttpError("Cada imagen debe pesar menos de 10MB.", 413)
    throw new HttpError("No se pudo subir el archivo adjunto. Probá con otra foto (JPG, PNG o PDF).", res.status)
}

/** Arma el multipart del envío clásico (fotos dentro del mismo request). */
function armarMultipart(campos: InscripcionPayload, fotos: InscripcionFotos): FormData {
    const data = new FormData()
    for (const [clave, valor] of Object.entries(campos)) {
        if (valor !== undefined && valor !== null) data.append(clave, String(valor))
    }
    data.append("fotoDni", fotos.fotoDni)
    data.append("fotoCertificado", fotos.fotoCertificado)
    data.append("fotoCuil", fotos.fotoCuil)
    return data
}

export interface InscripcionFotos {
    fotoDni: File
    fotoCertificado: File
    fotoCuil: File
}

export const api = {
    /** Consulta del formulario de contacto: el servidor la envía por correo. */
    enviarContacto: (data: { nombre: string; email: string; mensaje: string; website?: string }) =>
        request<{ ok: true }>("/api/contacto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }),

    /**
     * Envía una inscripción con sus dos fotos.
     *
     * Camino normal: las fotos van directo del navegador a Storage y a la API
     * solo le llega el JSON con las claves. Si la API no ofrece subida directa
     * (modo local, o una API anterior a este cambio), las fotos viajan en el
     * mismo request como antes.
     *
     * Cada reintento rehace todo (permisos, subidas y envío): si un intento
     * falla, la API descarta lo que se había subido en ese intento.
     */
    async enviarInscripcion(campos: InscripcionPayload, fotos: InscripcionFotos) {
        return conReintentos(async () => {
            let permisos: { direct: boolean; uploads?: UploadTicket[] } | null = null
            try {
                permisos = await request("/api/inscripciones/upload-urls", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        files: [fotos.fotoDni, fotos.fotoCertificado, fotos.fotoCuil].map((f) => ({ type: f.type, size: f.size })),
                    }),
                })
            } catch (err) {
                // API vieja sin el endpoint: se sigue con el envío clásico.
                if (!(err instanceof HttpError && err.status === 404)) throw err
            }

            if (!permisos?.direct || permisos.uploads?.length !== 3) {
                return request<InscripcionResult>("/api/inscripciones", {
                    method: "POST",
                    body: armarMultipart(campos, fotos),
                })
            }

            const [dni, certificado, cuil] = permisos.uploads
            await Promise.all([
                subirConPermiso(dni, fotos.fotoDni),
                subirConPermiso(certificado, fotos.fotoCertificado),
                subirConPermiso(cuil, fotos.fotoCuil),
            ])

            return request<InscripcionResult>("/api/inscripciones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...campos, fotoDniKey: dni.key, fotoCertificadoKey: certificado.key, fotoCuilKey: cuil.key }),
            })
        })
    },


    /** ¿Ya hay una inscripción con este DNI? Se consulta al terminar el primer paso. */
    async verificarDocumento(numeroDocumento: string) {
        return request<{ inscripto: boolean }>("/api/inscripciones/verificar-documento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ numeroDocumento }),
        })
    },

    async postInscripcion(data: FormData | InscripcionPayload) {
        if (data instanceof FormData) {
            return conReintentos(() =>
                request<InscripcionResult>("/api/inscripciones", {
                    method: "POST",
                    body: data,
                })
            )
        }
        return conReintentos(() =>
            request<InscripcionResult>("/api/inscripciones", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
        )
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

    async listInscripcionesPage(
        token: string,
        params: { page: number; pageSize: number; q?: string; career?: string },
    ) {
        const qs = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) })
        if (params.q) qs.set("q", params.q)
        if (params.career) qs.set("career", params.career)
        return authedRequest<{
            items: Alumno[]
            total: number
            totalAll: number
            unassigned: number
            careers: string[]
        }>(`/api/inscripciones?${qs}`, { headers: auth(token) })
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
        return request<{ cursos: SiteConfigMap; formOptions: FormOptions; contract?: ContractContent | null }>("/api/config")
    },

    /** Reemplaza el contrato por el que se armó a partir de un .docx. */
    async saveContract(token: string, contract: ContractContent) {
        return authedRequest<{ contract: ContractContent }>("/api/contract", {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...auth(token) },
            body: JSON.stringify(contract),
        })
    },

    /** Vuelve al contrato original de la escuela. */
    async resetContract(token: string) {
        return authedRequest<{ ok: boolean }>("/api/contract", { method: "DELETE", headers: auth(token) })
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