import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    GraduationCap,
    Loader2,
    Plus,
    Save,
    Trash2,
    Upload,
    X,
} from "lucide-react"
import { api, type ConfigSyllabusEntry, type ConfigTeacher, type CursoConfig } from "@/api"
import { CAREER_DATA, type Career } from "@/config/careerData"
import { CAREER_VIDEOS } from "@/config/careerVideos"
import { getImageFor, useSiteConfig } from "@/siteConfig"
import { MAX_CUPO_TITULARES, MIN_CUPO_TITULARES } from "@/lib/titulares"

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
    /** URL que ya está guardada en el servidor. */
    image: string
    /** Archivo nuevo elegido en este momento, todavía no subido. */
    file: File | null
    /** El admin marcó borrar la foto: se manda en el payload y el server la elimina. */
    removeImage: boolean
}

/* ---------- estilos ---------- */

const inputClass =
    "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all duration-300"

const textareaClass =
    "w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all duration-300"

const labelClass = "text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5"
const hintClass = "text-[11px] text-gray-400 font-medium mt-1.5"
const errorClass = "text-[11px] text-red-600 font-bold mt-1.5"

const fileButtonClass =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-[#4d0706] " +
    "bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer transition-colors"

/* ---------- pasos ---------- */

type StepId = "identidad" | "contenido" | "ejes" | "salida" | "docentes" | "inscripcion"

interface Step {
    id: StepId
    label: string
    short: string
}

const STEPS: Step[] = [
    { id: "identidad", label: "Identidad", short: "Identidad" },
    { id: "contenido", label: "Contenido", short: "Contenido" },
    { id: "ejes", label: "Ejes de formación", short: "Ejes" },
    { id: "salida", label: "Salida y requisitos", short: "Salida" },
    { id: "docentes", label: "Docentes", short: "Docentes" },
    { id: "inscripcion", label: "Inscripción", short: "Inscripción" },
]

/* ---------- helpers ---------- */

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

/**
 * Combina la career hardcodeada con lo que hay overrides en la config del
 * servidor, para que al editar una carrera el formulario muestre lo que
 * realmente se está viendo en la web y no el texto original del repo.
 */
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

/** Solo los campos presentes en la config pisan el dato original. */
/** Campos de la config que no son parte del tipo Career. */
const CONFIG_ONLY_KEYS = new Set(["available", "image", "cantidadTitulares", "teacher", "video", "ejes"])

function pickDefined(data: CursoConfig): Partial<Career> {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || CONFIG_ONLY_KEYS.has(key)) continue
        out[key] = value
    }
    return out as Partial<Career>
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
    const [longDescription, setLongDescription] = useState(view?.longDescription || "")
    const [duration, setDuration] = useState(view?.duration || "")
    const [modality, setModality] = useState(view?.modality || "Presencial")
    const [category, setCategory] = useState<NonNullable<Career["category"]>>(
        view?.category || (isCurso ? "curso-presencial" : "carrera"),
    )
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [removeImage, setRemoveImage] = useState(false)

    const [syllabus, setSyllabus] = useState<ConfigSyllabusEntry[]>(() => {
        if (view?.syllabus?.length) return view.syllabus.map((s) => ({ year: s.year, subjects: [...s.subjects] }))
        if (data?.ejes) return [{ year: "Nivel Único", subjects: splitLines(data.ejes) }]
        return [{ year: "", subjects: [] }]
    })

    const [salida, setSalida] = useState(toListText(view?.salidaLaboral))
    const [perfil, setPerfil] = useState(toListText(view?.perfilEgresado))
    const [inscriptionDocs, setInscriptionDocs] = useState(view?.inscriptionDocs || "")
    const [inscriptionFee, setInscriptionFee] = useState(view?.inscriptionFee || "")

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
    const [month, setMonth] = useState(view?.month || data?.month || "")
    const [schedule, setSchedule] = useState(view?.schedule || data?.schedule || "")
    const [cupo, setCupo] = useState(
        typeof data?.cantidadTitulares === "number" ? Math.trunc(data.cantidadTitulares) : 0,
    )
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [removeVideo, setRemoveVideo] = useState(false)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [touched, setTouched] = useState<Partial<Record<StepId, boolean>>>({})

    const currentImage = useMemo(() => {
        if (imageFile) return URL.createObjectURL(imageFile)
        if (removeImage || !curso) return ""
        return getImageFor(curso.id, config)
    }, [imageFile, removeImage, curso, config])

    const currentVideo = useMemo(() => {
        if (videoFile) return URL.createObjectURL(videoFile)
        if (removeVideo || !curso) return ""
        return data?.video || (CAREER_VIDEOS[curso.id]?.[0] ?? "")
    }, [videoFile, removeVideo, curso, data])

    /* ---------- validación ---------- */

    const validations: Record<StepId, () => string> = {
        identidad: () => (name.trim() ? "" : "Poné el nombre de la carrera o el curso."),
        contenido: () => {
            if (!description.trim()) return "La descripción corta es obligatoria: es la que se ve en el header."
            if (!longDescription.trim()) return "La descripción completa es obligatoria."
            if (!duration.trim()) return "Indicá la duración."
            if (!modality.trim()) return "Indicá la modalidad."
            return ""
        },
        ejes: () => {
            const filled = syllabus.some((s) => s.subjects.length > 0)
            return filled ? "" : "Cargá al menos un eje de formación."
        },
        salida: () => {
            if (!splitLines(salida).length) return "Cargá al menos una salida laboral."
            if (!inscriptionDocs.trim()) return "Indicá los requisitos de inscripción."
            if (!inscriptionFee.trim()) return "Indicá el arancel."
            return ""
        },
        docentes: () => {
            const conNombre = teachers.filter((t) => t.name.trim())
            if (!conNombre.length) return "Cargá al menos un docente."
            return ""
        },
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

    /* ---------- envío ---------- */

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
            form.append("longDescription", longDescription.trim())
            form.append("duration", duration.trim())
            form.append("modality", modality.trim())
            form.append("category", category)
            form.append("syllabus", JSON.stringify(syllabus.filter((s) => s.subjects.length > 0)))
            form.append("salidaLaboral", JSON.stringify(splitLines(salida)))
            form.append("perfilEgresado", JSON.stringify(splitLines(perfil)))
            form.append("inscriptionDocs", inscriptionDocs.trim())
            form.append("inscriptionFee", inscriptionFee.trim())
            form.append("teachers", JSON.stringify(teacherPayload))
            form.append("inscriptionDate", inscription.trim())
            form.append("month", month.trim())
            form.append("schedule", schedule.trim())

            if (!isCurso) form.append("cantidadTitulares", String(cupo))
            if (removeImage) form.append("removeImage", "true")
            if (imageFile) form.append("image", imageFile)
            if (removeVideo) form.append("removeVideo", "true")
            if (videoFile) form.append("video", videoFile)
            // El índice en el nombre es lo que le permite al server saber a
            // qué docente pertenece cada foto.
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

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 sm:flex sm:items-center sm:justify-center sm:p-4 lg:p-0"
            onClick={onClose}
        >
            <div
                className="bg-white w-full h-full flex flex-col sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl lg:max-w-none lg:max-h-none lg:h-full lg:rounded-none"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="shrink-0 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between px-5 py-4 lg:max-w-6xl lg:mx-auto">
                        <div className="min-w-0">
                            <h3 className="text-lg font-black text-[#4d0706]">
                                {curso ? "Editar" : "Nueva"} {isCurso ? "curso" : "carrera"}
                            </h3>
                            {name.trim() && (
                                <p className="text-[11px] font-bold text-gray-400 truncate mt-0.5">{name.trim()}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            title="Cerrar"
                            className="text-gray-400 hover:text-[#4d0706] cursor-pointer shrink-0"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navegación de pasos */}
                    <div className="px-5 pb-4 lg:max-w-6xl lg:mx-auto">
                        <ol className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-colors cursor-pointer ${
                                                state === "current"
                                                    ? "bg-[#4d0706] text-[#ffcc00]"
                                                    : state === "done"
                                                      ? "bg-[#4d0706]/5 text-[#4d0706] hover:bg-[#4d0706]/10"
                                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                            }`}
                                        >
                                            {state === "done" ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                                            <span className="hidden sm:inline">{s.short}</span>
                                        </button>
                                        {i < STEPS.length - 1 && (
                                            <span className="w-3 h-px bg-gray-200" aria-hidden="true" />
                                        )}
                                    </li>
                                )
                            })}
                        </ol>
                    </div>
                </div>

                <form
                    id="curso-form"
                    onSubmit={handleSubmit}
                    className="flex-1 min-h-0 overflow-y-auto p-5 pb-6 space-y-6 lg:max-w-6xl lg:mx-auto"
                >
                    {step === "identidad" && (
                        <div className="space-y-6">
                            <Section title="Nombre" hint={`Es el título que se ve en el header de la página.`}>
                                <input
                                    className={inputClass}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
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
                            </Section>

                            <Section title="Tipo" hint="Define cómo se agrupa en la oferta educativa del home.">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {(
                                        [
                                            { value: "carrera", label: "Carrera técnica" },
                                            { value: "curso-presencial", label: "Curso presencial" },
                                            { value: "curso-virtual", label: "Curso virtual" },
                                        ] as const
                                    ).map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setCategory(opt.value)}
                                            className={`px-4 py-3 rounded-xl text-xs font-black border transition-colors cursor-pointer ${
                                                category === opt.value
                                                    ? "border-[#4d0706] bg-[#4d0706]/5 text-[#4d0706]"
                                                    : "border-gray-200 bg-gray-50/50 text-gray-500 hover:bg-gray-100"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </Section>

                            <Section
                                title="Logo"
                                hint="Opcional. Es la imagen redonda del header y la del admin. Si no la subís, se usa la que ya tiene la carrera."
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-50 border border-gray-200 shrink-0 grid place-items-center">
                                        {currentImage ? (
                                            <img src={currentImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <GraduationCap className="w-8 h-8 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="min-w-0 space-y-2">
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
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label htmlFor="curso-logo" className={fileButtonClass}>
                                                <Upload className="w-3.5 h-3.5" />
                                                Subir logo
                                            </label>
                                            {(imageFile || (!removeImage && currentImage)) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null)
                                                        setRemoveImage(true)
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                        {imageFile && (
                                            <p className="text-[11px] font-bold text-[#4d0706] truncate">{imageFile.name}</p>
                                        )}
                                        {removeImage && <p className={errorClass}>Se va a quitar al guardar.</p>}
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}

                    {step === "contenido" && (
                        <div className="space-y-6">
                            <Section title="Descripción corta" hint="Es el texto que aparece debajo del título en el header.">
                                <textarea
                                    rows={3}
                                    className={textareaClass}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ej.: Habilidades y conocimiento en funcionamiento de un motor, puesta a punto e inyección electrónica."
                                    maxLength={400}
                                    required
                                />
                                {stepError("contenido") === "La descripción corta es obligatoria: es la que se ve en el header." && (
                                    <p className={errorClass}>La descripción corta es obligatoria.</p>
                                )}
                            </Section>

                            <Section title="Descripción completa" hint="El detalle de la carrera, de dos a cuatro oraciones.">
                                <textarea
                                    rows={6}
                                    className={textareaClass}
                                    value={longDescription}
                                    onChange={(e) => setLongDescription(e.target.value)}
                                    placeholder="Ej.: Formación integral en mecánica del automotor con enfoque en diagnóstico, mantenimiento y reparación…"
                                    maxLength={3000}
                                    required
                                />
                            </Section>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass} htmlFor="curso-duracion">
                                        Duración *
                                    </label>
                                    <input
                                        id="curso-duracion"
                                        className={inputClass}
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="Ej.: 3 años"
                                        maxLength={60}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass} htmlFor="curso-modalidad">
                                        Modalidad *
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
                        <div className="space-y-5">
                            <p className="text-xs font-medium text-gray-500 leading-relaxed">
                                Cada año tiene su propio listado de ejes. Si la carrera es de un solo nivel, dejá el año
                                vacío y se muestra como "Nivel Único".
                            </p>

                            {syllabus.map((entry, i) => (
                                <div key={i} className="border border-gray-200 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            className={inputClass + " h-10 flex-1"}
                                            value={entry.year}
                                            onChange={(e) =>
                                                setSyllabus((prev) =>
                                                    prev.map((s, idx) => (idx === i ? { ...s, year: e.target.value } : s)),
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
                                        <textarea
                                            rows={4}
                                            className={textareaClass}
                                            value={entry.subjects.join("\n")}
                                            onChange={(e) =>
                                                setSyllabus((prev) =>
                                                    prev.map((s, idx) =>
                                                        idx === i ? { ...s, subjects: splitLines(e.target.value) } : s,
                                                    ),
                                                )
                                            }
                                            placeholder={"Un eje por línea\nEj.: Funcionamiento de un Motor\nPuesta a Punto"}
                                        />
                                        <p className={hintClass}>Un eje por línea.</p>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => setSyllabus((prev) => [...prev, { year: "", subjects: [] }])}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Agregar año
                            </button>
                            {stepError("ejes") && <p className={errorClass}>{stepError("ejes")}</p>}
                        </div>
                    )}

                    {step === "salida" && (
                        <div className="space-y-6">
                            <Section title="Salida laboral" hint="Dónde puede trabajar el egresado. Una opción por línea.">
                                <textarea
                                    rows={5}
                                    className={textareaClass}
                                    value={salida}
                                    onChange={(e) => setSalida(e.target.value)}
                                    placeholder={"Agencias y Concesionarias Oficiales\nFlotas de Transporte y Logística"}
                                    required
                                />
                            </Section>

                            <Section title="Perfil del egresado" hint="Qué sabe hacer al terminar. Opcional.">
                                <textarea
                                    rows={4}
                                    className={textareaClass}
                                    value={perfil}
                                    onChange={(e) => setPerfil(e.target.value)}
                                    placeholder={"Diagnóstico y reparación de motores\nPuesta a punto de sistemas mecánicos"}
                                />
                                <p className={hintClass}>Un ítem por línea.</p>
                            </Section>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass} htmlFor="curso-docs">
                                        Requisitos de inscripción *
                                    </label>
                                    <input
                                        id="curso-docs"
                                        className={inputClass}
                                        value={inscriptionDocs}
                                        onChange={(e) => setInscriptionDocs(e.target.value)}
                                        placeholder="Ej.: Fotocopia de DNI"
                                        maxLength={300}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass} htmlFor="curso-arancel">
                                        Arancel *
                                    </label>
                                    <input
                                        id="curso-arancel"
                                        className={inputClass}
                                        value={inscriptionFee}
                                        onChange={(e) => setInscriptionFee(e.target.value)}
                                        placeholder="Ej.: $50.000"
                                        maxLength={60}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "docentes" && (
                        <div className="space-y-5">
                            <p className="text-xs font-medium text-gray-500 leading-relaxed">
                                La foto es opcional: si no la subís, se muestran las iniciales del docente.
                            </p>

                            {teachers.map((teacher, i) => (
                                <div key={teacher.key} className="border border-gray-200 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-50 border border-gray-200 shrink-0 grid place-items-center">
                                            {teacher.file ? (
                                                <img
                                                    src={URL.createObjectURL(teacher.file)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : teacher.image && !teacher.removeImage ? (
                                                <img src={teacher.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-black text-gray-300">
                                                    {teacher.name.trim().charAt(0).toUpperCase() || "?"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={labelClass}>Nombre *</label>
                                                    <input
                                                        className={inputClass + " h-10"}
                                                        value={teacher.name}
                                                        onChange={(e) =>
                                                            setTeachers((prev) =>
                                                                prev.map((t, idx) =>
                                                                    idx === i ? { ...t, name: e.target.value } : t,
                                                                ),
                                                            )
                                                        }
                                                        placeholder="Ej.: Alonzo, Ariel Alberto"
                                                        maxLength={120}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Cargo</label>
                                                    <input
                                                        className={inputClass + " h-10"}
                                                        value={teacher.title}
                                                        onChange={(e) =>
                                                            setTeachers((prev) =>
                                                                prev.map((t, idx) =>
                                                                    idx === i ? { ...t, title: e.target.value } : t,
                                                                ),
                                                            )
                                                        }
                                                        placeholder="Ej.: Auxiliar Técnico Automotor"
                                                        maxLength={160}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className={labelClass}>Legajo</label>
                                                <input
                                                    className={inputClass + " h-10"}
                                                    value={teacher.legajo}
                                                    onChange={(e) =>
                                                        setTeachers((prev) =>
                                                            prev.map((t, idx) =>
                                                                idx === i ? { ...t, legajo: e.target.value } : t,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="Ej.: 14594- L.8 - F. 106/107"
                                                    maxLength={80}
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    id={`docente-foto-${teacher.key}`}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                        const file = e.target.files?.[0] ?? null
                                                        setTeachers((prev) =>
                                                            prev.map((t, idx) =>
                                                                idx === i ? { ...t, file, removeImage: false } : t,
                                                            ),
                                                        )
                                                    }}
                                                />
                                                <label htmlFor={`docente-foto-${teacher.key}`} className={fileButtonClass}>
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Subir foto
                                                </label>
                                                {(teacher.file || (teacher.image && !teacher.removeImage)) && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setTeachers((prev) =>
                                                                prev.map((t, idx) =>
                                                                    idx === i
                                                                        ? { ...t, file: null, image: "", removeImage: true }
                                                                        : t,
                                                                ),
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Quitar
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setTeachers((prev) => prev.filter((_, idx) => idx !== i))}
                                                    title="Quitar docente"
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-gray-500 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    Quitar docente
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => setTeachers((prev) => [...prev, emptyTeacher()])}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 cursor-pointer transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Agregar docente
                            </button>
                            {stepError("docentes") && <p className={errorClass}>{stepError("docentes")}</p>}
                        </div>
                    )}

                    {step === "inscripcion" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass} htmlFor="curso-inscripcion">
                                        Inscripción *
                                    </label>
                                    <input
                                        id="curso-inscripcion"
                                        className={inputClass}
                                        value={inscription}
                                        onChange={(e) => setInscription(e.target.value)}
                                        placeholder="Ej.: Septiembre 2026"
                                        maxLength={60}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass} htmlFor="curso-mes">
                                        Mes de inicio
                                    </label>
                                    <input
                                        id="curso-mes"
                                        className={inputClass}
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        placeholder="Ej.: Octubre"
                                        maxLength={40}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass} htmlFor="curso-cursado">
                                    Cronograma de cursada *
                                </label>
                                <input
                                    id="curso-cursado"
                                    className={inputClass}
                                    value={schedule}
                                    onChange={(e) => setSchedule(e.target.value)}
                                    placeholder="Ej.: Lunes a Jueves de 20:30hs a 23:15hs"
                                    maxLength={200}
                                    required
                                />
                                <p className={hintClass}>
                                    En el mobile se parte por "de": escribí "Lunes a Jueves de 20:30hs a 23:15hs".
                                </p>
                            </div>

                            {!isCurso && (
                                <div>
                                    <label className={labelClass} htmlFor="curso-cupo">
                                        Cupo de titulares
                                    </label>
                                    <input
                                        id="curso-cupo"
                                        type="number"
                                        inputMode="numeric"
                                        className={inputClass}
                                        value={cupo}
                                        min={MIN_CUPO_TITULARES}
                                        max={MAX_CUPO_TITULARES}
                                        onChange={(e) =>
                                            setCupo(
                                                Math.min(
                                                    MAX_CUPO_TITULARES,
                                                    Math.max(MIN_CUPO_TITULARES, Math.trunc(Number(e.target.value) || 0)),
                                                ),
                                            )
                                        }
                                    />
                                    <p className={hintClass}>
                                        {cupo > 0
                                            ? `Los primeros ${cupo} participantes serán titulares.`
                                            : "Sin cupo cargado: todos serán suplentes."}
                                    </p>
                                </div>
                            )}

                            <Section
                                title="Video"
                                hint="Opcional. WebM o MP4 de hasta 50MB. Si no subís ninguno, se muestra el video que ya tenga la carrera."
                            >
                                <div className="flex flex-wrap items-center gap-2">
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
                                        Subir video
                                    </label>
                                    {(videoFile || (!removeVideo && currentVideo)) && (
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
                                {!videoFile && !removeVideo && currentVideo && (
                                    <p className={hintClass}>Video actual: {currentVideo.split("/").pop()}</p>
                                )}
                                {removeVideo && <p className={errorClass}>Se va a quitar al guardar.</p>}
                            </Section>

                            <p className="text-[11px] font-medium text-gray-400 leading-relaxed flex items-start gap-2">
                                <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                Guardá y la información queda publicada en la página de la carrera al instante.
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="flex items-start gap-2.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </p>
                    )}
                </form>

                <div className="shrink-0 bg-white border-t border-gray-100">
                    <div className="flex items-center justify-between gap-3 px-5 py-4 lg:max-w-6xl lg:mx-auto">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={stepIndex === 0}
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Anterior</span>
                        </button>

                        {stepIndex < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] cursor-pointer transition-colors"
                            >
                                Siguiente
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                form="curso-form"
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] disabled:opacity-60 cursor-pointer transition-colors"
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
                </div>
            </div>
        </div>
    )
}
