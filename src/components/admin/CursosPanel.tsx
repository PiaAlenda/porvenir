import { useEffect, useState, type ReactNode } from "react"
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
    Eye,
    Flame,
    GraduationCap,
    Hammer,
    Image,
    Loader2,
    Music,
    Palette,
    Pencil,
    Plus,
    Scissors,
    ShieldCheck,
    Sparkles,
    Sun,
    Trash2,
    Wrench,
    X,
    type LucideIcon,
} from "lucide-react"
import { api, type Alumno, type SiteConfigMap } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import { activeIds, getCantidadTitularesFor, getImageFor, isAvailableFor, useSiteConfig } from "@/siteConfig"
import { clasificarParticipantes, resumenCupo } from "@/lib/titulares"
import CarreraDetalle from "./CarreraDetalle"
import ConfirmDialog from "./ConfirmDialog"
import CursoModal from "./CursoModal"

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

interface CareerSummary {
    total: number
    titulares: number
    suplentes: number
    cupo: number
}

function CardIconButton({
    label,
    tone,
    onClick,
    disabled,
    children,
}: {
    label: string
    tone: string
    onClick: () => void
    disabled: boolean
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={`group relative flex-1 h-11 grid place-items-center rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${tone}`}
        >
            <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[11px] font-bold text-white opacity-0 shadow-md transition-opacity duration-100 delay-100 group-hover:opacity-100 group-focus-visible:opacity-100 z-30"
            >
                {label}
            </span>
            {children}
        </button>
    )
}

function AdminCareerCard({
    careerId,
    config,
    summary,
    loading,
    onView,
    onEdit,
    onDelete,
}: {
    careerId: string
    config: SiteConfigMap
    summary: CareerSummary
    loading: boolean
    onView: () => void
    onEdit: () => void
    onDelete: () => void
}) {
    const title = config[careerId]?.title || CAREER_DATA[careerId]?.title || careerId
    const available = isAvailableFor(careerId, config)
    const src = getImageFor(careerId, config)
    const [imgError, setImgError] = useState(false)
    const fallbackIconName = CAREER_DATA[careerId]?.icon
    const FallbackIcon = (fallbackIconName && CAREER_ICONS[fallbackIconName]) || GraduationCap

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 animate-pulse space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-[52px] h-[52px] rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                        <div className="h-5 bg-gray-100 rounded w-2/3" />
                    </div>
                </div>
                <div className="h-6 bg-gray-100 rounded w-1/2" />
                <div className="h-14 bg-gray-100 rounded w-full" />
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-11 bg-gray-100 rounded-xl" />
                    <div className="flex-1 h-11 bg-gray-100 rounded-xl" />
                    <div className="flex-1 h-11 bg-gray-100 rounded-xl" />
                </div>
            </div>
        )
    }

    const { total, titulares, suplentes } = summary

    return (
        <div className="relative bg-white border border-gray-200 rounded-2xl transition-all duration-200 hover:border-gray-300 hover:shadow-sm p-4 sm:p-5 flex flex-col gap-4 sm:gap-5">
            <div className="flex items-start gap-3">
                <div className="w-[52px] h-[52px] shrink-0 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200/80 flex items-center justify-center">
                    {!src || imgError ? (
                        <div className="w-full h-full bg-[#800000]/5 flex items-center justify-center">
                            <FallbackIcon className="w-5 h-5 text-[#800000]/55" />
                        </div>
                    ) : (
                        <img
                            src={src}
                            alt=""
                            loading="lazy"
                            onError={() => setImgError(true)}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Carrera</p>
                    <h3 className="mt-0.5 text-base sm:text-lg font-black text-gray-900 leading-tight truncate">
                        {title}
                    </h3>
                    {!available && <p className="mt-1 text-xs font-medium text-gray-500">Sin cupo</p>}
                </div>
            </div>

            <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {total} {total === 1 ? "participante" : "participantes"}
            </p>

            <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Titulares</p>
                    <p className="mt-0.5 text-2xl font-black text-[#4d0706] tracking-tight">{titulares}</p>
                </div>
                <div className="w-px h-8 bg-gray-200 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Suplentes</p>
                    <p className="mt-0.5 text-2xl font-black text-amber-600 tracking-tight">{suplentes}</p>
                </div>
            </div>

            <div className="mt-auto flex items-center gap-2">
                <CardIconButton
                    label="Editar información"
                    tone="text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10"
                    onClick={onEdit}
                    disabled={loading}
                >
                    <Pencil className="w-4 h-4" />
                </CardIconButton>
                <CardIconButton
                    label="Ver titulares"
                    tone="text-gray-600 bg-gray-100 hover:bg-gray-200"
                    onClick={onView}
                    disabled={loading}
                >
                    <Eye className="w-4 h-4" />
                </CardIconButton>
                <CardIconButton
                    label="Eliminar carrera"
                    tone="text-red-600 bg-red-50 hover:bg-red-100"
                    onClick={onDelete}
                    disabled={loading}
                >
                    <Trash2 className="w-4 h-4" />
                </CardIconButton>
            </div>
        </div>
    )
}

export default function CursosPanel({ token, section }: Props) {
    const { config, refresh } = useSiteConfig()
    const [savingId, setSavingId] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [imgError, setImgError] = useState<Record<string, boolean>>({})
    const [selected, setSelected] = useState<{ id: string; section: Props["section"] } | null>(null)
    const [deleting, setDeleting] = useState<{ id: string; label: string; section: Props["section"] } | null>(null)
    const [deletingBusy, setDeletingBusy] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    const [pagination, setPagination] = useState<{ section: Props["section"]; page: number }>({ section, page: 0 })
    const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">(() => {
        const w = window.innerWidth
        if (w >= 1024) return "desktop"
        if (w >= 640) return "tablet"
        return "mobile"
    })
    const [alumnos, setAlumnos] = useState<Alumno[] | null>(null)

    useEffect(() => {
        if (section !== "carreras") return
        let active = true
        api.listInscripciones(token)
            .then((res) => {
                if (active) setAlumnos(res.inscripciones)
            })
            .catch(() => {
                if (active) setAlumnos([])
            })
        return () => {
            active = false
        }
    }, [token, section, config])

    useEffect(() => {
        const compute = () => {
            const w = window.innerWidth
            setViewport(w >= 1024 ? "desktop" : w >= 640 ? "tablet" : "mobile")
        }
        window.addEventListener("resize", compute)
        return () => window.removeEventListener("resize", compute)
    }, [])

    const ids = activeIds(config)
    const cursos = ids.filter((id) => id.startsWith("curso-"))
    const carreras = ids.filter((id) => id.startsWith("tec-"))

    const titleOf = (id: string) => config[id]?.title || CAREER_DATA[id]?.title || id

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

    const handleEditCareer = (careerId: string) => {
        setEditingId(careerId)
    }

    const summaryFor = (careerId: string): CareerSummary => {
        const cupo = getCantidadTitularesFor(careerId, config)
        if (alumnos === null) return { total: 0, titulares: 0, suplentes: 0, cupo }
        const participantes = alumnos.filter((a) => a.careerId === careerId)
        const resumen = resumenCupo(clasificarParticipantes(participantes, cupo))
        return { ...resumen, cupo }
    }

    const handleConfigureCareer = (careerId: string) => {
        setSelected({ id: careerId, section: "carreras" })
    }

    /**
     * Elimina un curso o una carrera. El backend lo saca de la config y borra
     * los archivos que se habían subido, así que no hay que hacer limpieza acá.
     * La confirmación va en un popup del panel, no en el `confirm()` del
     * navegador.
     */
    const confirmDelete = async () => {
        if (!deleting) return
        const { id } = deleting
        setDeletingBusy(true)
        setDeleteError("")
        try {
            await api.deleteCurso(token, id)
            // Si se estaba viendo el detalle de esa carrera, el panel queda
            // en la lista: el detalle ya no tiene nada que mostrar.
            setSelected((prev) => (prev?.id === id ? null : prev))
            setEditingId((prev) => (prev === id ? null : prev))
            setDeleting(null)
            await refresh()
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar")
        } finally {
            setDeletingBusy(false)
        }
    }

    const askDelete = (id: string, section: Props["section"]) => {
        setDeleteError("")
        setDeleting({ id, label: titleOf(id), section })
    }

    const handleDeleteCareer = (careerId: string) => askDelete(careerId, "carreras")
    const handleDeleteCourse = (courseId: string) => askDelete(courseId, "cursos")

    if (selected && selected.section === section) {
        return <CarreraDetalle key={selected.id} token={token} careerId={selected.id} onBack={() => setSelected(null)} />
    }

    const renderCourseCard = (id: string) => {
        const title = titleOf(id)
        const available = isAvailableFor(id, config)
        const saving = savingId === id
        const src = getImageFor(id, config)
        const showFallback = !src || imgError[id]
        const FallbackIcon = iconFor(id)

        return (
            <div
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all flex flex-col ${available ? "border-gray-200 hover:border-gray-300" : "border-gray-300 opacity-85"
                    }`}
                key={id}
            >
                <div className="p-3">
                    <div
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden ${section === "carreras" ? "bg-[#800000]/5 flex items-center justify-center" : "bg-gray-50"
                            } ${available
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
                                className={`w-full h-full ${section === "carreras" ? "object-contain p-3" : "object-cover"
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
                        className={`inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-colors cursor-pointer disabled:opacity-50 ${available
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
                        onClick={() => setEditingId(id)}
                        title="Editar curso o carrera"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 transition-colors cursor-pointer"
                    >
                        <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        Editar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteCourse(id)}
                        title="Eliminar curso"
                        disabled={saving}
                        className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 shrink-0 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                </div>
            </div>
        )
    }

    const showIds = section === "cursos" ? cursos : carreras
    const perPage = viewport === "desktop" ? 9 : viewport === "tablet" ? 6 : 3
    const totalPages = Math.max(1, Math.ceil(showIds.length / perPage))
    const safePage = Math.min(pagination.section === section ? pagination.page : 0, totalPages - 1)
    const goToPage = (p: number) => setPagination({ section, page: p })
    const pageIds = showIds.slice(safePage * perPage, safePage * perPage + perPage)
    const availableCount = showIds.filter((id) => isAvailableFor(id, config)).length
    const noCupoCount = showIds.length - availableCount

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100">
                            <Check className="w-3 h-3" />
                            {availableCount} disp.
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-red-600 bg-red-50 ring-1 ring-red-100">
                            <X className="w-3 h-3" />
                            {noCupoCount} sin cupo
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] shadow-sm transition-colors cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    {section === "cursos" ? "Nuevo curso" : "Nueva carrera"}
                </button>
            </div>

            {showIds.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-14 text-center">
                    <p className="text-sm font-bold text-gray-500">No hay {section} cargadas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pageIds.map((id) =>
                        section === "carreras" ? (
                            <AdminCareerCard
                                key={id}
                                careerId={id}
                                config={config}
                                summary={summaryFor(id)}
                                loading={alumnos === null}
                                onView={() => handleConfigureCareer(id)}
                                onEdit={() => handleEditCareer(id)}
                                onDelete={() => handleDeleteCareer(id)}
                            />
                        ) : (
                            renderCourseCard(id)
                        )
                    )}
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
                            className={`w-9 h-9 grid place-items-center rounded-xl text-sm font-black cursor-pointer transition-colors ${i === safePage
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

            <button
                type="button"
                onClick={() => setCreating(true)}
                aria-label={section === "cursos" ? "Agregar nuevo curso" : "Agregar nueva carrera"}
                title={section === "cursos" ? "Nuevo curso" : "Nueva carrera"}
                className="sm:hidden fixed right-4 bottom-24 z-[95] w-14 h-14 rounded-full bg-[#4d0706] text-[#ffcc00] shadow-lg shadow-[#4d0706]/40 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
                <Plus className="w-7 h-7" />
            </button>

            {(creating || (editingId && config[editingId])) && (
                <CursoModal
                    token={token}
                    section={section}
                    existingIds={ids}
                    curso={editingId && config[editingId] ? { id: editingId, data: config[editingId] } : undefined}
                    onClose={() => {
                        setCreating(false)
                        setEditingId(null)
                    }}
                    onSaved={() => {
                        const wasCreate = creating
                        setCreating(false)
                        setEditingId(null)
                        refresh()
                        if (wasCreate) setPagination({ section, page: Number.MAX_SAFE_INTEGER })
                    }}
                />
            )}

            {deleting && (
                <ConfirmDialog
                    title={`Eliminar ${deleting.section === "cursos" ? "curso" : "carrera"}`}
                    message={
                        <>
                            <span className="font-black text-gray-900">{deleting.label}</span> se va a quitar del
                            sitio y de la lista de inscripción. Esta acción no se puede deshacer.
                        </>
                    }
                    busy={deletingBusy}
                    error={deleteError}
                    onConfirm={confirmDelete}
                    onCancel={() => {
                        if (!deletingBusy) setDeleting(null)
                    }}
                />
            )}
        </div>
    )
}