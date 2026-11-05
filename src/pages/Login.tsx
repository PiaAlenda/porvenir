import { useEffect, useState, type FormEvent } from "react"
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react"
import { api } from "@/api"
import { consumeExpiredNotice, saveAdminSession } from "@/lib/adminSession"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginProps {
    onSuccess?: () => void
    onBack?: () => void
}

const inputClass =
    "w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#4d0706]/10 focus:border-[#4d0706] transition-[border-color,box-shadow] duration-150 ease-out"

const stagger = (i: number) => ({ animationDelay: `${i * 50}ms` })

export default function Login({ onSuccess, onBack }: LoginProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [logging, setLogging] = useState(false)
    // La sesión anterior venció y no se pudo renovar: el panel la mandó acá.
    // Se consume al montar para que el aviso no quede para el próximo login.
    const [sesionVencida] = useState(() => consumeExpiredNotice())

    useEffect(() => {
        window.scrollTo(0, 0)
        document.title = "Acceso docentes - Obreros del Porvenir"
        return () => {
            document.title = "Obreros del Porvenir - Escuela Técnica de Capacitación Laboral N° 917"
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
            saveAdminSession(res.token, res.refreshToken)
            setShowPassword(false)
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo iniciar sesión")
        } finally {
            setLogging(false)
        }
    }

    return (
        <div className="min-h-dvh grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-white">
            {/* Panel de marca: solo desktop */}
            <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#4d0706] text-white p-12 xl:p-16">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ffcc00] via-gold to-[#d4a800]" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-gold/10 blur-3xl" />
                <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/[0.04] blur-2xl" />

                <div className="relative flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center shrink-0">
                        <img src="/icons/escuela.png" alt="" className="w-7 h-7 object-contain" />
                    </div>
                    <span className="text-sm font-bold tracking-wide text-white/90">Obreros del Porvenir</span>
                </div>

                <div className="relative max-w-md">
                    <h2 className="text-4xl xl:text-5xl font-black leading-[1.05] text-white">
                        Panel de gestión <span className="text-[#ffcc00]">docente</span>
                    </h2>
                    <p className="mt-5 text-base text-white/70 font-medium leading-relaxed">
                        Administrá inscripciones, cursos y carreras de la institución desde un solo lugar.
                    </p>
                </div>

                <p className="relative text-xs text-white/50 font-semibold">
                    Escuela Técnica de Capacitación Laboral N° 917
                </p>
            </aside>

            {/* Formulario: sin card */}
            <main className="flex flex-col justify-center px-6 py-10 sm:px-10 min-h-dvh">
                <div className="w-full max-w-sm mx-auto">
                    {/* Marca compacta: solo mobile */}
                    <div className="lg:hidden animate-login-in flex items-center gap-3 mb-10" style={stagger(0)}>
                        <div className="w-11 h-11 rounded-xl bg-[#4d0706] flex items-center justify-center shrink-0">
                            <img src="/icons/escuela.png" alt="Escuela Obreros del Porvenir" className="w-7 h-7 object-contain" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-[#4d0706] leading-tight">Obreros del Porvenir</p>
                            <p className="text-[11px] text-gray-500 font-semibold leading-tight mt-0.5">Escuela Técnica N° 917</p>
                        </div>
                    </div>

                    <div className="animate-login-in" style={stagger(1)}>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">Acceso docentes</h1>
                        <p className="mt-2 text-sm text-gray-500 font-medium">Ingresá tus credenciales para continuar.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
                        {sesionVencida && (
                            <div
                                className="animate-login-in flex items-start gap-2.5 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
                                style={stagger(2)}
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>Tu sesión expiró. Ingresá de nuevo para seguir trabajando en el panel.</span>
                            </div>
                        )}

                        <div className="animate-login-in" style={stagger(2)}>
                            <label htmlFor="login-email" className="block text-xs font-bold text-gray-700 mb-1.5">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        setError("")
                                    }}
                                    placeholder="tuemail@gmail.com"
                                    autoComplete="username"
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>

                        <div className="animate-login-in" style={stagger(3)}>
                            <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 mb-1.5">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setError("")
                                    }}
                                    placeholder="Tu contraseña"
                                    autoComplete="current-password"
                                    className={`${inputClass} pr-12`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#4d0706] hover:bg-[#4d0706]/5 transition-colors duration-150 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="animate-login-in flex items-start gap-2.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="animate-login-in pt-1" style={stagger(4)}>
                            <button
                                type="submit"
                                disabled={logging}
                                className="w-full h-12 bg-[#4d0706] text-[#ffcc00] font-black uppercase tracking-widest text-xs rounded-xl hover:bg-brand-dark active:scale-[0.97] transition-[transform,background-color,opacity] duration-150 ease-out disabled:opacity-60 disabled:active:scale-100 cursor-pointer flex items-center justify-center gap-2"
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
                        </div>
                    </form>

                    <div className="animate-login-in mt-8 space-y-4" style={stagger(5)}>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            Acceso restringido · Solo personal de la institución
                        </div>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#4d0706] transition-colors duration-150 cursor-pointer"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Volver al sitio
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
