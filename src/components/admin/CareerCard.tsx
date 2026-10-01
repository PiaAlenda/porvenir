import { MoreHorizontal, ChevronRight, Edit, Settings, Trash2 } from "lucide-react"
import { useState, useRef, useEffect, type RefObject } from "react"
import { api } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import { getCantidadTitularesFor, isAvailableFor } from "@/siteConfig"
import { clasificarParticipantes, resumenCupo } from "@/lib/titulares"
import type { SiteConfigMap } from "@/api"

interface CareerCardProps {
    careerId: string
    token: string
    config: SiteConfigMap
    onView: (careerId: string) => void
    onEdit: (careerId: string) => void
    onConfigure: (careerId: string) => void
    onDelete: (careerId: string) => void
}

interface ParticipantSummary {
    total: number
    titulares: number
    suplentes: number
    cupo: number
}

function useParticipantSummary(careerId: string, token: string, config: SiteConfigMap) {
    const [summary, setSummary] = useState<ParticipantSummary>({ total: 0, titulares: 0, suplentes: 0, cupo: 0 })
    const [loading, setLoading] = useState(true)

    const fetchSummary = async () => {
        try {
            const res = await api.listInscripciones(token)
            const participantes = res.inscripciones.filter((a) => a.careerId === careerId)
            const cupo = getCantidadTitularesFor(careerId, config)
            const clasificados = clasificarParticipantes(participantes, cupo)
            const resumen = resumenCupo(clasificados)
            setSummary({ ...resumen, cupo })
        } catch {
            const cupo = getCantidadTitularesFor(careerId, config)
            setSummary({ total: 0, titulares: 0, suplentes: 0, cupo })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSummary()
    }, [careerId, token, config])

    return { summary, loading }
}

function DropdownMenu({
    triggerRef,
    open,
    onOpenChange,
    onEdit,
    onConfigure,
    onDelete,
    disabled,
}: {
    triggerRef: RefObject<HTMLButtonElement | null>
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: () => void
    onConfigure: () => void
    onDelete: () => void
    disabled: boolean
}) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                onOpenChange(false)
            }
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open, onOpenChange, triggerRef])

    if (!open) return null

    return (
        <div ref={menuRef} className="absolute right-0 top-full mt-1 z-20 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg min-w-[160px] py-1 overflow-hidden">
                <button
                    onClick={() => { onEdit(); onOpenChange(false); }}
                    disabled={disabled}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                    <Edit className="w-4 h-4 text-gray-400" />
                    Editar carrera
                </button>
                <button
                    onClick={() => { onConfigure(); onOpenChange(false); }}
                    disabled={disabled}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Configurar cupo
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                    onClick={() => { onDelete(); onOpenChange(false); }}
                    disabled={disabled}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                </button>
            </div>
        </div>
    )
}

export default function CareerCard({
    careerId,
    token,
    config,
    onView,
    onEdit,
    onConfigure,
    onDelete,
}: CareerCardProps) {
    const careerMeta = CAREER_DATA[careerId]
    const title = config[careerId]?.title || careerMeta?.title || careerId
    const available = isAvailableFor(careerId, config)
    const cupo = getCantidadTitularesFor(careerId, config)

    const { summary, loading } = useParticipantSummary(careerId, token, config)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuTriggerRef = useRef<HTMLButtonElement>(null)

    const handleView = () => onView(careerId)
    const handleEdit = () => { setMenuOpen(false); onEdit(careerId) }
    const handleConfigure = () => { setMenuOpen(false); onConfigure(careerId) }
    const handleDelete = () => { setMenuOpen(false); onDelete(careerId) }

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse space-y-4">
                <div className="h-6 bg-gray-100 rounded w-3/4" />
                <div className="h-8 bg-gray-100 rounded w-1/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-10 bg-gray-100 rounded w-full" />
            </div>
        )
    }

    const { total, titulares, suplentes } = summary

    return (
        <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
            <div className="p-5 space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Carrera</p>
                        <h3 className="mt-1 text-lg font-black text-gray-900 leading-tight truncate">{title}</h3>
                        {!available && (
                            <p className="mt-1 text-xs font-medium text-gray-500">Sin cupo</p>
                        )}
                    </div>
                    <div className="relative shrink-0">
                        <button
                            ref={menuTriggerRef}
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="w-8 h-8 grid place-items-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            aria-label="Más opciones"
                            aria-expanded={menuOpen}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        <DropdownMenu
                            triggerRef={menuTriggerRef}
                            open={menuOpen}
                            onOpenChange={setMenuOpen}
                            onEdit={handleEdit}
                            onConfigure={handleConfigure}
                            onDelete={handleDelete}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="pt-1">
                    <p className="text-2xl font-black text-gray-900 tracking-tight">
                        {total} {total === 1 ? "participante" : "participantes"}
                    </p>
                </div>

                <div className="flex items-center gap-4 pt-2">
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

                {cupo > 0 && (
                    <p className="text-xs font-medium text-gray-500 pt-1 border-t border-gray-100">
                        Cupo de titulares: {cupo}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleView}
                    disabled={loading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 hover:text-[#4d0706] transition-colors cursor-pointer disabled:opacity-50"
                >
                    Ver carrera
                    <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
            </div>
        </div>
    )
}