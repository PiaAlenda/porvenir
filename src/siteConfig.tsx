/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { api, type SiteConfigMap } from "./api"
import { CAREER_DATA } from "./config/careerData"

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
    refresh: () => void
}

const Ctx = createContext<SiteConfigValue>({ config: {}, refresh: () => {} })

export function SiteConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<SiteConfigMap>({})

    const refresh = useCallback(() => {
        api.getConfig()
            .then((r) => setConfig(r.cursos))
            .catch(() => {})
    }, [])

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