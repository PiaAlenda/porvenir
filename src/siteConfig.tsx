/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { api, type CursoConfig, type SiteConfigMap } from "./api"
import { CAREER_DATA, type Career } from "./config/careerData"

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
    return c ? c.available !== false : true
}

const splitEjes = (value?: string): string[] =>
    (value || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)

function buildFromConfig(id: string, c: CursoConfig): Career {
    const ejes = splitEjes(c.ejes)
    return {
        id,
        title: c.title || id,
        icon: "GraduationCap",
        description: "",
        longDescription: "",
        duration: "",
        modality: "Presencial",
        category: id.startsWith("tec-") ? "carrera" : "curso-presencial",
        perfilEgresado: [],
        syllabus: ejes.length ? [{ year: "Nivel Único", subjects: ejes }] : [],
        teachers: c.teacher ? [{ name: c.teacher, title: "Docente" }] : [],
        schedule: c.schedule || "",
        inscriptionDate: c.inscriptionDate || "",
        month: c.month || undefined,
        inscriptionFee: "",
        inscriptionDocs: "",
        salidaLaboral: [],
    }
}

function applyConfig(base: Career, c: CursoConfig): Career {
    const ejes = splitEjes(c.ejes)
    const next: Career = { ...base }
    if (c.title) next.title = c.title
    if (c.inscriptionDate) next.inscriptionDate = c.inscriptionDate
    if (c.month) next.month = c.month
    if (c.schedule) next.schedule = c.schedule
    if (c.teacher) {
        const alreadyListed = base.teachers.some((t) => t.name === c.teacher)
        next.teachers = alreadyListed ? base.teachers : [{ name: c.teacher, title: "Docente" }, ...base.teachers]
    }
    if (ejes.length) {
        next.syllabus = [
            { year: base.syllabus[0]?.year || "Nivel Único", subjects: ejes },
            ...base.syllabus.slice(1),
        ]
    }
    return next
}

export function getCareerById(id: string, config: SiteConfigMap): Career | undefined {
    const base = CAREER_DATA[id]
    const c = config[id]
    if (base) return c ? applyConfig(base, c) : base
    if (c && (id.startsWith("curso-") || id.startsWith("tec-"))) return buildFromConfig(id, c)
    return undefined
}

export function getCareers(config: SiteConfigMap): Career[] {
    const ids = new Set([...Object.keys(CAREER_DATA), ...Object.keys(config)])
    const out: Career[] = []
    ids.forEach((id) => {
        const career = getCareerById(id, config)
        if (career) out.push(career)
    })
    return out
}

export function getCantidadTitularesFor(id: string, config: SiteConfigMap): number {
    const value = config[id]?.cantidadTitulares
    if (typeof value !== "number" || !Number.isFinite(value)) return 0
    return Math.max(0, Math.trunc(value))
}