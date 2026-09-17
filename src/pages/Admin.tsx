import { useEffect, useState, type FormEvent } from "react"
import { ArrowLeft, Briefcase, ChevronsLeft, ChevronsRight, Eye, EyeOff, GraduationCap, Lock, LogOut, ShieldCheck, Users } from "lucide-react"
import { api } from "@/api"
import AlumnosPanel from "@/components/admin/AlumnosPanel"
import AdminMobileNav from "@/components/admin/AdminMobileNav"
import CursosPanel from "@/components/admin/CursosPanel"
import { useSiteConfig } from "@/siteConfig"

interface AdminProps {
    onExit: () => void
}

const TOKEN_KEY = "obreros_admin_token"
const SIDEBAR_KEY = "obreros_admin_sidebar"

type TabId = "alumnos" | "cursos" | "carreras"

const tabs = {
    alumnos: {
        label: "Inscripciones",
        icon: Users,
        description: "Inscriptos y gestión de contratos de la escuela.",
    },
    cursos: {
        label: "Cursos",
        icon: GraduationCap,
        description: "Capacitaciones breves con alta salida laboral. Gestioná cupos y portadas.",
    },
    carreras: {
        label: "Carreras",
        icon: Briefcase,
        description: "Oferta presencial de mayor duración. Gestioná cupos y portadas.",
    },
} as const

const navOrder: TabId[] = ["alumnos", "cursos", "carreras"]

export default function Admin({ onExit }: AdminProps) {
    const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "")
    const [password, setPassword] = useState("")
    const [tab, setTab] = useState<TabId>("alumnos")
    const [loginError, setLoginError] = useState("")
    const [logging, setLogging] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem(SIDEBAR_KEY) !== "collapse")
    const [inscripcionesCount, setInscripcionesCount] = useState(0)

    const { config } = useSiteConfig()

    useEffect(() => {
        if (!token) return
        let cancelled = false
        api.listInscripciones(token)
            .then((r) => {
                if (!cancelled) setInscripcionesCount(r.inscripciones.length)
            })
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [token])

    const configIds = Object.keys(config)
    const cursosCount = configIds.filter((id) => id.startsWith("curso-")).length
    const carrerasCount = configIds.filter((id) => id.startsWith("tec-")).length

    const counts: Record<TabId, number> = {
        alumnos: inscripcionesCount,
        cursos: cursosCount,
        carreras: carrerasCount,
    }

    const toggleSidebar = () => {
        setSidebarOpen((open) => {
            localStorage.setItem(SIDEBAR_KEY, open ? "collapse" : "expand")
            return !open
        })
    }

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault()
        setLogging(true)
        setLoginError("")
        try {
            const res = await api.login(password)
            sessionStorage.setItem(TOKEN_KEY, res.token)
            setToken(res.token)
            setShowPassword(false)
        } catch (err) {
            setLoginError(err instanceof Error ? err.message : "No se pudo iniciar sesión")
        } finally {
            setLogging(false)
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem(TOKEN_KEY)
        setToken("")
        setPassword("")
        setShowPassword(false)
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/40 p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-[#4d0706] flex items-center justify-center shrink-0 overflow-hidden">
                                <img src="/icons/escuela.png" alt="Escuela" className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 leading-none">Panel de gestión</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Acceso restringido a la escuela</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setLoginError("")
                                    }}
                                    placeholder="Contraseña"
                                    className="w-full h-14 pl-11 pr-12 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#4d0706] hover:bg-[#4d0706]/5 cursor-pointer"
                                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {loginError && (
                                <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">{loginError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={logging}
                                className="w-full h-14 bg-[#4d0706] text-[#ffcc00] font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-[#4d0706]/20 disabled:opacity-60 cursor-pointer"
                            >
                                {logging ? "Ingresando..." : "Ingresar"}
                            </button>
                        </form>

                        <button onClick={onExit} className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#4d0706] cursor-pointer mx-auto">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Volver al sitio
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const ActiveIcon = tabs[tab].icon

    return (
        <div className="min-h-screen bg-[#fcfaf7]">
            <div className="lg:flex min-h-screen">
                <aside
                    className={`hidden lg:flex flex-col bg-[#4d0706] text-white h-screen sticky top-0 shrink-0 transition-all duration-300 ${
                        sidebarOpen ? "w-64" : "w-[76px]"
                    }`}
                >
                    <div className={`flex items-center gap-3 h-16 border-b border-white/10 ${sidebarOpen ? "px-4" : "px-3"}`}>
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-white/15">
                            <img src="/icons/escuela.png" alt="Escuela" className="w-6 h-6 object-contain" />
                        </div>
                        {sidebarOpen && (
                            <div className="min-w-0 leading-tight flex-1">
                                <p className="text-sm font-black truncate">Obreros del Porvenir</p>
                                <p className="text-xs text-white/60 font-semibold">Panel de gestión</p>
                            </div>
                        )}
                        <button
                            onClick={toggleSidebar}
                            title={sidebarOpen ? "Contraer menú" : "Expandir menú"}
                            className={`flex items-center justify-center w-8 h-8 rounded-lg text-white/70 hover:bg-white/10 hover:text-white cursor-pointer ${
                                sidebarOpen ? "ml-auto" : ""
                            }`}
                        >
                            {sidebarOpen ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
                        </button>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                        {sidebarOpen && (
                            <p className="text-xs font-black uppercase tracking-widest text-white/40 px-3 mb-2">Oferta académica</p>
                        )}
                        {navOrder.map((id) => {
                            const t = tabs[id]
                            const Icon = t.icon
                            const active = tab === id
                            return (
                                <button
                                    key={id}
                                    onClick={() => setTab(id)}
                                    title={sidebarOpen ? undefined : t.label}
                                    className={`flex items-center gap-3 w-full py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                                        active
                                            ? "bg-[#ffcc00] text-[#4d0706] shadow-lg shadow-black/20"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    } ${sidebarOpen ? "px-3" : "justify-center px-0"}`}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    {sidebarOpen && (
                                        <>
                                            <span className="flex-1 text-left truncate">{t.label}</span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                                    active ? "bg-[#4d0706]/10" : "bg-white/10 text-white/80"
                                                }`}
                                            >
                                                {counts[id]}
                                            </span>
                                        </>
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="border-t border-white/10 px-3 py-4">
                        <div
                            className={`flex items-center gap-2 rounded-xl ${sidebarOpen ? "px-3 py-2.5 bg-white/5" : "justify-center"}`}
                            title={sidebarOpen ? undefined : "Sesión admin activa"}
                        >
                            <span className="relative flex w-2.5 h-2.5 shrink-0">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                                <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-green-400" />
                            </span>
                            {sidebarOpen && <p className="text-xs font-bold text-white/70 truncate">Sesión admin activa</p>}
                        </div>
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    <header className="sticky top-0 z-50 bg-[#4d0706] text-white shadow-lg shadow-[#4d0706]/25">
                        <div className="max-w-7xl mx-auto px-4 sm:px-8">
                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-white/15">
                                        <img src="/icons/escuela.png" alt="Escuela" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="text-sm sm:text-lg font-black leading-none truncate">Panel de Gestión</h1>
                                        <p className="hidden md:block text-xs text-white/70 font-medium mt-1 truncate">
                                            Escuela de Capacitación Laboral "Obreros del Porvenir"
                                        </p>
                                        <p className="md:hidden text-xs text-white/60 font-semibold mt-0.5 truncate">Obreros del Porvenir</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    <div className="hidden sm:flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white/10 border border-white/10">
                                        <div className="w-8 h-8 rounded-full bg-[#ffcc00] text-[#4d0706] flex items-center justify-center">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div className="leading-tight">
                                            <p className="text-xs font-black">Administrador</p>
                                            <p className="text-[11px] text-white/60 font-semibold">Sesión activa</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onExit}
                                        title="Ver el sitio"
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white/80 hover:bg-white/10 cursor-pointer"
                                    >
                                        <Eye className="w-4 h-4 shrink-0" />
                                        <span className="hidden sm:inline">Ver el sitio</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        title="Cerrar sesión"
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black bg-[#ffcc00] text-[#4d0706] hover:bg-white cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4 shrink-0" />
                                        <span className="hidden sm:inline">Cerrar sesión</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-28 lg:pb-8">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#4d0706]/5 text-[#4d0706] flex items-center justify-center shrink-0">
                                <ActiveIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 leading-tight">{tabs[tab].label}</h2>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">{tabs[tab].description}</p>
                            </div>
                        </div>

                        <div className="mt-5">
                            {tab === "alumnos" ? <AlumnosPanel token={token} /> : <CursosPanel token={token} section={tab} />}
                        </div>
                    </div>
                </main>
            </div>

            <AdminMobileNav active={tab} counts={counts} onChange={setTab} />
        </div>
    )
}