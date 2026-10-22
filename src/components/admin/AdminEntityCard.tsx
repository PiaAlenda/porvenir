import { useState, type ReactNode } from "react"
import {
    Briefcase,
    Building2,
    Calculator,
    Check,
    ChefHat,
    Cog,
    Cpu,
    Eye,
    Flame,
    GraduationCap,
    Hammer,
    Image as ImageIcon,
    Music,
    Palette,
    Pencil,
    Scissors,
    ShieldCheck,
    Sparkles,
    Sun,
    Trash2,
    Wrench,
    X,
} from "lucide-react"
import type { SiteConfigMap } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import { getImageFor, isAvailableFor } from "@/siteConfig"

const iconClass = "w-5 h-5 text-[#800000]/55"

/* Elementos ya armados: así no se crea un componente nuevo en cada render. */
const CAREER_ICONS: Record<string, ReactNode> = {
    Briefcase: <Briefcase className={iconClass} />,
    Building2: <Building2 className={iconClass} />,
    Calculator: <Calculator className={iconClass} />,
    ChefHat: <ChefHat className={iconClass} />,
    Cog: <Cog className={iconClass} />,
    Cpu: <Cpu className={iconClass} />,
    Flame: <Flame className={iconClass} />,
    Hammer: <Hammer className={iconClass} />,
    Image: <ImageIcon className={iconClass} />,
    Music: <Music className={iconClass} />,
    Palette: <Palette className={iconClass} />,
    Scissors: <Scissors className={iconClass} />,
    ShieldCheck: <ShieldCheck className={iconClass} />,
    Sparkles: <Sparkles className={iconClass} />,
    Sun: <Sun className={iconClass} />,
    Wrench: <Wrench className={iconClass} />,
}

const iconFor = (id: string, config: SiteConfigMap): ReactNode => {
    const name = config[id]?.icon || CAREER_DATA[id]?.icon
    return (name && CAREER_ICONS[name]) || <GraduationCap className={iconClass} />
}

export interface AdminEntitySummary {
    total: number
    titulares: number
    suplentes: number
    cupo: number
}

interface Props {
    id: string
    /** Cambia solo las etiquetas: la card es la misma para carreras y cursos. */
    kind: "carrera" | "curso"
    config: SiteConfigMap
    summary: AdminEntitySummary
    loading: boolean
    saving: boolean
    onEdit: () => void
    onView: () => void
    onDelete: () => void
    onToggleAvailable: () => void
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

export default function AdminEntityCard({
    id,
    kind,
    config,
    summary,
    loading,
    saving,
    onEdit,
    onView,
    onDelete,
    onToggleAvailable,
}: Props) {
    const title = config[id]?.title || CAREER_DATA[id]?.title || id
    const available = isAvailableFor(id, config)
    const src = getImageFor(id, config)
    const [imgError, setImgError] = useState(false)
    const kindLabel = kind === "carrera" ? "Carrera" : "Curso"

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

    const { total, titulares, suplentes, cupo } = summary

    return (
        <div className="relative bg-white border border-gray-200 rounded-2xl transition-all duration-200 hover:border-gray-300 hover:shadow-sm p-4 sm:p-5 flex flex-col gap-4 sm:gap-5">
            <div className="flex items-start gap-3">
                <div className="w-[52px] h-[52px] shrink-0 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200/80 flex items-center justify-center">
                    {!src || imgError ? (
                        <div className="w-full h-full bg-[#800000]/5 flex items-center justify-center">
                            {iconFor(id, config)}
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
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">{kindLabel}</p>
                    <h3 className="mt-0.5 text-base sm:text-lg font-black text-gray-900 leading-tight truncate">
                        {title}
                    </h3>
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

            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-gray-400">
                    Cupo de titulares: <span className="text-gray-700">{cupo > 0 ? cupo : "sin configurar"}</span>
                </p>
                <button
                    type="button"
                    role="switch"
                    aria-checked={available}
                    onClick={onToggleAvailable}
                    disabled={saving}
                    title={available ? "Marcar sin cupo" : "Marcar disponible"}
                    className={`inline-flex shrink-0 items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-colors cursor-pointer disabled:opacity-50 ${
                        available
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-600 ring-red-200 hover:bg-red-100"
                    }`}
                >
                    {available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {available ? "Disponible" : "Sin cupo"}
                </button>
            </div>

            <div className="mt-auto flex items-center gap-2">
                <CardIconButton
                    label="Editar información"
                    tone="text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10"
                    onClick={onEdit}
                    disabled={saving}
                >
                    <Pencil className="w-4 h-4" />
                </CardIconButton>
                <CardIconButton
                    label="Ver titulares y suplentes"
                    tone="text-gray-600 bg-gray-100 hover:bg-gray-200"
                    onClick={onView}
                    disabled={saving}
                >
                    <Eye className="w-4 h-4" />
                </CardIconButton>
                <CardIconButton
                    label={`Eliminar ${kind}`}
                    tone="text-red-600 bg-red-50 hover:bg-red-100"
                    onClick={onDelete}
                    disabled={saving}
                >
                    <Trash2 className="w-4 h-4" />
                </CardIconButton>
            </div>
        </div>
    )
}
