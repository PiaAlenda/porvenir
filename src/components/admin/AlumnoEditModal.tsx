import { useState, type FormEvent, type ChangeEvent } from "react"
import { X, Save, Trash2 } from "lucide-react"
import { api, type Alumno } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import {
    PAISES,
    NACIONALIDADES,
    PROVINCIAS_ARGENTINA,
    DEPARTAMENTOS_SAN_JUAN,
    DISCAPACIDAD,
    PUEBLOS_INDIGENAS,
    ESPECIALIDADES,
} from "../features/home/form/options"

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
const textareaClass =
    "w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all duration-300"

export default function AlumnoEditModal({ token, alumno, onClose, onSaved }: Props) {
    const [form, setForm] = useState<Partial<Alumno>>({
        apellido: alumno.apellido,
        nombre: alumno.nombre,
        c_documento: alumno.c_documento,
        numeroDocumento: alumno.numeroDocumento,
        cuil: alumno.cuil,
        fechaNacimiento: alumno.fechaNacimiento,
        c_sexo: alumno.c_sexo,
        c_pais_nacimiento: alumno.c_pais_nacimiento ?? "Argentina",
        c_provincia_nacimiento: alumno.c_provincia_nacimiento ?? "San Juan",
        lugar_nacimiento: alumno.lugar_nacimiento ?? "",
        c_nacionalidad: alumno.c_nacionalidad ?? "Argentina",
        careerId: alumno.careerId ?? "",
        courseTitle: alumno.courseTitle ?? "",
        especialidad: alumno.especialidad ?? "General / Sin especialidad",
        domicilio: alumno.domicilio ?? "",
        departamento: alumno.departamento ?? "Capital",
        celular: alumno.celular ?? "",
        celularUrgencia: alumno.celularUrgencia ?? "",
        email: alumno.email ?? "",
        c_discapacidad: alumno.c_discapacidad ?? "No",
        cud: alumno.cud ?? "",
        c_pueblo_indigena: alumno.c_pueblo_indigena ?? "Ninguno",
        problematicaIntegrado: alumno.problematicaIntegrado ?? "",
        fotoDni: alumno.fotoDni ?? "",
        fotoCertificado: alumno.fotoCertificado ?? "",
    })

    const [fileDni, setFileDni] = useState<File | null>(null)
    const [fileCertificado, setFileCertificado] = useState<File | null>(null)
    const [removeDni, setRemoveDni] = useState(false)
    const [removeCert, setRemoveCert] = useState(false)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const set = (key: keyof Alumno) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }))

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError("")
        try {
            const courseTitle = form.careerId && CAREER_DATA[form.careerId] ? CAREER_DATA[form.careerId].title : form.courseTitle ?? ""
            let updated = (await api.updateInscripcion(token, alumno.id, {
                ...form,
                courseTitle,
                careerId: form.careerId || "",
            })).inscripcion

            if (fileDni || fileCertificado || removeDni || removeCert) {
                const data = new FormData()
                if (fileDni) data.append("fotoDni", fileDni)
                else if (removeDni) data.append("removeFotoDni", "true")

                if (fileCertificado) data.append("fotoCertificado", fileCertificado)
                else if (removeCert) data.append("removeFotoCertificado", "true")

                const archRes = await api.uploadArchivos(token, alumno.id, data)
                updated = archRes.inscripcion
            }

            onSaved(updated)
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
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto my-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur flex items-center justify-between p-5 sm:p-6 border-b border-gray-100">
                        <h3 className="text-lg font-black text-[#4d0706]">Editar alumno e inscripción</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-[#4d0706] cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
                        <div>
                            <p className="text-xs font-black text-[#4d0706] uppercase tracking-widest mb-3">1. Datos personales</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Apellido *</label>
                                    <input className={inputClass} value={form.apellido} onChange={set("apellido")} required />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Nombre *</label>
                                    <input className={inputClass} value={form.nombre} onChange={set("nombre")} required />
                                </div>
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
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Fecha de nacimiento *</label>
                                    <input type="date" className={inputClass} value={form.fechaNacimiento} onChange={set("fechaNacimiento")} required />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-black text-[#4d0706] uppercase tracking-widest mb-3">2. Lugar de nacimiento</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">País de nacimiento</label>
                                    <select className={selectClass} value={form.c_pais_nacimiento} onChange={set("c_pais_nacimiento")}>
                                        {PAISES.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                {form.c_pais_nacimiento === "Argentina" && (
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Provincia de nacimiento</label>
                                        <select className={selectClass} value={form.c_provincia_nacimiento} onChange={set("c_provincia_nacimiento")}>
                                            {PROVINCIAS_ARGENTINA.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Lugar / Localidad nacimiento</label>
                                    <input className={inputClass} value={form.lugar_nacimiento} onChange={set("lugar_nacimiento")} placeholder="Ej.: Capital, Caucete..." />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Nacionalidad</label>
                                    <select className={selectClass} value={form.c_nacionalidad} onChange={set("c_nacionalidad")}>
                                        {NACIONALIDADES.map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-black text-[#4d0706] uppercase tracking-widest mb-3">3. Contacto y domicilio</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Email</label>
                                    <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Celular particular</label>
                                    <input className={inputClass} value={form.celular} onChange={set("celular")} />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Celular urgencia</label>
                                    <input className={inputClass} value={form.celularUrgencia} onChange={set("celularUrgencia")} />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Departamento</label>
                                    <select className={selectClass} value={form.departamento} onChange={set("departamento")}>
                                        {DEPARTAMENTOS_SAN_JUAN.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Domicilio</label>
                                    <input className={inputClass} value={form.domicilio} onChange={set("domicilio")} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-black text-[#4d0706] uppercase tracking-widest mb-3">4. Inscripción y especialidad</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Curso / Carrera</label>
                                    <select className={selectClass} value={form.careerId ?? ""} onChange={set("careerId")}>
                                        <option value="">Sin asignar</option>
                                        {Object.values(CAREER_DATA).map((c) => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Especialidad</label>
                                    <select className={selectClass} value={form.especialidad} onChange={set("especialidad")}>
                                        {ESPECIALIDADES.map((e) => (
                                            <option key={e} value={e}>{e}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-black text-[#4d0706] uppercase tracking-widest mb-3">5. Documentación y datos complementarios</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Posee discapacidad</label>
                                    <select className={selectClass} value={form.c_discapacidad} onChange={set("c_discapacidad")}>
                                        {DISCAPACIDAD.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                {form.c_discapacidad === "Sí" && (
                                    <div>
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">N° CUD</label>
                                        <input className={inputClass} value={form.cud} onChange={set("cud")} />
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Pueblo indígena</label>
                                    <select className={selectClass} value={form.c_pueblo_indigena} onChange={set("c_pueblo_indigena")}>
                                        {PUEBLOS_INDIGENAS.map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5">Problemática integrado / Observaciones</label>
                                    <textarea rows={2} className={textareaClass} value={form.problematicaIntegrado} onChange={set("problematicaIntegrado")} />
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-2">
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Foto DNI</p>
                                    {form.fotoDni && !removeDni && (
                                        <div className="flex items-center justify-between gap-2">
                                            <a href={form.fotoDni} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#4d0706] underline truncate">
                                                Ver foto actual
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRemoveDni(true)
                                                    setFileDni(null)
                                                }}
                                                className="text-xs font-bold text-red-600 flex items-center gap-1 cursor-pointer hover:bg-red-50 p-1 rounded-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Quitar
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => {
                                            setFileDni(e.target.files?.[0] || null)
                                            setRemoveDni(false)
                                        }}
                                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#4d0706]/10 file:text-[#4d0706]"
                                    />
                                </div>

                                <div className="p-3 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-2">
                                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Foto Certificado</p>
                                    {form.fotoCertificado && !removeCert && (
                                        <div className="flex items-center justify-between gap-2">
                                            <a href={form.fotoCertificado} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#4d0706] underline truncate">
                                                Ver foto actual
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRemoveCert(true)
                                                    setFileCertificado(null)
                                                }}
                                                className="text-xs font-bold text-red-600 flex items-center gap-1 cursor-pointer hover:bg-red-50 p-1 rounded-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Quitar
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => {
                                            setFileCertificado(e.target.files?.[0] || null)
                                            setRemoveCert(false)
                                        }}
                                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#4d0706]/10 file:text-[#4d0706]"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer">
                                Cancelar
                            </button>
                            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] disabled:opacity-60 cursor-pointer">
                                <Save className="w-4 h-4" />
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}