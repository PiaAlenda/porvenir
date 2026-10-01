import { useState, useEffect } from "react"
import { Briefcase, ChevronLeft, ChevronRight, GraduationCap, LogOut, Settings, UserRound, Users } from "lucide-react"
import { api } from "@/api"
import AlumnosPanel from "@/components/admin/AlumnosPanel"
import AdminMobileNav from "@/components/admin/AdminMobileNav"
import CursosPanel from "@/components/admin/CursosPanel"
import AjustesPanel from "@/components/admin/AjustesPanel"
import { activeIds, useSiteConfig } from "@/siteConfig"

const PROFILE_IMAGE_KEY = "obreros_admin_profile_image"

interface AdminProps {
    onExit: () => void
}

const TOKEN_KEY = "obreros_admin_token"

type TabId = "alumnos" | "cursos" | "carreras" | "ajustes"

const tabs = {
    alumnos: {
        label: "Inscripciones",
        icon: Users,
        description: "Inscriptos y gestión de contratos de la escuela.",
    },
    cursos: {
        label: "Cursos",
        icon: GraduationCap,
        description: "Gestioná cupos e información de los cursos.",
    },
    carreras: {
        label: "Carreras",
        icon: Briefcase,
        description: "Gestioná cupos e información de las carreras.",
    },
    ajustes: {
        label: "Ajustes",
        icon: Settings,
        description: "Cambio de contraseña de la cuenta de administración.",
    },
} as const

const navOrder: TabId[] = ["alumnos", "cursos", "carreras"]

export default function Admin({ onExit }: AdminProps) {
    const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "")
    const [tab, setTab] = useState<TabId>("alumnos")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [profileOpen, setProfileOpen] = useState(false)
    const [inscripcionesCount, setInscripcionesCount] = useState(0)
    const [profileImage, setProfileImage] = useState<string | null>(null)

    const { config } = useSiteConfig()

    useEffect(() => {
        const saved = localStorage.getItem(PROFILE_IMAGE_KEY)
        if (saved) setProfileImage(saved)
    }, [])

    useEffect(() => {
        if (!token) return
        let cancelled = false
        api.listInscripciones(token)
            .then((r) => {
                if (!cancelled) setInscripcionesCount(r.inscripciones.length)
            })
            .catch(() => { })
        return () => {
            cancelled = true
        }
    }, [token])

    const configIds = activeIds(config)
    const cursosCount = configIds.filter((id) => id.startsWith("curso-")).length
    const carrerasCount = configIds.filter((id) => id.startsWith("tec-")).length

    const counts: Record<TabId, number> = {
        alumnos: inscripcionesCount,
        cursos: cursosCount,
        carreras: carrerasCount,
        ajustes: 0,
    }

    const handleLogout = () => {
        sessionStorage.removeItem(TOKEN_KEY)
        setToken("")
        onExit()
    }

    const toggleSidebar = () => {
        setSidebarOpen((open) => !open)
    }

    if (!token) return null

    const ActiveIcon = tabs[tab].icon

    return (
        <div className="min-h-screen bg-[#fcfaf7]">
            <div className="lg:flex min-h-screen">
                <aside className={`hidden lg:flex flex-col bg-[#4d0706] text-white h-screen sticky top-0 shrink-0 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}>
                    <div className="flex items-center gap-3 h-16 border-b border-white/10 px-3">
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
                            className={`flex items-center justify-center w-8 h-8 rounded-lg text-white/70 hover:bg-white/10 hover:text-white cursor-pointer ${sidebarOpen ? "ml-auto" : "ml-auto"}`}
                        >
                            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>

                    <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto">
                        {navOrder.map((id) => {
                            const t = tabs[id]
                            const Icon = t.icon
                            const active = tab === id
                            return (
                                <button
                                    key={id}
                                    onClick={() => setTab(id)}
                                    title={sidebarOpen ? undefined : t.label}
                                    className={`flex items-center gap-3 w-full py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer ${active
                                        ? "bg-[#ffcc00] text-[#4d0706] shadow-lg shadow-black/20"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                        } ${sidebarOpen ? "px-3" : "justify-center px-0"}`}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    {sidebarOpen && (
                                        <>
                                            <span className="flex-1 text-left truncate">{t.label}</span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-black ${active ? "bg-[#4d0706]/10" : "bg-white/10 text-white/80"
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

                    <div className="border-t border-white/10 px-2 py-4">
                        <button
                            onClick={handleLogout}
                            title="Cerrar sesión"
                            className={`flex items-center gap-3 w-full py-2.5 rounded-xl text-sm font-bold text-white/70 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer ${sidebarOpen ? "px-3" : "justify-center px-0"}`}
                        >
                            <LogOut className="w-5 h-5 shrink-0" />
                            {sidebarOpen && <span className="flex-1 text-left truncate">Cerrar sesión</span>}
                        </button>
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    <header className="sticky top-0 z-50 bg-[#4d0706] text-white shadow-lg shadow-[#4d0706]/25">
                        <div className="max-w-7xl mx-auto px-4 sm:px-8">
                            <div className="flex items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <h1 className="text-sm sm:text-lg font-black leading-none truncate">Panel de Gestión</h1>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    <div className="relative">
                                        <button
                                            onClick={() => setProfileOpen((v) => !v)}
                                            title="Perfil"
                                            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all overflow-hidden ${profileOpen || tab === "ajustes"
                                                ? "bg-[#ffcc00] text-[#4d0706] ring-2 ring-[#ffcc00] ring-offset-2 ring-offset-[#4d0706]"
                                                : "bg-[#ffcc00] text-[#4d0706] hover:bg-white"
                                                }`}
                                        >
                                            {profileImage ? (
                                                <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserRound className="w-5 h-5" />
                                            )}
                                        </button>

                                        {profileOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                                                <div className="absolute right-0 top-12 z-50 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-black/10 overflow-hidden">
                                                    <button
                                                        onClick={() => {
                                                            setProfileOpen(false)
                                                            setTab("ajustes")
                                                        }}
                                                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        <Settings className="w-4 h-4 shrink-0 text-gray-400" />
                                                        Perfil
                                                    </button>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer border-t border-gray-100"
                                                    >
                                                        <LogOut className="w-4 h-4 shrink-0" />
                                                        Cerrar sesión
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
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
                            {tab === "alumnos" ? (
                                <AlumnosPanel token={token} />
                            ) : tab === "ajustes" ? (
                                <AjustesPanel token={token} />
                            ) : (
                                <CursosPanel token={token} section={tab} />
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <AdminMobileNav active={tab} counts={counts} onChange={setTab} />
        </div>
    )
}