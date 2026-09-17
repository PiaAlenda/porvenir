"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { api } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import Stepper, { type StepperStep } from "./form/Stepper"
import { StepContactoYInscripcion, StepDatosPersonales } from "./form/InfoFormSteps"
import {
    STEP1_FIELDS,
    STEP2_FIELDS,
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
    { title: "Contacto e inscripción" },
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
    email: "",
    careerId: careerId ?? "",
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
                ? { ...prev, [name]: validateField(name, value) }
                : prev
        )
    }

    const handleBlur = (name: keyof InscriptionFormValues) => {
        const raw = formData[name]
        const value = name === "email" ? raw.trim().toLowerCase() : raw
        if (name === "email") setFormData((prev) => ({ ...prev, email: value }))
        setTouched((prev) => {
            const next = new Set(prev)
            next.add(name)
            return next
        })
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
    }

    const runStepValidation = (s: 1 | 2): boolean => {
        const fields = s === 1 ? STEP1_FIELDS : STEP2_FIELDS
        const nextErrors = validateStep(s, formData)
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        setTouched((prev) => {
            const merged = new Set(prev)
            fields.forEach((f) => merged.add(f))
            return merged
        })
        return Object.keys(nextErrors).length === 0
    }

    const goNext = () => {
        if (runStepValidation(1)) setStep(2)
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!runStepValidation(2)) return
        setStatus("loading")
        setErrorMsg("")
        try {
            const result = await api.postInscripcion({
                apellido: formData.apellido,
                nombre: formData.nombre,
                c_documento: "DNI",
                numeroDocumento: formData.numeroDocumento,
                cuil: formData.cuil,
                fechaNacimiento: formData.fechaNacimiento,
                c_sexo: formData.c_sexo,
                email: formData.email,
                careerId: formData.careerId,
                courseTitle: formData.careerId ? CAREER_DATA[formData.careerId]?.title : undefined,
            })
            setRegisteredName(result.nombre)
            setStatus("success")
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Ocurrió un error al enviar el formulario")
            setStatus("error")
        }
    }

    const resetForm = () => {
        setFormData(initialForm(careerId))
        setErrors({})
        setTouched(new Set())
        setStep(1)
        setStatus("idle")
        setErrorMsg("")
    }

    const containerRef = useRef<HTMLDivElement | null>(null)

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

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-5 sm:p-12 shadow-2xl shadow-gray-200/40">

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[#4d0706] flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src="/icons/escuela.png" alt="Escuela" className="w-8 h-8 object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-none">¿Listo para empezar?</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Completá tus datos, solo te tomará un minuto.</p>
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
                                        {registeredName}, tus datos se guardaron correctamente.
                                        {formData.careerId && CAREER_DATA[formData.careerId]
                                            ? ` Te inscribiste a ${CAREER_DATA[formData.careerId].title}.`
                                            : " La escuela te va a contactar a la brevedad."}
                                    </p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                        <button onClick={resetForm} className="text-[#4d0706] font-bold text-sm cursor-pointer rounded-lg px-4 py-3 hover:bg-[#4d0706]/5 font-bold">
                                            Cargar otro formulario
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-6">
                                    <Stepper steps={STEPS} current={step} completed={step === 2 ? [1] : []} />

                                    <div key={step} className="animate-step-in">
                                        {step === 1 ? (
                                            <StepDatosPersonales
                                                values={formData}
                                                errors={errors}
                                                isTouched={isTouched}
                                                onFieldChange={handleFieldChange}
                                                onBlur={handleBlur}
                                            />
                                        ) : (
                                            <StepContactoYInscripcion
                                                values={formData}
                                                errors={errors}
                                                isTouched={isTouched}
                                                onFieldChange={handleFieldChange}
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
                                        {step === 1 ? (
                                            <button type="button" onClick={goNext} className={btnPrimary}>
                                                Continuar
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <>
                                                <button type="button" onClick={() => setStep(1)} className={`${btnGhost} sm:w-auto`}>
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Volver
                                                </button>
                                                <button type="submit" disabled={status === "loading"} className={btnPrimary}>
                                                    {status === "loading" ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Enviando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Inscribirme ahora
                                                            <ArrowRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <p className="text-right text-xs font-medium text-gray-500">
                                        Los campos marcados con <span className="text-red-700 font-black" aria-hidden="true">*</span> son obligatorios
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
            </div>
        </section>
    )
}

export default InfoForm