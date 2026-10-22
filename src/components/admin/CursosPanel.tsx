import { useEffect, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { api, type Alumno } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import { activeIds, getCantidadTitularesFor, isAvailableFor, useSiteConfig } from "@/siteConfig"
import { clasificarParticipantes, resumenCupo } from "@/lib/titulares"
import AdminEntityCard, { type AdminEntitySummary } from "./AdminEntityCard"
import CarreraDetalle from "./CarreraDetalle"
import ConfirmDialog from "./ConfirmDialog"
import CursoModal from "./CursoModal"

interface Props {
    token: string
    section: "cursos" | "carreras"
}

export default function CursosPanel({ token, section }: Props) {
    const { config, refresh } = useSiteConfig()
    const [savingId, setSavingId] = useState<string | null>(null)
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
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

    // Los cupos se muestran igual en carreras y cursos: se cargan todos los inscriptos.
    useEffect(() => {
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
    }, [token, config])

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

    const openDetail = (id: string) => setSelected({ id, section })

    const summaryFor = (careerId: string): AdminEntitySummary => {
        const cupo = getCantidadTitularesFor(careerId, config)
        if (alumnos === null) return { total: 0, titulares: 0, suplentes: 0, cupo }
        const participantes = alumnos.filter((a) => a.careerId === careerId)
        const resumen = resumenCupo(clasificarParticipantes(participantes, cupo))
        return { ...resumen, cupo }
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
            // Si se estaba viendo el detalle de ese ítem, el panel queda en la
            // lista: el detalle ya no tiene nada que mostrar.
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

    if (selected && selected.section === section) {
        return (
            <CarreraDetalle
                key={selected.id}
                token={token}
                careerId={selected.id}
                section={selected.section}
                onBack={() => setSelected(null)}
            />
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
                <p className="py-10 text-center text-base sm:text-lg font-bold text-gray-500">
                    {section === "cursos" ? "No hay cursos cargados." : "No hay carreras cargadas."}
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pageIds.map((id) => (
                        <AdminEntityCard
                            key={id}
                            id={id}
                            kind={section === "carreras" ? "carrera" : "curso"}
                            config={config}
                            summary={summaryFor(id)}
                            loading={alumnos === null}
                            saving={savingId === id}
                            onEdit={() => setEditingId(id)}
                            onView={() => openDetail(id)}
                            onDelete={() => askDelete(id, section)}
                            onToggleAvailable={() => toggleAvailable(id, isAvailableFor(id, config))}
                        />
                    ))}
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