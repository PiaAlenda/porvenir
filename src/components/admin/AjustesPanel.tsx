import { useState, type FormEvent } from "react"
import { AlertCircle, Check, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { api } from "@/api"

interface Props {
    token: string
}

const MIN_LENGTH = 8

export default function AjustesPanel({ token }: Props) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [show, setShow] = useState({ current: false, next: false, confirm: false })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [saving, setSaving] = useState(false)

    const toggleShow = (field: keyof typeof show) => setShow((s) => ({ ...s, [field]: !s[field] }))

    const validate = (): string => {
        if (!currentPassword) return "Ingresá tu contraseña actual."
        if (newPassword.length < MIN_LENGTH) return `La nueva contraseña debe tener al menos ${MIN_LENGTH} caracteres.`
        if (newPassword === currentPassword) return "La nueva contraseña debe ser distinta a la actual."
        if (newPassword !== confirmPassword) return "Las contraseñas nuevas no coinciden."
        return ""
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const msg = validate()
        if (msg) {
            setError(msg)
            setSuccess("")
            return
        }
        setSaving(true)
        setError("")
        setSuccess("")
        try {
            const res = await api.changePassword(token, currentPassword, newPassword)
            setSuccess(res.message)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setShow({ current: false, next: false, confirm: false })
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña")
        } finally {
            setSaving(false)
        }
    }

    const passwordInput = (
        value: string,
        onChange: (v: string) => void,
        placeholder: string,
        visible: boolean,
        toggle: () => void,
        autoComplete: string
    ) => (
        <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
                type={visible ? "text" : "password"}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                    setError("")
                    setSuccess("")
                }}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="w-full h-14 pl-11 pr-12 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all"
                required
            />
            <button
                type="button"
                onClick={toggle}
                title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#4d0706] hover:bg-[#4d0706]/5 cursor-pointer"
            >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="relative bg-[#4d0706] px-5 sm:px-7 py-5">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ffcc00] via-gold to-[#d4a800]" />
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center shrink-0">
                            <KeyRound className="w-5 h-5 text-[#ffcc00]" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-black text-white leading-tight">Cambiar contraseña</h3>
                            <p className="text-xs text-white/60 font-semibold mt-0.5">
                                Actualizá la clave de acceso al panel de gestión.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-6 space-y-4" noValidate>
                    {passwordInput(currentPassword, setCurrentPassword, "Contraseña actual", show.current, () => toggleShow("current"), "current-password")}
                    {passwordInput(newPassword, setNewPassword, `Nueva contraseña (mínimo ${MIN_LENGTH} caracteres)`, show.next, () => toggleShow("next"), "new-password")}
                    {passwordInput(confirmPassword, setConfirmPassword, "Repetí la nueva contraseña", show.confirm, () => toggleShow("confirm"), "new-password")}

                    {error && (
                        <div className="flex items-start gap-2.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-start gap-2.5 text-sm text-green-700 font-medium bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                            <Check className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{success}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full h-14 bg-[#4d0706] text-[#ffcc00] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-[#4d0706]/20 hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <KeyRound className="w-4 h-4" />
                                Actualizar contraseña
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}