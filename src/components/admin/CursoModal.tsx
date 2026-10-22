import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type ClipboardEvent,
    type FormEvent,
    type KeyboardEvent,
    type ReactNode,
} from "react"
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Briefcase,
    Check,
    Film,
    GraduationCap,
    Loader2,
    Pencil,
    Plus,
    Save,
    Search,
    Trash2,
    Upload,
    UserPlus,
    Users,
    X,
} from "lucide-react"
import { api, type ConfigSyllabusEntry, type ConfigTeacher, type CursoConfig } from "@/api"
import { CAREER_DATA, type Career } from "@/config/careerData"
import { CAREER_VIDEOS } from "@/config/careerVideos"
import { getImageFor, useSiteConfig } from "@/siteConfig"
import { MAX_CUPO_TITULARES, MIN_CUPO_TITULARES } from "@/lib/titulares"
import {
    REQUISITOS_GENERALES,
    REQUISITOS_GENERALES_TEXTO,
    sonRequisitosGenerales,
} from "@/lib/requisitos"
import { arancelParaInput, formatearImporteConPuntos, mostrarSignoArancel, normalizarArancel } from "@/lib/precio"
import { esMes, MESES, mesActual } from "@/lib/meses"
import { limpiarArancel, limpiarLegajo, limpiarTexto, soloDigitos } from "@/lib/input"

interface Props {
    token: string
    section: "cursos" | "carreras"
    existingIds: string[]
    curso?: { id: string; data: CursoConfig }
    onClose: () => void
    onSaved: () => void
}

interface TeacherDraft {
    key: string
    name: string
    title: string
    legajo: string
    image: string
    file: File | null
    removeImage: boolean
}

const inputClass =
    "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all duration-300"

const textareaClass =
    "w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all duration-300"

const labelClass = "text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5"
/* Mismo peso visual que los títulos de sección (Salida laboral, Perfil, etc.). */
const sectionLabelClass = "text-sm font-black text-gray-900 block mb-1.5"
const hintClass = "text-[11px] text-gray-400 font-medium mt-1.5"
const errorClass = "text-[11px] text-red-600 font-bold mt-1.5"

const fileButtonClass =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-[#4d0706] " +
    "bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer transition-colors"

const compactInputClass =
    "w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-2 focus:ring-[#4d0706]/10 focus:border-[#4d0706] transition-all"

const compactLabelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1"

const iconButtonClass =
    "shrink-0 w-8 h-8 grid place-items-center rounded-lg cursor-pointer transition-colors"

type StepId = "identidad" | "ejes" | "salida" | "docentes" | "inscripcion"

interface Step {
    id: StepId
    label: string
    short: string
}

const STEPS: Step[] = [
    { id: "identidad", label: "Identidad", short: "Identidad" },
    { id: "ejes", label: "Ejes de formación", short: "Ejes" },
    { id: "salida", label: "Salida y requisitos", short: "Salida" },
    { id: "docentes", label: "Docentes", short: "Docentes" },
    { id: "inscripcion", label: "Inscripción", short: "Inscripción" },
]

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

const splitLines = (value: string): string[] =>
    value
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)

const toListText = (items?: string[]): string => (items || []).join("\n")

const SALIDA_PLACEHOLDERS = [
    "Ej.: Agencias y Concesionarias Oficiales",
    "Ej.: Flotas de Transporte y Logística",
    "Ej.: Talleres mecánicos independientes",
]

const EJE_PLACEHOLDERS = ["Funcionamiento de un Motor", "Puesta a Punto", "Sistemas de Frenos"]

const matchesTeacherQuery = (t: TeacherDraft, query: string) =>
    t.name.toLowerCase().includes(query) || t.title.toLowerCase().includes(query) || t.legajo.toLowerCase().includes(query)

let teacherKeyCounter = 0
const nextTeacherKey = () => {
    teacherKeyCounter += 1
    return `doc-${teacherKeyCounter}`
}

const emptyTeacher = (): TeacherDraft => ({
    key: nextTeacherKey(),
    name: "",
    title: "",
    legajo: "",
    image: "",
    file: null,
    removeImage: false,
})

function currentCareerView(id: string, data: CursoConfig | undefined): Career | undefined {
    const base = CAREER_DATA[id]
    if (!data) return base
    if (!base) {
        return {
            id,
            title: data.title || id,
            icon: data.icon || "GraduationCap",
            description: data.description || "",
            longDescription: data.longDescription || "",
            duration: data.duration || "",
            modality: data.modality || "Presencial",
            category: data.category,
            perfilEgresado: data.perfilEgresado || [],
            syllabus: data.syllabus || [],
            teachers: (data.teachers || []).map((t) => ({
                name: t.name,
                title: t.title || "",
                legajo: t.legajo,
                image: t.image,
            })),
            schedule: data.schedule || "",
            inscriptionDate: data.inscriptionDate || "",
            month: data.month,
            inscriptionFee: data.inscriptionFee || "",
            inscriptionDocs: data.inscriptionDocs || "",
            salidaLaboral: data.salidaLaboral || [],
        }
    }
    return { ...base, ...pickDefined(data) }
}

const CONFIG_ONLY_KEYS = new Set(["available", "image", "cantidadTitulares", "teacher", "video", "ejes"])

function pickDefined(data: CursoConfig): Partial<Career> {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || CONFIG_ONLY_KEYS.has(key)) continue
        out[key] = value
    }
    return out as Partial<Career>
}

function RequiredMark() {
    return (
        <span className="text-red-500" aria-hidden="true">
            *
        </span>
    )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <h4 className="text-sm font-black text-gray-900">{title}</h4>
            {hint && <p className="text-[11px] font-medium text-gray-400 leading-relaxed">{hint}</p>}
            <div className="pt-1">{children}</div>
        </div>
    )
}

export default function CursoModal({ token, section, existingIds, curso, onClose, onSaved }: Props) {
    const { config } = useSiteConfig()
    const isCurso = section === "cursos"
    const prefix = isCurso ? "curso-" : "tec-"

    const view = curso ? currentCareerView(curso.id, curso.data) : undefined
    const data = curso?.data

    const [step, setStep] = useState<StepId>("identidad")

    const [name, setName] = useState(view?.title || "")
    const [description, setDescription] = useState(view?.description || "")
    /* La descripción arranca en dos renglones y crece mientras se escribe. */
    const descriptionRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => {
        const el = descriptionRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${el.scrollHeight}px`
    }, [description, step])
    const [duration, setDuration] = useState(view?.duration || "")
    const [modality, setModality] = useState(view?.modality || "Presencial")
    // La categoría del curso se deriva de la modalidad, para no pedirla dos veces.
    const resolvedCategory: NonNullable<Career["category"]> = isCurso
        ? modality === "Virtual"
            ? "curso-virtual"
            : "curso-presencial"
        : "carrera"
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [removeImage, setRemoveImage] = useState(false)

    const [syllabus, setSyllabus] = useState<ConfigSyllabusEntry[]>(() => {
        if (view?.syllabus?.length) return view.syllabus.map((s) => ({ year: s.year, subjects: [...s.subjects] }))
        if (data?.ejes) return [{ year: "Nivel Único", subjects: splitLines(data.ejes) }]
        return [{ year: "", subjects: [] }]
    })

    const [salida, setSalida] = useState<string[]>(() => {
        const guardadas = (view?.salidaLaboral || []).map((s) => s.trim()).filter(Boolean)
        return guardadas.length ? guardadas : [""]
    })
    const [perfil, setPerfil] = useState(toListText(view?.perfilEgresado))
    /* El perfil arranca en dos renglones y crece a medida que se escribe. */
    const perfilRef = useRef<HTMLTextAreaElement>(null)
    useEffect(() => {
        const el = perfilRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${el.scrollHeight}px`
    }, [perfil, step])
    /*
     * Requisitos: por defecto se usan los generales (DNI, CUIL, analítico).
     * Solo se abre la edición libre si la carrera ya tenía requisitos propios.
     */
    const [docsMode, setDocsMode] = useState<"generales" | "personalizados">(() => {
        const guardados = view?.inscriptionDocs?.trim()
        return guardados && !sonRequisitosGenerales(guardados) ? "personalizados" : "generales"
    })
    const [inscriptionDocs, setInscriptionDocs] = useState(() => {
        const guardados = view?.inscriptionDocs?.trim()
        if (!guardados || sonRequisitosGenerales(guardados)) return REQUISITOS_GENERALES_TEXTO
        return guardados
    })
    // El arancel se guarda tal cual se escribe; los importes numéricos llevan "$".
    const [inscriptionFee, setInscriptionFee] = useState(view?.inscriptionFee || "")
    /* Conserva lo que el admin escribió si vuelve a los requisitos generales. */
    const customDocsRef = useRef(
        view?.inscriptionDocs && !sonRequisitosGenerales(view.inscriptionDocs) ? view.inscriptionDocs : "",
    )

    const [teachers, setTeachers] = useState<TeacherDraft[]>(() => {
        if (view?.teachers?.length) {
            return view.teachers.map((t) => ({
                key: nextTeacherKey(),
                name: t.name,
                title: t.title || "",
                legajo: t.legajo || "",
                image: t.image || "",
                file: null,
                removeImage: false,
            }))
        }
        if (data?.teacher) {
            return [{ ...emptyTeacher(), name: data.teacher, title: "Docente" }]
        }
        return [emptyTeacher()]
    })

    const [inscription, setInscription] = useState(view?.inscriptionDate || data?.inscriptionDate || "")
    // Mes de inicio: por defecto el mes en curso al crear una carrera o curso.
    const [month, setMonth] = useState(() => {
        const guardado = view?.month || data?.month || ""
        return guardado || (curso ? "" : mesActual())
    })
    const [schedule, setSchedule] = useState(view?.schedule || data?.schedule || "")
    const [cupo, setCupo] = useState(
        typeof data?.cantidadTitulares === "number" ? Math.trunc(data.cantidadTitulares) : 0,
    )
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [removeVideo, setRemoveVideo] = useState(false)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [touched, setTouched] = useState<Partial<Record<StepId, boolean>>>({})

    const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null)
    const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null)
    const [teacherSearch, setTeacherSearch] = useState("")
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)

    const salidaListRef = useRef<HTMLDivElement | null>(null)
    const focusSalidaRow = (index: number) => {
        requestAnimationFrame(() => {
            const rows = salidaListRef.current?.querySelectorAll<HTMLInputElement>("input[data-salida-row]")
            rows?.[Math.max(0, Math.min(index, (rows?.length ?? 1) - 1))]?.focus()
        })
    }
    const addSalidaAfter = (index: number) => {
        setSalida((prev) => [...prev.slice(0, index + 1), "", ...prev.slice(index + 1)])
        focusSalidaRow(index + 1)
    }

    const ejeInputRefs = useRef(new Map<string, HTMLInputElement>())
    const yearInputRefs = useRef(new Map<number, HTMLInputElement>())
    const addYear = () => {
        const nextIndex = syllabus.length
        setSyllabus((prev) => [...prev, { year: "", subjects: [] }])
        requestAnimationFrame(() => yearInputRefs.current.get(nextIndex)?.focus())
    }
    const focusEje = (yearIndex: number, ejeIndex: number) => {
        requestAnimationFrame(() => {
            ejeInputRefs.current.get(`${yearIndex}:${ejeIndex}`)?.focus()
        })
    }
    const patchEjes = (yearIndex: number, subjects: string[]) =>
        setSyllabus((prev) => prev.map((s, idx) => (idx === yearIndex ? { ...s, subjects } : s)))
    const addEjeAfter = (yearIndex: number, ejeIndex: number) => {
        setSyllabus((prev) =>
            prev.map((s, idx) =>
                idx === yearIndex
                    ? { ...s, subjects: [...s.subjects.slice(0, ejeIndex + 1), "", ...s.subjects.slice(ejeIndex + 1)] }
                    : s,
            ),
        )
        focusEje(yearIndex, ejeIndex + 1)
    }
    const removeEje = (yearIndex: number, ejeIndex: number) => {
        setSyllabus((prev) =>
            prev.map((s, idx) => (idx === yearIndex ? { ...s, subjects: s.subjects.filter((_, si) => si !== ejeIndex) } : s)),
        )
        focusEje(yearIndex, Math.max(0, ejeIndex - 1))
    }

    const lastLogoUrl = useRef("")
    const currentImage = useMemo(() => {
        if (lastLogoUrl.current) {
            URL.revokeObjectURL(lastLogoUrl.current)
            lastLogoUrl.current = ""
        }
        if (imageFile) {
            const url = URL.createObjectURL(imageFile)
            lastLogoUrl.current = url
            return url
        }
        if (removeImage || !curso) return ""
        return getImageFor(curso.id, config)
    }, [imageFile, removeImage, curso, config])

    const lastVideoUrl = useRef("")
    const currentVideo = useMemo(() => {
        if (lastVideoUrl.current) {
            URL.revokeObjectURL(lastVideoUrl.current)
            lastVideoUrl.current = ""
        }
        if (videoFile) {
            const url = URL.createObjectURL(videoFile)
            lastVideoUrl.current = url
            return url
        }
        if (removeVideo || !curso) return ""
        return data?.video || (CAREER_VIDEOS[curso.id]?.[0] ?? "")
    }, [videoFile, removeVideo, curso, data])

    const teacherPreviewUrls = useRef(new Map<string, { file: File; url: string }>())
    const getTeacherPreviewUrl = (key: string, file: File | null): string | null => {
        const cache = teacherPreviewUrls.current
        const cached = cache.get(key)
        if (!file) {
            if (cached) {
                URL.revokeObjectURL(cached.url)
                cache.delete(key)
            }
            return null
        }
        if (cached && cached.file === file) return cached.url
        if (cached) URL.revokeObjectURL(cached.url)
        const url = URL.createObjectURL(file)
        cache.set(key, { file, url })
        return url
    }

    useEffect(() => {
        return () => {
            if (lastLogoUrl.current) URL.revokeObjectURL(lastLogoUrl.current)
            if (lastVideoUrl.current) URL.revokeObjectURL(lastVideoUrl.current)
            teacherPreviewUrls.current.forEach(({ url }) => URL.revokeObjectURL(url))
            teacherPreviewUrls.current.clear()
        }
    }, [])

    const teacherRowRefs = useRef(new Map<string, HTMLDivElement>())
    useEffect(() => {
        if (!expandedTeacher) return
        teacherRowRefs.current.get(expandedTeacher)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }, [expandedTeacher])

    useEffect(() => {
        const compute = () => setIsDesktop(window.innerWidth >= 1024)
        window.addEventListener("resize", compute)
        return () => window.removeEventListener("resize", compute)
    }, [])

    useEffect(() => {
        const previous = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = previous
        }
    }, [])

    const conNombreCount = teachers.filter((t) => t.name.trim()).length
    const teacherQuery = teacherSearch.trim().toLowerCase()

    const visiblesTeachers = teachers
        .map((teacher, index) => ({ teacher, index }))
        .filter(
            ({ teacher }) =>
                !teacherQuery || matchesTeacherQuery(teacher, teacherQuery) || teacher.key === expandedTeacher,
        )

    const selectedTeacher = teachers.find((t) => t.key === expandedTeacher) ?? null
    const selectedTeacherIndex = selectedTeacher ? teachers.findIndex((t) => t.key === selectedTeacher.key) : -1
    const selectedPreviewUrl = selectedTeacher
        ? getTeacherPreviewUrl(selectedTeacher.key, selectedTeacher.file)
        : null

    const patchTeacher = (index: number, partial: Partial<TeacherDraft>) =>
        setTeachers((prev) => prev.map((t, idx) => (idx === index ? { ...t, ...partial } : t)))

    const selectTeacher = (key: string) => {
        setConfirmDeleteKey(null)
        setExpandedTeacher((prev) => (prev === key ? null : key))
    }

    const addTeacher = () => {
        const fresh = emptyTeacher()
        setTeachers((prev) => [...prev, fresh])
        setConfirmDeleteKey(null)
        setExpandedTeacher(fresh.key)
        setTeacherSearch("")
    }

    const removeTeacher = (index: number) => {
        setTeachers((prev) => prev.filter((_, idx) => idx !== index))
        setConfirmDeleteKey(null)
        setExpandedTeacher(null)
    }

    const renderTeacherFields = (
        teacher: TeacherDraft,
        index: number,
        mode: "panel" | "inline",
        previewUrl: string | null,
    ) => {
        const hasPhoto = Boolean(teacher.file || (teacher.image && !teacher.removeImage))
        const inicial = teacher.name.trim().charAt(0).toUpperCase() || "?"
        return (
            <div className={mode === "panel" ? "space-y-2.5" : "space-y-3"}>
                <div
                    className={
                        mode === "panel"
                            ? "grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                            : "grid grid-cols-1 sm:grid-cols-3 gap-3"
                    }
                >
                    <div className={mode === "panel" ? "sm:col-span-2" : undefined}>
                        <label className={compactLabelClass} htmlFor={`docente-nombre-${teacher.key}`}>
                            Nombre <RequiredMark />
                        </label>
                        <input
                            id={`docente-nombre-${teacher.key}`}
                            className={compactInputClass}
                            value={teacher.name}
                            onChange={(e) => patchTeacher(index, { name: limpiarTexto(e.target.value) })}
                            placeholder="Ej.: Alonzo, Ariel Alberto"
                            maxLength={120}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className={compactLabelClass} htmlFor={`docente-cargo-${teacher.key}`}>
                            Cargo
                        </label>
                        <input
                            id={`docente-cargo-${teacher.key}`}
                            className={compactInputClass}
                            value={teacher.title}
                            onChange={(e) => patchTeacher(index, { title: limpiarTexto(e.target.value) })}
                            placeholder="Ej.: Auxiliar Técnico Automotor"
                            maxLength={160}
                        />
                    </div>
                    <div>
                        <label className={compactLabelClass} htmlFor={`docente-legajo-${teacher.key}`}>
                            Legajo / matrícula
                        </label>
                        <input
                            id={`docente-legajo-${teacher.key}`}
                            className={compactInputClass}
                            value={teacher.legajo}
                            onChange={(e) => patchTeacher(index, { legajo: limpiarLegajo(e.target.value) })}
                            placeholder="Ej.: 14594- L.8 - F. 106/107"
                            maxLength={80}
                        />
                    </div>
                </div>

                {mode === "panel" ? (
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-gray-50 border border-gray-200 grid place-items-center">
                            {previewUrl ? (
                                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                            ) : teacher.image && !teacher.removeImage ? (
                                <img src={teacher.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-black text-gray-300">{inicial}</span>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`docente-foto-${teacher.key}`}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                patchTeacher(index, { file: e.target.files?.[0] ?? null, removeImage: false })
                            }
                        />
                        <label
                            htmlFor={`docente-foto-${teacher.key}`}
                            title="Subir foto"
                            className={`${iconButtonClass} text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10`}
                        >
                            <Upload className="w-4 h-4" />
                        </label>
                        {hasPhoto && (
                            <button
                                type="button"
                                title="Quitar foto"
                                onClick={() => patchTeacher(index, { file: null, image: "", removeImage: true })}
                                className={`${iconButtonClass} text-red-600 bg-red-50 hover:bg-red-100`}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-gray-400">
                            {teacher.file
                                ? teacher.file.name
                                : teacher.removeImage
                                    ? "Se quita al guardar"
                                    : teacher.image
                                        ? "Foto cargada"
                                        : "Sin foto"}
                        </span>
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                        <p className={compactLabelClass}>Foto (opcional)</p>
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-white border border-gray-200 grid place-items-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                                ) : teacher.image && !teacher.removeImage ? (
                                    <img src={teacher.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-black text-gray-300">{inicial}</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id={`docente-foto-${teacher.key}`}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            patchTeacher(index, {
                                                file: e.target.files?.[0] ?? null,
                                                removeImage: false,
                                            })
                                        }
                                    />
                                    <label
                                        htmlFor={`docente-foto-${teacher.key}`}
                                        className={fileButtonClass + " px-3 py-2"}
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        Subir foto
                                    </label>
                                    {hasPhoto && (
                                        <button
                                            type="button"
                                            title="Quitar foto"
                                            onClick={() =>
                                                patchTeacher(index, { file: null, image: "", removeImage: true })
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Quitar
                                        </button>
                                    )}
                                </div>
                                {teacher.file && (
                                    <p className="text-[11px] font-bold text-[#4d0706] truncate">
                                        {teacher.file.name}
                                    </p>
                                )}
                                {teacher.removeImage && (
                                    <p className="text-[11px] font-bold text-red-600">Se quita al guardar.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const validations: Record<StepId, () => string> = {
        identidad: () => {
            if (!name.trim()) return "Poné el nombre de la carrera o el curso."
            if (!description.trim()) return "La descripción corta es obligatoria: es la que se ve en el header."
            if (!duration.trim()) return "Indicá la duración."
            if (!modality.trim()) return "Indicá la modalidad."
            return ""
        },
        ejes: () => {
            const filled = syllabus.some((s) => s.subjects.some((subject) => subject.trim()))
            return filled ? "" : "Cargá al menos un eje de formación."
        },
        salida: () => {
            if (!salida.some((s) => s.trim())) return "Cargá al menos una salida laboral."
            if (!inscriptionDocs.trim()) return "Indicá los requisitos de inscripción."
            if (!inscriptionFee.trim()) return "Indicá el arancel."
            return ""
        },
        docentes: () => (conNombreCount ? "" : "Cargá al menos un docente."),
        inscripcion: () => {
            if (!inscription.trim()) return "Indicá la fecha o período de inscripción."
            if (!schedule.trim()) return "Indicá el cronograma de cursada."
            return ""
        },
    }

    const stepError = (id: StepId) => (touched[id] ? validations[id]() : "")

    const goNext = () => {
        const current = STEPS.find((s) => s.id === step)
        if (!current) return
        const message = validations[step]()
        if (message) {
            setTouched((t) => ({ ...t, [step]: true }))
            setError(message)
            return
        }
        setError("")
        const index = STEPS.findIndex((s) => s.id === step)
        const next = STEPS[index + 1]
        if (next) setStep(next.id)
    }

    const goPrev = () => {
        setError("")
        const index = STEPS.findIndex((s) => s.id === step)
        const prev = STEPS[index - 1]
        if (prev) setStep(prev.id)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        for (const s of STEPS) {
            const message = validations[s.id]()
            if (message) {
                setTouched((t) => ({ ...t, [s.id]: true }))
                setStep(s.id)
                setError(message)
                return
            }
        }

        const trimmedName = name.trim()
        setSaving(true)
        setError("")
        try {
            let id = curso?.id ?? ""
            if (!curso) {
                const slug = slugify(trimmedName)
                if (!slug) throw new Error("Ingresá un nombre válido.")
                id = `${prefix}${slug}`
                let n = 2
                while (existingIds.includes(id)) id = `${prefix}${slug}-${n++}`
            }

            const teacherPayload: ConfigTeacher[] = teachers
                .filter((t) => t.name.trim())
                .map((t) => {
                    const entry: ConfigTeacher = { name: t.name.trim() }
                    if (t.title.trim()) entry.title = t.title.trim()
                    if (t.legajo.trim()) entry.legajo = t.legajo.trim()
                    if (t.image) entry.image = t.image
                    if (t.removeImage) entry.removeImage = true
                    return entry
                })

            const form = new FormData()
            form.append("title", trimmedName)
            form.append("description", description.trim())
            form.append("duration", duration.trim())
            form.append("modality", modality.trim())
            form.append("category", resolvedCategory)
            form.append(
                "syllabus",
                JSON.stringify(
                    syllabus
                        .map((s) => ({ ...s, subjects: s.subjects.map((subject) => subject.trim()).filter(Boolean) }))
                        .filter((s) => s.subjects.length > 0),
                ),
            )
            form.append("salidaLaboral", JSON.stringify(splitLines(salida.join("\n"))))
            form.append("perfilEgresado", JSON.stringify(splitLines(perfil)))
            form.append("inscriptionDocs", inscriptionDocs.trim())
            form.append("inscriptionFee", normalizarArancel(inscriptionFee))
            form.append("teachers", JSON.stringify(teacherPayload))
            form.append("inscriptionDate", inscription.trim())
            form.append("month", month.trim())
            form.append("schedule", schedule.trim())

            form.append("cantidadTitulares", String(cupo))
            if (removeImage) form.append("removeImage", "true")
            if (imageFile) form.append("image", imageFile)
            if (removeVideo) form.append("removeVideo", "true")
            if (videoFile) form.append("video", videoFile)
            teachers.forEach((t, i) => {
                if (t.file) form.append(`teacherImage_${i}`, t.file)
            })

            await api.updateCurso(token, id, form)
            onSaved()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar")
        } finally {
            setSaving(false)
        }
    }

    const stepIndex = STEPS.findIndex((s) => s.id === step)

    const stepsNav = (
        <ol className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
                const state = i < stepIndex ? "done" : i === stepIndex ? "current" : "todo"
                return (
                    <li key={s.id} className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setError("")
                                setStep(s.id)
                            }}
                            aria-current={i === stepIndex ? "step" : undefined}
                            title={s.label}
                            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-black transition-colors cursor-pointer ${state === "current"
                                ? "bg-[#4d0706] text-[#ffcc00]"
                                : state === "done"
                                    ? "bg-[#4d0706]/5 text-[#4d0706] hover:bg-[#4d0706]/10"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                }`}
                        >
                            {state === "done" ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                            <span className="hidden sm:inline">{s.short}</span>
                        </button>
                        {i < STEPS.length - 1 && <span className="w-3 h-px bg-gray-200" aria-hidden="true" />}
                    </li>
                )
            })}
        </ol>
    )

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 sm:flex sm:items-center sm:justify-center sm:p-4 lg:p-0"
            onClick={onClose}
        >
            <div
                className="bg-white w-full h-full flex flex-col sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl lg:max-w-none lg:max-h-none lg:h-full lg:rounded-none"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="shrink-0 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8 2xl:px-12">
                        <span className="grid w-9 h-9 shrink-0 place-items-center rounded-xl bg-[#4d0706]/5 text-[#4d0706]">
                            {isCurso ? <GraduationCap className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-black leading-tight text-[#4d0706]">
                                {curso ? "Editar" : "Nueva"} {isCurso ? "curso" : "carrera"}
                            </h3>
                            <p className="text-[11px] font-bold text-gray-400 truncate">{name.trim() || "Sin nombre"}</p>
                        </div>
                        <div className="hidden shrink-0 lg:block">{stepsNav}</div>
                        <button
                            type="button"
                            onClick={onClose}
                            title="Cerrar"
                            className="grid w-8 h-8 shrink-0 place-items-center rounded-lg text-gray-400 hover:text-[#4d0706] hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="no-scrollbar overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden">{stepsNav}</div>
                </header>

                <form
                    id="curso-form"
                    onSubmit={handleSubmit}
                    className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-10 sm:px-6 lg:px-8 2xl:px-12"
                >
                    <div className="mx-auto w-full max-w-5xl space-y-6">
                        {step === "identidad" && (
                            <div className="mx-auto w-full max-w-xl space-y-7">
                                <div className="flex items-start gap-4 sm:gap-5">
                                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                                        <label
                                            htmlFor="curso-logo"
                                            className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-50 border border-gray-200 cursor-pointer"
                                        >
                                            {currentImage ? (
                                                <img src={currentImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full grid place-items-center">
                                                    {isCurso ? (
                                                        <GraduationCap className="w-8 h-8 text-gray-300" />
                                                    ) : (
                                                        <Briefcase className="w-8 h-8 text-gray-300" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors grid place-items-center">
                                                <Upload className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="curso-logo"
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                setImageFile(e.target.files?.[0] ?? null)
                                                setRemoveImage(false)
                                            }}
                                        />
                                        <p className="max-w-[80px] text-center text-[10px] font-bold leading-tight text-gray-400 break-words">
                                            {imageFile
                                                ? imageFile.name
                                                : removeImage
                                                    ? "Se quita al guardar"
                                                    : currentImage
                                                        ? "Logo cargado"
                                                        : "Sin logo"}
                                        </p>
                                        {(imageFile || (!removeImage && currentImage)) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null)
                                                    setRemoveImage(true)
                                                }}
                                                className="text-[11px] font-black text-red-600 hover:underline cursor-pointer"
                                            >
                                                Quitar
                                            </button>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <label className={labelClass} htmlFor="curso-nombre">
                                            Nombre <RequiredMark />
                                        </label>
                                        <input
                                            id="curso-nombre"
                                            className={inputClass}
                                            value={name}
                                            onChange={(e) => setName(limpiarTexto(e.target.value))}
                                            placeholder={isCurso ? "Ej.: Soldadura" : "Ej.: Técnico en Mecánica"}
                                            maxLength={120}
                                            autoFocus
                                            required
                                        />
                                        {!curso && (
                                            <p className={hintClass}>
                                                Se creará como {prefix}
                                                {slugify(name) || "…"} y quedará disponible al instante.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass} htmlFor="curso-descripcion">
                                        Descripción corta <RequiredMark />
                                    </label>
                                    <textarea
                                        ref={descriptionRef}
                                        id="curso-descripcion"
                                        rows={2}
                                        className={`${textareaClass} resize-none overflow-hidden`}
                                        value={description}
                                        onChange={(e) => setDescription(limpiarTexto(e.target.value))}
                                        placeholder="Ej.: Habilidades y conocimiento en funcionamiento de un motor, puesta a punto e inyección electrónica."
                                        maxLength={400}
                                        required
                                    />
                                    <p className={hintClass}>Se ve en el header y en la oferta educativa.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass} htmlFor="curso-duracion">
                                            Duración <RequiredMark />
                                        </label>
                                        <input
                                            id="curso-duracion"
                                            className={inputClass}
                                            value={duration}
                                            onChange={(e) => setDuration(limpiarTexto(e.target.value))}
                                            placeholder="Ej.: 3 años"
                                            maxLength={60}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass} htmlFor="curso-modalidad">
                                            Modalidad <RequiredMark />
                                        </label>
                                        <select
                                            id="curso-modalidad"
                                            className={inputClass}
                                            value={modality}
                                            onChange={(e) => setModality(e.target.value)}
                                        >
                                            <option value="Presencial">Presencial</option>
                                            <option value="Virtual">Virtual</option>
                                            <option value="Híbrida">Híbrida</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === "ejes" && (
                            <div className="space-y-4">
                                <p className="text-xs font-medium text-gray-500 leading-relaxed">
                                    Cada año tiene su propio listado de ejes. Si la carrera es de un solo nivel, dejá el año
                                    vacío y se muestra como "Nivel Único".
                                </p>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {syllabus.map((entry, i) => (
                                        <div key={i} className="border border-gray-200 rounded-2xl p-4 space-y-3 w-full">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    ref={(el) => {
                                                        if (el) yearInputRefs.current.set(i, el)
                                                        else yearInputRefs.current.delete(i)
                                                    }}
                                                    className={inputClass + " h-10 flex-1"}
                                                    value={entry.year}
                                                    onChange={(e) =>
                                                        setSyllabus((prev) =>
                                                            prev.map((s, idx) =>
                                                                idx === i ? { ...s, year: limpiarTexto(e.target.value) } : s,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="Año o nivel (Ej.: 1º Año)"
                                                    maxLength={60}
                                                    aria-label="Año o nivel"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setSyllabus((prev) => prev.filter((_, idx) => idx !== i))}
                                                    title="Quitar este año"
                                                    className="shrink-0 w-10 h-10 grid place-items-center rounded-xl text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Ejes de ese año</label>
                                                <div className="space-y-2">
                                                    {entry.subjects.map((subject, si) => (
                                                        <div key={si} className="flex items-center gap-2">
                                                            <span className="shrink-0 w-6 h-6 grid place-items-center rounded-lg bg-[#4d0706]/5 text-[10px] font-black text-[#4d0706]">
                                                                {si + 1}
                                                            </span>
                                                            <input
                                                                ref={(el) => {
                                                                    if (el) ejeInputRefs.current.set(`${i}:${si}`, el)
                                                                    else ejeInputRefs.current.delete(`${i}:${si}`)
                                                                }}
                                                                className={inputClass + " h-11"}
                                                                value={subject}
                                                                onChange={(e) =>
                                                                    patchEjes(
                                                                        i,
                                                                        entry.subjects.map((sub, subIdx) =>
                                                                            subIdx === si ? limpiarTexto(e.target.value) : sub,
                                                                        ),
                                                                    )
                                                                }
                                                                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault()
                                                                        if (subject.trim()) addEjeAfter(i, si)
                                                                        return
                                                                    }
                                                                    if (
                                                                        e.key === "Backspace" &&
                                                                        !subject &&
                                                                        entry.subjects.length > 1
                                                                    ) {
                                                                        e.preventDefault()
                                                                        removeEje(i, si)
                                                                    }
                                                                }}
                                                                placeholder={
                                                                    EJE_PLACEHOLDERS[si % EJE_PLACEHOLDERS.length] ||
                                                                    "Ej.: Puesta a Punto"
                                                                }
                                                                maxLength={200}
                                                                aria-label={`Eje ${si + 1} de ${entry.year || "año"}`}
                                                            />
                                                            {entry.subjects.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    title="Quitar este eje"
                                                                    onClick={() => removeEje(i, si)}
                                                                    className="shrink-0 w-10 h-10 grid place-items-center rounded-xl text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => addEjeAfter(i, entry.subjects.length - 1)}
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Agregar eje
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addYear}
                                        className="group flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#4d0706]/20 bg-[#4d0706]/[0.02] p-4 text-[#4d0706] hover:border-[#4d0706]/40 hover:bg-[#4d0706]/5 cursor-pointer transition-colors"
                                    >
                                        <span className="grid w-9 h-9 place-items-center rounded-full bg-[#4d0706]/10 group-hover:bg-[#4d0706]/15 transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </span>
                                        <span className="text-xs font-black">Agregar año</span>
                                        <span className="text-[11px] font-medium text-gray-400">
                                            Sumá otro nivel con sus ejes
                                        </span>
                                    </button>
                                </div>

                                {stepError("ejes") && <p className={errorClass}>{stepError("ejes")}</p>}
                            </div>
                        )}

                        {step === "salida" && (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                                <div className="space-y-6 lg:col-span-7">
                                    <Section
                                        title="Salida laboral"
                                        hint="Dónde puede trabajar el egresado. Cada salida va en su propio campo: con Enter agregás la siguiente."
                                    >
                                        <div ref={salidaListRef} className="space-y-2">
                                            {salida.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className="shrink-0 w-6 h-6 grid place-items-center rounded-lg bg-[#4d0706]/5 text-[10px] font-black text-[#4d0706]">
                                                        {i + 1}
                                                    </span>
                                                    <input
                                                        data-salida-row
                                                        className={inputClass + " h-11"}
                                                        value={item}
                                                        onChange={(e) =>
                                                            setSalida((prev) =>
                                                                prev.map((s, idx) =>
                                                                    idx === i ? limpiarTexto(e.target.value) : s,
                                                                ),
                                                            )
                                                        }
                                                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault()
                                                                if (item.trim()) addSalidaAfter(i)
                                                                return
                                                            }
                                                            if (e.key === "Backspace" && !item && salida.length > 1) {
                                                                e.preventDefault()
                                                                setSalida((prev) => prev.filter((_, idx) => idx !== i))
                                                                focusSalidaRow(i - 1)
                                                            }
                                                        }}
                                                        onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
                                                            const pegado = splitLines(e.clipboardData.getData("text")).map(limpiarTexto)
                                                            if (pegado.length <= 1) return
                                                            e.preventDefault()
                                                            setSalida((prev) => [
                                                                ...prev.slice(0, i),
                                                                ...pegado,
                                                                ...prev.slice(i + 1),
                                                            ])
                                                        }}
                                                        placeholder={
                                                            SALIDA_PLACEHOLDERS[i % SALIDA_PLACEHOLDERS.length] ||
                                                            "Ej.: Talleres mecánicos independientes"
                                                        }
                                                        maxLength={200}
                                                        aria-label={`Salida laboral ${i + 1}`}
                                                    />
                                                    {salida.length > 1 && (
                                                        <button
                                                            type="button"
                                                            title="Quitar esta salida"
                                                            onClick={() => {
                                                                setSalida((prev) => prev.filter((_, idx) => idx !== i))
                                                                focusSalidaRow(i - 1)
                                                            }}
                                                            className="shrink-0 w-10 h-10 grid place-items-center rounded-xl text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between gap-3 mt-2.5">
                                            <button
                                                type="button"
                                                onClick={() => addSalidaAfter(salida.length - 1)}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Agregar salida
                                            </button>
                                            <span className="text-[11px] font-medium text-gray-400">
                                                {salida.filter((s) => s.trim()).length} cargada
                                                {salida.filter((s) => s.trim()).length === 1 ? "" : "s"}
                                            </span>
                                        </div>
                                        {stepError("salida") && <p className={errorClass}>{stepError("salida")}</p>}
                                    </Section>

                                    <Section title="Perfil del egresado">
                                        <textarea
                                            ref={perfilRef}
                                            rows={2}
                                            className={`${textareaClass} resize-none overflow-hidden`}
                                            value={perfil}
                                            onChange={(e) => setPerfil(limpiarTexto(e.target.value))}
                                            placeholder={"Diagnóstico y reparación de motores\nPuesta a punto de sistemas mecánicos"}
                                        />
                                    </Section>
                                </div>

                                <div className="space-y-6 lg:col-span-5">
                                    <div>
                                        <label className={sectionLabelClass} htmlFor="curso-docs">
                                            Requisitos de inscripción <RequiredMark />
                                        </label>
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (docsMode === "personalizados") {
                                                        customDocsRef.current = inscriptionDocs
                                                    }
                                                    setDocsMode("generales")
                                                    setInscriptionDocs(REQUISITOS_GENERALES_TEXTO)
                                                }}
                                                aria-pressed={docsMode === "generales"}
                                                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-black transition-colors cursor-pointer ${docsMode === "generales"
                                                    ? "bg-[#4d0706] text-[#ffcc00]"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Dejar requisitos generales
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDocsMode("personalizados")
                                                    setInscriptionDocs(
                                                        customDocsRef.current ||
                                                        inscriptionDocs.trim() ||
                                                        REQUISITOS_GENERALES_TEXTO,
                                                    )
                                                }}
                                                aria-pressed={docsMode === "personalizados"}
                                                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-black transition-colors cursor-pointer ${docsMode === "personalizados"
                                                    ? "bg-[#4d0706] text-[#ffcc00]"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Crear mis requisitos
                                            </button>
                                        </div>

                                        {docsMode === "generales" ? (
                                            <div
                                                id="curso-docs"
                                                className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5"
                                            >
                                                {REQUISITOS_GENERALES.map((req) => (
                                                    <span
                                                        key={req}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600"
                                                    >
                                                        <Check className="w-3 h-3 text-[#4d0706]" />
                                                        {req}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <textarea
                                                id="curso-docs"
                                                rows={3}
                                                className={textareaClass}
                                                value={inscriptionDocs}
                                                onChange={(e) => {
                                                    const value = limpiarTexto(e.target.value)
                                                    customDocsRef.current = value
                                                    setInscriptionDocs(value)
                                                }}
                                                placeholder={"DNI\nCopia de CUIL\nAnalítico"}
                                                maxLength={300}
                                                required
                                            />
                                        )}
                                        <p className={hintClass}>
                                            {docsMode === "generales"
                                                ? "Se publican los requisitos generales. Si querés otros, tocá «Crear mis requisitos»."
                                                : null}
                                        </p>
                                    </div>
                                    <div>
                                        <label className={sectionLabelClass} htmlFor="curso-arancel">
                                            Arancel <RequiredMark />
                                        </label>
                                        <div className="relative">
                                            <span
                                                aria-hidden="true"
                                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400"
                                            >
                                                {mostrarSignoArancel(inscriptionFee) ? "$" : ""}
                                            </span>
                                            <input
                                                id="curso-arancel"
                                                type="text"
                                                autoComplete="off"
                                                className={`${inputClass} ${mostrarSignoArancel(inscriptionFee) ? "pl-8" : ""}`}
                                                value={arancelParaInput(inscriptionFee)}
                                                onChange={(e) => {
                                                    const raw = limpiarArancel(e.target.value)
                                                    const sinSigno = raw.replace(/^\$\s?/, "").trim()
                                                    if (/^[\d.\s]*$/.test(sinSigno)) {
                                                        const conPuntos = formatearImporteConPuntos(sinSigno)
                                                        setInscriptionFee(conPuntos)
                                                    } else {
                                                        setInscriptionFee(raw)
                                                    }
                                                }}
                                                placeholder="50.000"
                                                maxLength={60}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === "docentes" && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="mr-auto min-w-0">
                                        <h4 className="flex items-center gap-2 text-sm font-black text-gray-900">
                                            Docentes
                                            <span className="inline-flex items-center rounded-full bg-[#4d0706]/5 px-2 py-0.5 text-[10px] font-black text-[#4d0706]">
                                                {conNombreCount}
                                            </span>
                                        </h4>
                                        <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-400">
                                            Tocá un docente para editarlo. La foto es opcional: sin foto se muestran las
                                            iniciales.
                                        </p>
                                    </div>

                                    <div className="relative w-full sm:w-72">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            value={teacherSearch}
                                            onChange={(e) => setTeacherSearch(e.target.value)}
                                            placeholder="Buscar por nombre, cargo o matrícula..."
                                            aria-label="Buscar docente"
                                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706]"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addTeacher}
                                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] cursor-pointer transition-colors shrink-0"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Agregar docente
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
                                    <div className="min-w-0 space-y-2.5 lg:col-span-8">
                                        <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                                            {visiblesTeachers.length === 0 ? (
                                                <div className="px-4 py-10 text-center">
                                                    <Users className="mx-auto mb-2 w-8 h-8 text-gray-200" />
                                                    <p className="text-xs font-bold text-gray-400">
                                                        No hay docentes que coincidan con “{teacherSearch.trim()}”.
                                                    </p>
                                                </div>
                                            ) : (
                                                visiblesTeachers.map(({ teacher, index }) => {
                                                    const isSelected = expandedTeacher === teacher.key
                                                    const previewUrl = getTeacherPreviewUrl(teacher.key, teacher.file)

                                                    return (
                                                        <div
                                                            key={teacher.key}
                                                            ref={(el) => {
                                                                if (el) teacherRowRefs.current.set(teacher.key, el)
                                                                else teacherRowRefs.current.delete(teacher.key)
                                                            }}
                                                        >
                                                            <div
                                                                role="button"
                                                                tabIndex={0}
                                                                aria-expanded={isSelected}
                                                                onClick={() => selectTeacher(teacher.key)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" || e.key === " ") {
                                                                        e.preventDefault()
                                                                        selectTeacher(teacher.key)
                                                                    }
                                                                }}
                                                                className={`group relative flex items-center gap-3 px-3 sm:px-4 py-3 cursor-pointer transition-colors ${isSelected
                                                                    ? "bg-[#4d0706]/[0.04]"
                                                                    : "hover:bg-gray-50"
                                                                    }`}
                                                            >
                                                                {isSelected && (
                                                                    <span
                                                                        className="absolute inset-y-0 left-0 w-[3px] bg-[#4d0706]"
                                                                        aria-hidden="true"
                                                                    />
                                                                )}

                                                                <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 grid place-items-center">
                                                                    {previewUrl ? (
                                                                        <img
                                                                            src={previewUrl}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : teacher.image && !teacher.removeImage ? (
                                                                        <img
                                                                            src={teacher.image}
                                                                            alt=""
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-sm font-black text-gray-300">
                                                                            {teacher.name.trim().charAt(0).toUpperCase() || "?"}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-black text-gray-900 truncate">
                                                                        {teacher.name.trim() || "Docente sin nombre"}
                                                                    </p>
                                                                    <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
                                                                        <p className="text-[11px] text-gray-400 truncate">
                                                                            {teacher.title.trim() || "Sin cargo"}
                                                                        </p>
                                                                        {teacher.legajo.trim() && (
                                                                            <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-gray-500">
                                                                                Leg. {teacher.legajo.trim()}
                                                                            </span>
                                                                        )}
                                                                        {teacher.file && (
                                                                            <span className="shrink-0 text-[10px] font-bold text-[#4d0706]">
                                                                                foto nueva
                                                                            </span>
                                                                        )}
                                                                        {teacher.removeImage && (
                                                                            <span className="shrink-0 text-[10px] font-bold text-red-600">
                                                                                se quita la foto
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {confirmDeleteKey === teacher.key ? (
                                                                    <span className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-lg bg-red-50 border border-red-100 shrink-0">
                                                                        <span className="text-[11px] font-black text-red-600">
                                                                            ¿Quitar?
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            title="Sí, quitar"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                removeTeacher(index)
                                                                            }}
                                                                            className="w-6 h-6 grid place-items-center rounded text-red-600 hover:bg-red-100 cursor-pointer"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title="Cancelar"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setConfirmDeleteKey(null)
                                                                            }}
                                                                            className="w-6 h-6 grid place-items-center rounded text-gray-500 hover:bg-gray-200 cursor-pointer"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 shrink-0">
                                                                        <button
                                                                            type="button"
                                                                            title={isSelected ? "Cerrar edición" : "Editar docente"}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                selectTeacher(teacher.key)
                                                                            }}
                                                                            className={`${iconButtonClass} ${isSelected
                                                                                ? "text-[#4d0706] bg-[#4d0706]/10"
                                                                                : "text-gray-300 group-hover:text-[#4d0706] group-hover:bg-[#4d0706]/5"
                                                                                }`}
                                                                        >
                                                                            {isSelected ? (
                                                                                <X className="w-4 h-4" />
                                                                            ) : (
                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            title="Quitar docente"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setConfirmDeleteKey(teacher.key)
                                                                            }}
                                                                            className={`${iconButtonClass} text-gray-300 hover:text-red-600 hover:bg-red-50`}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {!isDesktop && isSelected && (
                                                                <div
                                                                    className="px-3 sm:px-4 pb-4 pt-3 border-t border-dashed border-gray-100 bg-[#4d0706]/[0.02]"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Escape") {
                                                                            e.preventDefault()
                                                                            setConfirmDeleteKey(null)
                                                                            setExpandedTeacher(null)
                                                                        }
                                                                    }}
                                                                >
                                                                    {renderTeacherFields(teacher, index, "inline", previewUrl)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>

                                        {stepError("docentes") && <p className={errorClass}>{stepError("docentes")}</p>}
                                    </div>

                                    {isDesktop && (
                                        <aside className="lg:col-span-4 lg:sticky lg:top-0">
                                            {selectedTeacher && selectedTeacherIndex >= 0 ? (
                                                <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-[0_1px_3px_rgba(77,7,6,0.06)]">
                                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                                                        <div className="min-w-0 flex-1">
                                                            <p className={compactLabelClass}>
                                                                Docente {selectedTeacherIndex + 1}
                                                            </p>
                                                            <p className="text-sm font-black text-gray-900 truncate">
                                                                {selectedTeacher.name.trim() || "Sin nombre"}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            title="Cerrar edición"
                                                            onClick={() => setExpandedTeacher(null)}
                                                            className="grid w-8 h-8 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#4d0706] cursor-pointer transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div
                                                        className="p-3"
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Escape") {
                                                                e.preventDefault()
                                                                setExpandedTeacher(null)
                                                            }
                                                        }}
                                                    >
                                                        {renderTeacherFields(
                                                            selectedTeacher,
                                                            selectedTeacherIndex,
                                                            "panel",
                                                            selectedPreviewUrl,
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-gray-100 bg-gray-50/60">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedTeacher(null)}
                                                            className="inline-flex items-center h-9 px-4 rounded-xl text-xs font-black text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer transition-colors"
                                                        >
                                                            Listo
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid place-items-center gap-1.5 px-4 py-10 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
                                                    <Users className="w-8 h-8 text-gray-200" />
                                                    <p className="text-xs font-bold text-gray-400">
                                                        Elegí un docente de la lista para editarlo.
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">
                                                        O sumá uno nuevo con «Agregar docente».
                                                    </p>
                                                </div>
                                            )}
                                        </aside>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === "inscripcion" && (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                                <div className="space-y-5 lg:col-span-7">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className={labelClass} htmlFor="curso-inscripcion">
                                                Inscripción <RequiredMark />
                                            </label>
                                            <input
                                                id="curso-inscripcion"
                                                className={inputClass}
                                                value={inscription}
                                                onChange={(e) => setInscription(limpiarTexto(e.target.value))}
                                                placeholder="Ej.: Septiembre 2026"
                                                maxLength={60}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass} htmlFor="curso-mes">
                                                Mes de inicio
                                            </label>
                                            <select
                                                id="curso-mes"
                                                className={inputClass}
                                                value={month}
                                                onChange={(e) => setMonth(e.target.value)}
                                            >
                                                <option value="">Sin especificar</option>
                                                {MESES.map((m) => (
                                                    <option key={m} value={m}>
                                                        {m}
                                                    </option>
                                                ))}
                                                {/* Valor heredado que no sea un mes del listado. */}
                                                {month && !esMes(month) && <option value={month}>{month}</option>}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className={labelClass} htmlFor="curso-cursado">
                                                Cronograma de cursada <RequiredMark />
                                            </label>
                                            <input
                                                id="curso-cursado"
                                                className={inputClass}
                                                value={schedule}
                                                onChange={(e) => setSchedule(limpiarTexto(e.target.value))}
                                                placeholder="Ej.: Lunes a Jueves de 20:30hs a 23:15hs"
                                                maxLength={200}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className={labelClass} htmlFor="curso-cupo">
                                                Cupo de titulares
                                            </label>
                                            <input
                                                id="curso-cupo"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                autoComplete="off"
                                                className={inputClass}
                                                value={cupo > 0 ? String(cupo) : ""}
                                                placeholder="Sin cupo cargado: todos serán suplentes."
                                                onChange={(e) => {
                                                    const digitos = soloDigitos(e.target.value).slice(0, 3)
                                                    setCupo(
                                                        digitos
                                                            ? Math.min(
                                                                MAX_CUPO_TITULARES,
                                                                Math.max(MIN_CUPO_TITULARES, Number(digitos)),
                                                            )
                                                            : MIN_CUPO_TITULARES,
                                                    )
                                                }}
                                                onFocus={(e) => e.currentTarget.select()}
                                            />
                                            {cupo > 0 && (
                                                <p className={hintClass}>
                                                    Los primeros {cupo} participantes serán titulares.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[11px] font-medium text-gray-400 leading-relaxed flex items-start gap-2">
                                        <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                        Guardá y la información queda publicada en la página de la carrera al instante.
                                    </p>
                                </div>

                                <div className="lg:col-span-5">
                                    <Section title="Video" hint="Opcional.">
                                        {currentVideo ? (
                                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                                <video
                                                    src={currentVideo}
                                                    preload="metadata"
                                                    muted
                                                    playsInline
                                                    className="w-full h-40 object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-9 text-center">
                                                <Film className="w-7 h-7 text-gray-300" />
                                                <p className="text-xs font-bold text-gray-400">
                                                    Todavía no hay un video cargado.
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <input
                                                type="file"
                                                accept="video/webm,video/mp4,video/ogg"
                                                className="hidden"
                                                id="curso-video"
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                    setVideoFile(e.target.files?.[0] ?? null)
                                                    setRemoveVideo(false)
                                                }}
                                            />
                                            <label htmlFor="curso-video" className={fileButtonClass}>
                                                <Upload className="w-3.5 h-3.5" />
                                                {currentVideo ? "Reemplazar video" : "Subir video"}
                                            </label>
                                            {currentVideo && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVideoFile(null)
                                                        setRemoveVideo(true)
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                        {videoFile && (
                                            <p className="text-[11px] font-bold text-[#4d0706] mt-2 truncate">
                                                {videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                                            </p>
                                        )}
                                    </Section>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="flex items-start gap-2.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </p>
                        )}
                    </div>
                </form>

                <footer className="shrink-0 bg-white border-t border-gray-100">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 2xl:px-12">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={stepIndex === 0}
                            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Anterior</span>
                        </button>

                        <p className="hidden sm:block min-w-0 truncate text-[11px] font-bold text-gray-400">
                            Paso {stepIndex + 1} de {STEPS.length} · {STEPS[stepIndex]?.label}
                        </p>

                        {stepIndex < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] cursor-pointer transition-colors shrink-0"
                            >
                                Siguiente
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                form="curso-form"
                                disabled={saving}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] disabled:opacity-60 cursor-pointer transition-colors shrink-0"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : curso ? (
                                    <Save className="w-4 h-4" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                {saving ? "Guardando..." : curso ? "Guardar cambios" : "Crear"}
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    )
}