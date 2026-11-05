import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface Props {
    open: boolean
    onClose(): void
    title: ReactNode
    subtitle?: ReactNode
    children: ReactNode
    footer?: ReactNode
    size?: "md" | "lg" | "full"
}

/**
 * Ventana del panel: en el celular sube desde abajo (como las apps), en la
 * computadora aparece centrada. Se cierra con la ✕, tocando afuera o con Esc.
 */
export default function Sheet({ open, onClose, title, subtitle, children, footer, size = "md" }: Props) {
    const [mounted, setMounted] = useState(open)
    const [shown, setShown] = useState(false)

    // Montar antes de animar la entrada y desmontar después de animar la salida.
    if (open && !mounted) setMounted(true)
    if (!open && shown) setShown(false)

    useEffect(() => {
        if (open) {
            let inner = 0
            const outer = requestAnimationFrame(() => {
                inner = requestAnimationFrame(() => setShown(true))
            })
            return () => {
                cancelAnimationFrame(outer)
                cancelAnimationFrame(inner)
            }
        }
        const t = setTimeout(() => setMounted(false), 220)
        return () => clearTimeout(t)
    }, [open])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.removeEventListener("keydown", onKey)
            document.body.style.overflow = prev
        }
    }, [open, onClose])

    if (!mounted) return null

    const full = size === "full"
    // "full": en el celular tapa toda la pantalla; en la computadora es una ventana grande de casi todo el alto.
    const box = full
        ? "h-[100dvh] sm:h-full sm:max-w-5xl rounded-none sm:rounded-2xl"
        : `${size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[92dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl`
    // Texto a un ancho cómodo de leer, centrado, aunque la ventana sea muy ancha.
    const inner = full ? "w-full max-w-3xl mx-auto" : ""

    return createPortal(
        <div className={`fixed inset-0 z-[100] flex justify-center ${full ? "items-stretch sm:p-6" : "items-end sm:items-center sm:p-6"}`} role="dialog" aria-modal="true">
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />
            <div
                className={`relative w-full ${box} flex flex-col bg-white shadow-2xl transition-all duration-200 ease-out ${
                    shown ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-full opacity-0 sm:translate-y-4 sm:scale-95"
                }`}
            >
                {!full && <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-200" aria-hidden />}
                <div className={`border-b border-gray-100 ${full ? "pt-[env(safe-area-inset-top)]" : ""}`}>
                    <div className={`flex items-start gap-3 px-5 ${full ? "py-4 sm:py-5" : "pt-3 sm:pt-5 pb-3"} ${inner}`}>
                        <div className="min-w-0 flex-1">
                            <h2 className={`font-black text-gray-900 ${full ? "text-lg" : "text-base"}`}>{title}</h2>
                            {subtitle && <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="w-10 h-10 -mr-2 -mt-1 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className={`flex-1 overflow-y-auto overscroll-contain ${full ? "sm:[scrollbar-gutter:stable_both-edges]" : ""}`}>
                    <div className={`px-5 ${full ? "py-6" : "py-4"} ${inner}`}>{children}</div>
                </div>
                {footer && (
                    <div className="border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
                        <div className={`px-5 py-3 ${inner}`}>{footer}</div>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    )
}
