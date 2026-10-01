/**
 * Exportación administrativa de inscripciones a XLSX.
 *
 * Reemplaza al CSV de `src/lib/csv.ts`, que volcaba una fila plana con los
 * nombres de campo de la base de datos. Acá el trabajo no es "ponerle color":
 * es decidir qué ve una persona administrativa al abrir el archivo.
 *
 * Decisiones que sostienen el resto del módulo:
 *
 * - **Nada se inventa ni se descarta.** Cada campo guardado tiene una columna.
 *   Los que no le sirven a una persona (IDs, códigos, URLs crudas) van a una
 *   tercera hoja en vez de desaparecer.
 * - **Los documentos y los teléfonos son texto, nunca números.** Excel
 *   degrada un DNI a notación científica en cuanto tiene 11 dígitos, y un
 *   teléfono a `4.63E+10` en cuanto lo rozás. Las celdas llevan numFmt `@` y
 *   el valor va como string, así que ni Excel ni LibreOffice lo tocan.
 * - **Las fechas se escriben como fechas de Excel**, no como texto, para que
 *   se puedan ordenar y filtrar por rango. El corrimiento de zona horaria se
 *   neutraliza composing la fecha con los componentes *locales* en UTC
 *   (ver `fechaComoSerial`): el número de serie que sale es el reloj de
 *   pared que la persona espera ver, no el de UTC.
 * - **La inyección de fórmulas deja de ser un riesgo.** El CSV necesitaba
 *   anteponer un apóstrofo a todo texto que empezara con `=`, `+`, `-` o `@`.
 *   En XLSX un string vive en la tabla de strings compartidos y Excel lo
 *   muestra como texto aunque empiece con `=`, así que ese parche ya no
 *   aplica (y no debe aplicarse: contaminaría el valor real).
 * - **La tabla va formateada a mano, no con `addTable`.** Un tema de tabla de
 *   Excel reescribe los colores de encabezado y de bandas, y el resultado
 *   cambia entre Excel, LibreOffice y Google Sheets. Estilos directos +
 *   `autoFilter` + paneles congelados se ven idéntico en los tres.
 */

import { parsePhoneNumber } from "libphonenumber-js"
import type { Cell, Worksheet } from "exceljs"
import { sexoLabel } from "@/components/features/home/form/options"

/* ──────────────────────────────────────────────────────────────────────────
 * Identidad visual
 *
 * Los colores salen de la paleta del sitio (`#4d0706` y `#f5c518` en
 * InfoForm.tsx). El resto son grises neutros: la prioridad es que la fila se
 * pueda seguir con el ojo, no que el archivo parezca una plantilla.
 * ────────────────────────────────────────────────────────────────────────── */

const BRAND = "4D0706"
const ACCENT = "F5C518"
const INK = "1F2937"
const MUTED = "6B7280"
const CABECERA_FILL = "F1F3F5"
const BANDA_FILL = "F8F9FA"
const BLANCO = "FFFFFF"
const REGLA = "E7EAEE"

const FUENTE = "Calibri"

/**
 * Única convención para datos que no están. Un solo símbolo en todo el
 * archivo: si el faltan dos ("—" y "No informado") la persona tiene que
 * aprender dos reglas para leer la misma columna vacía.
 */
const SIN_DATO = "—"

/** Convención propia de las columnas de documentación: hay archivo o no hay. */
const DOC_SI = "Disponible"
const DOC_NO = "No adjunto"
const DOC_LINK = "Ver documento"

/* ──────────────────────────────────────────────────────────────────────────
 * Tipo del registro exportado
 * ────────────────────────────────────────────────────────────────────────── */

export type ValorExportable = string | number | boolean | Date | File | null | undefined

/**
 * Los mismos campos que guarda la inscripción. Es deliberadamente
 * permisiva: el form público tiene `fotoDni` como `File` (recién elegida en
 * el navegador) y la base de datos lo tiene como URL, y los dos tienen que
 * poder caer en la misma exportación.
 */
export interface RegistroExportable {
    id?: ValorExportable
    apellido?: ValorExportable
    nombre?: ValorExportable
    c_documento?: ValorExportable
    numeroDocumento?: ValorExportable
    cuil?: ValorExportable
    fechaNacimiento?: ValorExportable
    c_sexo?: ValorExportable
    c_pais_nacimiento?: ValorExportable
    c_provincia_nacimiento?: ValorExportable
    lugar_nacimiento?: ValorExportable
    c_nacionalidad?: ValorExportable
    email?: ValorExportable
    celular?: ValorExportable
    celularUrgencia?: ValorExportable
    domicilio?: ValorExportable
    departamento?: ValorExportable
    careerId?: ValorExportable
    courseTitle?: ValorExportable
    careerTitle?: ValorExportable
    especialidad?: ValorExportable
    c_discapacidad?: ValorExportable
    cud?: ValorExportable
    c_pueblo_indigena?: ValorExportable
    problematicaIntegrado?: ValorExportable
    fotoDni?: ValorExportable
    fotoCertificado?: ValorExportable
    fechaInscripcion?: ValorExportable
    createdAt?: ValorExportable
    updatedAt?: ValorExportable
}

/* ──────────────────────────────────────────────────────────────────────────
 * Lectura de valores
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Normaliza a texto y colapsa todo lo que una persona no puede usar: null,
 * undefined, cadenas vacías, `NaN` y los "null"/"undefined" que algunos
 * drivers devuelven como texto.
 */
function texto(value: ValorExportable): string {
    if (value === null || value === undefined) return SIN_DATO
    if (typeof value === "boolean") return value ? "Sí" : "No"
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : SIN_DATO
    if (typeof value !== "string") return SIN_DATO

    const limpio = value.trim()
    if (!limpio) return SIN_DATO
    // JSON y algunos drivers devuelven "null"/"undefined" como cadena.
    if (/^(null|undefined|NaN)$/i.test(limpio)) return SIN_DATO
    return limpio
}

/**
 * Excel guarda a veces un texto con apóstrofo inicial para obligarlo a que
 * quede como texto (`'+542645...`). Es ruido de formato, no parte del número:
 * se saca antes de presentar.
 */
function sinApostrofe(value: ValorExportable): string {
    const bruto = texto(value)
    if (bruto === SIN_DATO) return SIN_DATO
    return bruto.replace(/^'+/, "").trim() || SIN_DATO
}

/* ── Documento ─────────────────────────────────────────────────────────── */

/**
 * El DNI se muestra como viene, sin separadores. Agregar puntos sería más
 * lindo de leer, pero el sistema lo guarda en dígitos y quien use la planilla
 * para cruzarla con otro sistema necesita el mismo valor, no uno equivalente
 * con caracteres de más.
 */
function documento(value: ValorExportable): string {
    const bruto = sinApostrofe(value)
    if (bruto === SIN_DATO) return SIN_DATO
    return bruto.replace(/[.\s]/g, "")
}

/**
 * CUIL con el formato de siempre: 27-47798628-0. Sale de los 11 dígitos que
 * valida el formulario, así que no hay nada que inventar. Queda como texto.
 */
function cuil(value: ValorExportable): string {
    const digitos = sinApostrofe(value).replace(/\D/g, "")
    if (digitos.length !== 11) return documento(value)
    return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`
}

/* ── Sexo ──────────────────────────────────────────────────────────────── */

/** Usa el mismo catálogo que ya aplica la ficha del alumno del panel. */
function sexo(value: ValorExportable): string {
    const codigo = texto(value)
    if (codigo === SIN_DATO) return SIN_DATO
    return sexoLabel(codigo)
}

/* ── Teléfono ──────────────────────────────────────────────────────────── */

/**
 * Se intenta leer como teléfono internacional. Si el número no calza (puede
 * venir con un dígito de más, como el `'+54264589009922` que llega del
 * navegador) se muestra el valor limpio tal cual: es preferible ver el
 * número raro como lo CBA que no verlo.
 *
 * El valor original queda íntegro en la hoja "Datos técnicos".
 */
function telefono(value: ValorExportable): string {
    const limpio = sinApostrofe(value)
    if (limpio === SIN_DATO) return SIN_DATO

    try {
        const parsed = parsePhoneNumber(limpio)
        if (parsed?.isValid()) return parsed.formatInternational()
    } catch {
        // Número que libphonenumber no entiende: se muestra como vino.
    }
    return limpio
}

/* ── Fechas ────────────────────────────────────────────────────────────── */

type Partes = { anio: number; mes: number; dia: number; hora: number; minuto: number }

/** Parte una fecha ISO en sus componentes locales. `null` si no hay fecha. */
function partesLocales(value: ValorExportable): Partes | null {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null
        return {
            anio: value.getFullYear(),
            mes: value.getMonth() + 1,
            dia: value.getDate(),
            hora: value.getHours(),
            minuto: value.getMinutes(),
        }
    }
    if (typeof value !== "string") return null

    const iso = value.trim()
    if (!iso) return null

    // Fecha sola (YYYY-MM-DD): no tiene hora, y parsearla como UTC corrige el
    // día para fechas westernas. Se leen los números tal cual.
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    if (soloFecha) {
        return {
            anio: Number(soloFecha[1]),
            mes: Number(soloFecha[2]),
            dia: Number(soloFecha[3]),
            hora: 0,
            minuto: 0,
        }
    }

    const conHora = new Date(iso)
    if (Number.isNaN(conHora.getTime())) return null
    return {
        anio: conHora.getFullYear(),
        mes: conHora.getMonth() + 1,
        dia: conHora.getDate(),
        hora: conHora.getHours(),
        minuto: conHora.getMinutes(),
    }
}

/**
 * Construye el número de serie de Excel a partir de los componentes locales.
 *
 * ExcelJS escribe un `Date` tomándolo como UTC. Si se le pasa la fecha tal
 * cual, una inscripción de las 23:30 de San Juan queda Guardada con el día
 * siguiente. Armando el `Date` con `Date.UTC` de los componentes *locales* el
 * número de serie representa directamente la hora de pared, que es lo que
 * tiene que ver la persona.
 */
function fechaComoSerial(partes: Partes): Date {
    return new Date(Date.UTC(partes.anio, partes.mes - 1, partes.dia, partes.hora, partes.minuto, 0, 0))
}

const FMT_FECHA = "dd/mm/yyyy"
const FMT_FECHA_HORA = "dd/mm/yyyy hh:mm"

type CeldaFecha =
    | { tipo: "fecha"; valor: Date | string; formato: string }
    | { tipo: "texto"; valor: string }

/** Fecha de calendario: `22/12/2007`, sin hora. */
function fecha(value: ValorExportable): CeldaFecha {
    const partes = partesLocales(value)
    if (!partes) return { tipo: "texto", valor: texto(value) }
    return { tipo: "fecha", valor: fechaComoSerial(partes), formato: FMT_FECHA }
}

/** Fecha y hora: `01/10/2026 12:55`. */
function fechaHora(value: ValorExportable): CeldaFecha {
    const partes = partesLocales(value)
    if (!partes) return { tipo: "texto", valor: texto(value) }
    return { tipo: "fecha", valor: fechaComoSerial(partes), formato: FMT_FECHA_HORA }
}

/* ── Documentación adjunta ─────────────────────────────────────────────── */

interface EstadoDocumento {
    etiqueta: string
    url?: string
    archivo?: string
}

/**
 * Las URLs de Supabase miden cientos de caracteres y romperían la lectura
 * horizontal de la tabla. En la planilla va "Disponible" (con hipervínculo si
 * hay URL) y la URL entera, en la hoja de datos técnicos.
 */
function documentacion(value: ValorExportable): EstadoDocumento {
    if (!value) return { etiqueta: DOC_NO }

    if (typeof value === "string") {
        const limpio = value.trim()
        if (!limpio) return { etiqueta: DOC_NO }
        if (/^https?:\/\//i.test(limpio)) return { etiqueta: DOC_LINK, url: limpio }
        return { etiqueta: DOC_SI, archivo: limpio }
    }

    if (typeof File !== "undefined" && value instanceof File) {
        return { etiqueta: DOC_SI, archivo: value.name }
    }

    return { etiqueta: DOC_SI }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Catálogo de columnas
 *
 * El orden es el de una ficha de inscripción leída de arriba a abajo: quién
 * es, cómo lo contacto, qué estudia y qué tiene que mirar la secretaría. Los
 * anchos siguen el largo real del contenido, no un valor uniforme.
 * ────────────────────────────────────────────────────────────────────────── */

type Alineacion = "left" | "center" | "right"

type ValorCelda = string | number | Date | { text: string; hyperlink: string }

interface Columna {
    /** Nombre del campo en el registro. */
    campo: string
    /** Texto que ve la persona. */
    titulo: string
    grupo: string
    ancho: number
    alineacion: Alineacion
    /** `wrap` solo donde el contenido largo es inevitable (direcciones). */
    wrap?: boolean
    /** Fecha con hora → número de serie; el resto, texto. */
    formato?: string
    /**
     * Marca las columnas de fecha. El `numFmt` de fecha solo se aplica si la
     * celda terminó siendo una fecha de verdad: si el dato faltaba se está
     * escribiendo el guion de "sin dato", y ponerle formato `dd/mm/yyyy` a un
     * texto no aporta nada.
     */
    esFecha?: boolean
    valor: (registro: RegistroExportable) => ValorCelda
    /** Para columnas cuyo render es más caro que leer el campo. */
    extra?: (registro: RegistroExportable) => { etiqueta: string; url?: string; archivo?: string } | undefined
}

const GRUPOS = {
    personal: "DATOS PERSONALES",
    contacto: "DATOS DE CONTACTO",
    academicos: "DATOS ACADÉMICOS",
    adicional: "INFORMACIÓN ADICIONAL",
    documentacion: "DOCUMENTACIÓN",
    inscripcion: "INSCRIPCIÓN",
} as const

const COLUMNAS: Columna[] = [
    // ── Datos personales ──
    { campo: "apellido", titulo: "Apellido", grupo: GRUPOS.personal, ancho: 22, alineacion: "left", valor: (r) => texto(r.apellido) },
    { campo: "nombre", titulo: "Nombre", grupo: GRUPOS.personal, ancho: 22, alineacion: "left", valor: (r) => texto(r.nombre) },
    { campo: "c_documento", titulo: "Tipo de documento", grupo: GRUPOS.personal, ancho: 14, alineacion: "center", valor: (r) => texto(r.c_documento) },
    { campo: "numeroDocumento", titulo: "DNI", grupo: GRUPOS.personal, ancho: 11, alineacion: "center", formato: "@", valor: (r) => documento(r.numeroDocumento) },
    { campo: "cuil", titulo: "CUIL", grupo: GRUPOS.personal, ancho: 15, alineacion: "center", formato: "@", valor: (r) => cuil(r.cuil) },
    {
        campo: "fechaNacimiento",
        titulo: "Fecha de nacimiento",
        grupo: GRUPOS.personal,
        ancho: 16,
        alineacion: "center",
        formato: FMT_FECHA,
        esFecha: true,
        valor: (r) => fecha(r.fechaNacimiento).valor,
    },
    { campo: "c_sexo", titulo: "Sexo", grupo: GRUPOS.personal, ancho: 12, alineacion: "center", valor: (r) => sexo(r.c_sexo) },

    // ── Contacto ──
    { campo: "email", titulo: "Correo electrónico", grupo: GRUPOS.contacto, ancho: 28, alineacion: "left", valor: (r) => texto(r.email) },
    { campo: "celular", titulo: "Teléfono", grupo: GRUPOS.contacto, ancho: 18, alineacion: "left", formato: "@", valor: (r) => telefono(r.celular) },
    { campo: "celularUrgencia", titulo: "Teléfono de emergencia", grupo: GRUPOS.contacto, ancho: 18, alineacion: "left", formato: "@", valor: (r) => telefono(r.celularUrgencia) },
    { campo: "domicilio", titulo: "Domicilio", grupo: GRUPOS.contacto, ancho: 34, alineacion: "left", wrap: true, valor: (r) => texto(r.domicilio) },
    { campo: "departamento", titulo: "Departamento", grupo: GRUPOS.contacto, ancho: 16, alineacion: "left", valor: (r) => texto(r.departamento) },

    // ── Académicos ──
    { campo: "careerTitle", titulo: "Carrera o curso", grupo: GRUPOS.academicos, ancho: 28, alineacion: "left", wrap: true, valor: (r) => tituloCarrera(r) },
    { campo: "especialidad", titulo: "Especialidad", grupo: GRUPOS.academicos, ancho: 24, alineacion: "left", wrap: true, valor: (r) => texto(r.especialidad) },

    // ── Información adicional ──
    {
        campo: "c_discapacidad",
        titulo: "¿Posee discapacidad?",
        grupo: GRUPOS.adicional,
        ancho: 14,
        alineacion: "center",
        valor: (r) => texto(r.c_discapacidad),
    },
    { campo: "cud", titulo: "CUD", grupo: GRUPOS.adicional, ancho: 14, alineacion: "center", formato: "@", valor: (r) => documento(r.cud) },
    { campo: "c_pueblo_indigena", titulo: "Pueblo indígena", grupo: GRUPOS.adicional, ancho: 16, alineacion: "left", valor: (r) => texto(r.c_pueblo_indigena) },
    {
        campo: "problematicaIntegrado",
        titulo: "Problemática integrada",
        grupo: GRUPOS.adicional,
        ancho: 34,
        alineacion: "left",
        wrap: true,
        valor: (r) => texto(r.problematicaIntegrado),
    },

    // ── Documentación ──
    {
        campo: "fotoDni",
        titulo: "DNI adjunto",
        grupo: GRUPOS.documentacion,
        ancho: 14,
        alineacion: "center",
        valor: (r) => celdaDocumento(r.fotoDni),
        extra: (r) => documentacion(r.fotoDni),
    },
    {
        campo: "fotoCertificado",
        titulo: "Certificado adjunto",
        grupo: GRUPOS.documentacion,
        ancho: 16,
        alineacion: "center",
        valor: (r) => celdaDocumento(r.fotoCertificado),
        extra: (r) => documentacion(r.fotoCertificado),
    },

    // ── Inscripción ──
    {
        campo: "fechaInscripcion",
        titulo: "Fecha de inscripción",
        grupo: GRUPOS.inscripcion,
        ancho: 17,
        alineacion: "center",
        formato: FMT_FECHA_HORA,
        esFecha: true,
        valor: (r) => fechaHora(r.fechaInscripcion).valor,
    },
]

/** Colisión resuelta a favor del nombre humano que la persona ya ve en el form. */
function tituloCarrera(r: RegistroExportable): string {
    const humano = texto(r.careerTitle)
    return humano !== SIN_DATO ? humano : texto(r.courseTitle)
}

function celdaDocumento(value: ValorExportable): ValorCelda {
    const estado = documentacion(value)
    return estado.url ? { text: estado.etiqueta, hyperlink: estado.url } : estado.etiqueta
}

/* ──────────────────────────────────────────────────────────────────────────
 * Hoja "Datos técnicos"
 *
 * Todo lo que una persona administrativa no necesita ver, pero que no se puede
 * borrar: identificadores, códigos crudos, URLs enteras y los valores tal
 * cual los guardó el sistema. Sirve para auditoría y para recargar datos.
 * ────────────────────────────────────────────────────────────────────────── */

interface ColumnaTecnica {
    campo: string
    titulo: string
    ancho: number
}

const COLUMNAS_TECNICAS: ColumnaTecnica[] = [
    { campo: "id", titulo: "ID del registro", ancho: 38 },
    { campo: "apellido", titulo: "apellido", ancho: 22 },
    { campo: "nombre", titulo: "nombre", ancho: 22 },
    { campo: "c_documento", titulo: "c_documento", ancho: 14 },
    { campo: "numeroDocumento", titulo: "numeroDocumento", ancho: 16 },
    { campo: "cuil", titulo: "cuil", ancho: 16 },
    { campo: "fechaNacimiento", titulo: "fechaNacimiento (ISO)", ancho: 22 },
    { campo: "c_sexo", titulo: "c_sexo (código)", ancho: 14 },
    { campo: "c_pais_nacimiento", titulo: "c_pais_nacimiento", ancho: 20 },
    { campo: "c_provincia_nacimiento", titulo: "c_provincia_nacimiento", ancho: 22 },
    { campo: "lugar_nacimiento", titulo: "lugar_nacimiento", ancho: 20 },
    { campo: "c_nacionalidad", titulo: "c_nacionalidad", ancho: 18 },
    { campo: "email", titulo: "email", ancho: 28 },
    { campo: "celular", titulo: "celular (valor original)", ancho: 20 },
    { campo: "celularUrgencia", titulo: "celularUrgencia (valor original)", ancho: 20 },
    { campo: "domicilio", titulo: "domicilio", ancho: 34 },
    { campo: "departamento", titulo: "departamento", ancho: 18 },
    { campo: "careerId", titulo: "careerId", ancho: 26 },
    { campo: "courseTitle", titulo: "courseTitle", ancho: 28 },
    { campo: "especialidad", titulo: "especialidad", ancho: 24 },
    { campo: "c_discapacidad", titulo: "c_discapacidad", ancho: 16 },
    { campo: "cud", titulo: "cud", ancho: 14 },
    { campo: "c_pueblo_indigena", titulo: "c_pueblo_indigena", ancho: 20 },
    { campo: "problematicaIntegrado", titulo: "problematicaIntegrado", ancho: 34 },
    { campo: "fotoDni", titulo: "fotoDni (URL / archivo)", ancho: 52 },
    { campo: "fotoCertificado", titulo: "fotoCertificado (URL / archivo)", ancho: 52 },
    { campo: "fechaInscripcion", titulo: "fechaInscripcion (ISO)", ancho: 26 },
    { campo: "createdAt", titulo: "createdAt", ancho: 26 },
    { campo: "updatedAt", titulo: "updatedAt", ancho: 26 },
]

/* ──────────────────────────────────────────────────────────────────────────
 * Utilidades de escritura
 * ────────────────────────────────────────────────────────────────────────── */

function letraDeColumna(indice: number): string {
    let n = indice + 1
    let letras = ""
    while (n > 0) {
        const resto = (n - 1) % 26
        letras = String.fromCharCode(65 + resto) + letras
        n = Math.floor((n - 1) / 26)
    }
    return letras
}

const ULTIMA_COLUMNA = letraDeColumna(COLUMNAS.length - 1)

type ExcelWorkbook = import("exceljs").Workbook

function pintarFondo(celda: Cell, argb: string | undefined): void {
    if (!argb) return
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb } }
}

/** exceljs convierte `{ text, hyperlink }` en una celda con relación. */
function esHipervinculo(valor: Cell["value"]): boolean {
    return typeof valor === "object" && valor !== null && "hyperlink" in valor && Boolean((valor as { hyperlink?: string }).hyperlink)
}

/** Estilo del encabezado de columna: claro, en negrita, con regla al pie. */
function estiloCabecera(celda: Cell): void {
    celda.font = { name: FUENTE, size: 10, bold: true, color: { argb: BRAND } }
    celda.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
    pintarFondo(celda, CABECERA_FILL)
    celda.border = { bottom: { style: "thin", color: { argb: BRAND } } }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Hoja "Inscriptos"
 *
 * Cuatro filas de encabezado antes del primer dato:
 *   1 título   2 filete de acento   3 grupos   4 columnas
 * El autofiltro arranca en la fila 4 y el panel congela hasta la 4, así que
 * scrollear en cualquier dirección conserva título, grupo y columna.
 * ────────────────────────────────────────────────────────────────────────── */

const FILA_TITULO = 1
const FILA_FILETE = 2
const FILA_GRUPOS = 3
const FILA_COLUMNAS = 4
const PRIMER_DATOS = 5

function escribirInscriptos(wb: ExcelWorkbook, registros: RegistroExportable[], generado: Date, carrera: string): Worksheet {
    const ws = wb.addWorksheet("Inscriptos", {
        views: [{ state: "frozen", xSplit: 2, ySplit: FILA_COLUMNAS, activeCell: `C${PRIMER_DATOS}` }],
        pageSetup: {
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            printTitlesRow: `${FILA_GRUPOS}:${FILA_COLUMNAS}`,
            margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
            horizontalCentered: true,
        },
    })

    COLUMNAS.forEach((columna, i) => {
        ws.getColumn(i + 1).width = columna.ancho
    })

    // ── Fila 1: título a la izquierda, sello de generación a la derecha ──
    ws.mergeCells(`A${FILA_TITULO}:H${FILA_TITULO}`)
    const celdaTitulo = ws.getCell(`A${FILA_TITULO}`)
    celdaTitulo.value = "Listado de inscripciones"
    celdaTitulo.font = { name: FUENTE, size: 14, bold: true, color: { argb: BRAND } }
    celdaTitulo.alignment = { vertical: "middle", horizontal: "left" }
    ws.getRow(FILA_TITULO).height = 24

    ws.mergeCells(`I${FILA_TITULO}:${ULTIMA_COLUMNA}${FILA_TITULO}`)
    const celdaSello = ws.getCell(`I${FILA_TITULO}`)
    const total = registros.length
    celdaSello.value = `${total} ${total === 1 ? "registro" : "registros"}`
    celdaSello.font = { name: FUENTE, size: 10, color: { argb: MUTED } }
    celdaSello.alignment = { vertical: "middle", horizontal: "right" }

    // ── Fila 2: filete de acento. Cuatro píxeles de color de marca. ──
    ws.mergeCells(`A${FILA_FILETE}:${ULTIMA_COLUMNA}${FILA_FILETE}`)
    pintarFondo(ws.getCell(`A${FILA_FILETE}`), ACCENT)
    ws.getRow(FILA_FILETE).height = 4

    // ── Fila 3: bandas de grupo, una celda por bloque de columnas ──
    let inicio = 0
    while (inicio < COLUMNAS.length) {
        const grupo = COLUMNAS[inicio].grupo
        let fin = inicio
        while (fin + 1 < COLUMNAS.length && COLUMNAS[fin + 1].grupo === grupo) fin++

        const desde = letraDeColumna(inicio)
        const hasta = letraDeColumna(fin)
        const rango = desde === hasta ? `${desde}${FILA_GRUPOS}` : `${desde}${FILA_GRUPOS}:${hasta}${FILA_GRUPOS}`
        ws.mergeCells(rango)

        const celda = ws.getCell(`${desde}${FILA_GRUPOS}`)
        celda.value = grupo
        celda.font = { name: FUENTE, size: 9, bold: true, color: { argb: BLANCO } }
        celda.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
        // El merge de exceljs ya propaga el estilo del maestro a las celdas
        // esclavas: pintar el rango a mano dejaría huecos al imprimir.
        pintarFondo(celda, BRAND)

        inicio = fin + 1
    }
    ws.getRow(FILA_GRUPOS).height = 18

    // ── Fila 4: encabezados ──
    COLUMNAS.forEach((columna, i) => {
        const celda = ws.getCell(FILA_COLUMNAS, i + 1)
        celda.value = columna.titulo
        estiloCabecera(celda)
    })
    ws.getRow(FILA_COLUMNAS).height = 28

    // ── Datos ──
    registros.forEach((registro, indiceFila) => {
        const numeroFila = PRIMER_DATOS + indiceFila
        const fila = ws.getRow(numeroFila)
        const banda = indiceFila % 2 === 1

        COLUMNAS.forEach((columna, i) => {
            const celda = fila.getCell(i + 1)
            celda.value = columna.valor(registro)
            // `@` es lo que ata DNI, CUIL y teléfonos al formato texto: sin
            // esto Excel los pasa a número y arruina ceros y guiones.
            if (columna.formato && (!columna.esFecha || celda.value instanceof Date)) {
                celda.numFmt = columna.formato
            }
            celda.font = { name: FUENTE, size: 10, color: { argb: INK } }
            celda.alignment = {
                vertical: "middle",
                horizontal: columna.alineacion,
                wrapText: columna.wrap === true,
            }
            if (banda) pintarFondo(celda, BANDA_FILL)
            // Solo una regla fina al pie: alcanza para seguir la fila de
            // punta a punta sin encerrar cada celda en una caja.
            celda.border = { bottom: { style: "thin", color: { argb: REGLA } } }
            if (esHipervinculo(celda.value)) {
                celda.font = { name: FUENTE, size: 10, color: { argb: BRAND }, underline: true }
            }
        })
    })

    const ultimaFila = PRIMER_DATOS + registros.length - 1
    ws.autoFilter = `A${FILA_COLUMNAS}:${ULTIMA_COLUMNA}${ultimaFila}`

    // La fecha de generación va al encabezado de impresión: suma sin tapar la
    // tabla, y el listado impreso queda fechado aunque se use suelto.
    const sellado = partesLocales(generado)
    ws.headerFooter = {
        oddHeader: `&L${carrera}&RGenerado el ${sellado ? fechaLegible(sellado) : ""}`,
        oddFooter: `&LListado de inscripciones&C&P de &N&R&F`,
    }

    return ws
}

/* ──────────────────────────────────────────────────────────────────────────
 * Hoja "Resumen"
 *
 * Portada, no presentación: título, qué archivo es, cuándo se generó y los
 * indicadores que salen de los propios registros. Si un dato no se puede
 * calcular, no se muestra en lugar de estimar uno.
 * ────────────────────────────────────────────────────────────────────────── */

const RESUMEN_B = "B"
const RESUMEN_C = "C"
const RESUMEN_ULTIMA = "F"

interface FilaResumen {
    etiqueta: string
    valor: string
    /** Cuenta de la fila de indicadores, para destacar el número. */
    destacado?: boolean
    /** Conteos de los bloques de distribución: van a la derecha. */
    conteo?: boolean
}

interface BloqueResumen {
    titulo: string
    filas: FilaResumen[]
}

function contarPor(registros: RegistroExportable[], leer: (r: RegistroExportable) => string): Array<[string, number]> {
    const conteo = new Map<string, number>()
    registros.forEach((registro) => {
        const clave = leer(registro)
        conteo.set(clave, (conteo.get(clave) ?? 0) + 1)
    })
    return [...conteo.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
}

/** Cuenta solo lo que tiene valor: "—" no es una categoría, es un vacío. */
function contarPorConDato(registros: RegistroExportable[], leer: (r: RegistroExportable) => string): Array<[string, number]> {
    return contarPor(
        registros.filter((registro) => leer(registro) !== SIN_DATO),
        leer,
    )
}

function bloquesResumen(registros: RegistroExportable[], carrera: string, generado: Date): BloqueResumen[] {
    const conDiscapacidad = registros.filter((r) => texto(r.c_discapacidad) === "Sí").length

    const archivos: BloqueResumen[] = [
        {
            titulo: "DATOS DEL ARCHIVO",
            filas: [
                { etiqueta: "Total de registros", valor: String(registros.length), destacado: true },
                { etiqueta: "Carrera o curso", valor: carrera },
                { etiqueta: "Generado el", valor: fechaLegible(partesLocales(generado)!) },
            ],
        },
        {
            titulo: "INDICADORES",
            filas: [
                { etiqueta: "Inscriptos con discapacidad", valor: String(conDiscapacidad), destacado: true },
                { etiqueta: "Inscriptos sin discapacidad", valor: String(registros.length - conDiscapacidad) },
                { etiqueta: "Con documentación adjunta (DNI)", valor: `${registros.filter((r) => documentacion(r.fotoDni).etiqueta !== DOC_NO).length} de ${registros.length}` },
            ],
        },
    ]

    const porCarrera = contarPorConDato(registros, tituloCarrera)
    if (porCarrera.length) {
        archivos.push({
            titulo: "CARRERAS INCLUIDAS",
            filas: porCarrera.map(([nombre, cantidad]) => ({
                etiqueta: nombre,
                valor: `${cantidad} inscripto${cantidad === 1 ? "" : "s"}`,
                conteo: true,
            })),
        })
    }

    const porDepartamento = contarPorConDato(registros, (r) => texto(r.departamento))
    if (porDepartamento.length) {
        archivos.push({
            titulo: "DEPARTAMENTOS",
            filas: porDepartamento.map(([nombre, cantidad]) => ({
                etiqueta: nombre,
                valor: `${cantidad} inscripto${cantidad === 1 ? "" : "s"}`,
                conteo: true,
            })),
        })
    }

    return archivos
}

/**
 * `01/10/2026 12:55`
 *
 * A mano y no con `toLocaleDateString`: el resultado de un `Intl` depende del
 * ICU de cada navegador y de cada sistema operativo, así que el mismo código
 * puede imprimir `1/10/2026` en una máquina y `10/1/2026` en otra. En un
 * documento administrativo la fecha tiene que ser siempre la misma.
 */
function fechaLegible(partes: Partes): string {
    const dd = String(partes.dia).padStart(2, "0")
    const mm = String(partes.mes).padStart(2, "0")
    const hh = String(partes.hora).padStart(2, "0")
    const mi = String(partes.minuto).padStart(2, "0")
    return `${dd}/${mm}/${partes.anio} ${hh}:${mi}`
}

function escribirResumen(wb: ExcelWorkbook, registros: RegistroExportable[], carrera: string, generado: Date): Worksheet {
    const ws = wb.addWorksheet("Resumen", {
        pageSetup: {
            orientation: "portrait",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            margins: { left: 0.6, right: 0.6, top: 0.7, bottom: 0.6, header: 0.3, footer: 0.3 },
        },
    })

    // B es lo bastante ancha para que un nombre de carrera completo entre sin
    // que la cifra de al lado lo recorte.
    ws.getColumn(1).width = 2.6
    ws.getColumn(2).width = 44
    ws.getColumn(3).width = 16
    ws.getColumn(4).width = 16
    ws.getColumn(5).width = 16
    ws.getColumn(6).width = 2.6

    let fila = 1
    const siguiente = (alto: number) => {
        ws.getRow(fila).height = alto
        fila++
    }

    siguiente(10)

    // ── Título ──
    ws.mergeCells(`${RESUMEN_B}${fila}:${RESUMEN_ULTIMA}${fila}`)
    const titulo = ws.getCell(`${RESUMEN_B}${fila}`)
    titulo.value = "Listado de inscripciones"
    titulo.font = { name: FUENTE, size: 22, bold: true, color: { argb: BRAND } }
    titulo.alignment = { vertical: "middle", horizontal: "left" }
    siguiente(30)

    ws.mergeCells(`${RESUMEN_B}${fila}:${RESUMEN_ULTIMA}${fila}`)
    const subtitulo = ws.getCell(`${RESUMEN_B}${fila}`)
    subtitulo.value = "Obreros del Porvenir · Escuela Superior de Comercio N° 44"
    subtitulo.font = { name: FUENTE, size: 10, color: { argb: MUTED } }
    subtitulo.alignment = { vertical: "middle", horizontal: "left" }
    siguiente(18)

    // ── Filete de acento ──
    ws.mergeCells(`${RESUMEN_B}${fila}:${RESUMEN_ULTIMA}${fila}`)
    pintarFondo(ws.getCell(`${RESUMEN_B}${fila}`), ACCENT)
    siguiente(4)

    siguiente(12)

    // ── Bloques ──
    for (const bloque of bloquesResumen(registros, carrera, generado)) {
        ws.mergeCells(`${RESUMEN_B}${fila}:${RESUMEN_ULTIMA}${fila}`)
        const encabezado = ws.getCell(`${RESUMEN_B}${fila}`)
        encabezado.value = bloque.titulo
        encabezado.font = { name: FUENTE, size: 9, bold: true, color: { argb: MUTED } }
        encabezado.alignment = { vertical: "middle", horizontal: "left" }
        ws.getRow(fila).height = 16
        fila++

        for (const item of bloque.filas) {
            ws.mergeCells(`${RESUMEN_C}${fila}:${RESUMEN_ULTIMA}${fila}`)

            const etiqueta = ws.getCell(`${RESUMEN_B}${fila}`)
            etiqueta.value = item.etiqueta
            etiqueta.font = { name: FUENTE, size: 10, bold: item.destacado === true, color: { argb: item.destacado ? INK : MUTED } }
            etiqueta.alignment = { vertical: "middle", horizontal: "left" }

            const valor = ws.getCell(`${RESUMEN_C}${fila}`)
            valor.value = item.valor
            valor.font = { name: FUENTE, size: item.destacado ? 12 : 10, bold: true, color: { argb: item.destacado ? BRAND : INK } }
            valor.alignment = { vertical: "middle", horizontal: item.conteo ? "right" : "left" }
            ws.getRow(fila).height = 18
            fila++
        }

        siguiente(14)
    }

    // ── Pie ──
    const total = registros.length
    ws.mergeCells(`${RESUMEN_B}${fila}:${RESUMEN_ULTIMA}${fila}`)
    const pie = ws.getCell(`${RESUMEN_B}${fila}`)
    pie.value =
        total === 0
            ? "Este archivo no contiene registros."
            : `Documento generado automáticamente. Los datos de contacto y documentación no han sido verificados por la institución.`
    pie.font = { name: FUENTE, size: 9, italic: true, color: { argb: MUTED } }
    pie.alignment = { vertical: "middle", horizontal: "left", wrapText: true }
    ws.getRow(fila).height = 28

    return ws
}

/* ──────────────────────────────────────────────────────────────────────────
 * Hoja "Datos técnicos"
 * ────────────────────────────────────────────────────────────────────────── */

function escribirDatosTecnicos(wb: ExcelWorkbook, registros: RegistroExportable[]): Worksheet {
    const ws = wb.addWorksheet("Datos técnicos", {
        views: [{ state: "frozen", ySplit: 1, activeCell: "A2" }],
        pageSetup: {
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            printTitlesRow: "1:1",
            margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
        },
    })

    COLUMNAS_TECNICAS.forEach((columna, i) => {
        ws.getColumn(i + 1).width = columna.ancho
    })

    COLUMNAS_TECNICAS.forEach((columna, i) => {
        const celda = ws.getCell(1, i + 1)
        celda.value = columna.titulo
        estiloCabecera(celda)
    })
    ws.getRow(1).height = 26

    registros.forEach((registro, indiceFila) => {
        const fila = ws.getRow(2 + indiceFila)
        const banda = indiceFila % 2 === 1

        COLUMNAS_TECNICAS.forEach((columna, i) => {
            const celda = fila.getCell(i + 1)
            const bruto = registro[columna.campo as keyof RegistroExportable]
            celda.value = valorTecnico(bruto)
            celda.font = { name: FUENTE, size: 10, color: { argb: MUTED } }
            celda.alignment = { vertical: "middle", horizontal: "left" }
            if (banda) pintarFondo(celda, BANDA_FILL)
            celda.border = { bottom: { style: "thin", color: { argb: REGLA } } }
        })
    })

    ws.autoFilter = `A1:${letraDeColumna(COLUMNAS_TECNICAS.length - 1)}${registros.length + 1}`

    return ws
}

/** Los valores técnicos van como los guardó el sistema, sin maquetar. */
function valorTecnico(value: ValorExportable): string {
    if (value === null || value === undefined) return SIN_DATO
    // El `typeof` evita el `ReferenceError` de `File` si este módulo se llegara
    // a evaluar fuera del navegador.
    if (typeof File !== "undefined" && value instanceof File) return `archivo: ${value.name}`
    if (value instanceof Date) return value.toISOString()
    if (typeof value === "string") {
        const limpio = value.trim()
        return limpio && !/^(null|undefined|NaN)$/i.test(limpio) ? limpio : SIN_DATO
    }
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : SIN_DATO
    return SIN_DATO
}

/* ──────────────────────────────────────────────────────────────────────────
 * Nombre del archivo y descarga
 * ────────────────────────────────────────────────────────────────────────── */

function dosDigitos(n: number): string {
    return String(n).padStart(2, "0")
}

/**
 * `Inscripcion_Mecanica-del-Automotor_01-10-2026.xlsx`
 *
 * Sin IDs, sin nombres de persona y sin la marca de tiempo de `Date.now()`
 * (1790870118662 era el punto feo del nombre anterior). Los acentos se quitan
 * para no depender de cómo maneje el nombre el sistema de archivos.
 */
export function nombreArchivoInscripcion(carrera: string, fecha = new Date()): string {
    const carreraSlug = carrera
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
    const dia = `${dosDigitos(fecha.getDate())}-${dosDigitos(fecha.getMonth() + 1)}-${fecha.getFullYear()}`
    return `Inscripcion_${carreraSlug || "Sin-Carrera"}_${dia}.xlsx`
}

export interface OpcionesExportacion {
    registros: RegistroExportable[]
    /** Nombre humano de la carrera, para el resumen y el nombre de archivo. */
    careerTitle: string
    /** Momento de generación. Por defecto, ahora. */
    generado?: Date
}

/**
 * Arma el .xlsx completo y lo descarga.
 *
 * `exceljs` entra por `import()` a propósito: son ~900 kB minificados que solo
 * hacen falta cuando alguien pulsa el botón, y no tiene por qué entrar en el
 * bundle inicial de la web.
 */
export async function downloadInscripcionXlsx({ registros, careerTitle, generado = new Date() }: OpcionesExportacion): Promise<void> {
    if (!registros.length) {
        throw new Error("No hay registros para exportar.")
    }

/*
 * `exceljs` es CommonJS y además publica un bundle UMD para el navegador. Vite
 * lo envuelve y alcanza con leer la named export; si otro empaquetador lo deja
 * como CJS crudo, la biblioteca queda colgando de `.default`.
 */
const exceljs = await import("exceljs")
    const Workbook = exceljs.Workbook ?? (exceljs.default as typeof exceljs | undefined)?.Workbook
    if (!Workbook) throw new Error("No se pudo cargar la librería de Excel.")
    const wb = new Workbook()
    wb.creator = "Obreros del Porvenir · Escuela Superior de Comercio N° 44"
    wb.created = generado

    const carrera = careerTitle.trim() || "Sin carrera seleccionada"

    escribirResumen(wb, registros, carrera, generado)
    escribirInscriptos(wb, registros, generado, carrera)
    escribirDatosTecnicos(wb, registros)

    // El buffer es un Uint8Array en el navegador y un Buffer en Node; el
    // `Blob` lo acepta igual en los dos casos.
    const buffer = await wb.xlsx.writeBuffer()

    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = nombreArchivoInscripcion(carrera, generado)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}