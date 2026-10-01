/**
 * Errores con un mensaje que está pensado para mostrarse al usuario.
 *
 * Cualquier otro `Error` se registra en el log del servidor y se responde con
 * un mensaje genérico. Esto evita que al cliente le lleguen detalles internos
 * como nombres de tablas de Supabase o rutas del filesystem.
 */
export class PublicError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = "PublicError"
    this.expose = true
    this.status = status
  }
}
