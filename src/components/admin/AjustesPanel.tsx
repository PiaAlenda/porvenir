import { useState, type FormEvent, type ChangeEvent, useEffect } from "react"
import { AlertCircle, Check, Camera, Eye, EyeOff, KeyRound, Loader2, User } from "lucide-react"
import { api } from "@/api"

interface Props {
    token: string
}

const MIN_LENGTH = 8
const PROFILE_IMAGE_KEY = "obreros_admin_profile_image"

export default function AjustesPanel({ token }: Props) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [show, setShow] = useState({ current: false, next: false, confirm: false })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [saving, setSaving] = useState(false)
    const [profileImage, setProfileImage] = useState<string | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem(PROFILE_IMAGE_KEY)
        if (saved) setProfileImage(saved)
    }, [])

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

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) {
            setError("El archivo debe ser una imagen")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("La imagen no debe superar los 5MB")
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result as string
            setProfileImage(dataUrl)
            localStorage.setItem(PROFILE_IMAGE_KEY, dataUrl)
            setError("")
            setSuccess("Foto de perfil actualizada")
        }
        reader.readAsDataURL(file)
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
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-gray-200">
                            {profileImage ? (
                                <img src={profileImage} alt="Foto de perfil" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-gray-400" />
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#4d0706] text-[#ffcc00] rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-dark transition-colors" title="Cambiar foto de perfil">
                            <Camera className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </label>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Foto de perfil</h3>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Subí una imagen para tu perfil (máx. 5MB)</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-black text-gray-900 mb-4">Cambiar contraseña</h3>
                    <p className="text-sm text-gray-500 font-medium mb-4">Actualizá la clave de acceso al panel de gestión.</p>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        </div>
    )
}