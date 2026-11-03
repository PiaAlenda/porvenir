import { AlertCircle, HeartPulse, Info } from "lucide-react"
import { CampoOpciones } from "./InfoFormSteps"
import { TextAreaInput, TextInput } from "./fields"
import type { FormFieldConfig } from "./formSchema"
import {
    SECCIONES_FICHA,
    SI,
    claveError,
    preguntaActiva,
    type FichaMedicaValues,
    type PreguntaFicha,
} from "./fichaMedica"

interface StepFichaMedicaProps {
    ficha: FichaMedicaValues
    errors: Record<string, string | undefined>
    onChange: (id: string, value: string) => void
    onBlur: (id: string) => void
}

/** Adapta una pregunta de la ficha al formato que entiende `CampoOpciones`. */
function comoCampo(p: PreguntaFicha): FormFieldConfig {
    return {
        id: `x_med_${p.id}`,
        kind: p.tipo === "multi" ? "checkbox" : "radio",
        step: 4,
        label: p.label,
        hint: p.hint,
        required: !!p.required,
        visible: true,
        options: (p.opciones ?? []).map((o) => ({ value: o, label: o })),
    }
}

function Pregunta({ p, ctx }: { p: PreguntaFicha; ctx: StepFichaMedicaProps }) {
    const value = ctx.ficha[p.id] ?? ""
    const error = ctx.errors[claveError(p.id)]
    const onChange = (v: string) => ctx.onChange(p.id, v)
    const onBlur = () => ctx.onBlur(p.id)
    // La grilla tiene 2 columnas siempre: lo ancho ocupa las dos, los números
    // (altura y peso) van de a pares también en mobile, y el resto se apila
    // en mobile y va de a dos en pantallas anchas.
    const span = p.ancho ? "col-span-2" : p.tipo === "numero" ? "col-span-1" : "col-span-2 sm:col-span-1"

    if (p.tipo === "acepto") {
        const checked = value === SI
        return (
            <div className={span}>
                <label
                    className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${checked
                        ? "border-[#4d0706] bg-[#4d0706]/[0.04]"
                        : error ? "border-red-300" : "border-gray-200 hover:border-gray-300"}`}
                >
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked ? SI : "")}
                        aria-invalid={error ? true : undefined}
                        className="mt-0.5 w-4 h-4 shrink-0 accent-[#4d0706] cursor-pointer"
                    />
                    <span className="text-xs font-semibold leading-relaxed text-gray-700 uppercase">
                        {p.label}
                        <span className="text-red-700" aria-hidden="true"> *</span>
                    </span>
                </label>
                {error && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-red-700">
                        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{error}</span>
                    </p>
                )}
            </div>
        )
    }

    if (p.tipo === "sino" || p.tipo === "unica" || p.tipo === "multi") {
        return (
            <div className={span}>
                <CampoOpciones campo={comoCampo(p)} value={value} error={error} onChange={onChange} onBlur={onBlur} enLinea={p.tipo === "sino"} />
            </div>
        )
    }

    if (p.tipo === "textarea") {
        return (
            <div className={span}>
                <TextAreaInput
                    label={p.label}
                    name={`med_${p.id}`}
                    value={value}
                    placeholder={p.placeholder}
                    hint={p.hint}
                    error={error}
                    required={p.required}
                    rows={3}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                />
            </div>
        )
    }

    return (
        <div className={span}>
            <TextInput
                label={p.unidad ? `${p.label} (${p.unidad})` : p.label}
                name={`med_${p.id}`}
                type={p.tipo === "fecha" ? "date" : "text"}
                inputMode={p.tipo === "numero" ? "decimal" : undefined}
                value={value}
                placeholder={p.placeholder}
                hint={p.hint}
                error={error}
                valid={!!value.trim() && !error}
                required={p.required}
                maxLength={p.tipo === "numero" ? 6 : 200}
                onChange={(e) => onChange(p.tipo === "numero" ? e.target.value.replace(/[^\d.,]/g, "") : e.target.value)}
                onBlur={onBlur}
            />
        </div>
    )
}

export default function StepFichaMedica(props: StepFichaMedicaProps) {
    return (
        <fieldset className="space-y-6 sm:space-y-8">
            <legend className="sr-only">Ficha médica (DDJJ)</legend>

            <div className="flex items-start gap-3 rounded-2xl bg-[#4d0706]/5 border border-[#4d0706]/10 px-4 py-3">
                <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-[#4d0706]" aria-hidden="true" />
                <p className="text-xs font-medium leading-relaxed text-[#4d0706]">
                    Declaración jurada médica. Esta información es confidencial y solo la usa la escuela
                    para cuidar tu salud y actuar correctamente ante una emergencia.
                </p>
            </div>

            {SECCIONES_FICHA.map((s) => {
                const activas = s.preguntas.filter((p) => preguntaActiva(p, props.ficha))
                return (
                    <section key={s.id} className="space-y-3 sm:space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#4d0706] border-b border-gray-100 pb-2">
                            {s.titulo}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {activas.map((p) => <Pregunta key={p.id} p={p} ctx={props} />)}
                        </div>
                        {s.nota && (
                            <p className="flex items-start gap-2 text-xs font-medium text-gray-500">
                                <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span>{s.nota}</span>
                            </p>
                        )}
                    </section>
                )
            })}
        </fieldset>
    )
}
