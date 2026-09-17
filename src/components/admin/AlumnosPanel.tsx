import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CalendarDays, FileText, FileSpreadsheet, Mail, MoreVertical, Pencil, Phone, Trash2, RefreshCw, Loader2, Users, Search, GraduationCap, X } from "lucide-react"
import { api, type Alumno } from "@/api"
import AlumnoEditModal from "./AlumnoEditModal"
import { downloadContractPdf } from "@/pdf/downloadContract"

interface Props {
    token: string
}

type StatId = "total" | "mostrando" | "sinAsignar"

export default function AlumnosPanel({ token }: Props) {
    const [alumnos, setAlumnos] = useState<Alumno[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [editing, setEditing] = useState<Alumno | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<Alumno | null>(null)
    const [search, setSearch] = useState("")
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [expandedStat, setExpandedStat] = useState<StatId | null>(null)
    const [detailAlumno, setDetailAlumno] = useState<Alumno | null>(null)
    const [menuOpen, setMenuOpen] = useState<string | null>(null)
    const actionsRefs = useRef<Record<string, HTMLDivElement | null>>({})

    useEffect(() => {
        if (!menuOpen) return
        const onClick = (e: MouseEvent) => {
            const target = e.target as Node
            const el = actionsRefs.current[menuOpen]
            if (el && !el.contains(target)) setMenuOpen(null)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(null)
        }
        document.addEventListener("click", onClick)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("click", onClick)
            document.removeEventListener("keydown", onKey)
        }
    }, [menuOpen])

    useEffect(() => {
        if (!detailAlumno) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setDetailAlumno(null)
        }
        document.addEventListener("keydown", onKey)
        return () => document.removeEventListener("keydown", onKey)
    }, [detailAlumno])

    const load = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const res = await api.listInscripciones(token)
            setAlumnos(res.inscripciones)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar las inscripciones")
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        let cancelled = false
        api.listInscripciones(token)
            .then((res) => {
                if (!cancelled) setAlumnos(res.inscripciones)
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar las inscripciones")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [token])

    const handleDelete = async () => {
        if (!confirmDelete) return
        try {
            await api.deleteInscripcion(token, confirmDelete.id)
            setAlumnos((prev) => prev.filter((a) => a.id !== confirmDelete.id))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al eliminar")
        } finally {
            setConfirmDelete(null)
        }
    }

    const handleDownloadContrato = async (alumno: Alumno) => {
        if (downloadingId) return
        setDownloadingId(alumno.id)
        setError("")
        try {
            await downloadContractPdf(alumno)
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo generar el contrato")
        } finally {
            setDownloadingId(null)
        }
    }

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        if (!q) return alumnos
        return alumnos.filter(
            (a) =>
                a.apellido.toLowerCase().includes(q) ||
                a.nombre.toLowerCase().includes(q) ||
                a.numeroDocumento.toLowerCase().includes(q) ||
                a.cuil.toLowerCase().includes(q) ||
                (a.courseTitle ?? "").toLowerCase().includes(q),
        )
    }, [alumnos, search])

    const unassigned = useMemo(() => alumnos.filter((a) => !a.courseTitle).length, [alumnos])
    const unassignedAlumnos = useMemo(() => alumnos.filter((a) => !a.courseTitle), [alumnos])

    const statItems = [
        { id: "total" as const, label: "Total inscriptos", value: alumnos.length, icon: Users, boxClass: "bg-[#4d0706]/5 text-[#4d0706]" },
        { id: "mostrando" as const, label: "Mostrando", value: filtered.length, icon: Search, boxClass: "bg-emerald-50 text-emerald-700" },
        { id: "sinAsignar" as const, label: "Sin asignar", value: unassigned, icon: GraduationCap, boxClass: "bg-amber-50 text-amber-700" },
    ]

    const renderStatDetail = (id: StatId) => {
        switch (id) {
            case "total":
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600 font-medium">
                            Total de inscripciones registradas en la escuela hasta el momento.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-[#4d0706] bg-[#4d0706]/5">
                                Con curso asignado: {alumnos.length - unassigned}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-amber-700 bg-amber-50">
                                Sin asignar: {unassigned}
                            </span>
                        </div>
                    </div>
                )
            case "mostrando":
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600 font-medium">
                            Estás viendo <strong>{filtered.length}</strong> de <strong>{alumnos.length}</strong> inscripciones.
                        </p>
                        {search.trim() ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-[#4d0706] bg-[#4d0706]/5">
                                    Búsqueda: "{search.trim()}"
                                </span>
                                <button
                                    onClick={() => setSearch("")}
                                    className="text-xs font-bold text-gray-500 hover:text-[#4d0706] cursor-pointer underline underline-offset-2"
                                >
                                    Limpiar búsqueda
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 font-medium">Sin filtros aplicados. Se muestran todas las inscripciones.</p>
                        )}
                    </div>
                )
            case "sinAsignar":
                return (
                    <div className="space-y-3">
                        {unassignedAlumnos.length === 0 ? (
                            <p className="text-sm text-gray-600 font-medium">Todos los inscriptos tienen curso o carrera asignada.</p>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 font-medium">Inscriptos que todavía no tienen curso o carrera asignada:</p>
                                <ul className="space-y-1.5">
                                    {unassignedAlumnos.slice(0, 5).map((a) => (
                                        <li key={a.id} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                            {a.apellido}, {a.nombre}
                                        </li>
                                    ))}
                                </ul>
                                {unassignedAlumnos.length > 5 && (
                                    <p className="text-xs text-gray-400 font-medium">y {unassignedAlumnos.length - 5} más...</p>
                                )}
                            </>
                        )}
                    </div>
                )
        }
    }

    const formatDate = (iso?: string) => {
        if (!iso) return ""
        const d = new Date(iso)
        return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
    }

    const calcAge = (iso?: string) => {
        if (!iso) return null
        const d = new Date(iso)
        if (isNaN(d.getTime()) || d > new Date()) return null
        return Math.floor((new Date().getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    }

    const sexoLabel = (s?: string) => {
        if (s === "M") return "Masculino"
        if (s === "F") return "Femenino"
        if (s === "X") return "Otro (X)"
        return "—"
    }

    const renderRow = (a: Alumno) => {
        const initial = `${(a.nombre || "").charAt(0)}${(a.apellido || "").charAt(0)}`.toUpperCase()
        const isMenuOpen = menuOpen === a.id

        return (
            <div key={a.id} className="relative px-3 sm:px-5 py-2.5 sm:py-4">
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setDetailAlumno(a)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                setDetailAlumno(a)
                            }
                        }}
                        aria-label={`Detalles de ${a.apellido}, ${a.nombre}`}
                        className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4d0706]/40 rounded-xl"
                    >
                        <div className="w-8 h-8 rounded-lg sm:w-10 sm:h-10 sm:rounded-xl shrink-0 flex items-center justify-center text-[11px] sm:text-xs font-black text-[#4d0706] bg-[#4d0706]/5">
                            {initial || "?"}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <p className="text-[13px] sm:text-sm font-bold text-gray-900 leading-tight truncate">
                                    {a.apellido}, {a.nombre}
                                </p>
                                {a.courseTitle ? (
                                    <span className="inline-flex items-center shrink-0 gap-1 max-w-[40%] px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black text-[#4d0706] bg-[#4d0706]/5">
                                        <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                                        <span className="truncate">{a.courseTitle}</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black text-amber-700 bg-amber-50">
                                        Sin asignar
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] sm:text-xs font-medium text-gray-500 leading-tight mt-0.5 truncate">
                                DNI: {a.c_documento} {a.numeroDocumento} | CUIL: {a.cuil}
                            </p>
                            <p className="text-[11px] sm:text-xs font-medium text-gray-400 leading-tight mt-0.5">
                                {formatDate(a.createdAt) || "Sin fecha"}{" "}
                                <span className="text-gray-400">·</span>{" "}
                                <span className="text-[#4d0706] font-bold">Detalles</span>
                            </p>
                        </div>
                    </div>

                    <div ref={(el) => { actionsRefs.current[a.id] = el }} className="relative flex items-center shrink-0">
                        <button
                            onClick={() => {
                                setMenuOpen(null)
                                setConfirmDelete(a)
                            }}
                            title="Eliminar"
                            aria-label={`Eliminar inscripción de ${a.apellido}, ${a.nombre}`}
                            className="w-8 h-8 sm:w-11 sm:h-11 grid place-items-center rounded-xl text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setMenuOpen(isMenuOpen ? null : a.id)
                            }}
                            title="Más acciones"
                            aria-haspopup="menu"
                            aria-expanded={isMenuOpen}
                            className={`w-8 h-8 sm:w-11 sm:h-11 grid place-items-center rounded-xl cursor-pointer transition-colors ${
                                isMenuOpen ? "bg-gray-100 text-[#4d0706]" : "text-gray-500 hover:bg-gray-100 hover:text-[#4d0706]"
                            }`}
                        >
                            <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-3 top-14 z-30 w-48 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/50 p-1.5">
                                {downloadingId === a.id && (
                                    <div className="flex items-center gap-2 px-3 py-2.5 text-xs font-black text-gray-400">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Generando contrato...
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setMenuOpen(null)
                                        handleDownloadContrato(a)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-[#4d0706] hover:bg-[#4d0706]/5 cursor-pointer transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    Contrato
                                </button>
                                <a
                                    href={api.urls.ficha(a.id, token)}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setMenuOpen(null)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-green-700 hover:bg-green-50 cursor-pointer transition-colors"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Plantilla
                                </a>
                                <button
                                    onClick={() => {
                                        setMenuOpen(null)
                                        setEditing(a)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Editar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_1px_3px_rgba(77,7,6,0.06)] overflow-hidden">
                <div className="flex divide-x divide-gray-100">
                    {statItems.map((item) => {
                        const Icon = item.icon
                        const isOpen = expandedStat === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => setExpandedStat((prev) => (prev === item.id ? null : item.id))}
                                aria-expanded={isOpen}
                                title={isOpen ? "Contraer" : "Detalles"}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-1 sm:px-2 min-w-0 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4d0706]/30 ${
                                    isOpen ? "bg-[#4d0706]/[0.04]" : "hover:bg-gray-50"
                                }`}
                            >
                                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center shrink-0 ${item.boxClass}`}>
                                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500 leading-none whitespace-nowrap">
                                    {item.label}
                                </p>
                                <p className="text-base sm:text-xl font-black text-gray-900 leading-none">{item.value}</p>
                            </button>
                        )
                    })}
                </div>
                <AnimatePresence initial={false}>
                    {expandedStat && (
                        <motion.div
                            key={expandedStat}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-gray-100"
                        >
                            <div className="p-4 sm:p-5">{renderStatDetail(expandedStat)}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por apellido, nombre, DNI o CUIL..."
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706]"
                    />
                </div>
                <button
                    onClick={load}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Actualizar
                </button>
            </div>

            {error && <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-14 text-center">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500">
                        {alumnos.length === 0 ? "Todavía no hay inscripciones." : "No se encontraron resultados."}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_1px_3px_rgba(77,7,6,0.06)] divide-y divide-gray-100">
                    {filtered.map(renderRow)}
                </div>
            )}

            {detailAlumno && (
                <div
                    className="fixed inset-0 z-[100] overflow-hidden bg-transparent sm:bg-black/60"
                    onClick={() => setDetailAlumno(null)}
                >
                    <div className="flex h-full items-center justify-center sm:p-4">
                    <div
                        className="w-full h-full sm:h-auto sm:max-h-full sm:max-w-3xl bg-white flex flex-col my-auto overflow-hidden sm:rounded-3xl sm:shadow-2xl sm:border sm:border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                    <div className="shrink-0 bg-[#4d0706] text-white shadow-lg shadow-[#4d0706]/20">
                        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-3.5">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-black text-[#ffcc00] shrink-0">
                                {`${(detailAlumno.nombre || "").charAt(0)}${(detailAlumno.apellido || "").charAt(0)}`.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-black uppercase tracking-widest text-white/60">Ficha del inscripto</p>
                                <p className="text-sm sm:text-base font-black leading-tight truncate">
                                    {detailAlumno.apellido}, {detailAlumno.nombre}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailAlumno(null)}
                                title="Cerrar"
                                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 cursor-pointer transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 pt-6 sm:pt-8 pb-8">
                        <div className="bg-[#fcfaf7] border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#4d0706] text-[#ffcc00] flex items-center justify-center text-lg font-black shrink-0">
                                {`${(detailAlumno.nombre || "").charAt(0)}${(detailAlumno.apellido || "").charAt(0)}`.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-lg font-black text-gray-900 leading-tight">
                                        {detailAlumno.apellido}, {detailAlumno.nombre}
                                    </p>
                                    {detailAlumno.courseTitle ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black text-[#4d0706] bg-[#4d0706]/5">
                                            <GraduationCap className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{detailAlumno.courseTitle}</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black text-amber-700 bg-amber-50">
                                            Sin asignar
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-medium text-gray-500">
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                        Inscripto el {formatDate(detailAlumno.createdAt) || "—"}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        {detailAlumno.celular || "Sin celular"}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        {detailAlumno.email || "Sin email"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Datos personales</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Tipo documento</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">{detailAlumno.c_documento}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Número documento</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">{detailAlumno.numeroDocumento}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">CUIL</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">{detailAlumno.cuil}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Fecha de nacimiento</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">
                                        {detailAlumno.fechaNacimiento ? formatDate(detailAlumno.fechaNacimiento) : "—"}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Sexo</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">{sexoLabel(detailAlumno.c_sexo)}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Edad</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">
                                        {detailAlumno.fechaNacimiento ? `${calcAge(detailAlumno.fechaNacimiento)} años` : "—"}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Celular</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">{detailAlumno.celular || "—"}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Email</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">{detailAlumno.email || "—"}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Domicilio</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">{detailAlumno.domicilio || "—"}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Departamento</p>
                                    <p className="text-sm font-bold text-gray-800 mt-1 break-words">{detailAlumno.departamento || "—"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex flex-wrap items-center justify-center gap-2">
                            <button
                                onClick={() => handleDownloadContrato(detailAlumno)}
                                disabled={downloadingId === detailAlumno.id}
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#4d0706] hover:bg-[#300404] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            >
                                {downloadingId === detailAlumno.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <FileText className="w-3.5 h-3.5" />
                                )}
                                {downloadingId === detailAlumno.id ? "Generando..." : "Contrato"}
                            </button>
                            <a
                                href={api.urls.ficha(detailAlumno.id, token)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                Plantilla
                            </a>
                            <button
                                onClick={() => {
                                    const a = detailAlumno
                                    setDetailAlumno(null)
                                    setEditing(a)
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Editar
                            </button>
                            <button
                                onClick={() => {
                                    const a = detailAlumno
                                    setDetailAlumno(null)
                                    setConfirmDelete(a)
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {editing && (
                <AlumnoEditModal
                    token={token}
                    alumno={editing}
                    onClose={() => setEditing(null)}
                    onSaved={(updated) => setAlumnos((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))}
                />
            )}

            {confirmDelete && (
                <div className="fixed inset-0 z-[100] overflow-hidden bg-black/50" onClick={() => setConfirmDelete(null)}>
                    <div className="flex h-full items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md max-h-full overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-gray-900">¿Eliminar inscripción?</h3>
                        <p className="text-sm text-gray-500 font-medium mt-2">
                            Se eliminará el registro de <strong>{confirmDelete.apellido}, {confirmDelete.nombre}</strong>. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button onClick={() => setConfirmDelete(null)} className="px-5 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer">
                                Cancelar
                            </button>
                            <button onClick={handleDelete} className="px-6 py-3 rounded-xl text-sm font-black text-white bg-red-600 hover:bg-red-700 cursor-pointer">
                                Eliminar
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </div>
    )
}