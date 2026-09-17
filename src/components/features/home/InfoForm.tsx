"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { api } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import Stepper, { type StepperStep } from "./form/Stepper"
import {
    StepContacto,
    StepDatosPersonales,
    StepDocumentacion,
    StepInscripcion,
} from "./form/InfoFormSteps"
import {
    validateField,
    validateStep,
    type FormErrors,
    type InscriptionFormValues,
} from "./form/validation"

interface InfoFormProps {
    careerId?: string | null
}

const STEPS: StepperStep[] = [
    { title: "Datos personales" },
    { title: "Contacto" },
    { title: "Inscripción" },
    { title: "Documentación y datos complementarios" },
]

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

const initialForm = (careerId?: string | null): InscriptionFormValues => ({
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
    especialidad: "General / Sin especialidad",
    c_discapacidad: "No",
    cud: "",
    c_pueblo_indigena: "Ninguno",
    problematicaIntegrado: "",
    fotoDni: null,
    fotoCertificado: null,
})

const InfoForm = ({ careerId }: InfoFormProps) => {
    const [formData, setFormData] = useState<InscriptionFormValues>(() => initialForm(careerId))
    const [errors, setErrors] = useState<FormErrors>({})
    const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set())
    const [step, setStep] = useState(1)
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = useState("")
    const [registeredName, setRegisteredName] = useState("")

    const career = careerId ? CAREER_DATA[careerId] : undefined

    const isTouched = (name: keyof InscriptionFormValues) => touched.has(name)

    const handleFieldChange = (name: keyof InscriptionFormValues, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
        setTouched((prev) => {
            const next = new Set(prev)
            next.add(name)
            return next
        })
        setErrors((prev) =>
            prev[name] !== undefined || touched.has(name)
                ? { ...prev, [name]: validateField(name, value, { ...formData, [name]: value }) }
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
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value, formData) }))
    }

    const runStepValidation = (s: 1 | 2 | 3 | 4): boolean => {
        const nextErrors = validateStep(s, formData)
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        setTouched((prev) => {
            const merged = new Set(prev)
            Object.keys(nextErrors).forEach((f) => merged.add(f))
            return merged
        })
        return Object.keys(nextErrors).length === 0
    }

    const goNext = () => {
        if (step === 1 && runStepValidation(1)) setStep(2)
        else if (step === 2 && runStepValidation(2)) setStep(3)
        else if (step === 3 && runStepValidation(3)) setStep(4)
    }

    const goBack = () => {
        setStep((prev) => Math.max(1, prev - 1))
    }

    // This is called ONLY from the "Finalizar" button on step 4
    const handleFinalSubmit = async () => {
        // Safety: this function must only run on step 4
        if (step !== 4) return
        if (!runStepValidation(4)) return

        setStatus("loading")
        setErrorMsg("")
        try {
            const courseTitle = formData.careerId && CAREER_DATA[formData.careerId] ? CAREER_DATA[formData.careerId].title : ""
            let result: { id: string; nombre: string; message: string }

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
                data.append("especialidad", formData.especialidad)
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
                    especialidad: formData.especialidad,
                    c_discapacidad: formData.c_discapacidad,
                    cud: formData.cud,
                    c_pueblo_indigena: formData.c_pueblo_indigena,
                    problematicaIntegrado: formData.problematicaIntegrado,
                })
            }

            setRegisteredName(result.nombre)
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

    const resetForm = () => {
        if (cardRef.current) {
            scrollAnchorRef.current = {
                y: window.scrollY,
                bottom: cardRef.current.getBoundingClientRect().bottom,
            }
        }
        setFormData(initialForm(careerId))
        setErrors({})
        setTouched(new Set())
        setStep(1)
        setStatus("idle")
        setErrorMsg("")
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
        <section id="inscripciones" className="bg-white py-12 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-12">
                <div className="text-center mb-10 sm:mb-20 opacity-0" ref={containerRef}>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#4d0706]/10 text-[#4d0706] text-[10px] font-bold uppercase tracking-widest mb-4">
                        Inscripciones
                    </span>
                    <h2 className="text-3xl sm:text-6xl font-black text-[#4d0706] leading-tight tracking-tight">
                        Iniciá tu futuro <span className="text-[#f5c518] italic"> hoy</span>
                    </h2>
                </div>

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
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h4 className="text-2xl font-black text-gray-900">¡Inscripción registrada!</h4>
                                <p className="text-sm text-gray-500 font-medium">
                                    {registeredName}, tus datos y documentación se guardaron correctamente.
                                    {formData.careerId && CAREER_DATA[formData.careerId]
                                        ? ` Te inscribiste a ${CAREER_DATA[formData.careerId].title}.`
                                        : " La escuela te va a contactar a la brevedad."}
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    <button type="button" onClick={resetForm} className="text-[#4d0706] font-bold text-sm cursor-pointer rounded-lg px-4 py-3 hover:bg-[#4d0706]/5">
                                        Cargar otro formulario
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── NO <form> — usamos <div> para evitar submit nativo del navegador ── */
                            <div className="space-y-4 sm:space-y-6">
                                <Stepper steps={STEPS} current={step} completed={completedSteps} />

                                <div key={step} className="animate-step-in mt-6">
                                    {step === 1 && (
                                        <StepDatosPersonales
                                            values={formData}
                                            errors={errors}
                                            isTouched={isTouched}
                                            onFieldChange={handleFieldChange}
                                            onFileChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                    )}
                                    {step === 2 && (
                                        <StepContacto
                                            values={formData}
                                            errors={errors}
                                            isTouched={isTouched}
                                            onFieldChange={handleFieldChange}
                                            onFileChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                    )}
                                    {step === 3 && (
                                        <StepInscripcion
                                            values={formData}
                                            errors={errors}
                                            isTouched={isTouched}
                                            onFieldChange={handleFieldChange}
                                            onFileChange={handleFileChange}
                                            onBlur={handleBlur}
                                        />
                                    )}
                                    {step === 4 && (
                                        <StepDocumentacion
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
                                    {step < 4 ? (
                                        <button type="button" onClick={goNext} className={btnPrimary}>
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