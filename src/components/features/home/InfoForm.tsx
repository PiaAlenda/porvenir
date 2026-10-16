"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Download, Printer } from "lucide-react"
import { api, type InscripcionResult } from "@/api"
import { getCareerById, useSiteConfig } from "@/siteConfig"
import { downloadInscripcionXlsx } from "@/lib/excelExport"
import { downloadContractFromFormData } from "@/pdf/downloadContract"
import Stepper, { type StepperStep } from "./form/Stepper"
import {
    StepContacto,
    StepDatosPersonales,
    StepDocumentacion,
    StepInscripcion,
    StepTipoPropuesta,
} from "./form/InfoFormSteps"
import {
    validateField,
    validateStep,
    tipoEfectivoDe,
    type FormErrors,
    type InscriptionFormValues,
} from "./form/validation"

interface InfoFormProps {
    careerId?: string | null
    /** Modo embebido (p. ej. dentro del detalle de una carrera): sin header de marketing y con la carrera ya fija. */
    embedded?: boolean
}

const STEPS_BASE: StepperStep[] = [
    { title: "Datos personales" },
    { title: "Contacto" },
    { title: "Inscripción" },
    { title: "Documentación y datos complementarios" },
]

const STEPS_WITH_TIPO: StepperStep[] = [{ title: "Categoría" }, ...STEPS_BASE]

const btnPrimary =
    "inline-flex h-12 sm:h-16 w-full items-center justify-center gap-2 rounded-xl bg-[#4d0706] " +
    "px-6 text-xs font-black uppercase tracking-widest text-[#ffcc00] shadow-xl shadow-[#4d0706]/20 " +
    "transition-all duration-200 border-none cursor-pointer hover:bg-[#300404] hover:shadow-[#4d0706]/30 " +
    "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffcc00]/60 " +
    "disabled:cursor-not-allowed disabled:opacity-60"

const btnGhost =
    "inline-flex h-12 sm:h-16 items-center justify-center gap-2 rounded-xl bg-white px-6 " +
    "text-xs font-black uppercase tracking-widest text-[#4d0706] border-2 border-[#4d0706]/20 " +
    "transition-all duration-200 cursor-pointer hover:border-[#4d0706] hover:bg-[#4d0706]/5 active:scale-[0.98] " +
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4d0706]/20"

/* Mensajes que ve la persona según si la carrera/curso tenía cupo disponible. */
const MSG_CON_CUPO =
    "Tu preinscripción ha sido registrada. Para finalizar y confirmar la inscripción, " +
    "deberás imprimir el contrato adjunto y acercarte a la administración de la escuela " +
    "para presentarlo y abonar el monto correspondiente. Ten en cuenta que dispones de " +
    "72 horas hábiles para asistir a la escuela a confirmar; de lo contrario, tu " +
    "preinscripción será dada de baja."

const MSG_SIN_CUPO =
    "El cupo de esta carrera está COMPLETO, por lo que has quedado preinscripto como " +
    "SUPLENTE. Si se libera algún cupo, la administración se contactará con vos. " +
    "Gracias por tu tiempo."

const initialForm = (careerId?: string | null): InscriptionFormValues => ({
    // Con la carrera ya elegida (detalle) se omite la pregunta: el tipo se
    // deduce del id. Los ids de carreras empiezan con "tec-".
    tipoPropuesta: careerId ? (careerId.startsWith("tec-") ? "carrera" : "curso") : "",
    apellido: "",
    nombre: "",
    numeroDocumento: "",
    cuil: "",
    fechaNacimiento: "",
    c_sexo: "M",
    c_pais_nacimiento: "Argentina",
    c_provincia_nacimiento: "San Juan",
    lugar_nacimiento: "",
    c_nacionalidad: "Argentina",
    email: "",
    celular: "",
    celularUrgencia: "",
    domicilio: "",
    departamento: "Capital",
    careerId: careerId ?? "",
    anioDivision: "",
    c_discapacidad: "No",
    cud: "",
    c_pueblo_indigena: "Ninguno",
    problematicaIntegrado: "",
    fotoDni: null,
    fotoCertificado: null,
})

const InfoForm = ({ careerId, embedded }: InfoFormProps) => {
    const { config, formOptions } = useSiteConfig()
    const [formData, setFormData] = useState<InscriptionFormValues>(() => initialForm(careerId))
    const [errors, setErrors] = useState<FormErrors>({})
    const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set())
    const [step, setStep] = useState(1)
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")
    const [registeredName, setRegisteredName] = useState("")
    const [submittedData, setSubmittedData] = useState<InscriptionFormValues | null>(null)
    const [descargando, setDescargando] = useState(false)
    const [errorDescarga, setErrorDescarga] = useState("")
    /** false = la carrera/curso estaba completa y la persona quedó suplente. */
    const [hayCupo, setHayCupo] = useState(true)
    const [generandoContrato, setGenerandoContrato] = useState(false)

    const career = careerId ? getCareerById(careerId, config) : undefined

    /*
     * Sin carrera preseleccionada se pregunta primero si es curso o carrera;
     * con ella fija (detalle) el tipo ya se dedujo del id y ese paso no existe.
     * `grupo` identifica qué validar en el paso actual: "tipo" o bien
     * 1 datos / 2 contacto / 3 inscripción / 4 documentación.
     */
    const mostrarPasoTipo = !careerId
    const steps = mostrarPasoTipo ? STEPS_WITH_TIPO : STEPS_BASE
    const totalSteps = steps.length
    const grupoDelPaso = (s: number): "tipo" | 1 | 2 | 3 | 4 =>
        mostrarPasoTipo ? (s === 1 ? "tipo" : ((s - 1) as 1 | 2 | 3 | 4)) : (s as 1 | 2 | 3 | 4)
    const grupo = grupoDelPaso(step)

    /*
     * Datos del esquema que reciben todos los pasos: qué campos mostrar, en qué
     * orden, con qué etiquetas y si son obligatorios. Sale de la config que
     * edita el admin.
     */
    const pasoProps = {
        campos: formOptions.campos,
        config,
        tipo: tipoEfectivoDe(formData),
    }

    const isTouched = (name: keyof InscriptionFormValues) => touched.has(name)

    const handleFieldChange = (name: keyof InscriptionFormValues, value: string) => {
        setFormData((prev) => {
            const next = { ...prev, [name]: value }
            /*
             * Si cambia el tipo de propuesta, la carrera/curso elegido podría
             * no corresponderte: se limpia para que el paso de Inscripción
             * pida elegir una del nuevo tipo.
             */
            if (name === "tipoPropuesta" && value !== prev.tipoPropuesta) {
                next.careerId = ""
            }
            return next
        })
        setTouched((prev) => {
            const next = new Set(prev)
            next.add(name)
            return next
        })
        setErrors((prev) =>
            prev[name] !== undefined || touched.has(name)
                ? { ...prev, [name]: validateField(name, value, { ...formData, [name]: value }, formOptions.campos) }
                : prev
        )
    }

    const handleFileChange = (name: "fotoDni" | "fotoCertificado", file: File | null) => {
        setFormData((prev) => ({ ...prev, [name]: file }))
        setTouched((prev) => {
            const next = new Set(prev)
            next.add(name)
            return next
        })
    }

    const handleBlur = (name: keyof InscriptionFormValues) => {
        const raw = formData[name]
        const value = typeof raw === "string" && name === "email" ? raw.trim().toLowerCase() : raw
        if (name === "email" && typeof value === "string") {
            setFormData((prev) => ({ ...prev, email: value }))
        }
        setTouched((prev) => {
            const next = new Set(prev)
            next.add(name)
            return next
        })
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value, formData, formOptions.campos) }))
    }

    const runStepValidation = (grupo: "tipo" | 1 | 2 | 3 | 4): boolean => {
        if (grupo === "tipo") {
            const err = validateField("tipoPropuesta", formData.tipoPropuesta, formData, formOptions.campos)
            setErrors((prev) => ({ ...prev, tipoPropuesta: err }))
            setTouched((prev) => {
                const next = new Set(prev)
                next.add("tipoPropuesta")
                return next
            })
            return !err
        }
        const nextErrors = validateStep(grupo, formData, formOptions.campos)
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        setTouched((prev) => {
            const merged = new Set(prev)
            Object.keys(nextErrors).forEach((f) => merged.add(f))
            return merged
        })
        return Object.keys(nextErrors).length === 0
    }

    const goNext = () => {
        if (step < totalSteps && runStepValidation(grupoDelPaso(step))) {
            setStep((prev) => prev + 1)
        }
    }

    const goBack = () => {
        setStep((prev) => Math.max(1, prev - 1))
    }

    // This is called ONLY from the "Finalizar" button on the last step
    const handleFinalSubmit = async () => {
        // Safety: this function must only run on the last step
        if (step !== totalSteps) return
        if (!runStepValidation(4)) return

        setStatus("loading")
        setErrorMsg("")
        try {
            const courseTitle = formData.careerId ? getCareerById(formData.careerId, config)?.title ?? "" : ""
            let result: InscripcionResult

            if (formData.fotoDni || formData.fotoCertificado) {
                const data = new FormData()
                data.append("apellido", formData.apellido)
                data.append("nombre", formData.nombre)
                data.append("c_documento", "DNI")
                data.append("numeroDocumento", formData.numeroDocumento)
                data.append("cuil", formData.cuil)
                data.append("fechaNacimiento", formData.fechaNacimiento)
                data.append("c_sexo", formData.c_sexo)
                data.append("c_pais_nacimiento", formData.c_pais_nacimiento)
                data.append("c_provincia_nacimiento", formData.c_provincia_nacimiento)
                data.append("lugar_nacimiento", formData.lugar_nacimiento)
                data.append("c_nacionalidad", formData.c_nacionalidad)
                data.append("email", formData.email)
                data.append("celular", formData.celular)
                data.append("celularUrgencia", formData.celularUrgencia)
                data.append("domicilio", formData.domicilio)
                data.append("departamento", formData.departamento)
                data.append("careerId", formData.careerId)
                data.append("courseTitle", courseTitle)
                data.append("anioDivision", formData.anioDivision)
                data.append("c_discapacidad", formData.c_discapacidad)
                data.append("cud", formData.cud)
                data.append("c_pueblo_indigena", formData.c_pueblo_indigena)
                data.append("problematicaIntegrado", formData.problematicaIntegrado)

                if (formData.fotoDni) data.append("fotoDni", formData.fotoDni)
                if (formData.fotoCertificado) data.append("fotoCertificado", formData.fotoCertificado)

                result = await api.postInscripcion(data)
            } else {
                result = await api.postInscripcion({
                    apellido: formData.apellido,
                    nombre: formData.nombre,
                    c_documento: "DNI",
                    numeroDocumento: formData.numeroDocumento,
                    cuil: formData.cuil,
                    fechaNacimiento: formData.fechaNacimiento,
                    c_sexo: formData.c_sexo,
                    c_pais_nacimiento: formData.c_pais_nacimiento,
                    c_provincia_nacimiento: formData.c_provincia_nacimiento,
                    lugar_nacimiento: formData.lugar_nacimiento,
                    c_nacionalidad: formData.c_nacionalidad,
                    email: formData.email,
                    celular: formData.celular,
                    celularUrgencia: formData.celularUrgencia,
                    domicilio: formData.domicilio,
                    departamento: formData.departamento,
                    careerId: formData.careerId,
                    courseTitle,
                    anioDivision: formData.anioDivision,
                    c_discapacidad: formData.c_discapacidad,
                    cud: formData.cud,
                    c_pueblo_indigena: formData.c_pueblo_indigena,
                    problematicaIntegrado: formData.problematicaIntegrado,
                })
            }

            setRegisteredName(result.nombre)
            setSubmittedData(formData)
            setHayCupo(result.hayCupo !== false)
            if (cardRef.current) {
                scrollAnchorRef.current = {
                    y: window.scrollY,
                    bottom: cardRef.current.getBoundingClientRect().bottom,
                }
            }
            setStatus("success")
        } catch (err) {
            let msg = "No se pudo registrar la inscripción. Por favor, comprobá tus datos e intentá de nuevo."
            if (err instanceof Error && err.message) {
                const lower = err.message.toLowerCase()
                if (lower.includes("fetch") || lower.includes("network") || lower.includes("conectar") || lower.includes("servidor")) {
                    msg = "No se pudo conectar con el servidor. Por favor, comprobá tu conexión a internet e intentá de nuevo."
                } else if (!lower.includes("faltan datos") && !lower.includes("apellido") && !lower.includes("nombre") && !lower.includes("c_") && !lower.includes("error 500")) {
                    msg = err.message
                }
            }
            setErrorMsg(msg)
            setStatus("error")
        }
    }

    /**
     * Genera e imprime el contrato con los datos enviados en la inscripción.
     * Es el paso posterior al registro cuando hay cupo: la persona debe
     * presentarlo en administración para confirmar la plaza.
     */
    const printContract = async () => {
        const dataToPrint = submittedData || formData
        const courseTitle = dataToPrint.careerId
            ? getCareerById(dataToPrint.careerId, config)?.title ?? ""
            : ""

        setGenerandoContrato(true)
        setErrorDescarga("")
        try {
            await downloadContractFromFormData(
                {
                    ...dataToPrint,
                    // El contrato usa "address"; el formulario lo guarda como "domicilio".
                    address: dataToPrint.domicilio,
                },
                courseTitle
            )
        } catch (err) {
            setErrorDescarga(err instanceof Error ? err.message : "No se pudo generar el contrato")
        } finally {
            setGenerandoContrato(false)
        }
    }

    /**
     * Arma el .xlsx con la inscripción recién registrada.
     *
     * `submittedData` es el estado del form en el momento del envío, no el
     * actual: si la persona toca algo después de confirmar, el archivo tiene
     * que reflejar lo que realmente llegó al servidor.
     */
    const downloadFormData = async () => {
        const dataToDownload = submittedData || formData
        const careerInfo = dataToDownload.careerId
            ? getCareerById(dataToDownload.careerId, config)?.title ?? "Sin carrera seleccionada"
            : "Sin carrera seleccionada"

        setDescargando(true)
        setErrorDescarga("")
        try {
            await downloadInscripcionXlsx({
                careerTitle: careerInfo,
                registros: [
                    {
                        ...dataToDownload,
                        // El form manda "DNI" fijo en `c_documento`; se replica
                        // acá para que el archivo diga lo mismo que la base.
                        c_documento: "DNI",
                        careerTitle: careerInfo,
                        fechaInscripcion: new Date(),
                    },
                ],
            })
        } catch (err) {
            setErrorDescarga(err instanceof Error ? err.message : "No se pudo generar el archivo de Excel")
        } finally {
            setDescargando(false)
        }
    }

    const containerRef = useRef<HTMLDivElement | null>(null)
    const cardRef = useRef<HTMLDivElement | null>(null)
    const scrollAnchorRef = useRef<{ y: number; bottom: number } | null>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("animate-fade-up")
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.1 }
        )
        if (containerRef.current) observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!cardRef.current || !scrollAnchorRef.current) return
        const { y, bottom } = scrollAnchorRef.current
        const delta = cardRef.current.getBoundingClientRect().bottom - bottom
        if (delta !== 0) window.scrollTo({ top: Math.max(0, y + delta), behavior: "auto" })
        scrollAnchorRef.current = null
    }, [status])

    const completedSteps = Array.from({ length: step - 1 }, (_, i) => i + 1)

    return (
        <section id={embedded ? "inscripcion-form" : "inscripciones"} className="bg-white py-12 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-12">
                {!embedded && (
                    <div className="text-center mb-10 sm:mb-20 opacity-0" ref={containerRef}>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#4d0706]/10 text-[#4d0706] text-[10px] font-bold uppercase tracking-widest mb-4">
                            Inscripciones
                        </span>
                        <h2 className="text-3xl sm:text-6xl font-black text-[#4d0706] leading-tight tracking-tight">
                            Iniciá tu futuro <span className="text-[#f5c518] italic"> hoy</span>
                        </h2>
                    </div>
                )}

                <div className="mx-auto max-w-3xl">
                    <div ref={cardRef} className="bg-white rounded-[2.5rem] border border-gray-100 p-5 sm:p-12 shadow-2xl shadow-gray-200/40">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-[#4d0706] flex items-center justify-center shrink-0 overflow-hidden">
                                <img src="/icons/escuela.png" alt="Escuela" className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-none">¿Listo para empezar?</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Completá tus datos de inscripción paso a paso.</p>
                            </div>
                        </div>

                        {career && status === "idle" && (
                            <div className="mb-6 px-4 py-3 rounded-2xl bg-[#4d0706]/5 border border-[#4d0706]/10 text-sm text-[#4d0706] font-bold">
                                Inscripción a: {career.title}
                            </div>
                        )}

                        {status === "success" ? (
                            <div role="status" aria-live="polite" className="text-center py-10 space-y-6">
                                {hayCupo ? (
                                    <>
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                                        </div>
                                        <h4 className="text-2xl font-black text-gray-900">¡Preinscripción registrada!</h4>
                                        <p className="text-sm text-gray-600 font-medium max-w-xl mx-auto leading-relaxed">
                                            {registeredName}
                                            {submittedData?.careerId && getCareerById(submittedData.careerId, config)
                                                ? `, tu preinscripción a ${getCareerById(submittedData.careerId, config)?.title} fue registrada.`
                                                : "."}
                                            <br />
                                            <br />
                                            {MSG_CON_CUPO}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                                            <AlertCircle className="w-10 h-10 text-amber-500" />
                                        </div>
                                        <h4 className="text-2xl font-black text-gray-900">Cupo completo — Suplente</h4>
                                        <p className="text-sm text-gray-600 font-medium max-w-xl mx-auto leading-relaxed">
                                            {registeredName}
                                            {submittedData?.careerId && getCareerById(submittedData.careerId, config)
                                                ? `, respecto a ${getCareerById(submittedData.careerId, config)?.title}:`
                                                : "."}
                                            <br />
                                            <br />
                                            {MSG_SIN_CUPO}
                                        </p>
                                    </>
                                )}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    {hayCupo && (
                                        <button
                                            type="button"
                                            onClick={printContract}
                                            disabled={generandoContrato}
                                            className={`${btnPrimary} sm:w-auto`}
                                        >
                                            {generandoContrato ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Printer className="w-4 h-4" />
                                            )}
                                            {generandoContrato ? "Generando contrato..." : "Imprimir contrato"}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={downloadFormData}
                                        disabled={descargando}
                                        className={hayCupo ? btnGhost : `${btnPrimary} sm:w-auto`}
                                    >
                                        {descargando ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        {descargando ? "Generando archivo" : "Descargar comprobante"}
                                    </button>
                                </div>
                                {errorDescarga && (
                                    <p role="alert" className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-md">
                                        {errorDescarga}
                                    </p>
                                )}
                            </div>
                        ) : (
                            /* ── NO <form> — usamos <div> para evitar submit nativo del navegador ── */
                            <div className="space-y-4 sm:space-y-6">
                                <Stepper steps={steps} current={step} completed={completedSteps} />

                                <div key={step} className="animate-step-in mt-6">
                                    {grupo === "tipo" && (
                                        <StepTipoPropuesta
                                            {...pasoProps}
                                            values={formData}
                                            errors={errors}
                                            isTouched={isTouched}
                                            onFieldChange={handleFieldChange}
                                            onFileChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                    )}
                                    {grupo === 1 && (
                                        <StepDatosPersonales
                                            {...pasoProps}
                                            values={formData}
                                            errors={errors}
                                            isTouched={isTouched}
                                            onFieldChange={handleFieldChange}
                                            onFileChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                    )}
                                    {grupo === 2 && (
                                        <StepContacto
                                            {...pasoProps}
                                            values={formData}
                                            errors={errors}
                                            isTouched={isTouched}
                                            onFieldChange={handleFieldChange}
                                            onFileChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                    )}
                                    {grupo === 3 && (
                                        <StepInscripcion
                                            {...pasoProps}
                                            values={formData}
                                            errors={errors}
                                            isTouched={isTouched}
                                            onFieldChange={handleFieldChange}
                                            onFileChange={handleFileChange}
                                            onBlur={handleBlur}
                                            careerLocked={!!careerId}
                                        />
                                    )}
                                    {grupo === 4 && (
                                        <StepDocumentacion
                                            {...pasoProps}
                                            values={formData}
                                            errors={errors}
                                            isTouched={isTouched}
                                            onFieldChange={handleFieldChange}
                                            onFileChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                    )}
                                </div>

                                {status === "error" && (
                                    <div role="alert" className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                                    {step > 1 && (
                                        <button type="button" onClick={goBack} className={`${btnGhost} sm:w-auto`}>
                                            <ArrowLeft className="w-4 h-4" />
                                            Volver
                                        </button>
                                    )}
                                    {step < totalSteps ? (
                                        <button
                                            type="button"
                                            onClick={goNext}
                                            // En el paso de categoría no se avanza sin elegir:
                                            // se deshabilita el botón en vez de mostrar un error.
                                            disabled={grupo === "tipo" && !formData.tipoPropuesta}
                                            className={btnPrimary}
                                        >
                                            Continuar
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={status === "loading"}
                                            onClick={handleFinalSubmit}
                                            className={btnPrimary}
                                        >
                                            {status === "loading" ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    Finalizar e Inscribirme
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <p className="text-right text-xs font-medium text-gray-500">
                                    Los campos marcados con <span className="text-red-700 font-black" aria-hidden="true">*</span> son obligatorios
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default InfoForm