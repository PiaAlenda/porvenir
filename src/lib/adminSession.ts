/**
 * Sesión del panel de administración.
 *
 * Antes cada archivo leía y escribía `sessionStorage` por su cuenta con la
 * misma clave copiada a mano (`TOKEN_KEY` en App, Login y Admin). Eso funciona
 * hasta que hay que reaccionar a un cambio de sesión en un solo lugar: con el
 * refresh del access token, el panel tiene que volver a leer el token cuando
 * se renueva y tiene que mandar al login cuando ya no hay sesión posible.
 *
 * Por eso la sesión vive acá, con suscriptores. El storage sigue siendo
 * `sessionStorage` (no sobrevive a la pestaña) a propósito: es lo que hace que
 * cerrar la pestaña cierre el panel.
 */

const TOKEN_KEY = "obreros_admin_token"
const REFRESH_KEY = "obreros_admin_refresh_token"
/**
 * Aviso para la pantalla de login: la sesión anterior terminó porque venció,
 * no porque alguien haya cerrado sesión. Se consume (se borra) al leerlo, así
 * el mensaje no queda pegado para el próximo login.
 */
const EXPIRED_KEY = "obreros_admin_session_expired"

type Listener = () => void

const listeners = new Set<Listener>()

function read(key: string): string {
    try {
        return sessionStorage.getItem(key) || ""
    } catch {
        // Storage inaccesible (modo privado estricto): sin sesión, no en error.
        return ""
    }
}

function write(key: string, value: string | null): void {
    try {
        if (value === null) sessionStorage.removeItem(key)
        else sessionStorage.setItem(key, value)
    } catch {
        // Sin storage la sesión no sobrevive a este render; lo cubre el login.
    }
}

function notify(): void {
    listeners.forEach((listener) => listener())
}

/** Access token vigente, o vacío si no hay sesión. */
export function getAdminToken(): string {
    return read(TOKEN_KEY)
}

/** Refresh token del login; solo lo consume `api.ts` para renovar la sesión. */
export function getAdminRefreshToken(): string {
    return read(REFRESH_KEY)
}

export function hasAdminSession(): boolean {
    return Boolean(getAdminToken())
}

/** Login correcto: guarda la sesión y borra cualquier aviso previo. */
export function saveAdminSession(token: string, refreshToken?: string): void {
    write(TOKEN_KEY, token)
    if (refreshToken) write(REFRESH_KEY, refreshToken)
    write(EXPIRED_KEY, null)
    notify()
}

/**
 * La sesión se renovó: access token nuevo. Si venía un refresh token nuevo
 * también se guarda (Supabase los rota) y el aviso de expiración, si había
 * quedado, ya no corresponde.
 */
export function updateAdminSession(token: string, refreshToken?: string): void {
    write(TOKEN_KEY, token)
    if (refreshToken) write(REFRESH_KEY, refreshToken)
    write(EXPIRED_KEY, null)
    notify()
}

/**
 * La sesión ya no sirve y no se pudo renovar. Se borra todo y se deja el
 * aviso para que el login explique por qué está de vuelta ahí.
 */
export function expireAdminSession(): void {
    if (!read(TOKEN_KEY) && !read(REFRESH_KEY)) return
    write(TOKEN_KEY, null)
    write(REFRESH_KEY, null)
    write(EXPIRED_KEY, "1")
    notify()
}

/** Cierre de sesión a voluntad: sin aviso, el login queda limpio. */
export function clearAdminSession(): void {
    write(TOKEN_KEY, null)
    write(REFRESH_KEY, null)
    write(EXPIRED_KEY, null)
    notify()
}

/** true si la sesión anterior venció. Se lee una sola vez. */
export function consumeExpiredNotice(): boolean {
    if (!read(EXPIRED_KEY)) return false
    write(EXPIRED_KEY, null)
    return true
}

/** Devuelve la función que hay que llamar para dejar de escuchar. */
export function subscribeAdminSession(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
