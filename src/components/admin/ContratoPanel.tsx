import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react"
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Check,
    CheckCircle2,
    ChevronDown,
    FileText,
    FileUp,
    GripVertical,
    Lightbulb,
    Loader2,
    MoreHorizontal,
    MousePointerClick,
    Plus,
    RotateCcw,
    Trash2,
    TriangleAlert,
    Undo2,
} from "lucide-react"
import { api } from "@/api"
import ConfirmDialog from "@/components/admin/ConfirmDialog"
import { useSiteConfig } from "@/siteConfig"
import {
    CONTRACT_CONTENT,
    CONTRACT_MARKER_LABELS,
    CONTRACT_MARKERS,
    EXTRA_STUDENT_MARKERS,
    MARKER_SPLIT_RE,
    type ContractMarker,
} from "@/pdf/contractContent"
import { parseContractDocx } from "@/pdf/parseContractDocx"
import { generateContractBlob } from "@/pdf/downloadContract"
import { esPersonalizado } from "@/components/features/home/form/formSchema"
import IntroEditor, { FIELD_DRAG_TYPE, type IntroEditorHandle, type LabelFor } from "@/components/admin/contrato/IntroEditor"
import { AutoTextarea, ClauseEditor, ClauseRow, INPUT } from "@/components/admin/contrato/ClauseCard"
import Sheet from "@/components/admin/contrato/Sheet"
import {
    MAX_TEXT,
    SAMPLE,
    SAMPLE_BY_MARKER,
    isEmptyClause,
    newId,
    readStored,
    renumber,
    snapshot,
    toContent,
    toDraft,
    writeStored,
    type Draft,
    type DraftClause,
} from "@/components/admin/contrato/draft"

interface Props {
    token: string
}

type Tab = "encabezado" | "parrafo" | "clausulas"

const TABS: { id: Tab; label: string }[] = [
    { id: "encabezado", label: "Encabezado" },
    { id: "parrafo", label: "Párrafo" },
    { id: "clausulas", label: "Cláusulas" },
]

/** Caja de una línea con su nombre arriba. text-base en el celular evita el zoom del iPhone. */
function LabeledInput({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange(v: string): void; placeholder: string; className?: string }) {
    return (
        <label className="block">
            <span className="block mb-1 text-xs font-bold text-gray-500">{label}</span>
            {/* Crece hacia abajo si el texto es largo, en vez de cortarlo. */}
            <AutoTextarea
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                placeholder={placeholder}
                maxLength={200}
                className={`${INPUT} ${className}`}
            />
        </label>
    )
}

function SectionTitle({ step, title, hint }: { step: number; title: string; hint: string }) {
    return (
        <div className="flex items-start gap-3 mb-4">
            <span className="hidden lg:flex w-7 h-7 rounded-full bg-[#ffcc00] text-[#4d0706] text-xs font-black items-center justify-center shrink-0">{step}</span>
            <div>
                <h2 className="text-base lg:text-sm font-black text-gray-900">{title}</h2>
                <p className="text-[13px] lg:text-xs text-gray-500 font-medium">{hint}</p>
            </div>
        </div>
    )
}

function FieldGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#4d0706]/60 mb-1.5">{title}</p>
            {hint && <p className="text-[11px] text-gray-500 font-medium mb-1.5">{hint}</p>}
            <div className="flex flex-wrap gap-1.5">{children}</div>
        </div>
    )
}

function NextButton({ label, onClick }: { label: string; onClick(): void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="lg:hidden mt-6 w-full h-12 rounded-xl bg-gray-100 text-[15px] font-black text-[#4d0706] inline-flex items-center justify-center gap-2 active:bg-gray-200 cursor-pointer"
        >
            Siguiente: {label}
            <ArrowRight className="w-4 h-4" />
        </button>
    )
}

const HELP_STEPS = [
    "Escribí en cualquier caja, como en Word.",
    "Para poner un dato del alumno, tocá el párrafo donde va y después el dato en la barra amarilla.",
    "Tocá una cláusula para abrirla y cambiarla.",
    "Tocá «Ver PDF» para ver cómo queda y después «Guardar cambios».",
]

export default function ContratoPanel({ token }: Props) {
    const { contract, refresh, formOptions } = useSiteConfig()
    const saved = useMemo(() => contract ?? CONTRACT_CONTENT, [contract])
    const savedSnap = useMemo(() => snapshot(toDraft(saved)), [saved])

    const [draft, setDraft] = useState<Draft>(() => toDraft(saved))
    /** Contrato (en texto) sobre el que se empezó a editar; contra eso se compara si hay cambios. */
    const [baseSnap, setBaseSnap] = useState<string | null>(null)
    /** Último contrato guardado que ya se sincronizó con el borrador. */
    const [syncedSnap, setSyncedSnap] = useState<string | null>(null)

    const panelRef = useRef<HTMLDivElement>(null)
    const introEditor = useRef<IntroEditorHandle>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const dragDepth = useRef(0)

    const [saving, setSaving] = useState(false)
    const [reading, setReading] = useState(false)
    const [previewing, setPreviewing] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState("")
    const [deleted, setDeleted] = useState<{ clause: DraftClause; index: number } | null>(null)

    const [tab, setTab] = useState<Tab>("encabezado")
    const [showMoreFields, setShowMoreFields] = useState(false)
    const [optionsOpen, setOptionsOpen] = useState(false)
    const [wordDragOver, setWordDragOver] = useState(false)
    /** Word elegido mientras había cambios sin guardar: se pide confirmación antes de reemplazarlos. */
    const [pendingWord, setPendingWord] = useState<File | null>(null)
    /** Cláusula que se está editando en la ventana. */
    const [openId, setOpenId] = useState<string | null>(null)
    const [clauseOpen, setClauseOpen] = useState(false)
    const [newClauseId, setNewClauseId] = useState<string | null>(null)

    const currentSnap = useMemo(() => snapshot(draft), [draft])
    const dirty = baseSnap !== null && currentSnap !== baseSnap
    const isCustom = Boolean(contract)
    const introTooLong = draft.intro.length > MAX_TEXT
    const usedKeys = useMemo(
        () => new Set(Array.from(draft.intro.matchAll(new RegExp(MARKER_SPLIT_RE.source, "g")), (m) => m[1].slice(1, -1))),
        [draft.intro],
    )
    const missingName = !usedKeys.has("ALUMNO") && !(usedKeys.has("APELLIDO") && usedKeys.has("NOMBRE"))

    // Preguntas que el admin agregó en la pestaña Formulario: también se pueden usar.
    const customFields = useMemo(
        () => formOptions.campos.filter(esPersonalizado).map((c) => ({ id: c.id, label: c.label.trim() || "Pregunta sin nombre" })),
        [formOptions],
    )
    const labelFor = useCallback<LabelFor>(
        (key) =>
            key in CONTRACT_MARKER_LABELS
                ? CONTRACT_MARKER_LABELS[key as ContractMarker]
                : (customFields.find((f) => f.id === key)?.label ?? null),
        [customFields],
    )
    const moreCount = EXTRA_STUDENT_MARKERS.length + customFields.length + 2

    // Cuando llega (o cambia) el contrato guardado: si no hay cambios a medio
    // hacer, se muestra ese. Si había un borrador sin guardar de otra visita, se recupera.
    // Se hace durante el render (no en un efecto) para no pintar un estado viejo.
    if (syncedSnap !== savedSnap) {
        setSyncedSnap(savedSnap)
        const wasDirty = baseSnap !== null && snapshot(draft) !== baseSnap
        if (!wasDirty) {
            const stored = readStored()
            if (stored && stored.base === savedSnap && snapshot(stored.draft) !== savedSnap) {
                setDraft(stored.draft)
                setNotice("Recuperamos los cambios que no habías guardado.")
            } else {
                setDraft(toDraft(saved))
            }
        }
        setBaseSnap(savedSnap)
    }

    // Borrador automático, para no perder nada si se cambia de pestaña.
    useEffect(() => {
        if (baseSnap === null) return
        if (dirty) writeStored({ base: baseSnap, draft })
        else if (readStored()?.base === baseSnap) writeStored(null)
    }, [draft, dirty, baseSnap])

    useEffect(() => {
        if (!dirty) return
        const warn = (e: BeforeUnloadEvent) => e.preventDefault()
        window.addEventListener("beforeunload", warn)
        return () => window.removeEventListener("beforeunload", warn)
    }, [dirty])

    useEffect(() => {
        if (!deleted) return
        const t = setTimeout(() => setDeleted(null), 8000)
        return () => clearTimeout(t)
    }, [deleted])

    const update = (patch: Partial<Draft>) => {
        setNotice("")
        setError("")
        setDraft((d) => ({ ...d, ...patch }))
    }
    const setClauses = (fn: (c: DraftClause[]) => DraftClause[]) => {
        setNotice("")
        setDraft((d) => ({ ...d, clauses: fn(d.clauses) }))
    }

    const goTab = (next: Tab) => {
        setTab(next)
        const top = panelRef.current?.getBoundingClientRect().top
        if (top !== undefined && top < 0) window.scrollBy({ top: top - 80, behavior: "smooth" })
    }

    /* ---------- Cláusulas ---------- */

    const openIndex = draft.clauses.findIndex((c) => c.id === openId)
    const openClause = openIndex >= 0 ? draft.clauses[openIndex] : null

    const openClauseSheet = (id: string) => {
        setNewClauseId(null)
        setOpenId(id)
        setClauseOpen(true)
    }
    const closeClauseSheet = () => {
        // Una cláusula nueva que quedó vacía se descarta sola.
        if (openClause && isEmptyClause(openClause)) setClauses((cs) => renumber(cs.filter((c) => c.id !== openClause.id)))
        setClauseOpen(false)
        setNewClauseId(null)
    }
    const addClause = () => {
        const id = newId()
        setClauses((cs) => renumber([...cs, { id, heading: `${cs.length + 1}) `, items: [], body: "" }]))
        setOpenId(id)
        setNewClauseId(id)
        setClauseOpen(true)
        setDeleted(null)
    }
    const moveClause = (i: number, dir: -1 | 1) =>
        setClauses((cs) => {
            const j = i + dir
            if (j < 0 || j >= cs.length) return cs
            const next = [...cs]
            ;[next[i], next[j]] = [next[j], next[i]]
            return renumber(next)
        })
    const deleteClause = (i: number) => {
        const clause = draft.clauses[i]
        if (!clause) return
        if (!isEmptyClause(clause)) setDeleted({ clause, index: i })
        setClauses((cs) => renumber(cs.filter((_, j) => j !== i)))
    }
    const undoDelete = () => {
        if (!deleted) return
        setClauses((cs) => {
            const next = [...cs]
            next.splice(Math.min(deleted.index, next.length), 0, deleted.clause)
            return renumber(next)
        })
        setDeleted(null)
    }

    /* ---------- Datos del alumno ---------- */

    /** Inserta el dato donde está el cursor. Si vino de "Más datos", la lista se cierra sola. */
    const insertField = (key: string) => {
        introEditor.current?.insertField(key)
        setShowMoreFields(false)
    }

    /* ---------- Guardar, descartar, PDF, Word ---------- */

    const save = async () => {
        setError("")
        const content = toContent(draft)
        if (!content.intro) return setError("Falta el párrafo inicial.")
        if (introTooLong) return setError("El párrafo inicial es demasiado largo. Acortalo un poco.")
        if (!content.clauses.length) return setError("Agregá al menos una cláusula.")
        setSaving(true)
        try {
            const res = await api.saveContract(token, content)
            const fresh = toDraft(res.contract)
            writeStored(null)
            setDraft(fresh)
            setBaseSnap(snapshot(fresh))
            setDeleted(null)
            await refresh()
            setNotice("¡Guardado! Desde ahora los contratos se imprimen con este texto.")
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar el contrato.")
        } finally {
            setSaving(false)
        }
    }

    const discard = () => {
        writeStored(null)
        setDraft(toDraft(saved))
        setBaseSnap(savedSnap)
        setDeleted(null)
        setError("")
        setNotice("Se descartaron los cambios.")
    }

    const reset = async () => {
        setSaving(true)
        setError("")
        try {
            await api.resetContract(token)
            writeStored(null)
            const original = toDraft(CONTRACT_CONTENT)
            setDraft(original)
            setBaseSnap(snapshot(original))
            await refresh()
            setConfirmReset(false)
            setNotice("Se volvió al contrato original de la escuela.")
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo restaurar el contrato.")
        } finally {
            setSaving(false)
        }
    }

    const openPreview = async () => {
        setError("")
        setPreviewing(true)
        // La pestaña se abre antes del await para que el navegador no la bloquee.
        const tabWindow = window.open("", "_blank")
        try {
            // Las preguntas del formulario salen como "[Nombre de la pregunta]" en el ejemplo.
            const sampleExtras = Object.fromEntries(customFields.map((f) => [f.id, `[${f.label}]`]))
            const blob = await generateContractBlob({ ...SAMPLE, values: { ...SAMPLE.values, ...sampleExtras }, content: toContent(draft) })
            const url = URL.createObjectURL(blob)
            if (tabWindow) tabWindow.location.href = url
            else window.location.assign(url)
            setTimeout(() => URL.revokeObjectURL(url), 60_000)
        } catch (err) {
            tabWindow?.close()
            setError(err instanceof Error ? err.message : "No se pudo generar la vista previa.")
        } finally {
            setPreviewing(false)
        }
    }

    const pickWordFile = () => fileRef.current?.click()

    /** Elegido o arrastrado: si hay cambios sin guardar, primero se pregunta. */
    const chooseWord = (file: File | undefined) => {
        if (fileRef.current) fileRef.current.value = ""
        if (!file) return
        if (dirty) setPendingWord(file)
        else importWord(file)
    }

    const importWord = async (file: File) => {
        setPendingWord(null)
        setError("")
        setNotice("")
        setReading(true)
        try {
            const parsed = await parseContractDocx(file)
            setDraft(toDraft(parsed.content))
            setDeleted(null)
            setNotice(`Cargamos "${file.name}". Revisá el texto y, si está bien, tocá Guardar.`)
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo leer el archivo.")
        } finally {
            setReading(false)
        }
    }

    // El contador evita que el aviso parpadee al pasar el archivo por encima de otros elementos.
    const isFileDrag = (e: DragEvent) => e.dataTransfer.types.includes("Files")
    const wordDrop = {
        onDragEnter: (e: DragEvent) => {
            if (!isFileDrag(e)) return
            dragDepth.current += 1
            setWordDragOver(true)
        },
        onDragOver: (e: DragEvent) => {
            if (!isFileDrag(e)) return
            e.preventDefault()
            e.dataTransfer.dropEffect = "copy"
        },
        onDragLeave: (e: DragEvent) => {
            if (!isFileDrag(e)) return
            dragDepth.current = Math.max(0, dragDepth.current - 1)
            if (dragDepth.current === 0) setWordDragOver(false)
        },
        onDrop: (e: DragEvent) => {
            if (!isFileDrag(e)) return
            e.preventDefault()
            dragDepth.current = 0
            setWordDragOver(false)
            chooseWord(e.dataTransfer.files?.[0])
        },
    }

    /* ---------- Piezas de la interfaz ---------- */

    const sectionCls = (t: Tab) => (tab === t ? "" : "hidden lg:block")

    const saveButton = (size = "h-12") => (
        <button
            onClick={save}
            disabled={saving || !dirty}
            className={`${size} inline-flex items-center justify-center gap-2 rounded-xl bg-[#4d0706] text-[#ffcc00] text-sm font-black hover:bg-[#3a0504] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
        >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {dirty ? "Guardar cambios" : "Todo guardado"}
        </button>
    )

    const alerts = (
        <>
            {error && !confirmReset && (
                <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 text-red-700 text-sm font-bold px-4 py-3">
                    <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                </div>
            )}
            {notice && (
                <div role="status" className="flex items-start gap-2 rounded-xl bg-green-50 text-green-700 text-sm font-bold px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    {notice}
                </div>
            )}
            {missingName && (
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold px-4 py-3">
                    <TriangleAlert className="w-4 h-4 shrink-0" />
                    Falta el nombre del alumno en el párrafo inicial: sin eso el contrato sale sin nombre.
                </p>
            )}
        </>
    )

    const helpList = (
        <ol className="space-y-2.5 text-sm text-gray-600 font-medium">
            {HELP_STEPS.map((s, i) => (
                <li key={i} className="flex gap-2.5">
                    <b className="text-[#4d0706]">{i + 1}.</b>
                    <span>{s}</span>
                </li>
            ))}
        </ol>
    )

    const fieldChip = (key: string, label: string) => {
        const used = usedKeys.has(key)
        return (
            <button
                key={key}
                type="button"
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData(FIELD_DRAG_TYPE, key)
                    e.dataTransfer.effectAllowed = "copy"
                }}
                // mousedown sin foco: así no se pierde dónde estaba el cursor.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertField(key)}
                className={`inline-flex items-center gap-1 h-9 sm:h-8 pl-2 sm:pl-1.5 pr-2.5 rounded-lg text-xs font-black cursor-pointer sm:cursor-grab active:cursor-grabbing transition-all hover:-translate-y-px hover:shadow-md ${
                    used ? "bg-[#ffcc00] text-[#4d0706]" : "bg-white text-[#4d0706] border border-dashed border-[#4d0706]/40"
                }`}
                title={`Ej.: ${SAMPLE_BY_MARKER[key] ?? "lo que respondió el alumno"}${used ? " · Ya está en el texto" : ""}`}
            >
                <GripVertical className="hidden sm:block w-3.5 h-3.5 opacity-40" />
                {used ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {label}
            </button>
        )
    }

    const topBtn =
        "inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-white ring-1 ring-gray-200 text-sm font-bold text-[#4d0706] hover:bg-gray-50 active:bg-gray-50 disabled:opacity-60 cursor-pointer"
    const wordButton = (
        <button onClick={pickWordFile} disabled={reading} className={topBtn}>
            {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {reading ? "Leyendo..." : "Subir un Word"}
        </button>
    )
    const pdfButton = (
        <button onClick={openPreview} disabled={previewing} className={topBtn}>
            {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Ver PDF
        </button>
    )

    const optionCls ="w-full flex items-center gap-3 rounded-xl px-3 h-14 text-left text-[15px] font-bold disabled:opacity-40 active:bg-gray-100 cursor-pointer"

    return (
        // Se puede soltar un Word en cualquier parte del panel.
        <div ref={panelRef} {...wordDrop} className="max-w-6xl mx-auto pb-28">
            {/* ------- Barra de arriba: estado, Word, PDF y más opciones ------- */}
            <div className="space-y-3 mb-3 lg:mb-5">
                <div className="flex items-center gap-2 lg:gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dirty ? "bg-amber-400 animate-pulse" : "bg-green-500"}`} aria-hidden />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-700">{dirty ? "Cambios sin guardar" : "Todo guardado"}</p>
                        <p className="hidden lg:block text-xs text-gray-500 font-medium">
                            {isCustom ? "Se usa el contrato personalizado." : "Se usa el contrato original de la escuela."} También podés arrastrar un Word acá.
                        </p>
                    </div>
                    <div className="hidden lg:flex items-center gap-2">
                        {wordButton}
                        {pdfButton}
                    </div>
                    <button
                        onClick={() => setOptionsOpen(true)}
                        aria-label="Más opciones"
                        title="Más opciones"
                        className="w-11 h-11 rounded-xl bg-white ring-1 ring-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:hidden">
                    {wordButton}
                    {pdfButton}
                </div>
                {alerts}
            </div>

            <div className="lg:hidden sticky top-16 z-30 mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-white/95 backdrop-blur ring-1 ring-gray-200 shadow-sm p-1">
                {TABS.map((t, i) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => goTab(t.id)}
                        aria-current={tab === t.id ? "step" : undefined}
                        className={`h-11 min-w-0 px-1 rounded-xl inline-flex items-center justify-center gap-1 text-[12.5px] font-black transition-colors cursor-pointer ${
                            tab === t.id ? "bg-[#4d0706] text-[#ffcc00]" : "text-gray-500 active:bg-gray-100"
                        }`}
                    >
                        <span
                            className={`w-[18px] h-[18px] shrink-0 rounded-full text-[10px] flex items-center justify-center ${
                                tab === t.id ? "bg-[#ffcc00] text-[#4d0706]" : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            {i + 1}
                        </span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ------- El contrato ------- */}
            <div className="min-w-0 lg:rounded-2xl lg:bg-gray-100/70 lg:p-6">
                <div className="bg-white rounded-2xl lg:rounded-xl ring-1 ring-black/5 lg:shadow-xl lg:shadow-black/10 px-4 sm:px-8 lg:px-10 py-5 lg:py-8 lg:space-y-10">
                    {/* 1. Encabezado */}
                    <section className={sectionCls("encabezado")}>
                        <SectionTitle step={1} title="Encabezado" hint="Las tres líneas de arriba de la hoja. Los logos se agregan solos." />
                        <div className="space-y-3">
                            <LabeledInput
                                label="Nombre de la escuela"
                                value={draft.header[0]}
                                onChange={(v) => update({ header: [v, draft.header[1], draft.header[2]] })}
                                placeholder="Ej.: Escuela de Capacitación Laboral..."
                                className="font-black text-[#4d0706]"
                            />
                            <LabeledInput
                                label="Dirección"
                                value={draft.header[1]}
                                onChange={(v) => update({ header: [draft.header[0], v, draft.header[2]] })}
                                placeholder="Ej.: Av. Alem 527 Sur – Capital – San Juan"
                            />
                            <LabeledInput
                                label="Título del contrato"
                                value={draft.header[2]}
                                onChange={(v) => update({ header: [draft.header[0], draft.header[1], v] })}
                                placeholder="Ej.: Contrato de Prestación de Servicios Educativos 2027"
                                className="font-bold"
                            />
                        </div>
                        <NextButton label="Párrafo inicial" onClick={() => goTab("parrafo")} />
                    </section>

                    {/* 2. Párrafo con los datos del alumno */}
                    <section className={sectionCls("parrafo")}>
                        <SectionTitle
                            step={2}
                            title="Párrafo inicial"
                            hint="Las etiquetas amarillas se reemplazan solas por los datos de cada alumno."
                        />

                        {/* Paleta de datos: queda fija arriba mientras se escribe el párrafo. */}
                        <div className="sticky top-[7.75rem] lg:top-[4.5rem] z-20 mb-3 rounded-2xl bg-[#fffbea] ring-1 ring-[#ffcc00]/70 shadow-sm p-2 sm:p-3">
                            <p className="flex items-center gap-1.5 px-1 mb-2 text-xs font-bold text-[#4d0706]">
                                <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
                                <span className="sm:hidden">Tocá el texto y después el dato. Deslizá para ver más →</span>
                                <span className="hidden sm:inline">Hacé clic en el texto donde va el dato y tocá el dato. También podés arrastrarlo.</span>
                            </p>
                            {/* En el celular es una sola fila que se desliza, para no tapar el texto. */}
                            <div className="flex flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible gap-1.5 -mx-2 px-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>button]:shrink-0">
                                {CONTRACT_MARKERS.map((key) => fieldChip(key, CONTRACT_MARKER_LABELS[key]))}
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowMoreFields((v) => !v)}
                                    aria-expanded={showMoreFields}
                                    className="inline-flex items-center gap-1 h-9 sm:h-8 px-3 rounded-lg text-xs font-black text-white bg-[#4d0706] hover:bg-[#3a0504] cursor-pointer"
                                >
                                    {showMoreFields ? "Cerrar" : `Más datos (${moreCount})`}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreFields ? "rotate-180" : ""}`} />
                                </button>
                            </div>

                            {showMoreFields && (
                                <div className="mt-3 pt-3 border-t border-[#ffcc00]/50 space-y-3 max-h-[40vh] overflow-y-auto">
                                    <FieldGroup title="Otros datos del alumno">
                                        {EXTRA_STUDENT_MARKERS.map((key) => fieldChip(key, CONTRACT_MARKER_LABELS[key]))}
                                    </FieldGroup>
                                    <FieldGroup
                                        title="Preguntas que agregaste en el Formulario"
                                        hint={
                                            customFields.length
                                                ? "Sale lo que respondió cada alumno."
                                                : "Todavía no hay. Si necesitás un dato que no está acá, agregalo como pregunta en la pestaña Formulario y aparece en esta lista."
                                        }
                                    >
                                        {customFields.map((f) => fieldChip(f.id, f.label))}
                                    </FieldGroup>
                                    <FieldGroup title="Especiales">
                                        {fieldChip("FECHA_HOY", CONTRACT_MARKER_LABELS.FECHA_HOY)}
                                        {fieldChip("BLANCO", "Línea en blanco (completar a mano)")}
                                    </FieldGroup>
                                </div>
                            )}
                        </div>

                        <IntroEditor
                            ref={introEditor}
                            value={draft.intro}
                            labelFor={labelFor}
                            onChange={(intro) => update({ intro })}
                            placeholder="Ej.: Entre la Escuela... y el Sr/a [Nombre completo], DNI [DNI]..."
                        />
                        <div className="flex items-start justify-between gap-3 mt-2 px-1">
                            <p className="text-xs text-gray-400 font-medium">
                                {usedKeys.size} {usedKeys.size === 1 ? "dato" : "datos"} en el texto. Para quitar uno, tocá la ✕ de su etiqueta.
                            </p>
                            <p className={`text-[11px] font-bold shrink-0 ${introTooLong ? "text-red-600" : "text-gray-300"}`}>
                                {draft.intro.length.toLocaleString("es-AR")} / {MAX_TEXT.toLocaleString("es-AR")}
                            </p>
                        </div>
                        <p className="mt-4 text-center text-xs font-bold text-gray-400">La FECHA del contrato se completa sola con el día en que se imprime.</p>
                        <NextButton label="Cláusulas" onClick={() => goTab("clausulas")} />
                    </section>

                    {/* 3. Cláusulas */}
                    <section className={sectionCls("clausulas")}>
                        <SectionTitle
                            step={3}
                            title={`Cláusulas (${draft.clauses.length})`}
                            hint="Tocá una cláusula para cambiarla. Los números se acomodan solos."
                        />

                        <div className="space-y-2">
                            {draft.clauses.map((clause, i) => (
                                <ClauseRow
                                    key={clause.id}
                                    clause={clause}
                                    index={i}
                                    total={draft.clauses.length}
                                    onOpen={() => openClauseSheet(clause.id)}
                                    onMove={(dir) => moveClause(i, dir)}
                                    onDelete={() => deleteClause(i)}
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addClause}
                            className="mt-3 w-full h-12 rounded-2xl border-2 border-dashed border-gray-300 text-[15px] sm:text-sm font-black text-gray-500 hover:border-[#4d0706] hover:text-[#4d0706] hover:bg-[#4d0706]/[0.03] inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar una cláusula
                        </button>

                        <div className="mt-8 border-t border-dashed border-gray-200 pt-5">
                            <div className="grid grid-cols-3 gap-3 text-center text-[11px] font-bold text-gray-400">
                                {["Firma del Alumno", "Firma Rep. Legal", "Padre / Tutor"].map((f) => (
                                    <div key={f}>
                                        <div className="h-px bg-gray-300 mb-1.5" />
                                        {f}
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-center text-[11px] text-gray-400">Las firmas se agregan solas al final del PDF.</p>
                        </div>
                    </section>
                </div>
            </div>

            <input
                ref={fileRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => chooseWord(e.target.files?.[0])}
            />

            {/* ------- Ventanas ------- */}
            <Sheet
                open={clauseOpen && Boolean(openClause)}
                onClose={closeClauseSheet}
                size="lg"
                title={openClause ? `Cláusula ${openIndex + 1} de ${draft.clauses.length}` : "Cláusula"}
                subtitle={newClauseId && newClauseId === openId ? "Nueva cláusula. Si la dejás vacía, no se agrega." : "Lo que cambies se guarda al tocar «Guardar cambios»."}
                footer={
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => moveClause(openIndex, -1)}
                            disabled={openIndex <= 0}
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                            aria-label="Subir esta cláusula"
                            title="Subir"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => moveClause(openIndex, 1)}
                            disabled={openIndex < 0 || openIndex >= draft.clauses.length - 1}
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                            aria-label="Bajar esta cláusula"
                            title="Bajar"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                deleteClause(openIndex)
                                setClauseOpen(false)
                                setNewClauseId(null)
                            }}
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-red-500 ring-1 ring-red-100 hover:bg-red-50 cursor-pointer"
                            aria-label="Borrar esta cláusula"
                            title="Borrar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={closeClauseSheet}
                            className="ml-auto h-11 px-7 rounded-xl bg-[#4d0706] text-[#ffcc00] text-sm font-black inline-flex items-center gap-1.5 hover:bg-[#3a0504] cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            Listo
                        </button>
                    </div>
                }
            >
                {openClause && (
                    <ClauseEditor
                        key={openClause.id}
                        clause={openClause}
                        autoFocusTitle={newClauseId === openClause.id}
                        onChange={(next) => setClauses((cs) => cs.map((c) => (c.id === next.id ? next : c)))}
                    />
                )}
            </Sheet>

            {/* Celular: el resto de las opciones */}
            <Sheet open={optionsOpen} onClose={() => setOptionsOpen(false)} title="Más opciones">
                <div className="space-y-1">
                    <button
                        type="button"
                        disabled={!dirty}
                        onClick={() => {
                            setOptionsOpen(false)
                            discard()
                        }}
                        className={`${optionCls} text-gray-800`}
                    >
                        <Undo2 className="w-5 h-5 shrink-0" />
                        Descartar los cambios sin guardar
                    </button>
                    <button
                        type="button"
                        disabled={reading}
                        onClick={() => {
                            setOptionsOpen(false)
                            pickWordFile()
                        }}
                        className={`${optionCls} text-gray-800`}
                    >
                        <FileUp className="w-5 h-5 shrink-0" />
                        Importar el contrato desde un Word
                    </button>
                    {isCustom && (
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                                setOptionsOpen(false)
                                setConfirmReset(true)
                            }}
                            className={`${optionCls} text-red-600`}
                        >
                            <RotateCcw className="w-5 h-5 shrink-0" />
                            Volver al contrato original
                        </button>
                    )}
                </div>
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3">
                        <Lightbulb className="w-4 h-4 text-[#ffcc00] fill-[#ffcc00]/30" />
                        Cómo se usa
                    </p>
                    {helpList}
                </div>
            </Sheet>

            {/* Deshacer borrado */}
            {deleted && (
                <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] lg:bottom-28 z-[95] flex items-center gap-3 rounded-full bg-gray-900 text-white text-sm font-bold pl-5 pr-2 py-2 shadow-2xl whitespace-nowrap">
                    Se borró la cláusula {deleted.index + 1}
                    <button onClick={undoDelete} className="h-8 px-3 rounded-full bg-white/15 hover:bg-white/25 text-[#ffcc00] cursor-pointer">
                        Deshacer
                    </button>
                </div>
            )}

            {/* Guardar flotante: aparece cuando hay cambios. En el celular, encima del menú de abajo. */}
            {dirty && (
                <div className="fixed z-[89] inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-8 lg:bottom-8 flex items-center gap-3 rounded-2xl bg-white ring-1 ring-gray-200 shadow-2xl shadow-black/15 p-2 pl-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="text-sm font-bold text-gray-700 flex-1 lg:flex-none lg:pr-2">Cambios sin guardar</span>
                    <button
                        onClick={discard}
                        disabled={saving}
                        className="hidden lg:inline-flex items-center gap-1.5 h-11 px-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                    >
                        <Undo2 className="w-4 h-4" />
                        Descartar
                    </button>
                    {saveButton("px-5 h-11")}
                </div>
            )}

            {/* Al arrastrar un archivo sobre el panel */}
            {wordDragOver && (
                <div className="fixed inset-0 z-[96] pointer-events-none bg-[#4d0706]/10 backdrop-blur-[1px] flex items-center justify-center p-6">
                    <div className="rounded-3xl border-4 border-dashed border-[#4d0706] bg-white/95 px-10 py-8 text-center shadow-2xl">
                        <FileUp className="w-10 h-10 mx-auto text-[#4d0706]" />
                        <p className="mt-2 text-lg font-black text-[#4d0706]">Soltá el Word para cargarlo</p>
                        <p className="text-sm text-gray-500 font-medium">Después lo revisás y tocás Guardar.</p>
                    </div>
                </div>
            )}

            {pendingWord && (
                <ConfirmDialog
                    title="Reemplazar con el Word"
                    message={
                        <>
                            Tenés cambios sin guardar. Si cargás <b>{pendingWord.name}</b>, se reemplaza todo el texto que estás editando.
                        </>
                    }
                    confirmLabel="Cargar el Word"
                    onConfirm={() => importWord(pendingWord)}
                    onCancel={() => setPendingWord(null)}
                />
            )}

            {confirmReset && (
                <ConfirmDialog
                    title="Volver al contrato original"
                    message="Se deja de usar el contrato personalizado y los contratos vuelven a imprimirse con el texto original de la escuela."
                    confirmLabel="Volver al original"
                    busy={saving}
                    error={error}
                    onConfirm={reset}
                    onCancel={() => {
                        setConfirmReset(false)
                        setError("")
                    }}
                />
            )}
        </div>
    )
}
