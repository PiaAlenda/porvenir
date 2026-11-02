import JSZip from "jszip"
import { CONTRACT_MARKERS, type ContractContent } from "./contractContent"

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
const MAX_DOCX_BYTES = 5 * 1024 * 1024

export interface ParsedContract {
    content: ContractContent
    /** Datos del alumno que el sistema va a completar solo en el PDF. */
    detected: string[]
    /** Datos que el documento no tiene y quedarán en blanco. */
    missing: string[]
}

interface NumLevel {
    fmt: string
    text: string
    start: number
}

type NumberingMap = Map<string, Map<number, NumLevel>>

function elementsByName(parent: Element | Document, name: string): Element[] {
    return Array.from(parent.getElementsByTagNameNS(W, name))
}

function attr(el: Element | null | undefined, name: string): string | null {
    return el ? el.getAttributeNS(W, name) : null
}

function parseXml(xml: string): Document {
    const doc = new DOMParser().parseFromString(xml, "application/xml")
    if (doc.getElementsByTagName("parsererror").length) {
        throw new Error("El archivo no es un documento de Word válido.")
    }
    return doc
}

/** numId -> nivel -> formato. Word guarda la numeración aparte del texto. */
function parseNumbering(xml: string | null): NumberingMap {
    const out: NumberingMap = new Map()
    if (!xml) return out
    const doc = parseXml(xml)

    const abstracts = new Map<string, Map<number, NumLevel>>()
    for (const abs of elementsByName(doc, "abstractNum")) {
        const id = attr(abs, "abstractNumId")
        if (id === null) continue
        const levels = new Map<number, NumLevel>()
        for (const lvl of elementsByName(abs, "lvl")) {
            const ilvl = Number(attr(lvl, "ilvl") ?? 0)
            levels.set(ilvl, {
                fmt: attr(elementsByName(lvl, "numFmt")[0], "val") ?? "decimal",
                text: attr(elementsByName(lvl, "lvlText")[0], "val") ?? "",
                start: Number(attr(elementsByName(lvl, "start")[0], "val") ?? 1),
            })
        }
        abstracts.set(id, levels)
    }

    for (const num of elementsByName(doc, "num")) {
        const numId = attr(num, "numId")
        const abstractId = attr(elementsByName(num, "abstractNumId")[0], "val")
        if (numId === null || abstractId === null) continue
        const levels = abstracts.get(abstractId)
        if (levels) out.set(numId, levels)
    }
    return out
}

function toLetters(n: number, upper: boolean): string {
    let s = ""
    let v = n
    while (v > 0) {
        v -= 1
        s = String.fromCharCode(97 + (v % 26)) + s
        v = Math.floor(v / 26)
    }
    return upper ? s.toUpperCase() : s
}

function toRoman(n: number, upper: boolean): string {
    const table: [number, string][] = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]]
    let v = n
    let s = ""
    for (const [value, sym] of table) {
        while (v >= value) {
            s += sym
            v -= value
        }
    }
    return upper ? s.toUpperCase() : s
}

function formatCounter(fmt: string, n: number): string {
    switch (fmt) {
        case "lowerLetter":
            return toLetters(n, false)
        case "upperLetter":
            return toLetters(n, true)
        case "lowerRoman":
            return toRoman(n, false)
        case "upperRoman":
            return toRoman(n, true)
        default:
            return String(n)
    }
}

interface RawParagraph {
    text: string
    /** Texto de la numeración de Word ("1)", "a)"). Vacío si es viñeta o no tiene. */
    label: string
    isList: boolean
    isBullet: boolean
    isDecimal: boolean
}

function paragraphText(p: Element): string {
    let text = ""
    const walk = (node: Node) => {
        for (const child of Array.from(node.childNodes)) {
            if (child.nodeType !== 1) continue
            const el = child as Element
            if (el.namespaceURI !== W) {
                walk(el)
                continue
            }
            if (el.localName === "t") text += el.textContent ?? ""
            else if (el.localName === "tab") text += " "
            else if (el.localName === "br") text += " "
            else if (el.localName === "pPr" || el.localName === "rPr") continue
            else walk(el)
        }
    }
    walk(p)
    return text
}

function readParagraphs(documentXml: string, numbering: NumberingMap): RawParagraph[] {
    const doc = parseXml(documentXml)
    const body = elementsByName(doc, "body")[0]
    if (!body) throw new Error("El documento de Word está vacío.")

    const counters = new Map<string, number[]>()
    const out: RawParagraph[] = []

    for (const node of Array.from(body.children)) {
        if (node.namespaceURI !== W || node.localName !== "p") continue

        const numPr = elementsByName(node, "numPr")[0]
        const numId = attr(elementsByName(numPr ?? node, "numId")[0], "val")
        const ilvl = Number(attr(elementsByName(numPr ?? node, "ilvl")[0], "val") ?? 0)
        const level = numPr && numId && numId !== "0" ? numbering.get(numId)?.get(ilvl) : undefined

        let label = ""
        let isBullet = false
        let isDecimal = false
        if (level && numId) {
            if (level.fmt === "bullet" || level.fmt === "none") {
                isBullet = true
            } else {
                const levels = counters.get(numId) ?? []
                levels[ilvl] = (levels[ilvl] ?? level.start - 1) + 1
                // Un nivel nuevo reinicia los más profundos, como hace Word.
                levels.length = ilvl + 1
                counters.set(numId, levels)
                label = level.text.replace(/%(\d)/g, (_, d: string) => {
                    const idx = Number(d) - 1
                    const fmt = numbering.get(numId)?.get(idx)?.fmt ?? level.fmt
                    return formatCounter(fmt, levels[idx] ?? 1)
                })
                isDecimal = level.fmt === "decimal"
            }
        }

        out.push({ text: paragraphText(node), label, isList: Boolean(level), isBullet, isDecimal })
    }
    return out
}

/** Pasa las comillas curvas a rectas y junta los espacios repetidos. */
function clean(text: string): string {
    return text
        .replace(/[“”„]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

const BLANK = "(?:[\\u2026._]{3,}|\\.{2,}\\s*\\u2026+)"
const DATE_BLANK = "[\\u2026._]{2,}\\s*\\/\\s*[\\u2026._]{2,}\\s*\\/\\s*[\\u2026._]{2,}"

/**
 * Si el documento ya trae <ALUMNO>, <DNI>... se respeta. Si tiene los datos
 * como líneas de puntos ("Sr/a………", "DNI………"), se reemplazan por el marcador
 * correspondiente para que el contrato se complete solo.
 */
function insertMarkers(intro: string): string {
    const rules: [RegExp, string][] = [
        [new RegExp(`(Sr\\/a\\.?\\s*)${BLANK}`, "i"), "ALUMNO"],
        [new RegExp(`(\\bDNI\\s*:?\\s*)${BLANK}`), "DNI"],
        [new RegExp(`(\\bedad\\s*:?\\s*)${BLANK}`, "i"), "EDAD"],
        [new RegExp(`(C\\.?\\s?U\\.?\\s?[IL]\\.?\\s?[LT]\\.?\\s*:?\\s*)${BLANK}`, "i"), "CUIL"],
        [new RegExp(`(domicilio\\s+en\\s*)${BLANK}`, "i"), "DOMICILIO"],
        [new RegExp(`(departamento\\s*:?\\s*)${BLANK}`, "i"), "DEPARTAMENTO"],
        [new RegExp(`(Celular\\s*(?:N[°º.]*)?\\s*:?\\s*)${BLANK}`, "i"), "CELULAR"],
        [new RegExp(`(fecha\\s+de\\s+nacimiento\\s*:?\\s*)${DATE_BLANK}`, "i"), "FECHA_NACIMIENTO"],
        [new RegExp(`(e-?mail\\s*:?\\s*)${BLANK}`, "i"), "EMAIL"],
        [new RegExp(`(especialidad|curso|carrera)(\\s*:?\\s*)${BLANK}`, "i"), "CURSO"],
    ]
    let out = intro
    for (const [regex, marker] of rules) {
        if (out.includes(`<${marker}>`)) continue
        out = out.replace(regex, (_m, label: string, sep?: string) =>
            typeof sep === "string" ? `${label}${sep.trimEnd()} <${marker}> ` : `${label.trimEnd()} <${marker}> `,
        )
    }
    return out.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim()
}

function splitFirmas(text: string): string[] {
    return text
        .split(/\s{3,}/)
        .map((s) => s.trim())
        .filter(Boolean)
}

function structure(paragraphs: RawParagraph[]): ContractContent {
    const withText = paragraphs.filter((p) => clean(p.text))

    let introIdx = withText.findIndex((p) => !p.isList && clean(p.text).length > 200)
    if (introIdx === -1) introIdx = withText.findIndex((p) => /<[A-Z_]+>/.test(p.text))
    if (introIdx === -1) {
        throw new Error("No encontré el párrafo inicial del contrato (\"Entre la Escuela... y el Sr/a...\").")
    }

    const header = withText.slice(0, introIdx).slice(0, 3).map((p) => clean(p.text))
    while (header.length < 3) header.push("")

    const intro = insertMarkers(clean(withText[introIdx].text))
    const clauses: ContractContent["clauses"] = []
    const firmaLines: string[] = []
    let current: ContractContent["clauses"][number] | null = null

    const ensureClause = () => {
        if (!current) {
            current = { heading: "" }
            clauses.push(current)
        }
        return current
    }

    for (const p of withText.slice(introIdx + 1)) {
        const text = clean(p.text)

        if (/^firma/i.test(text)) {
            firmaLines.push(...splitFirmas(p.text.replace(/\u00A0/g, " ")).map(clean))
            continue
        }

        const typedHeading = !p.isList && /^\d+\s*[).-]\s*\S/.test(text)
        if (p.isDecimal || typedHeading) {
            const heading = p.isDecimal ? `${p.label} ${text}` : text
            current = { heading }
            clauses.push(current)
            continue
        }

        if (p.isList || /^[a-z]\)\s+\S/.test(text)) {
            const clause = ensureClause()
            const item = p.label && !p.isBullet ? `${p.label} ${text}` : text
            clause.items = [...(clause.items ?? []), item]
            continue
        }

        if (/^fecha\b/i.test(text) && !current) continue
        const clause = ensureClause()
        clause.body = clause.body ? `${clause.body}\n${text}` : text
    }

    if (!clauses.length) throw new Error("No encontré las cláusulas del contrato en el documento.")

    return { header: header as ContractContent["header"], intro, clauses, firmaLines }
}

const MARKER_LABELS: Record<(typeof CONTRACT_MARKERS)[number], string> = {
    ALUMNO: "Nombre del alumno",
    DNI: "DNI",
    EDAD: "Edad",
    CUIL: "CUIL",
    DOMICILIO: "Domicilio",
    DEPARTAMENTO: "Departamento",
    CELULAR: "Celular",
    FECHA_NACIMIENTO: "Fecha de nacimiento",
    EMAIL: "Email",
    CURSO: "Curso / carrera",
}

export async function parseContractDocx(file: File): Promise<ParsedContract> {
    if (!/\.docx$/i.test(file.name)) {
        throw new Error("El archivo tiene que ser un documento de Word (.docx).")
    }
    if (file.size > MAX_DOCX_BYTES) {
        throw new Error("El archivo supera los 5 MB.")
    }

    let zip: JSZip
    try {
        zip = await JSZip.loadAsync(await file.arrayBuffer())
    } catch {
        throw new Error("No se pudo abrir el archivo. ¿Es un .docx válido?")
    }

    const documentXml = await zip.file("word/document.xml")?.async("string")
    if (!documentXml) throw new Error("El archivo no es un documento de Word válido.")
    const numberingXml = (await zip.file("word/numbering.xml")?.async("string")) ?? null

    const content = structure(readParagraphs(documentXml, parseNumbering(numberingXml)))
    content.fileName = file.name

    const detected = CONTRACT_MARKERS.filter((m) => content.intro.includes(`<${m}>`)).map((m) => MARKER_LABELS[m])
    const missing = CONTRACT_MARKERS.filter((m) => !content.intro.includes(`<${m}>`)).map((m) => MARKER_LABELS[m])
    return { content, detected, missing }
}
