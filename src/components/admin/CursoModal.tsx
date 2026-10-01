import { useState, type FormEvent, type ChangeEvent } from "react"
import { Loader2, Plus, Save, X } from "lucide-react"
import { api, type CursoConfig } from "@/api"
import { CAREER_DATA } from "@/config/careerData"
import { MAX_CUPO_TITULARES, MIN_CUPO_TITULARES } from "@/lib/titulares"

interface Props {
    token: string
    section: "cursos" | "carreras"
    existingIds: string[]
    curso?: { id: string; data: CursoConfig }
    onClose: () => void
    onSaved: () => void
}

const inputClass =
    "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all duration-300"

const textareaClass =
    "w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium " +
    "focus:outline-none focus:ring-4 focus:ring-[#4d0706]/5 focus:border-[#4d0706] focus:bg-white transition-all duration-300"

const labelClass = "text-xs font-black text-gray-500 uppercase tracking-widest block mb-1.5"

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

export default function CursoModal({ token, section, existingIds, curso, onClose, onSaved }: Props) {
    const base = curso ? CAREER_DATA[curso.id] : undefined
    const data = curso?.data

    const [name, setName] = useState(curso ? data?.title || base?.title || curso.id : "")
    const [inscription, setInscription] = useState(data?.inscriptionDate || base?.inscriptionDate || "")
    const [month, setMonth] = useState(data?.month || base?.month || "")
    const [schedule, setSchedule] = useState(data?.schedule || base?.schedule || "")
    const [teacher, setTeacher] = useState(data?.teacher || base?.teachers[0]?.name || "")
    const [ejes, setEjes] = useState(data?.ejes || base?.syllabus[0]?.subjects.join("\n") || "")
    const [file, setFile] = useState<File | null>(null)
    const cupoInicial = typeof data?.cantidadTitulares === "number" ? Math.trunc(data.cantidadTitulares) : 0
    const [cupo, setCupo] = useState(cupoInicial)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const isCurso = section === "cursos"
    const prefix = isCurso ? "curso-" : "tec-"

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const trimmedName = name.trim()
        if (!trimmedName) {
            setError("Ingresá un nombre válido.")
            return
        }

        setSaving(true)
        setError("")
        try {
            let id = curso?.id ?? ""
            if (!curso) {
                const slug = slugify(trimmedName)
                if (!slug) {
                    setError("Ingresá un nombre válido.")
                    setSaving(false)
                    return
                }
                id = `${prefix}${slug}`
                let n = 2
                while (existingIds.includes(id)) id = `${prefix}${slug}-${n++}`
            }

            const form = new FormData()
            form.append("title", trimmedName)
            form.append("inscriptionDate", inscription.trim())
            form.append("month", month.trim())
            form.append("schedule", schedule.trim())
            form.append("teacher", teacher.trim())
            form.append("ejes", ejes.trim())
            if (file) form.append("image", file)

            await api.updateCurso(token, id, form)
            if (section === "carreras" && cupo !== cupoInicial) {
                await api.updateCantidadTitulares(token, id, cupo)
            }
            onSaved()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 sm:flex sm:items-center sm:justify-center sm:p-4 lg:p-0"
            onClick={onClose}
        >
            <div
                className="bg-white w-full h-full flex flex-col sm:h-auto sm:max-w-lg sm:max-h-[90vh] sm:rounded-3xl shadow-2xl lg:max-w-none lg:max-h-none lg:h-full lg:rounded-none"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="shrink-0 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between px-5 py-4 lg:max-w-6xl lg:mx-auto">
                        <h3 className="text-lg font-black text-[#4d0706]">
                            {curso ? "Editar" : "Nuevo"} {isCurso ? "curso" : "carrera"}
                        </h3>
                        <button type="button" onClick={onClose} title="Cerrar" className="text-gray-400 hover:text-[#4d0706] cursor-pointer">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <form
                    id="curso-form"
                    onSubmit={handleSubmit}
                    className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 pb-6 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-5 lg:space-y-0 lg:max-w-6xl lg:mx-auto lg:content-start"
                >
                    <div className="lg:col-span-2">
                        <label className={labelClass} htmlFor="curso-nombre">
                            Nombre {isCurso ? "del curso" : "de la carrera"} *
                        </label>
                        <input
                            id="curso-nombre"
                            className={inputClass}
                            value={name}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            placeholder={isCurso ? "Ej.: Soldadura" : "Ej.: Técnico en Mecánica"}
                            maxLength={80}
                            autoFocus
                            required
                        />
                        {!curso && (
                            <p className="text-[11px] text-gray-400 font-medium mt-1.5">
                                Se creará como {prefix}
                                {slugify(name) || "…"} y quedará disponible al instante.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass} htmlFor="curso-inscripcion">
                                Inscripción
                            </label>
                            <input
                                id="curso-inscripcion"
                                className={inputClass}
                                value={inscription}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setInscription(e.target.value)}
                                placeholder="Ej.: Septiembre 2026"
                                maxLength={60}
                            />
                        </div>
                        <div>
                            <label className={labelClass} htmlFor="curso-mes">
                                Mes de inicio
                            </label>
                            <input
                                id="curso-mes"
                                className={inputClass}
                                value={month}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setMonth(e.target.value)}
                                placeholder="Ej.: Octubre"
                                maxLength={40}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="curso-cursado">
                            Cursado
                        </label>
                        <input
                            id="curso-cursado"
                            className={inputClass}
                            value={schedule}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSchedule(e.target.value)}
                            placeholder="Ej.: Lunes a Jueves de 18:00 a 20:00hs"
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className={labelClass} htmlFor="curso-docente">
                            Docente
                        </label>
                        <input
                            id="curso-docente"
                            className={inputClass}
                            value={teacher}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setTeacher(e.target.value)}
                            placeholder="Ej.: Juan Pérez"
                            maxLength={120}
                        />
                    </div>

                    {section === "carreras" && (
                        <div>
                            <label className={labelClass} htmlFor="curso-cupo">
                                Cupo de titulares
                            </label>
                            <input
                                id="curso-cupo"
                                type="number"
                                inputMode="numeric"
                                className={inputClass}
                                value={cupo}
                                min={MIN_CUPO_TITULARES}
                                max={MAX_CUPO_TITULARES}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setCupo(
                                        Math.min(
                                            MAX_CUPO_TITULARES,
                                            Math.max(MIN_CUPO_TITULARES, Math.trunc(Number(e.target.value) || 0))
                                        )
                                    )
                                }
                            />
                            <p className="text-[11px] text-gray-400 font-medium mt-1.5">
                                {cupo > 0
                                    ? `Los primeros ${cupo} participantes serán titulares.`
                                    : "Sin cupo cargado: todos serán suplentes."}
                            </p>
                        </div>
                    )}

                    <div className="lg:col-span-2">
                        <label className={labelClass} htmlFor="curso-ejes">
                            Ejes de formación
                        </label>
                        <textarea
                            id="curso-ejes"
                            rows={4}
                            className={textareaClass}
                            value={ejes}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEjes(e.target.value)}
                            placeholder={"Un eje por línea\nEj.: Soldadura manual\nInterpretación de planos"}
                        />
                        <p className="text-[11px] text-gray-400 font-medium mt-1.5">Un eje por línea.</p>
                    </div>

                    <div className="lg:col-span-2">
                        <label className={labelClass}>Imagen {curso ? "(opcional, reemplaza la actual)" : "(opcional)"}</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
                            className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#4d0706]/10 file:text-[#4d0706] cursor-pointer"
                        />
                        {file && <p className="text-xs font-bold text-[#4d0706] mt-2 truncate">{file.name}</p>}
                    </div>

                    {error && <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3 lg:col-span-2">{error}</p>}
                </form>

                <div className="shrink-0 bg-white border-t border-gray-100">
                    <div className="flex items-center justify-end gap-3 px-5 py-4 lg:max-w-6xl lg:mx-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="curso-form"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-[#4d0706] text-[#ffcc00] hover:bg-[#300404] disabled:opacity-60 cursor-pointer"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : curso ? (
                                <Save className="w-4 h-4" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            {saving ? "Guardando..." : curso ? "Guardar cambios" : "Crear"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
