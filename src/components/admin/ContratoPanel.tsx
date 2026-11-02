import { useRef, useState, type DragEvent } from "react"
import { Check, CheckCircle2, FileText, FileUp, Loader2, RotateCcw, TriangleAlert, X } from "lucide-react"
import { api } from "@/api"
import ConfirmDialog from "@/components/admin/ConfirmDialog"
import { useSiteConfig } from "@/siteConfig"
import { CONTRACT_MARKERS, getContractContent, type ContractContent } from "@/pdf/contractContent"
import { parseContractDocx, type ParsedContract } from "@/pdf/parseContractDocx"
import { generateContractBlob } from "@/pdf/downloadContract"

interface Props {
    token: string
}

const SAMPLE = {
    fullName: "Pérez Juan Carlos",
    dni: "30.123.456",
    edad: "35",
    cuil: "20-30123456-7",
    address: "Calle Falsa 123",
    departamento: "Capital",
    celular: "264 555-0000",
    birthDate: "15/03/1990",
    email: "juan@ejemplo.com",
    courseName: "Curso de ejemplo",
    currentDate: new Date().toLocaleDateString("es-AR"),
}

const FIELD_LABELS: Record<(typeof CONTRACT_MARKERS)[number], string> = {
    ALUMNO: "Nombre del alumno",
    DNI: "DNI",
    EDAD: "Edad",
    CUIL: "CUIL",
    DOMICILIO: "Domicilio",
    DEPARTAMENTO: "Departamento",
    CELULAR: "Celular",
    FECHA_NACIMIENTO: "Fecha de nacimiento",
    EMAIL: "Email",
    CURSO: "Curso o carrera",
}

/** Párrafo inicial con los datos del alumno resaltados como etiquetas. */
function Intro({ text }: { text: string }) {
    return (
        <p>
            {text.split(/(<[A-Z_]+>)/).map((part, i) => {
                const m = /^<([A-Z_]+)>$/.exec(part)
                if (!m) return <span key={i}>{part}</span>
                const key = m[1] as keyof typeof FIELD_LABELS
                return (
                    <span key={i} className="mx-0.5 px-1.5 py-0.5 rounded bg-[#ffcc00]/40 text-[#4d0706] font-bold text-[0.85em] whitespace-nowrap">
                        {FIELD_LABELS[key] ?? key}
                    </span>
                )
            })}
        </p>
    )
}

/** La hoja del contrato, para ver cómo queda el texto antes de guardarlo. */
function Paper({ content }: { content: ContractContent }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div className="relative bg-white rounded-lg shadow-xl shadow-black/10 ring-1 ring-black/5 text-[13px] leading-relaxed text-gray-800">
            <div className={`px-6 sm:px-10 pt-8 ${expanded ? "pb-16" : "max-h-[460px] overflow-hidden"}`}>
            <div className="text-center border-b-2 border-[#4d0706] pb-3 mb-4">
                <p className="font-black text-[#4d0706] uppercase tracking-wide">{content.header[0]}</p>
                <p className="text-xs text-gray-500">{content.header[1]}</p>
                <p className="font-black text-gray-900 uppercase mt-1">{content.header[2]}</p>
            </div>
            <Intro text={content.intro} />
            <div className="mt-4 space-y-4">
                {content.clauses.map((clause, i) => (
                    <div key={i} className="space-y-1">
                        {clause.heading && <p className="font-bold text-gray-900">{clause.heading}</p>}
                        {clause.items?.map((item, j) => (
                            <p key={j} className="pl-4 text-gray-700">
                                • {item}
                            </p>
                        ))}
                        {clause.body && <p className="whitespace-pre-line text-gray-700">{clause.body}</p>}
                    </div>
                ))}
            </div>
            </div>
            <div
                className={`flex justify-center pb-4 pt-12 ${
                    expanded ? "absolute inset-x-0 bottom-0" : "absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent rounded-b-lg"
                }`}
            >
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="px-4 h-9 rounded-full bg-white ring-1 ring-gray-200 shadow-sm text-xs font-black text-[#4d0706] hover:bg-gray-50 cursor-pointer"
                >
                    {expanded ? "Ver menos" : "Ver contrato completo"}
                </button>
            </div>
        </div>
    )
}

export default function ContratoPanel({ token }: Props) {
    const { contract, refresh } = useSiteConfig()
    const inputRef = useRef<HTMLInputElement>(null)
    const [parsed, setParsed] = useState<ParsedContract | null>(null)
    const [reading, setReading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [previewing, setPreviewing] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState("")

    const isCustom = Boolean(contract)
    const shown = parsed?.content ?? getContractContent()
    const detectedKeys = CONTRACT_MARKERS.filter((m) => shown.intro.includes(`<${m}>`))

    const handleFile = async (file: File | undefined) => {
        if (!file) return
        setError("")
        setNotice("")
        setParsed(null)
        setReading(true)
        try {
            setParsed(await parseContractDocx(file))
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo leer el archivo.")
        } finally {
            setReading(false)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    const onDrop = (e: DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files?.[0])
    }

    const openPreview = async () => {
        setError("")
        setPreviewing(true)
        // La pestaña se abre antes del await para que el navegador no la bloquee.
        const tab = window.open("", "_blank")
        try {
            const blob = await generateContractBlob({ ...SAMPLE, content: shown })
            const url = URL.createObjectURL(blob)
            if (tab) tab.location.href = url
            else window.location.assign(url)
            setTimeout(() => URL.revokeObjectURL(url), 60_000)
        } catch (err) {
            tab?.close()
            setError(err instanceof Error ? err.message : "No se pudo generar la vista previa.")
        } finally {
            setPreviewing(false)
        }
    }

    const save = async () => {
        if (!parsed) return
        setSaving(true)
        setError("")
        try {
            await api.saveContract(token, parsed.content)
            await refresh()
            setParsed(null)
            setNotice("Listo. Desde ahora los contratos se imprimen con este texto.")
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar el contrato.")
        } finally {
            setSaving(false)
        }
    }

    const reset = async () => {
        setSaving(true)
        setError("")
        try {
            await api.resetContract(token)
            await refresh()
            setConfirmReset(false)
            setNotice("Se volvió al contrato original de la escuela.")
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo restaurar el contrato.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
            {/* Vista del contrato */}
            <div className="order-2 lg:order-1 space-y-3 min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                        {parsed ? "Así quedaría el nuevo contrato" : "Contrato actual"}
                    </p>
                    <button
                        onClick={openPreview}
                        disabled={previewing || saving}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4d0706] hover:underline disabled:opacity-60 cursor-pointer"
                    >
                        {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Ver PDF de ejemplo
                    </button>
                </div>
                <div className="rounded-2xl bg-gray-100/70 p-3 sm:p-6">
                    <Paper content={shown} />
                </div>
            </div>

            {/* Acciones */}
            <aside className="order-1 lg:order-2 space-y-6 lg:sticky lg:top-24">
                {!parsed ? (
                    <>
                        <div>
                            <p className="text-sm font-black text-gray-900">
                                {isCustom ? "Contrato personalizado" : "Contrato original de la escuela"}
                            </p>
                            <p className="text-sm text-gray-500 font-medium mt-0.5">
                                {isCustom && contract?.fileName ? contract.fileName : "Es el que se usa hoy para imprimir."}
                            </p>
                        </div>

                        <input
                            ref={inputRef}
                            type="file"
                            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault()
                                setDragOver(true)
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            disabled={reading}
                            className={`w-full rounded-xl border-2 border-dashed px-4 py-3 flex items-center gap-3 text-left transition-all cursor-pointer ${
                                dragOver
                                    ? "border-[#4d0706] bg-[#4d0706]/5"
                                    : "border-gray-300 hover:border-[#4d0706] hover:bg-[#4d0706]/[0.03]"
                            }`}
                        >
                            <span className="w-10 h-10 rounded-full bg-[#4d0706] text-[#ffcc00] flex items-center justify-center shrink-0">
                                {reading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-black text-gray-900">
                                    {reading ? "Leyendo el documento..." : "Subir un contrato nuevo"}
                                </span>
                                <span className="block text-xs text-gray-500 font-medium">Arrastrá el Word acá o hacé clic</span>
                            </span>
                        </button>

                        {isCustom && (
                            <button
                                onClick={() => setConfirmReset(true)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:underline disabled:opacity-60 cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Volver al contrato original
                            </button>
                        )}

                        <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Cómo preparar el Word</p>
                            <ol className="space-y-3 text-sm text-gray-600 font-medium">
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#ffcc00] text-[#4d0706] text-xs font-black flex items-center justify-center shrink-0">1</span>
                                    <span>Escribí el contrato completo en un archivo .docx.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#ffcc00] text-[#4d0706] text-xs font-black flex items-center justify-center shrink-0">2</span>
                                    <span>
                                        En el párrafo inicial, dejá los datos del alumno con las líneas de puntos (“Sr/a………”, “DNI………”) o con
                                        marcadores como <b>&lt;ALUMNO&gt;</b> y <b>&lt;DNI&gt;</b>.
                                    </span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[#ffcc00] text-[#4d0706] text-xs font-black flex items-center justify-center shrink-0">3</span>
                                    <span>Subilo y revisá la vista previa. Los datos que se completan solos se marcan en amarillo.</span>
                                </li>
                            </ol>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <p className="text-sm font-black text-gray-900">Revisá antes de guardar</p>
                            <p className="text-sm text-gray-500 font-medium mt-0.5 break-all">
                                {parsed.content.fileName} · {parsed.content.clauses.length} cláusulas
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Datos del alumno</p>
                            {CONTRACT_MARKERS.map((m) => {
                                const ok = detectedKeys.includes(m)
                                return (
                                    <div key={m} className="flex items-center gap-2.5 text-sm">
                                        <span
                                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                                ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                                            }`}
                                        >
                                            {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        </span>
                                        <span className={ok ? "font-bold text-gray-800" : "font-medium text-gray-400"}>{FIELD_LABELS[m]}</span>
                                        {!ok && <span className="text-xs text-gray-400">· en blanco</span>}
                                    </div>
                                )
                            })}
                            {detectedKeys.length === 0 && (
                                <p className="text-xs text-amber-700 font-bold pt-2">
                                    No encontré dónde van los datos del alumno. Agregá marcadores como &lt;ALUMNO&gt; y &lt;DNI&gt; en el
                                    párrafo inicial y volvé a subirlo.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={save}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#4d0706] text-[#ffcc00] text-sm font-black hover:bg-[#3a0504] disabled:opacity-60 cursor-pointer"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Usar este contrato
                            </button>
                            <button
                                onClick={() => setParsed(null)}
                                disabled={saving}
                                className="h-10 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                            >
                                Descartar y elegir otro
                            </button>
                        </div>
                    </>
                )}

                {error && !confirmReset && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 text-red-700 text-sm font-bold px-4 py-3">
                        <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}
                {notice && (
                    <div className="flex items-start gap-2 rounded-xl bg-green-50 text-green-700 text-sm font-bold px-4 py-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        {notice}
                    </div>
                )}
            </aside>

            {confirmReset && (
                <ConfirmDialog
                    title="Volver al contrato original"
                    message="Se deja de usar el contrato que subiste y los contratos vuelven a imprimirse con el texto original de la escuela."
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
