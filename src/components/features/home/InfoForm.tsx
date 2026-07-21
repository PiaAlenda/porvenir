"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChevronDown, CheckCircle2 } from "lucide-react"

interface FormData {
    nombre: string
    apellido: string
    email: string
    telefono: string
    tipoCarrera: string
    carrera: string
    modalidad: string
    localidad: string
    [key: string]: string
}

const selectLabels: Record<string, string> = {
    tipoCarrera: "Tipo de carrera",
    carrera: "Carrera",
    modalidad: "Modalidad",
}

const selectOptions: Record<string, string[]> = {
    tipoCarrera: ["Grado", "Posgrado", "Tecnicatura"],
    carrera: ["Medicina", "Derecho", "Psicología", "Administración"],
    modalidad: ["Carreras", "Cursos"],
}

const inputClass =
    "w-full h-14 px-5 rounded-2xl border border-gray-200 bg-gray-50/50 " +
    "text-sm text-gray-900 placeholder:text-gray-400 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white " +
    "transition-all duration-300"

const InfoForm = () => {
    const [formData, setFormData] = useState<FormData>({
        nombre: "", apellido: "", email: "", telefono: "",
        tipoCarrera: "", carrera: "", modalidad: "", localidad: "",
    })

    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitted(true)
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

                    <div className="lg:col-span-5 space-y-6">
                        <div className="relative aspect-video sm:aspect-square rounded-[2rem] overflow-hidden shadow-xl">
                            <img src="/img/alumnos.webp" alt="Estudiantes" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-6 left-6 text-white">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Acreditación Oficial</p>
                                <p className="text-xl font-black">Escuela Superior de Comercio</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Años", value: "100" },
                                { label: "Sedes", value: "3" },
                                { label: "Carreras", value: "15" },
                            ].map((s) => (
                                <div key={s.label} className="bg-[#fcfaf7] rounded-2xl p-4 text-center border border-gray-100">
                                    <p className="text-lg font-black text-[#4d0706]">{s.value}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 sm:p-12 shadow-2xl shadow-gray-200/40">

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-xl bg-[#4d0706] flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src="/icons/escuela.png" alt="Escuela" className="w-8 h-8 object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-none">¿Listo para empezar?</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Completá tus datos y nos contactamos.</p>
                                </div>
                            </div>

                            {submitted ? (
                                <div className="text-center py-10 space-y-6">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-gray-900">¡Enviado con éxito!</h4>
                                    <p className="text-sm text-gray-500 font-medium">Un asesor se comunicará a la brevedad.</p>
                                    <button onClick={() => setSubmitted(false)} className="text-[#4d0706] font-bold text-sm">Cargar otro formulario</button>
                                </div>
                            ) : (
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} className={inputClass} required />
                                        <input type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleChange} className={inputClass} required />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={inputClass} required />
                                        <input type="text" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} className={inputClass} required />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {["tipoCarrera", "carrera", "modalidad"].map((name) => (
                                            <div key={name} className="relative group">
                                                <select name={name} value={formData[name]} onChange={handleChange} className={inputClass + " appearance-none cursor-pointer pr-10"} required>
                                                    <option value="">{selectLabels[name]}</option>
                                                    {selectOptions[name].map((opt) => (
                                                        <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#4d0706] transition-colors" />
                                            </div>
                                        ))}
                                    </div>

                                    <button type="submit" className="w-full h-14 sm:h-16 bg-[#4d0706] text-[#ffcc00] font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-[#4d0706]/20 transition-transform active:scale-[0.98] mt-4 border-none cursor-pointer">
                                        Inscribirme Ahora
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default InfoForm