import { useRef, useState, type ChangeEvent } from "react"
import { Check, Loader2, Upload, X } from "lucide-react"
import { api } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import { getImageFor, isAvailableFor, useSiteConfig } from "@/siteConfig"

interface Props {
    token: string
    section: "cursos" | "carreras"
}

export default function CursosPanel({ token, section }: Props) {
    const { config, refresh } = useSiteConfig()
    const [savingId, setSavingId] = useState<string | null>(null)
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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

        return (
            <div
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all flex flex-col ${
                    available ? "border-gray-200" : "border-gray-300 opacity-80"
                }`}
                key={id}
            >
                <div className="relative aspect-[1090/1350] bg-gray-100">
                    <img
                        src={getImageFor(id, config)}
                        alt={title}
                        className={`w-full h-full object-cover ${available ? "" : "grayscale"}`}
                        onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                    />
                    {!available && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="px-4 py-2 rounded-full bg-gray-800 text-white text-xs font-black uppercase tracking-widest">
                                Sin cupo
                            </span>
                        </div>
                    )}
                    {saving && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                </div>

                <div className="p-3 sm:p-4 space-y-3 flex flex-col">
                    <h4 className="text-sm font-black text-gray-900 leading-tight line-clamp-2">{title}</h4>

                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500" id={`avail-${id}`}>Disponible</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={available}
                            aria-labelledby={`avail-${id}`}
                            onClick={() => toggleAvailable(id, available)}
                            disabled={saving}
                            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${available ? "bg-green-500" : "bg-gray-300"}`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${available ? "translate-x-5" : ""}`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                        <button
                            onClick={() => fileInputRefs.current[id]?.click()}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer"
                        >
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Subir imagen</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => removeImage(id)}
                            className="flex items-center justify-center px-2.5 py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                            title="Volver a la imagen original"
                        >
                            <X className="w-3.5 h-3.5" />
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
            </div>
        )
    }

    const showIds = section === "cursos" ? cursos : carreras
    const availableCount = showIds.filter((id) => isAvailableFor(id, config)).length
    const noCupoCount = showIds.length - availableCount

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-green-700 bg-green-50">
                    <Check className="w-3.5 h-3.5" />
                    {availableCount} disponibles
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-gray-500 bg-gray-100">
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
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {showIds.map(renderCard)}
                </div>
            )}
        </div>
    )
}