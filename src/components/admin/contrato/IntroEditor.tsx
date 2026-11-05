import { forwardRef, useEffect, useImperativeHandle, useRef, type DragEvent } from "react"
import { MARKER_SPLIT_RE, MARKER_TOKEN_RE } from "@/pdf/contractContent"

export const FIELD_DRAG_TYPE = "application/x-contrato-dato"

const NBSP = String.fromCharCode(160)

/** Nombre visible de un marcador, o null si ya no existe (por ejemplo, una pregunta borrada). */
export type LabelFor = (key: string) => string | null

export interface IntroEditorHandle {
    /** Inserta el dato donde quedó el cursor (o al final si nunca se tocó el texto). */
    insertField(key: string): void
}

interface Props {
    value: string
    onChange(value: string): void
    labelFor: LabelFor
    placeholder?: string
}

const CHIP_CLASS =
    "relative inline-flex items-center gap-1 mx-0.5 pl-2 pr-1 py-0.5 rounded-md font-black text-[0.85em] align-baseline whitespace-nowrap select-none cursor-default shadow-sm"
const CHIP_OK = "bg-[#ffcc00] text-[#4d0706] transition-all duration-300"
const FLASH = ["ring-4", "ring-[#4d0706]/50", "scale-110"]
const CHIP_GONE = "bg-red-100 text-red-700 line-through decoration-red-400"
const REMOVE_CLASS =
    "inline-flex items-center justify-center w-4 h-4 rounded-full text-[11px] leading-none no-underline opacity-60 hover:opacity-100 hover:bg-[#4d0706] hover:text-[#ffcc00] cursor-pointer"

function createChip(key: string, labelFor: LabelFor): HTMLSpanElement {
    const label = labelFor(key)
    const chip = document.createElement("span")
    chip.contentEditable = "false"
    chip.dataset.field = key
    chip.className = `${CHIP_CLASS} ${label ? CHIP_OK : CHIP_GONE}`
    chip.title = label
        ? "Este dato se completa solo con la información de cada alumno"
        : "Esta pregunta ya no existe en el formulario: en el PDF sale en blanco. Quitala con la ✕."
    chip.append(document.createTextNode(label ?? "Pregunta borrada"))
    const remove = document.createElement("span")
    remove.dataset.remove = "1"
    remove.className = REMOVE_CLASS
    remove.title = "Quitar este dato"
    remove.setAttribute("aria-label", `Quitar ${label ?? "dato"}`)
    remove.textContent = "×"
    chip.append(remove)
    return chip
}

/** Texto con <MARCADORES> → nodos del editor. */
function render(el: HTMLElement, value: string, labelFor: LabelFor) {
    const nodes: Node[] = []
    for (const part of value.split(MARKER_SPLIT_RE)) {
        if (!part) continue
        const m = MARKER_TOKEN_RE.exec(part)
        nodes.push(m ? createChip(m[1], labelFor) : document.createTextNode(part))
    }
    el.replaceChildren(...nodes)
}

/** Nodos del editor → texto con <MARCADORES>, que es lo que guarda el sistema. */
function serialize(el: HTMLElement): string {
    let out = ""
    const walk = (node: Node) => {
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE) {
                out += child.textContent ?? ""
            } else if (child instanceof HTMLElement) {
                const key = child.dataset.field
                if (key) out += `<${key}>`
                else if (child.tagName === "BR") out += " "
                else {
                    // Algunos navegadores envuelven el texto en <div> al pegar o borrar.
                    if (out && !out.endsWith(" ")) out += " "
                    walk(child)
                }
            }
        }
    }
    walk(el)
    // Pasa a espacio común los espacios duros (U+00A0) que mete el navegador y los saltos de línea.
    return out.split(NBSP).join(" ").replace(/\n/g, " ")
}

function rangeFromPoint(x: number, y: number): Range | null {
    const doc = document as Document & {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
    }
    if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(x, y)
        if (!pos) return null
        const range = document.createRange()
        range.setStart(pos.offsetNode, pos.offset)
        range.collapse(true)
        return range
    }
    return document.caretRangeFromPoint?.(x, y) ?? null
}

const IntroEditor = forwardRef<IntroEditorHandle, Props>(function IntroEditor({ value, onChange, labelFor, placeholder }, ref) {
    const elRef = useRef<HTMLDivElement>(null)
    const lastValue = useRef<string | null>(null)
    const lastLabelFor = useRef<LabelFor | null>(null)
    const savedRange = useRef<Range | null>(null)

    // Solo se redibuja cuando el valor cambia desde afuera (importar, descartar)
    // o cambian los nombres de las preguntas. Si se redibujara en cada tecla,
    // el cursor saltaría al principio.
    useEffect(() => {
        const el = elRef.current
        if (!el || (value === lastValue.current && labelFor === lastLabelFor.current)) return
        render(el, value, labelFor)
        lastValue.current = value
        lastLabelFor.current = labelFor
        savedRange.current = null
    }, [value, labelFor])

    // Recordamos dónde estaba el cursor, porque al tocar un botón el editor pierde el foco.
    useEffect(() => {
        const onSelection = () => {
            const el = elRef.current
            const sel = window.getSelection()
            if (!el || !sel || !sel.rangeCount) return
            const range = sel.getRangeAt(0)
            if (el.contains(range.commonAncestorContainer)) savedRange.current = range.cloneRange()
        }
        document.addEventListener("selectionchange", onSelection)
        return () => document.removeEventListener("selectionchange", onSelection)
    }, [])

    const emit = () => {
        const el = elRef.current
        if (!el) return
        const next = serialize(el)
        lastValue.current = next
        onChange(next)
    }

    const placeCaret = (range: Range) => {
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
        savedRange.current = range.cloneRange()
    }

    const insertAt = (range: Range, key: string) => {
        const el = elRef.current
        if (!el) return
        range.deleteContents()

        const before = document.createRange()
        before.setStart(el, 0)
        before.setEnd(range.startContainer, range.startOffset)
        const prev = before.toString().slice(-1)

        const frag = document.createDocumentFragment()
        if (prev && !/\s/.test(prev)) frag.append(document.createTextNode(" "))
        const chip = createChip(key, labelFor)
        frag.append(chip)
        const after = document.createTextNode(" ")
        frag.append(after)
        range.insertNode(frag)

        const caret = document.createRange()
        caret.setStart(after, 1)
        caret.collapse(true)
        el.focus()
        placeCaret(caret)
        emit()

        // Se ilumina un momento para que se vea dónde quedó.
        chip.scrollIntoView({ behavior: "smooth", block: "center" })
        chip.classList.add(...FLASH)
        setTimeout(() => chip.classList.remove(...FLASH), 1600)
    }

    useImperativeHandle(ref, () => ({
        insertField(key) {
            const el = elRef.current
            if (!el) return
            let range = savedRange.current
            if (!range || !el.contains(range.commonAncestorContainer)) {
                range = document.createRange()
                range.selectNodeContents(el)
                range.collapse(false)
            }
            insertAt(range, key)
        },
    }))

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        const key = e.dataTransfer.getData(FIELD_DRAG_TYPE)
        if (!key || !labelFor(key)) return
        e.preventDefault()
        const el = elRef.current
        const range = rangeFromPoint(e.clientX, e.clientY)
        if (!el || !range || !el.contains(range.startContainer)) return
        insertAt(range, key)
    }

    return (
        <div className="relative">
            <div
                ref={elRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label="Párrafo inicial del contrato"
                spellCheck
                onInput={emit}
                onKeyDown={(e) => {
                    // Es un solo párrafo: Enter no corta el texto.
                    if (e.key === "Enter") e.preventDefault()
                }}
                onPaste={(e) => {
                    e.preventDefault()
                    const text = e.clipboardData.getData("text/plain").replace(/\s+/g, " ")
                    document.execCommand("insertText", false, text)
                    // Si pegaron texto con <ALUMNO>, <DNI>... lo mostramos como etiquetas.
                    if (MARKER_SPLIT_RE.test(text) && elRef.current) {
                        const next = serialize(elRef.current)
                        render(elRef.current, next, labelFor)
                        lastValue.current = next
                        onChange(next)
                    }
                }}
                onMouseDown={(e) => {
                    const target = e.target as HTMLElement
                    if (target.dataset.remove) {
                        e.preventDefault()
                        target.parentElement?.remove()
                        emit()
                    }
                }}
                onDragOver={(e) => {
                    if (e.dataTransfer.types.includes(FIELD_DRAG_TYPE)) {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = "copy"
                    }
                }}
                onDrop={onDrop}
                className="min-h-[140px] rounded-xl px-3.5 sm:px-4 py-3 text-[15px] sm:text-[14px] leading-[2] text-gray-800 bg-white ring-1 ring-gray-300 hover:ring-gray-400 focus:ring-2 focus:ring-[#4d0706] outline-none transition-shadow"
            />
            {!value.trim() && placeholder && (
                <p className="pointer-events-none absolute left-3.5 sm:left-4 top-3 right-4 text-[15px] sm:text-[14px] leading-[2] text-gray-400">{placeholder}</p>
            )}
        </div>
    )
})

export default IntroEditor
