/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { api, type CursoConfig, type SiteConfigMap } from "./api"
import { CAREER_DATA, type Career, type CareerSubject, type Teacher } from "./config/careerData"
import { CAREER_VIDEOS } from "./config/careerVideos"

export const DEFAULT_COURSE_IMAGES: Record<string, string> = {
    "curso-danza": "/img/cursos/CURSO DE DANZA.webp",
    "curso-estilismo-moda": "/img/cursos/ESTILISMO DE MODA.webp",
    "curso-franquicia-septiembre": "/img/cursos/franquicia septiembre.webp",
    "curso-higiene-seguridad": "/img/cursos/higiene y seguridad 2 SEPTIEMBRE NUEVO.webp",
    "curso-maquillaje-profesional": "/img/cursos/mAQUILLAJE PROFESIONAL AGOSTO.webp",
    "curso-peinado-profesional": "/img/cursos/peinadp profesional AGOSTO.webp",
    "curso-plomero-cloaquista": "/img/cursos/Plomero cloaquista SEPTIEMBRE.webp",
    "curso-secretariado-administrativo": "/img/cursos/secretariado administrativo.webp",
    "curso-soldadura": "/img/cursos/soldadura SEPTIEMBRE -.webp",
    "curso-instalacion-paneles": "/img/cursos/Instalacion paneles 2026- 2 QR AGOSTO ----.webp",
}

interface SiteConfigValue {
    config: SiteConfigMap
    refresh: () => Promise<void>
}

const Ctx = createContext<SiteConfigValue>({ config: {}, refresh: () => Promise.resolve() })

export function SiteConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<SiteConfigMap>({})

    const refresh = useCallback(
        () =>
            api
                .getConfig()
                .then((r) => setConfig(r.cursos))
                .catch(() => {}),
        [],
    )

    useEffect(() => {
        refresh()
    }, [refresh])

    return <Ctx.Provider value={{ config, refresh }}>{children}</Ctx.Provider>
}

export function useSiteConfig(): SiteConfigValue {
    return useContext(Ctx)
}

export function getImageFor(id: string, config: SiteConfigMap): string {
    const c = config[id]
    if (c?.image) return c.image
    if (DEFAULT_COURSE_IMAGES[id]) return DEFAULT_COURSE_IMAGES[id]
    if (CAREER_DATA[id]) return `/icons/${id}.webp`
    return ""
}

export function isAvailableFor(id: string, config: SiteConfigMap): boolean {
    const c = config[id]
    if (!c) return true
    if (isRemoved(id, config)) return false
    return c.available !== false
}

/** El item existe pero el admin lo eliminó: queda como lápida en la config. */
export function isRemoved(id: string, config: SiteConfigMap): boolean {
    return config[id]?.removed === true
}

/** Ids que hay que mostrar de verdad, sin las lápidas de los eliminados. */
export function activeIds(config: SiteConfigMap): string[] {
    return Object.keys(config).filter((id) => !isRemoved(id, config))
}

const splitLines = (value?: string): string[] =>
    (value || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)

const splitEjes = splitLines

/**
 * Normaliza el syllabus guardado en la config. Acepta dos formatos: el nuevo
 * (`[{ year, subjects }]`) y el plano heredado (`ejes` con un eje por línea),
 * para no dejar ninguna carrera sin contenido.
 */
function normalizeSyllabus(c: CursoConfig, fallbackYear: string): CareerSubject[] {
    const fromStructured = (c.syllabus || [])
        .map((entry) => ({
            year: (entry?.year || "").trim(),
            subjects: splitLines((entry?.subjects || []).join("\n")),
        }))
        .filter((entry) => entry.subjects.length > 0)
        .map((entry) => ({ year: entry.year || fallbackYear, subjects: entry.subjects }))

    if (fromStructured.length) return fromStructured

    const ejes = splitEjes(c.ejes)
    return ejes.length ? [{ year: fallbackYear, subjects: ejes }] : []
}

function normalizeTeachers(c: CursoConfig): Teacher[] {
    const fromStructured = (c.teachers || [])
        .map((t) => ({
            name: (t?.name || "").trim(),
            title: (t?.title || "").trim(),
            legajo: (t?.legajo || "").trim(),
            image: (t?.image || "").trim() || undefined,
        }))
        .filter((t) => t.name)

    if (fromStructured.length) return fromStructured

    const legacy = (c.teacher || "").trim()
    return legacy ? [{ name: legacy, title: "Docente" }] : []
}

function buildFromConfig(id: string, c: CursoConfig): Career {
    const isCareer = id.startsWith("tec-")
    return {
        id,
        title: c.title || id,
        icon: c.icon || "GraduationCap",
        description: c.description || "",
        longDescription: c.longDescription || "",
        duration: c.duration || "",
        modality: c.modality || "Presencial",
        category: c.category || (isCareer ? "carrera" : "curso-presencial"),
        perfilEgresado: (c.perfilEgresado || []).map((s) => s.trim()).filter(Boolean),
        syllabus: normalizeSyllabus(c, "Nivel Único"),
        teachers: normalizeTeachers(c),
        schedule: c.schedule || "",
        inscriptionDate: c.inscriptionDate || "",
        month: c.month || undefined,
        inscriptionFee: c.inscriptionFee || "",
        inscriptionDocs: c.inscriptionDocs || "",
        salidaLaboral: (c.salidaLaboral || []).map((s) => s.trim()).filter(Boolean),
    }
}

function applyConfig(base: Career, c: CursoConfig): Career {
    const next: Career = { ...base }
    if (c.title) next.title = c.title
    if (c.icon) next.icon = c.icon
    if (c.description !== undefined) next.description = c.description
    if (c.longDescription !== undefined) next.longDescription = c.longDescription
    if (c.duration !== undefined) next.duration = c.duration
    if (c.modality !== undefined) next.modality = c.modality
    if (c.category) next.category = c.category
    if (c.inscriptionDate !== undefined) next.inscriptionDate = c.inscriptionDate
    if (c.month !== undefined) next.month = c.month || undefined
    if (c.schedule !== undefined) next.schedule = c.schedule
    if (c.inscriptionFee !== undefined) next.inscriptionFee = c.inscriptionFee
    if (c.inscriptionDocs !== undefined) next.inscriptionDocs = c.inscriptionDocs
    if (c.salidaLaboral) next.salidaLaboral = c.salidaLaboral.map((s) => s.trim()).filter(Boolean)
    if (c.perfilEgresado) next.perfilEgresado = c.perfilEgresado.map((s) => s.trim()).filter(Boolean)

    const syllabus = normalizeSyllabus(c, base.syllabus[0]?.year || "Nivel Único")
    if (syllabus.length) next.syllabus = syllabus

    // Un docente sin foto no es un motivo para perder la foto que ya estaba
    // cargada: solo se pisa el campo cuando la config trae algo.
    const teachers = normalizeTeachers(c)
    if (teachers.length) {
        next.teachers = teachers.map((t, i) => ({
            ...t,
            image: t.image || base.teachers[i]?.image || undefined,
        }))
    } else if (c.teacher) {
        const alreadyListed = base.teachers.some((t) => t.name === c.teacher)
        next.teachers = alreadyListed ? base.teachers : [{ name: c.teacher, title: "Docente" }, ...base.teachers]
    }
    return next
}

export function getCareerById(id: string, config: SiteConfigMap): Career | undefined {
    if (isRemoved(id, config)) return undefined
    const base = CAREER_DATA[id]
    const c = config[id]
    if (base) return c ? applyConfig(base, c) : base
    if (c && (id.startsWith("curso-") || id.startsWith("tec-"))) return buildFromConfig(id, c)
    return undefined
}

export function getCareers(config: SiteConfigMap): Career[] {
    /*
     * Los ids hardcodeados de `CAREER_DATA` entran siempre: el panel puede
     * crear ofertas nuevas, pero borrar una no puede sacar el id del código.
     * Por eso la eliminación se guarda como lápida en la config y se filtra
     * acá en lugar de intentar borrar el registro.
     */
    const ids = new Set([...Object.keys(CAREER_DATA), ...activeIds(config)])
    const out: Career[] = []
    ids.forEach((id) => {
        const career = getCareerById(id, config)
        if (career) out.push(career)
    })
    return out
}

/**
 * Videos de una carrera. Si el admin cargó uno, gana sobre el archivo que ya
 * estaba en `public/videos`. Siempre devuelve un array porque el detalle
 * puede mostrar más de un video.
 */
export function getVideosFor(id: string, config: SiteConfigMap): string[] {
    const uploaded = (config[id]?.video || "").trim()
    if (uploaded) return [uploaded]
    return CAREER_VIDEOS[id] || []
}

export function getCantidadTitularesFor(id: string, config: SiteConfigMap): number {
    const value = config[id]?.cantidadTitulares
    if (typeof value !== "number" || !Number.isFinite(value)) return 0
    return Math.max(0, Math.trunc(value))
}