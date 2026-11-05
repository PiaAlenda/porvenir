import { useEffect, useLayoutEffect, useRef, useState, type TextareaHTMLAttributes } from "react"
import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2, X } from "lucide-react"
import { clauseTitle, type DraftClause } from "./draft"

function fitHeight(el: HTMLTextAreaElement) {
    if (!el.offsetWidth) return // escondida: se mide cuando aparezca
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`
}

/** Textarea que crece con el texto, para que nunca aparezca una barra de scroll chiquita. */
export function AutoTextarea({
    value,
    className = "",
    focusAtEnd = false,
    ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string; focusAtEnd?: boolean }) {
    const ref = useRef<HTMLTextAreaElement>(null)
    useLayoutEffect(() => {
        const el = ref.current
        if (el) fitHeight(el)
    }, [value])
    // También al cambiar el ancho: girar el celular, achicar la ventana, o una
    // pestaña escondida que se vuelve a mostrar (escondida mide 0).
    useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        let lastWidth = el.offsetWidth
        const ro = new ResizeObserver(() => {
            if (el.offsetWidth === lastWidth) return
            lastWidth = el.offsetWidth
            fitHeight(el)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    // Solo al aparecer: cursor al final (por ejemplo, después del "4) " de una cláusula nueva).
    useLayoutEffect(() => {
        const el = ref.current
        if (!focusAtEnd || !el) return
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <textarea ref={ref} rows={1} value={value} className={`block w-full resize-none overflow-hidden ${className}`} {...rest} />
}

/** Caja de texto con borde visible: se nota que se puede escribir. text-base evita el zoom del iPhone. */
export const INPUT =
    "rounded-xl bg-white px-3 py-2.5 text-base sm:text-sm text-gray-800 leading-relaxed outline-none ring-1 ring-gray-300 hover:ring-gray-400 focus:ring-2 focus:ring-[#4d0706] placeholder:text-gray-400"

/** Igual que INPUT pero con letra más grande: en la ventana de edición se lee texto largo. */
const READ_INPUT =
    "rounded-xl bg-white px-3.5 py-3 text-base sm:text-[15px] text-gray-800 leading-relaxed outline-none ring-1 ring-gray-300 hover:ring-gray-400 focus:ring-2 focus:ring-[#4d0706] placeholder:text-gray-400"

/* ---------- Fila de la lista ---------- */

interface RowProps {
    clause: DraftClause
    index: number
    total: number
    onOpen(): void
    onMove(dir: -1 | 1): void
    onDelete(): void
}

export function ClauseRow({ clause, index, total, onOpen, onMove, onDelete }: RowProps) {
    const title = clauseTitle(clause)
    const meta = [
        clause.items.length ? `${clause.items.length} ${clause.items.length === 1 ? "punto" : "puntos"}` : "",
        clause.body.trim() ? "texto" : "",
    ]
        .filter(Boolean)
        .join(" · ")
    const iconBtn =
        "w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"

    return (
        <div className="group flex items-center rounded-2xl bg-white ring-1 ring-gray-200 hover:ring-[#4d0706]/30 hover:shadow-sm transition-shadow">
            <button type="button" onClick={onOpen} className="flex-1 min-w-0 flex items-center gap-3 py-3.5 pl-3.5 pr-2 text-left cursor-pointer">
                <span className="w-7 h-7 rounded-full bg-[#4d0706] text-[#ffcc00] flex items-center justify-center text-xs font-black shrink-0">
                    {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[15px] sm:text-sm font-bold ${title ? "text-gray-800" : "text-gray-400 italic"}`}>
                        {title || "Cláusula sin título"}
                    </span>
                    <span className="block text-xs font-medium text-gray-400">{meta || (title ? "Solo título" : "Tocá para escribirla")}</span>
                </span>
                <ChevronRight className="w-5 h-5 shrink-0 text-gray-300 group-hover:text-[#4d0706] sm:hidden" />
                <span className="hidden sm:inline text-xs font-bold text-[#4d0706] opacity-0 group-hover:opacity-100 shrink-0">Editar</span>
            </button>
            {/* Atajos para la computadora. En el celular están dentro de la ventana de edición. */}
            <div className="hidden sm:flex items-center pr-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className={iconBtn} title="Subir">
                    <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className={iconBtn} title="Bajar">
                    <ArrowDown className="w-4 h-4" />
                </button>
                <button type="button" onClick={onDelete} className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`} title="Borrar">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

/* ---------- Contenido de la ventana de edición ---------- */

function FieldLabel({ title, hint, htmlFor }: { title: string; hint?: string; htmlFor?: string }) {
    return (
        <label htmlFor={htmlFor} className="block mb-1.5">
            <span className="block text-sm font-black text-gray-900">{title}</span>
            {hint && <span className="block text-xs text-gray-500 font-medium">{hint}</span>}
        </label>
    )
}

interface EditorProps {
    clause: DraftClause
    onChange(next: DraftClause): void
    /** Pone el cursor en el título (cláusula recién creada). */
    autoFocusTitle?: boolean
}

export function ClauseEditor({ clause, onChange, autoFocusTitle }: EditorProps) {
    const [focusItem, setFocusItem] = useState<number | null>(null)

    const setItem = (i: number, text: string) => onChange({ ...clause, items: clause.items.map((it, j) => (j === i ? text : it)) })
    const removeItem = (i: number) => onChange({ ...clause, items: clause.items.filter((_, j) => j !== i) })
    const addItem = (at = clause.items.length) => {
        const items = [...clause.items]
        items.splice(at, 0, "")
        onChange({ ...clause, items })
        setFocusItem(at)
    }

    return (
        <div className="space-y-6">
            <div>
                <FieldLabel title="Título" hint="Lo que se lee primero, en negrita. Puede ser una frase o un párrafo." htmlFor={`t-${clause.id}`} />
                <AutoTextarea
                    id={`t-${clause.id}`}
                    value={clause.heading}
                    focusAtEnd={autoFocusTitle}
                    onChange={(e) => onChange({ ...clause, heading: e.target.value.replace(/\n/g, " ") })}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    placeholder="Ej.: 4) Vigencia del contrato"
                    maxLength={6000}
                    className={`${READ_INPUT} font-bold`}
                />
            </div>

            <div>
                <FieldLabel title="Puntos (opcional)" hint="Se imprimen como una lista. Con Enter pasás al punto siguiente." />
                {clause.items.length > 0 && (
                    <ol className="space-y-3 mb-3">
                        {clause.items.map((item, i) => (
                            <li key={i}>
                                {/* Número y "Quitar" arriba: así el texto usa todo el ancho. */}
                                <div className="flex items-center justify-between mb-1 px-1">
                                    <span className="text-xs font-black text-gray-400">Punto {i + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(i)}
                                        className="inline-flex items-center gap-1 h-7 px-2 -mr-2 rounded-lg text-xs font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                        aria-label={`Quitar el punto ${i + 1}`}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Quitar
                                    </button>
                                </div>
                                <AutoTextarea
                                    value={item}
                                    autoFocus={focusItem === i}
                                    onFocus={() => setFocusItem(null)}
                                    onChange={(e) => setItem(i, e.target.value.replace(/\n/g, " "))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            addItem(i + 1)
                                        }
                                        if (e.key === "Backspace" && !item) {
                                            e.preventDefault()
                                            removeItem(i)
                                        }
                                    }}
                                    placeholder="Escribí este punto"
                                    maxLength={6000}
                                    aria-label={`Punto ${i + 1}`}
                                    className={READ_INPUT}
                                />
                            </li>
                        ))}
                    </ol>
                )}
                <button
                    type="button"
                    onClick={() => addItem()}
                    className="w-full h-11 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-500 hover:border-[#4d0706] hover:text-[#4d0706] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Agregar un punto
                </button>
            </div>

            <div>
                <FieldLabel title="Texto adicional (opcional)" hint="Párrafos que van debajo de los puntos. Con Enter empezás un renglón nuevo." htmlFor={`b-${clause.id}`} />
                <AutoTextarea
                    id={`b-${clause.id}`}
                    value={clause.body}
                    onChange={(e) => onChange({ ...clause, body: e.target.value })}
                    placeholder="Escribí acá si la cláusula necesita más explicación"
                    maxLength={12000}
                    className={`${READ_INPUT} min-h-[120px]`}
                />
            </div>
        </div>
    )
}
