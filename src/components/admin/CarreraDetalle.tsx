import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, ArrowLeft, ChevronRight, Loader2, RefreshCw, Users } from "lucide-react"
import { api, type Alumno } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import { getCantidadTitularesFor, useSiteConfig } from "@/siteConfig"
import { clasificarParticipantes, type ParticipanteClasificado } from "@/lib/titulares"
import CupoTitularesField from "./CupoTitularesField"

interface Props {
    token: string
    careerId: string
    onBack: () => void
}

export default function CarreraDetalle({ token, careerId, onBack }: Props) {
    const { config } = useSiteConfig()
    const [participantes, setParticipantes] = useState<Alumno[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState("")

    const title = config[careerId]?.title || CAREER_DATA[careerId]?.title || careerId
    const cupo = getCantidadTitularesFor(careerId, config)

    const cargar = useCallback(
        () =>
            api
                .listInscripciones(token)
                .then((r) => r.inscripciones.filter((a) => a.careerId === careerId))
                .then((list) => {
                    setParticipantes(list)
                    setLoadError("")
                })
                .catch((err) =>
                    setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los participantes"),
                )
                .finally(() => setLoading(false)),
        [token, careerId],
    )

    const recargar = () => {
        setLoading(true)
        setLoadError("")
        void cargar()
    }

    useEffect(() => {
        void cargar()
    }, [cargar])

    const clasificados = useMemo(() => clasificarParticipantes(participantes, cupo), [participantes, cupo])

    const fila = ({ alumno, posicion, titular }: ParticipanteClasificado) => (
        <li key={alumno.id} className="flex items-center gap-3 sm:gap-4 py-2.5">
            <span className="w-6 shrink-0 text-center text-xs font-black tabular-nums text-gray-400">
                {String(posicion).padStart(2, "0")}
            </span>
            <span className={`min-w-0 flex-1 truncate text-sm font-bold ${titular ? "text-gray-900" : "text-gray-600"}`}>
                {alumno.apellido}, {alumno.nombre}
            </span>
            <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${
                    titular ? "bg-[#4d0706]/5 text-[#4d0706]" : "bg-gray-100 text-gray-500"
                }`}
            >
                {titular ? "Titular" : "Suplente"}
            </span>
        </li>
    )

    const total = participantes.length
    const titulares = clasificados.filter((p) => p.titular).length
    const suplentes = total - titulares

    return (
        <div className="space-y-6">
            <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 min-w-0 text-xs font-bold">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1 shrink-0 text-gray-500 hover:text-[#4d0706] cursor-pointer transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Carreras
                </button>
                <ChevronRight className="w-3 h-3 shrink-0 text-gray-300" />
                <span className="truncate text-gray-400">{title}</span>
            </nav>

            <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight break-words">{title}</h2>
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
                    <Users className="w-4 h-4 shrink-0 text-gray-400" />
                    {loading ? "Cargando participantes..." : `${total} ${total === 1 ? "participante" : "participantes"}`}
                </p>
                <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-gray-500">
                    Revisá cómo se distribuyen los participantes entre titulares y suplentes.
                </p>
            </div>

            <CupoTitularesField titulares={titulares} suplentes={suplentes} />

            <section>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Participantes</h3>
                        <p className="mt-1.5 text-sm font-medium text-gray-500">
                            La posición determina quiénes son titulares y suplentes.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={recargar}
                        title="Actualizar participantes"
                        aria-label="Actualizar participantes"
                        className="shrink-0 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-[#4d0706] hover:bg-[#4d0706]/5 cursor-pointer transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>

                <div className="mt-4">
                    {loadError ? (
                        <div className="flex items-start gap-2.5 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{loadError}</span>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-bold">Cargando participantes...</span>
                        </div>
                    ) : clasificados.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm font-bold text-gray-600">No hay participantes todavía.</p>
                            <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                                Cuando se registren participantes, aparecerán aquí y se clasificará automáticamente
                                quiénes son titulares y suplentes.
                            </p>
                        </div>
                    ) : (
                        <ol className="divide-y divide-gray-100/80">
                            {clasificados.map((p) => (
                                <Fragment key={p.alumno.id}>
                                    {!p.titular && p.posicion > 1 && (
                                        <li
                                            aria-hidden="true"
                                            className="flex items-center gap-3 py-1.5"
                                        >
                                            <span className="h-px flex-1 bg-gray-100" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                Suplentes
                                            </span>
                                            <span className="h-px flex-1 bg-gray-100" />
                                        </li>
                                    )}
                                    {fila(p)}
                                </Fragment>
                            ))}
                        </ol>
                    )}
                </div>
            </section>
        </div>
    )
}
