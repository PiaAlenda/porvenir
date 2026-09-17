import { Briefcase, GraduationCap, Settings, Users } from "lucide-react"

export type AdminTabId = "alumnos" | "cursos" | "carreras" | "ajustes"

interface Props {
    active: AdminTabId
    counts: Record<AdminTabId, number>
    onChange: (id: AdminTabId) => void
}

const items: { id: AdminTabId; label: string; icon: typeof Users }[] = [
    { id: "alumnos", label: "Inscripciones", icon: Users },
    { id: "cursos", label: "Cursos", icon: GraduationCap },
    { id: "carreras", label: "Carreras", icon: Briefcase },
    { id: "ajustes", label: "Ajustes", icon: Settings },
]

export default function AdminMobileNav({ active, counts, onChange }: Props) {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-4">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive = active === item.id
                    const count = counts[item.id]
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={`relative flex flex-col items-center justify-center gap-1 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] cursor-pointer transition-colors ${
                                isActive ? "text-[#4d0706]" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <span className="relative flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                                {count > 0 && (
                                    <span
                                        className={`absolute -top-1.5 -right-2 px-1 py-px rounded-full text-[10px] font-black leading-tight ${
                                            isActive ? "bg-[#4d0706] text-[#ffcc00]" : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </span>
                            <span className={`text-xs leading-none ${isActive ? "font-black" : "font-bold"}`}>{item.label}</span>
                            {isActive && <span className="absolute top-0 h-0.5 w-10 rounded-b-full bg-[#4d0706]" />}
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}