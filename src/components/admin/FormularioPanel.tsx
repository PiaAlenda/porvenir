"use client"

import { useState } from "react"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, AlertCircle, Check, ChevronDown, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react"
import { api } from "@/api"
import { useSiteConfig } from "@/siteConfig"
import { DEFAULT_FORM_OPTIONS, type FieldId, type FormFieldConfig, type FormFieldOption } from "@/components/features/home/form/formSchema"

interface Props {
    token: string
}

const PASOS: { step: 1 | 2 | 3 | 4; titulo: string; corto: string }[] = [
    { step: 1, titulo: "Paso 1 · Datos personales", corto: "Datos personales" },
    { step: 2, titulo: "Paso 2 · Contacto", corto: "Contacto" },
    { step: 3, titulo: "Paso 3 · Inscripción", corto: "Inscripción" },
    { step: 4, titulo: "Paso 4 · Documentación y datos complementarios", corto: "Documentación" },
]

const MAX_OPTIONS = 80

const inputClass =
    "w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all"

const labelClass = "text-[11px] font-black uppercase tracking-widest text-gray-500 block mb-1.5"

function CampoEditor({
    campo,
    expanded,
    puedeSubir,
    puedeBajar,
    onToggle,
    onPatch,
    onMover,
}: {
    campo: FormFieldConfig
    expanded: boolean
    puedeSubir: boolean
    puedeBajar: boolean
    onToggle: () => void
    onPatch: (patch: Partial<FormFieldConfig>) => void
    onMover: (dir: -1 | 1) => void
}) {
    const esSelect = campo.kind === "select"
    const esCareer = campo.kind === "career"
    const esCity = campo.kind === "city"

    const actualizarOpcion = (index: number, patch: Partial<FormFieldOption>) => {
        const options = [...(campo.options ?? [])]
        options[index] = { ...options[index], ...patch }
        onPatch({ options })
    }

    const agregarOpcion = () => {
        const options = [...(campo.options ?? []), { value: "", label: "" }]
        onPatch({ options })
    }

    const quitarOpcion = (index: number) => {
        onPatch({ options: (campo.options ?? []).filter((_, i) => i !== index) })
    }

    return (
        <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${campo.visible ? "border-gray-200" : "border-gray-200 bg-gray-50/40"}`}>
            <div
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onToggle()
                    }
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 cursor-pointer transition-colors ${expanded ? "bg-[#4d0706]/[0.03]" : "hover:bg-gray-50"} ${!campo.visible ? "opacity-60" : ""}`}
            >
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={() => onMover(-1)}
                        disabled={!puedeSubir}
                        title="Mover antes"
                        aria-label="Mover antes"
                        className="w-7 h-7 grid place-items-center rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                        <ArrowUp aria-hidden="true" className="w-3.5 h-3.5 lg:hidden" />
                        <ArrowLeft aria-hidden="true" className="hidden lg:block w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onMover(1)}
                        disabled={!puedeBajar}
                        title="Mover después"
                        aria-label="Mover después"
                        className="w-7 h-7 grid place-items-center rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                        <ArrowDown aria-hidden="true" className="w-3.5 h-3.5 lg:hidden" />
                        <ArrowRight aria-hidden="true" className="hidden lg:block w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{campo.label || campo.id}</p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">
                        {campo.id} · {campo.kind}
                        {campo.required && " · obligatorio"}
                    </p>
                </div>

                <label
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 cursor-pointer select-none shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        checked={campo.visible}
                        onChange={(e) => onPatch({ visible: e.target.checked })}
                        className="w-4 h-4 accent-[#4d0706] cursor-pointer"
                    />
                    <span className="hidden sm:inline">Visible</span>
                </label>

                <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
            </div>

            {expanded && (
                <div className="px-3 sm:px-4 pb-4 pt-1 space-y-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Etiqueta visible</label>
                            <input
                                className={inputClass}
                                value={campo.label}
                                maxLength={120}
                                onChange={(e) => onPatch({ label: e.target.value })}
                            />
                        </div>
                        {campo.kind !== "file" && campo.kind !== "career" && (
                            <>
                                <div>
                                    <label className={labelClass}>Texto de ejemplo (placeholder)</label>
                                    <input
                                        className={inputClass}
                                        value={campo.placeholder ?? ""}
                                        maxLength={160}
                                        onChange={(e) => onPatch({ placeholder: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Ayuda debajo del campo</label>
                                    <input
                                        className={inputClass}
                                        value={campo.hint ?? ""}
                                        maxLength={200}
                                        onChange={(e) => onPatch({ hint: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                        {esSelect && (
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Texto del desplegable vacío</label>
                                <input
                                    className={inputClass}
                                    value={campo.placeholderOption ?? ""}
                                    maxLength={120}
                                    onChange={(e) => onPatch({ placeholderOption: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={campo.required}
                                onChange={(e) => onPatch({ required: e.target.checked })}
                                className="w-4 h-4 accent-[#4d0706] cursor-pointer"
                            />
                            Obligatorio
                        </label>
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={campo.span === 2}
                                onChange={(e) => onPatch({ span: e.target.checked ? 2 : 1 })}
                                className="w-4 h-4 accent-[#4d0706] cursor-pointer"
                            />
                            Ocupa todo el ancho
                        </label>
                    </div>

                    {esSelect && (
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                                    Opciones ({campo.options?.length ?? 0}/{MAX_OPTIONS})
                                </p>
                                <button
                                    type="button"
                                    onClick={agregarOpcion}
                                    disabled={(campo.options?.length ?? 0) >= MAX_OPTIONS}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black text-[#4d0706] bg-[#4d0706]/5 hover:bg-[#4d0706]/10 disabled:opacity-50 cursor-pointer transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Agregar
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 font-medium">
                                El <span className="font-bold">valor</span> es lo que se guarda; el{" "}
                                <span className="font-bold">texto</span> es lo que ve la persona. En la mayoría de los campos son iguales.
                            </p>
                            <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
                                {(campo.options ?? []).map((opt, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            className={`${inputClass} sm:w-40`}
                                            value={opt.value}
                                            placeholder="Valor"
                                            maxLength={80}
                                            onChange={(e) => actualizarOpcion(index, { value: e.target.value })}
                                        />
                                        <input
                                            className={`${inputClass} flex-1 min-w-0`}
                                            value={opt.label}
                                            placeholder="Texto visible"
                                            maxLength={120}
                                            onChange={(e) => actualizarOpcion(index, { label: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => quitarOpcion(index)}
                                            title="Quitar opción"
                                            className="w-11 h-11 shrink-0 grid place-items-center rounded-xl text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(campo.options?.length ?? 0) === 0 && (
                                    <p className="text-xs text-gray-400 font-medium py-2 text-center border border-dashed border-gray-200 rounded-xl">
                                        Sin opciones. El campo no va a ofrecer nada para elegir.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {esCareer && (
                        <p className="text-[11px] text-gray-400 font-medium pt-3 border-t border-gray-100">
                            Este campo muestra las carreras y cursos del sitio: se administran desde las pestañas Cursos y Carreras.
                        </p>
                    )}

                    {esCity && (
                        <p className="text-[11px] text-gray-400 font-medium pt-3 border-t border-gray-100">
                            Este campo muestra las localidades de la provincia que elige la persona, ordenadas alfabéticamente. Las opciones no se editan acá.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

export default function FormularioPanel({ token }: Props) {
    const { formOptions, refresh } = useSiteConfig()
    const [campos, setCampos] = useState<FormFieldConfig[]>(formOptions.campos)
    const [fuente, setFuente] = useState(formOptions)
    const [dirty, setDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1)
    const [expandedId, setExpandedId] = useState<FieldId | null>(null)

    if (!dirty && formOptions !== fuente) {
        setFuente(formOptions)
        setCampos(formOptions.campos)
    }

    const marcar = () => {
        setDirty(true)
        setSuccess("")
    }

    const actualizarCampo = (id: FieldId, patch: Partial<FormFieldConfig>) => {
        setCampos((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
        marcar()
    }

    const mover = (id: FieldId, dir: -1 | 1) => {
        setCampos((prev) => {
            const idx = prev.findIndex((c) => c.id === id)
            if (idx < 0) return prev
            const step = prev[idx].step
            const indices = prev.map((c, i) => (c.step === step ? i : -1)).filter((i) => i >= 0)
            const pos = indices.indexOf(idx)
            const targetPos = pos + dir
            if (targetPos < 0 || targetPos >= indices.length) return prev
            const targetIdx = indices[targetPos]
            const next = [...prev]
            next[idx] = prev[targetIdx]
            next[targetIdx] = prev[idx]
            return next
        })
        marcar()
    }

    const restablecer = () => {
        setCampos(structuredClone(DEFAULT_FORM_OPTIONS.campos))
        setError("")
        setSuccess("Esquema restablecido a los valores de fábrica (todavía no guardado).")
        marcar()
    }

    const guardar = async () => {
        if (!campos.length) {
            setError("El formulario no puede quedar vacío.")
            return
        }
        const visibles = campos.filter((c) => c.visible)
        const sinEtiqueta = visibles.filter((c) => !c.label.trim())
        if (sinEtiqueta.length) {
            setError(`Hay campos visibles sin etiqueta: ${sinEtiqueta.map((c) => c.id).join(", ")}.`)
            return
        }
        const selectsSinOpciones = visibles.filter((c) => c.kind === "select" && !(c.options ?? []).length)
        if (selectsSinOpciones.length) {
            setError(`Los desplegables visibles necesitan al menos una opción: ${selectsSinOpciones.map((c) => c.id).join(", ")}.`)
            return
        }
        setSaving(true)
        setError("")
        setSuccess("")
        try {
            await api.updateFormOptions(token, campos)
            await refresh()
            setDirty(false)
            setSuccess("Formulario guardado. Ya se ve así en la página de inscripción.")
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo guardar el formulario")
        } finally {
            setSaving(false)
        }
    }

    const camposPaso = campos.filter((c) => c.step === activeStep)
    const visiblesPorPaso = (step: 1 | 2 | 3 | 4) => campos.filter((c) => c.step === step && c.visible).length

    return (
        <div className="w-full space-y-5">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {PASOS.map((paso) => (
                    <button
                        key={paso.step}
                        type="button"
                        onClick={() => setActiveStep(paso.step)}
                        className={`shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-colors cursor-pointer ${activeStep === paso.step
                            ? "bg-[#4d0706] text-[#ffcc00]"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                    >
                        {paso.corto}
                        <span
                            className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] ${activeStep === paso.step ? "bg-[#ffcc00]/20 text-[#ffcc00]" : "bg-white text-gray-400"
                                }`}
                        >
                            {visiblesPorPaso(paso.step)}
                        </span>
                    </button>
                ))}
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-start">
                {camposPaso.map((campo, index) => (
                    <CampoEditor
                        key={campo.id}
                        campo={campo}
                        expanded={expandedId === campo.id}
                        puedeSubir={index > 0}
                        puedeBajar={index < camposPaso.length - 1}
                        onToggle={() => setExpandedId((prev) => (prev === campo.id ? null : campo.id))}
                        onPatch={(patch) => actualizarCampo(campo.id, patch)}
                        onMover={(dir) => mover(campo.id, dir)}
                    />
                ))}
                {camposPaso.length === 0 && (
                    <p className="lg:col-span-2 text-sm text-gray-400 font-medium text-center py-10 border border-dashed border-gray-200 rounded-2xl">
                        Este paso no tiene campos cargados.
                    </p>
                )}
            </section>

            {error && (
                <div className="flex items-start gap-2.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-start gap-2.5 text-sm text-green-700 font-medium bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                </div>
            )}

            <div className="sticky bottom-0 bg-white/95 backdrop-blur pt-3 pb-1 -mx-1 px-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={restablecer}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 cursor-pointer transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Restablecer
                    </button>
                    <div className="flex items-center gap-3">
                        <p className={`text-xs font-bold ${dirty ? "text-amber-600" : "text-gray-400"}`}>
                            {dirty ? "Tenés cambios sin guardar" : "Todo guardado"}
                        </p>
                        <button
                            type="button"
                            onClick={guardar}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] shadow-xl shadow-[#4d0706]/20 hover:bg-[#300404] disabled:opacity-60 cursor-pointer transition-all"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar formulario
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}