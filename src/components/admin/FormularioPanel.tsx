"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
    AlertCircle,
    AlignLeft,
    ArrowDown,
    ArrowUp,
    CalendarDays,
    Check,
    ChevronDown,
    CircleDot,
    GripVertical,
    List,
    ListChecks,
    Loader2,
    Plus,
    RotateCcw,
    Save,
    Trash2,
    Type,
    X,
    type LucideIcon,
} from "lucide-react"
import { api } from "@/api"
import { useSiteConfig } from "@/siteConfig"
import {
    CUSTOM_KINDS,
    CUSTOM_KIND_DESCRIPTIONS,
    CUSTOM_KIND_LABELS,
    DEFAULT_FORM_OPTIONS,
    esPersonalizado,
    nuevoIdPersonalizado,
    tieneOpciones,
    type CustomKind,
    type FieldKind,
    type FormFieldConfig,
    type FormFieldOption,
} from "@/components/features/home/form/formSchema"

type FieldId = FormFieldConfig["id"]

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
const MAX_CUSTOM = 30

const inputClass =
    "w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all"

const labelClass = "text-[11px] font-black uppercase tracking-widest text-gray-500 block mb-1.5"

const KIND_ICONS: Record<CustomKind, LucideIcon> = {
    text: Type,
    textarea: AlignLeft,
    select: List,
    radio: CircleDot,
    checkbox: ListChecks,
    date: CalendarDays,
}

/** Opciones con las que arranca un campo nuevo de tipo lista, para no empezar vacío. */
const opcionesIniciales = (): FormFieldOption[] => [
    { value: "Opción 1", label: "Opción 1" },
    { value: "Opción 2", label: "Opción 2" },
]

/** En los campos personalizados el valor guardado es el mismo texto que se ve ("|" separa respuestas múltiples). */
const limpiarTextoOpcion = (t: string) => t.replace(/\|/g, "")

const nombreTipo = (kind: FieldKind) => CUSTOM_KIND_LABELS[kind as CustomKind] ?? kind

interface DragInfo {
    x: number
    y: number
    gx: number
    gy: number
    w: number
}

function CampoEditor({
    campo,
    expanded,
    dragging,
    order,
    onToggle,
    onPatch,
    onDelete,
    onDragStart,
    onDragMove,
    onDragEnd,
}: {
    campo: FormFieldConfig
    expanded: boolean
    dragging: boolean
    /** Posición visual: el DOM no se reordena para no cortar el arrastre. */
    order: number
    onToggle: () => void
    onPatch: (patch: Partial<FormFieldConfig>) => void
    onDelete: () => void
    onDragStart: (info: DragInfo) => void
    onDragMove: (x: number, y: number) => void
    onDragEnd: () => void
}) {
    const rootRef = useRef<HTMLDivElement>(null)
    const [confirmaBorrar, setConfirmaBorrar] = useState(false)
    const personalizado = esPersonalizado(campo)
    const esSelect = campo.kind === "select"
    const conOpciones = tieneOpciones(campo.kind)
    const sinPlaceholder = ["file", "career", "radio", "checkbox", "date"].includes(campo.kind)
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

    const moverOpcion = (index: number, delta: -1 | 1) => {
        const options = [...(campo.options ?? [])]
        const destino = index + delta
        if (destino < 0 || destino >= options.length) return
        const tmp = options[index]
        options[index] = options[destino]
        options[destino] = tmp
        onPatch({ options })
    }

    const quitarOpcion = (index: number) => {
        onPatch({ options: (campo.options ?? []).filter((_, i) => i !== index) })
    }

    return (
        <div
            ref={rootRef}
            data-campo-id={campo.id}
            style={{ order }}
            className={`border rounded-2xl overflow-hidden ${dragging
                ? "border-2 border-dashed border-[#4d0706]/50 bg-[#4d0706]/5 [&>*]:opacity-30"
                : `transition-colors ${campo.visible ? "bg-white border-gray-200" : "border-gray-200 bg-gray-50/40"}`}`}>
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
                <button
                    type="button"
                    title="Arrastrar para reordenar"
                    aria-label="Arrastrar para reordenar"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => {
                        e.preventDefault()
                        e.currentTarget.setPointerCapture(e.pointerId)
                        const r = rootRef.current?.getBoundingClientRect()
                        onDragStart({ x: e.clientX, y: e.clientY, gx: e.clientX - (r?.left ?? 0), gy: e.clientY - (r?.top ?? 0), w: r?.width ?? 300 })
                    }}
                    onPointerMove={(e) => {
                        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
                        if (e.pointerType === "mouse" && e.buttons === 0) {
                            onDragEnd()
                            return
                        }
                        onDragMove(e.clientX, e.clientY)
                    }}
                    onPointerUp={onDragEnd}
                    onPointerCancel={onDragEnd}
                    onLostPointerCapture={onDragEnd}
                    style={{ touchAction: "none" }}
                    className="w-7 h-9 shrink-0 grid place-items-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors"
                >
                    <GripVertical aria-hidden="true" className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{campo.label || campo.id}</p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">
                        {personalizado ? `personalizado · ${nombreTipo(campo.kind)}` : `${campo.id} · ${campo.kind}`}
                        {conOpciones && ` · ${campo.options?.length ?? 0} opciones`}
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
                        {personalizado && (
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Tipo de campo</label>
                                <select
                                    className={inputClass}
                                    value={campo.kind}
                                    onChange={(e) => {
                                        const kind = e.target.value as FieldKind
                                        onPatch({ kind, ...(tieneOpciones(kind) && !campo.options?.length ? { options: opcionesIniciales() } : {}) })
                                    }}
                                >
                                    {CUSTOM_KINDS.map((k) => (
                                        <option key={k} value={k}>
                                            {CUSTOM_KIND_LABELS[k]} — {CUSTOM_KIND_DESCRIPTIONS[k]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {campo.kind !== "file" && campo.kind !== "career" && (
                            <>
                                {!sinPlaceholder && <div>
                                    <label className={labelClass}>Texto de ejemplo (placeholder)</label>
                                    <input
                                        className={inputClass}
                                        value={campo.placeholder ?? ""}
                                        maxLength={160}
                                        onChange={(e) => onPatch({ placeholder: e.target.value })}
                                    />
                                </div>}
                                <div className={sinPlaceholder ? "sm:col-span-2" : ""}>
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

                    {conOpciones && (
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
                            {personalizado ? (
                                <p className="text-[11px] text-gray-400 font-medium">
                                    {campo.kind === "checkbox"
                                        ? "La persona puede marcar varias de estas opciones."
                                        : campo.kind === "radio"
                                            ? "Se muestran todas a la vista y la persona elige una."
                                            : "Se muestran en una lista desplegable y la persona elige una."}{" "}
                                    Usá las flechas para cambiar el orden.
                                </p>
                            ) : (
                                <p className="text-[11px] text-gray-400 font-medium">
                                    El <span className="font-bold">valor</span> es lo que se guarda; el{" "}
                                    <span className="font-bold">texto</span> es lo que ve la persona. En la mayoría de los campos son iguales.
                                </p>
                            )}
                            <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
                                {(campo.options ?? []).map((opt, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2">
                                        {personalizado ? (
                                            <input
                                                className={`${inputClass} flex-1 min-w-0`}
                                                value={opt.label}
                                                placeholder={`Opción ${index + 1}`}
                                                maxLength={80}
                                                onChange={(e) => {
                                                    const texto = limpiarTextoOpcion(e.target.value)
                                                    actualizarOpcion(index, { value: texto, label: texto })
                                                }}
                                            />
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                        <div className="flex gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => moverOpcion(index, -1)}
                                            disabled={index === 0}
                                            title="Subir"
                                            aria-label="Subir opción"
                                            className="w-11 h-11 grid place-items-center rounded-xl text-gray-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 cursor-pointer transition-colors"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moverOpcion(index, 1)}
                                            disabled={index === (campo.options?.length ?? 0) - 1}
                                            title="Bajar"
                                            aria-label="Bajar opción"
                                            className="w-11 h-11 grid place-items-center rounded-xl text-gray-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 cursor-pointer transition-colors"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => quitarOpcion(index)}
                                            title="Quitar opción"
                                            className="w-11 h-11 shrink-0 grid place-items-center rounded-xl text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        </div>
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

                    <div className="pt-3 border-t border-gray-100">
                        {personalizado ? (
                            confirmaBorrar ? (
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-bold text-red-600">¿Eliminar este campo? Las respuestas ya guardadas no se borran.</p>
                                    <button
                                        type="button"
                                        onClick={onDelete}
                                        className="px-3 py-1.5 rounded-lg text-xs font-black text-white bg-red-600 hover:bg-red-700 cursor-pointer transition-colors"
                                    >
                                        Sí, eliminar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmaBorrar(false)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirmaBorrar(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Eliminar campo
                                </button>
                            )
                        ) : (
                            <p className="text-[11px] text-gray-400 font-medium">
                                Este campo es parte del formulario base y no se puede eliminar; si no lo necesitás, desmarcá "Visible".
                            </p>
                        )}
                    </div>
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
    const [draggingId, setDraggingId] = useState<FieldId | null>(null)
    const [ghost, setGhost] = useState<DragInfo | null>(null)
    const [eligiendoTipo, setEligiendoTipo] = useState(false)

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

    /*
     * Arrastre: el campo arrastrado se inserta en el lugar del que está bajo el cursor
     * (los demás se corren), tanto hacia adelante como hacia atrás o a los costados.
     *
     * - `ordenInicial` congela el orden del DOM durante el arrastre (ver `domPaso`).
     * - `arrastrandoRef` / `punteroRef` se leen en los eventos del puntero, que pueden
     *   llegar antes de que React haya vuelto a renderizar.
     * - `esperandoRender` evita decidir con un layout viejo: tras un movimiento no se
     *   vuelve a evaluar hasta que el cambio esté pintado.
     * - `ultimoMovimiento` exige que el puntero se mueva un poco antes de reordenar de
     *   nuevo, así dos tarjetas de distinto tamaño no se turnan sin parar.
     */
    const ordenInicial = useRef<FormFieldConfig[] | null>(null)
    const camposRef = useRef(campos)
    camposRef.current = campos
    const arrastrandoRef = useRef<FieldId | null>(null)
    const punteroRef = useRef<{ x: number; y: number } | null>(null)
    const esperandoRender = useRef(false)
    const ultimoMovimiento = useRef<{ x: number; y: number } | null>(null)

    const moverA = (id: FieldId, overId: string) => {
        const actual = camposRef.current
        const from = actual.findIndex((c) => c.id === id)
        const to = actual.findIndex((c) => c.id === overId)
        if (from < 0 || to < 0 || from === to || actual[from].step !== actual[to].step) return
        esperandoRender.current = true
        ultimoMovimiento.current = punteroRef.current
        setCampos((prev) => {
            const f = prev.findIndex((c) => c.id === id)
            const t = prev.findIndex((c) => c.id === overId)
            if (f < 0 || t < 0 || f === t) return prev
            const next = [...prev]
            const [movido] = next.splice(f, 1)
            next.splice(t, 0, movido)
            return next
        })
        marcar()
    }

    const evaluarArrastre = () => {
        const id = arrastrandoRef.current
        const p = punteroRef.current
        if (!id || !p || esperandoRender.current) return
        const u = ultimoMovimiento.current
        if (u && Math.hypot(p.x - u.x, p.y - u.y) < 8) return
        const cercano = tarjetaMasCercana(p.x, p.y)
        if (cercano && cercano !== id) moverA(id, cercano)
    }

    const abrirSelectorTipo = () => {
        if (campos.filter(esPersonalizado).length >= MAX_CUSTOM) {
            setError(`Podés agregar hasta ${MAX_CUSTOM} campos personalizados.`)
            return
        }
        setError("")
        setEligiendoTipo(true)
    }

    const agregarCampo = (kind: CustomKind) => {
        const id = nuevoIdPersonalizado()
        const conOpciones = tieneOpciones(kind)
        setCampos((prev) => [
            ...prev,
            {
                id,
                kind,
                step: activeStep,
                label: "Nuevo campo",
                placeholder: "",
                required: false,
                visible: true,
                span: conOpciones && kind !== "select" ? 2 : 1,
                ...(conOpciones ? { options: opcionesIniciales() } : {}),
                ...(kind === "select" ? { placeholderOption: "Seleccioná una opción" } : {}),
            },
        ])
        setExpandedId(id)
        setEligiendoTipo(false)
        setError("")
        marcar()
    }

    const eliminarCampo = (id: FieldId) => {
        setCampos((prev) => prev.filter((c) => c.id !== id))
        setExpandedId((prev) => (prev === id ? null : prev))
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
        const conOpciones = visibles.filter((c) => tieneOpciones(c.kind))
        const sinOpciones = conOpciones.filter((c) => !(c.options ?? []).length)
        if (sinOpciones.length) {
            setError(`Los campos con opciones necesitan al menos una: ${sinOpciones.map((c) => c.label || c.id).join(", ")}.`)
            return
        }
        const opcionVacia = conOpciones.filter((c) => (c.options ?? []).some((o) => !o.value.trim() || !o.label.trim()))
        if (opcionVacia.length) {
            setError(`Hay opciones sin texto en: ${opcionVacia.map((c) => c.label || c.id).join(", ")}. Completalas o quitalas.`)
            return
        }
        const repetidas = conOpciones.filter((c) => {
            const valores = (c.options ?? []).map((o) => o.value.trim().toLowerCase())
            return new Set(valores).size !== valores.length
        })
        if (repetidas.length) {
            setError(`Hay opciones repetidas en: ${repetidas.map((c) => c.label || c.id).join(", ")}.`)
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

    /*
     * FLIP: cuando cambia el orden, cada tarjeta se desliza desde donde estaba
     * hasta donde quedó, así se ve claramente qué se movió y adónde.
     */
    const sectionRef = useRef<HTMLElement>(null)
    const rectsRef = useRef(new Map<string, { x: number; y: number }>())
    const ordenRef = useRef("")
    useLayoutEffect(() => {
        const section = sectionRef.current
        if (!section) return
        // El cambio ya está pintado: se puede volver a decidir con el layout nuevo.
        esperandoRender.current = false
        const orden = `${activeStep}:${campos.map((c) => c.id).join(",")}`
        const animar = orden !== ordenRef.current && ordenRef.current.startsWith(`${activeStep}:`)
        ordenRef.current = orden
        const nuevos = new Map<string, { x: number; y: number }>()
        section.querySelectorAll<HTMLElement>("[data-campo-id]").forEach((el) => {
            const id = el.dataset.campoId as string
            // offsetLeft/Top ignoran los transform: una tarjeta a mitad de animación
            // no falsea la posición de la siguiente.
            const pos = { x: el.offsetLeft, y: el.offsetTop }
            nuevos.set(id, pos)
            const prev = rectsRef.current.get(id)
            if (animar && prev && (Math.abs(prev.x - pos.x) > 1 || Math.abs(prev.y - pos.y) > 1)) {
                el.animate(
                    [{ transform: `translate(${prev.x - pos.x}px, ${prev.y - pos.y}px)` }, { transform: "translate(0, 0)" }],
                    { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
                )
            }
        })
        rectsRef.current = nuevos
        // Si el puntero ya se había movido mientras se pintaba, se reevalúa.
        if (arrastrandoRef.current) requestAnimationFrame(evaluarArrastre)
    })

    /*
     * Tarjeta más cercana al cursor (en cualquier dirección, incluso en diagonal o sobre los huecos).
     * Usa el layout (offset*) y no getBoundingClientRect, que incluye las animaciones en curso.
     */
    const tarjetaMasCercana = (cx: number, cy: number): string | null => {
        const section = sectionRef.current
        if (!section) return null
        const sr = section.getBoundingClientRect()
        const x = cx - sr.left
        const y = cy - sr.top
        let mejor: string | null = null
        let mejorBorde = Infinity
        let mejorCentro = Infinity
        section.querySelectorAll<HTMLElement>("[data-campo-id]").forEach((el) => {
            const r = { left: el.offsetLeft, top: el.offsetTop, right: el.offsetLeft + el.offsetWidth, bottom: el.offsetTop + el.offsetHeight, width: el.offsetWidth, height: el.offsetHeight }
            const dx = Math.max(r.left - x, 0, x - r.right)
            const dy = Math.max(r.top - y, 0, y - r.bottom)
            const borde = Math.hypot(dx, dy)
            const centro = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2))
            if (borde < mejorBorde - 0.5 || (Math.abs(borde - mejorBorde) <= 0.5 && centro < mejorCentro)) {
                mejor = el.dataset.campoId ?? null
                mejorBorde = borde
                mejorCentro = centro
            }
        })
        return mejor
    }

    const camposPaso = campos.filter((c) => c.step === activeStep)
    /*
     * Mientras se arrastra, el DOM conserva el orden de partida y el orden
     * visual lo da `order`. Si React moviera en el DOM la tarjeta arrastrada
     * (al ir hacia atrás o a la izquierda), el navegador soltaría el puntero
     * y el arrastre se cortaría.
     */
    const domPaso = ordenInicial.current
        ? [
            ...ordenInicial.current.filter((c) => c.step === activeStep).flatMap((c) => campos.filter((k) => k.id === c.id)),
            ...camposPaso.filter((c) => !ordenInicial.current?.some((o) => o.id === c.id)),
        ]
        : camposPaso
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

            <section ref={sectionRef} className="relative grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-start">
                {domPaso.map((campo) => (
                    <CampoEditor
                        key={campo.id}
                        campo={campo}
                        expanded={expandedId === campo.id}
                        dragging={draggingId === campo.id}
                        order={camposPaso.findIndex((c) => c.id === campo.id)}
                        onToggle={() => setExpandedId((prev) => (prev === campo.id ? null : campo.id))}
                        onPatch={(patch) => actualizarCampo(campo.id, patch)}
                        onDelete={() => eliminarCampo(campo.id)}
                        onDragStart={(info) => {
                            ordenInicial.current = campos
                            arrastrandoRef.current = campo.id
                            punteroRef.current = { x: info.x, y: info.y }
                            ultimoMovimiento.current = null
                            esperandoRender.current = false
                            // Una tarjeta abierta distorsiona la grilla mientras se arrastra.
                            setExpandedId(null)
                            setDraggingId(campo.id)
                            setGhost(info)
                        }}
                        onDragMove={(x, y) => {
                            if (arrastrandoRef.current !== campo.id) return
                            punteroRef.current = { x, y }
                            setGhost((g) => (g ? { ...g, x, y } : g))
                            evaluarArrastre()
                            // autoscroll cerca de los bordes
                            if (y < 110) window.scrollBy(0, -18)
                            else if (y > window.innerHeight - 120) window.scrollBy(0, 18)
                        }}
                        onDragEnd={() => {
                            ordenInicial.current = null
                            arrastrandoRef.current = null
                            punteroRef.current = null
                            ultimoMovimiento.current = null
                            setDraggingId(null)
                            setGhost(null)
                        }}
                    />
                ))}
                {camposPaso.length === 0 && (
                    <p className="lg:col-span-2 text-sm text-gray-400 font-medium text-center py-10 border border-dashed border-gray-200 rounded-2xl">
                        Este paso no tiene campos cargados.
                    </p>
                )}
            </section>

            {eligiendoTipo ? (
                <div className="rounded-2xl border-2 border-dashed border-[#4d0706]/30 p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">¿Qué tipo de campo querés agregar?</p>
                        <button
                            type="button"
                            onClick={() => setEligiendoTipo(false)}
                            title="Cancelar"
                            aria-label="Cancelar"
                            className="w-8 h-8 grid place-items-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {CUSTOM_KINDS.map((k) => {
                            const Icon = KIND_ICONS[k]
                            return (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => agregarCampo(k)}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white text-left hover:border-[#4d0706]/40 hover:bg-[#4d0706]/[0.03] cursor-pointer transition-colors"
                                >
                                    <span className="w-9 h-9 shrink-0 grid place-items-center rounded-lg bg-[#4d0706]/5 text-[#4d0706]">
                                        <Icon className="w-4 h-4" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-black text-gray-900">{CUSTOM_KIND_LABELS[k]}</span>
                                        <span className="block text-[11px] font-medium text-gray-400">{CUSTOM_KIND_DESCRIPTIONS[k]}</span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={abrirSelectorTipo}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-xs font-black uppercase tracking-widest text-[#4d0706] border-2 border-dashed border-[#4d0706]/30 hover:bg-[#4d0706]/5 cursor-pointer transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Agregar campo a este paso
                </button>
            )}

            {ghost && draggingId && (() => {
                const c = campos.find((f) => f.id === draggingId)
                if (!c) return null
                return createPortal(
                    <div
                        style={{ position: "fixed", left: 0, top: 0, width: ghost.w, transform: `translate(${ghost.x - ghost.gx}px, ${ghost.y - ghost.gy}px) rotate(1.5deg)`, pointerEvents: "none", zIndex: 9999 }}
                        className="bg-white border border-[#4d0706]/30 rounded-2xl shadow-2xl ring-2 ring-[#4d0706]/30 px-4 py-3 flex items-center gap-2 cursor-grabbing"
                    >
                        <GripVertical aria-hidden="true" className="w-4 h-4 text-[#4d0706] shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate">{c.label || c.id}</p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">{c.id} · {c.kind}</p>
                        </div>
                    </div>,
                    document.body,
                )
            })()}

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