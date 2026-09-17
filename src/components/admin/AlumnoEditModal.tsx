import { useState, type FormEvent, type ChangeEvent } from "react"
import { X, Save } from "lucide-react"
import { api, type Alumno } from "@/api"
import { CAREER_DATA } from "@/config/careerData"

interface Props {
    token: string
    alumno: Alumno
    onClose: () => void
    onSaved: (updated: Alumno) => void
}

const inputClass =
    "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all duration-300"

const selectClass = inputClass + " appearance-none cursor-pointer"

export default function AlumnoEditModal({ token, alumno, onClose, onSaved }: Props) {
    const [form, setForm] = useState<Partial<Alumno>>({
        apellido: alumno.apellido,
        nombre: alumno.nombre,
        c_documento: alumno.c_documento,
        numeroDocumento: alumno.numeroDocumento,
        cuil: alumno.cuil,
        fechaNacimiento: alumno.fechaNacimiento,
        c_sexo: alumno.c_sexo,
        careerId: alumno.careerId ?? "",
        domicilio: alumno.domicilio ?? "",
        departamento: alumno.departamento ?? "",
        celular: alumno.celular ?? "",
        email: alumno.email ?? "",
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const set = (key: keyof Alumno) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }))

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError("")
        try {
            const courseTitle = form.careerId && CAREER_DATA[form.careerId] ? CAREER_DATA[form.careerId].title : form.courseTitle ?? ""
            const updated = await api.updateInscripcion(token, alumno.id, {
                ...form,
                courseTitle: courseTitle,
                careerId: form.careerId || "",
            })
            onSaved(updated.inscripcion)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-black/60" onClick={onClose}>
            <div className="flex h-full items-center justify-center p-4">
                <div
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto my-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
                    <h3 className="text-lg font-black text-[#4d0706]">Editar alumno</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-[#4d0706] cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Apellido *</label>
                            <input className={inputClass} value={form.apellido} onChange={set("apellido")} required />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Nombre *</label>
                            <input className={inputClass} value={form.nombre} onChange={set("nombre")} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Tipo de documento *</label>
                            <select className={selectClass} value={form.c_documento} onChange={set("c_documento")} required>
                                <option value="DNI">DNI</option>
                                <option value="LE">LE</option>
                                <option value="LC">LC</option>
                                <option value="Pasaporte">Pasaporte</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Número de documento *</label>
                            <input className={inputClass} value={form.numeroDocumento} onChange={set("numeroDocumento")} required inputMode="numeric" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">CUIL *</label>
                            <input className={inputClass} value={form.cuil} onChange={set("cuil")} maxLength={11} required />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Sexo *</label>
                            <select className={selectClass} value={form.c_sexo} onChange={set("c_sexo")} required>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="X">Otro (X)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Fecha de nacimiento *</label>
                            <input type="date" className={inputClass} value={form.fechaNacimiento} onChange={set("fechaNacimiento")} required />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Curso / Carrera</label>
                            <select className={selectClass} value={form.careerId ?? ""} onChange={set("careerId")}>
                                <option value="">Sin asignar</option>
                                {Object.values(CAREER_DATA).map((c) => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Datos internos de la escuela (para el contrato)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Domicilio</label>
                                <input className={inputClass} value={form.domicilio} onChange={set("domicilio")} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Departamento</label>
                                <input className={inputClass} value={form.departamento} onChange={set("departamento")} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Celular</label>
                                <input className={inputClass} value={form.celular} onChange={set("celular")} />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Email</label>
                                <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] disabled:opacity-60 cursor-pointer">
                            <Save className="w-4 h-4" />
                            {saving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </div>
    )
}