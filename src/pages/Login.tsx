import { useEffect, useState, type FormEvent } from "react"
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react"
import { api } from "@/api"

const TOKEN_KEY = "obreros_admin_token"
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginProps {
    onSuccess?: () => void
    onBack?: () => void
}

export default function Login({ onSuccess, onBack }: LoginProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [logging, setLogging] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)
        document.title = "Acceso docentes - Obreros del Porvenir"
        return () => {
            document.title = "Obreros del Porvenir - Escuela Superior de Comercio N° 44"
        }
    }, [])

    const validate = (): string => {
        const trimmed = email.trim()
        if (!trimmed) return "Ingresá tu correo institucional."
        if (!EMAIL_REGEX.test(trimmed)) return "El correo electrónico no es válido."
        if (!password) return "Ingresá tu contraseña."
        return ""
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const msg = validate()
        if (msg) {
            setError(msg)
            return
        }
        setLogging(true)
        setError("")
        try {
            const res = await api.login(email.trim(), password)
            sessionStorage.setItem(TOKEN_KEY, res.token)
            setShowPassword(false)
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo iniciar sesión")
        } finally {
            setLogging(false)
        }
    }

    return (
        <div className="relative min-h-screen bg-[#fcfaf7] flex items-center justify-center px-4 py-12 overflow-hidden">
            <div className="pointer-events-none absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-[#4d0706]/[0.04] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-gold/10 blur-3xl" />

            <div className="relative w-full max-w-md">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-300/50 overflow-hidden">
                    <div className="relative bg-[#4d0706] px-7 sm:px-10 pt-9 sm:pt-10 pb-8">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ffcc00] via-gold to-[#d4a800]" />
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center overflow-hidden shrink-0">
                                <img src="/icons/escuela.png" alt="Escuela Obreros del Porvenir" className="w-9 h-9 object-contain" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">Acceso docentes</h1>
                                <p className="text-xs text-white/60 font-semibold mt-1">Escuela Superior de Comercio N° 44</p>
                            </div>
                        </div>
                        <p className="mt-6 text-sm text-white/80 font-medium leading-relaxed">
                            Ingresá tus credenciales para administrar inscripciones, cursos y carreras.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-7 sm:px-10 py-8 space-y-5" noValidate>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setError("")
                                }}
                                placeholder="tuemail@gmail.com"
                                autoComplete="username"
                                className="w-full h-14 pl-11 pr-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError("")
                                }}
                                placeholder="Contraseña"
                                autoComplete="current-password"
                                className="w-full h-14 pl-11 pr-12 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#4d0706] hover:bg-[#4d0706]/5 cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={logging}
                            className="w-full h-14 bg-[#4d0706] text-[#ffcc00] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-[#4d0706]/20 hover:bg-brand-dark hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                        >
                            {logging ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Ingresar
                                </>
                            )}
                        </button>
                    </form>

                    <div className="px-7 sm:px-10 pb-9">
                        <div className="flex items-center gap-2 justify-center text-xs text-gray-400 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Acceso restringido · Solo personal de la institución
                        </div>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="mt-5 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#4d0706] cursor-pointer mx-auto"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Volver al sitio
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}