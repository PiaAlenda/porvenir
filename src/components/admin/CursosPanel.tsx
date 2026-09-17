import { useEffect, useRef, useState, type ChangeEvent } from "react"
import {
    Briefcase,
    Building2,
    Calculator,
    Check,
    ChefHat,
    ChevronLeft,
    ChevronRight,
    Cog,
    Cpu,
    Flame,
    GraduationCap,
    Hammer,
    Image,
    Loader2,
    Music,
    Palette,
    Scissors,
    ShieldCheck,
    Sparkles,
    Sun,
    Upload,
    Wrench,
    X,
    type LucideIcon,
} from "lucide-react"
import { api } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import { getImageFor, isAvailableFor, useSiteConfig } from "@/siteConfig"

interface Props {
    token: string
    section: "cursos" | "carreras"
}

const CAREER_ICONS: Record<string, LucideIcon> = {
    Briefcase,
    Building2,
    Calculator,
    ChefHat,
    Cog,
    Cpu,
    Flame,
    Hammer,
    Image,
    Music,
    Palette,
    Scissors,
    ShieldCheck,
    Sparkles,
    Sun,
    Wrench,
}

const iconFor = (id: string): LucideIcon => {
    const name = CAREER_DATA[id]?.icon
    return (name && CAREER_ICONS[name]) || GraduationCap
}

export default function CursosPanel({ token, section }: Props) {
    const { config, refresh } = useSiteConfig()
    const [savingId, setSavingId] = useState<string | null>(null)
    const [imgError, setImgError] = useState<Record<string, boolean>>({})
    const [pagination, setPagination] = useState<{ section: Props["section"]; page: number }>({ section, page: 0 })
    const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">(() => {
        const w = window.innerWidth
        if (w >= 1024) return "desktop"
        if (w >= 640) return "tablet"
        return "mobile"
    })
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

    useEffect(() => {
        const compute = () => {
            const w = window.innerWidth
            setViewport(w >= 1024 ? "desktop" : w >= 640 ? "tablet" : "mobile")
        }
        window.addEventListener("resize", compute)
        return () => window.removeEventListener("resize", compute)
    }, [])

    const ids = Object.keys(config)
    const cursos = ids.filter((id) => id.startsWith("curso-"))
    const carreras = ids.filter((id) => id.startsWith("tec-"))

    const titleOf = (id: string) => (CAREER_DATA[id] ? CAREER_DATA[id].title : id)

    const save = async (id: string, form: FormData) => {
        setSavingId(id)
        try {
            await api.updateCurso(token, id, form)
            refresh()
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error al guardar")
        } finally {
            setSavingId(null)
        }
    }

    const toggleAvailable = (id: string, current: boolean) => {
        const form = new FormData()
        form.append("available", String(!current))
        save(id, form)
    }

    const onPickImage = (id: string, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const form = new FormData()
        form.append("image", file)
        form.append("available", String(isAvailableFor(id, config)))
        save(id, form)
        e.target.value = ""
    }

    const removeImage = (id: string) => {
        const form = new FormData()
        form.append("removeImage", "true")
        form.append("available", String(isAvailableFor(id, config)))
        save(id, form)
    }

    const renderCard = (id: string) => {
        const title = titleOf(id)
        const available = isAvailableFor(id, config)
        const saving = savingId === id
        const src = getImageFor(id, config)
        const showFallback = !src || imgError[id]
        const FallbackIcon = iconFor(id)

        return (
            <div
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all flex flex-col ${
                    available ? "border-gray-200 hover:border-gray-300" : "border-gray-300 opacity-85"
                }`}
                key={id}
            >
                <div className="p-3">
                    <div
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden ${
                            section === "carreras" ? "bg-[#800000]/5 flex items-center justify-center" : "bg-gray-50"
                        } ${
                            available
                                ? "ring-1 ring-gray-100"
                                : "ring-1 ring-gray-100 grayscale opacity-80"
                        }`}
                    >
                        {showFallback ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full bg-[#800000]/5 ring-1 ring-[#800000]/10 flex items-center justify-center">
                                    <FallbackIcon className="w-6 h-6 text-[#800000]/60" />
                                </div>
                            </div>
                        ) : (
                            <img
                                src={src}
                                alt={title}
                                className={`w-full h-full ${
                                    section === "carreras" ? "object-contain p-3" : "object-cover"
                                }`}
                                onError={() => setImgError((prev) => ({ ...prev, [id]: true }))}
                            />
                        )}
                        {saving && (
                            <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-3 pb-3 flex flex-col gap-2.5">
                    <h4 className="text-sm font-bold text-[#1F2937] leading-tight line-clamp-2">{title}</h4>

                    <button
                        type="button"
                        role="switch"
                        aria-checked={available}
                        onClick={() => toggleAvailable(id, available)}
                        disabled={saving}
                        title={available ? "Marcar sin cupo" : "Marcar disponible"}
                        className={`inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-colors cursor-pointer disabled:opacity-50 ${
                            available
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-600 ring-red-200 hover:bg-red-100"
                        }`}
                    >
                        {available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {available ? "Disponible" : "Sin Cupo"}
                    </button>
                </div>

                <div className="mt-auto flex items-center gap-1.5 sm:gap-2 border-t border-gray-100 p-2.5 sm:p-3">
                    <button
                        type="button"
                        onClick={() => fileInputRefs.current[id]?.click()}
                        title="Subir una imagen"
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 transition-colors cursor-pointer"
                    >
                        <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">Subir imagen</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => removeImage(id)}
                        title="Volver a la imagen original"
                        className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 shrink-0 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <input
                        ref={(el) => {
                            fileInputRefs.current[id] = el
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickImage(id, e)}
                    />
                </div>
            </div>
        )
    }

    const showIds = section === "cursos" ? cursos : carreras
    const perPage = viewport === "desktop" ? 10 : viewport === "tablet" ? 6 : 4
    const totalPages = Math.max(1, Math.ceil(showIds.length / perPage))
    const safePage = Math.min(pagination.section === section ? pagination.page : 0, totalPages - 1)
    const goToPage = (p: number) => setPagination({ section, page: p })
    const pageIds = showIds.slice(safePage * perPage, safePage * perPage + perPage)
    const availableCount = showIds.filter((id) => isAvailableFor(id, config)).length
    const noCupoCount = showIds.length - availableCount

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100">
                    <Check className="w-3.5 h-3.5" />
                    {availableCount} disponibles
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-600 bg-red-50 ring-1 ring-red-100">
                    <X className="w-3.5 h-3.5" />
                    {noCupoCount} sin cupo
                </span>
                <span className="hidden sm:inline ml-auto text-xs text-gray-400 font-medium">
                    Subí una imagen o marcá sin cupo. Los cambios se ven al instante.
                </span>
            </div>

            {showIds.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-14 text-center">
                    <p className="text-sm font-bold text-gray-500">No hay {section} cargadas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {pageIds.map(renderCard)}
                </div>
            )}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                    <button
                        type="button"
                        onClick={() => goToPage(safePage - 1)}
                        disabled={safePage === 0}
                        title="Anterior"
                        className="w-9 h-9 grid place-items-center rounded-xl text-[#4d0706] bg-white border border-gray-200 hover:bg-[#4d0706]/5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => goToPage(i)}
                            aria-current={i === safePage ? "page" : undefined}
                            className={`w-9 h-9 grid place-items-center rounded-xl text-sm font-black cursor-pointer transition-colors ${
                                i === safePage
                                    ? "bg-[#4d0706] text-[#ffcc00]"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-[#4d0706]/5"
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => goToPage(safePage + 1)}
                        disabled={safePage >= totalPages - 1}
                        title="Siguiente"
                        className="w-9 h-9 grid place-items-center rounded-xl text-[#4d0706] bg-white border border-gray-200 hover:bg-[#4d0706]/5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}