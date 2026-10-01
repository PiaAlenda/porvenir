import { useEffect, type ReactNode } from "react"
import { Loader2, TriangleAlert } from "lucide-react"

interface Props {
    title: string
    message: ReactNode
    confirmLabel?: string
    cancelLabel?: string
    busy?: boolean
    error?: string
    onConfirm: () => void
    onCancel: () => void
}

/**
 * Confirmación para acciones destructivas. Reemplaza al `confirm()` del
 * navegador: el popup nativo queda atado a cómo lo pinte cada sistema
 * operativo y no se puede estilizar.
 */
export default function ConfirmDialog({
    title,
    message,
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
    busy = false,
    error = "",
    onConfirm,
    onCancel,
}: Props) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !busy) onCancel()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onCancel, busy])

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
                if (!busy) onCancel()
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4"
            >
                <div className="flex items-start gap-3">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-red-50 text-red-600 grid place-items-center">
                        <TriangleAlert className="w-5 h-5" />
                    </span>
                    <h3 id="confirm-dialog-title" className="text-base font-black text-gray-900 leading-tight pt-1.5">
                        {title}
                    </h3>
                </div>

                <div className="text-sm font-medium text-gray-600 leading-relaxed">{message}</div>

                {error && (
                    <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        {error}
                    </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-black text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        {busy ? "Eliminando..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}