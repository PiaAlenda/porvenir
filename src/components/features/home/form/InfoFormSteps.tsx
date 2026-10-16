import { Fragment, type ReactNode } from "react"
import { Briefcase, GraduationCap } from "lucide-react"
import type { SiteConfigMap } from "@/api"
import { getCareers } from "@/siteConfig"
import CuilInput from "./CuilInput"
import DocInput from "./DocInput"
import { PhoneInput } from "./PhoneInput"
import { SearchableSelect, SelectInput, TextInput, TextAreaInput } from "./fields"
import { campoPorId, type FormFieldConfig } from "./formSchema"
import type { FormErrors, InscriptionFormValues } from "./validation"

/**
 * El formulario se dibuja a partir del esquema que el admin configura. Cada
 * paso recorre los campos que le corresponden, en el orden guardado, y elige
 * el componente según `kind`. Etiquetas, textos de ayuda, obligatoriedad,
 * visibilidad y opciones salen todos de la configuración.
 */
export interface StepsProps {
    values: InscriptionFormValues
    errors: FormErrors
    isTouched: (name: keyof InscriptionFormValues) => boolean
    onFieldChange: (name: keyof InscriptionFormValues, value: string) => void
    onFileChange: (name: "fotoDni" | "fotoCertificado", file: File | null) => void
    onBlur: (name: keyof InscriptionFormValues) => void
    campos: FormFieldConfig[]
    config: SiteConfigMap
    tipo: "curso" | "carrera" | ""
}

function isValid(value: string | File | null, error: string | undefined, touched: boolean): boolean {
    if (typeof value === "string") {
        return touched && value.trim() !== "" && !error
    }
    return touched && value !== null && !error
}

const spanClass = (span?: 1 | 2) => (span === 2 ? "sm:col-span-2" : "")

function FileField({ campo, ctx }: { campo: FormFieldConfig; ctx: StepsProps }) {
    const file = ctx.values[campo.id] as File | null

    return (
        <div className={spanClass(campo.span)}>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">
                {campo.label}
                {campo.required && <span className="text-red-700" aria-hidden="true"> *</span>}
            </label>
            <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                    ctx.onFileChange(campo.id as "fotoDni" | "fotoCertificado", e.target.files?.[0] || null)
                }}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#4d0706]/10 file:text-[#4d0706] hover:file:bg-[#4d0706]/20 cursor-pointer border border-gray-200 rounded-2xl p-2 bg-white"
            />
            {file && (
                <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold text-emerald-600 truncate">Seleccionado: {file.name}</p>
                    {file.type.startsWith("image/") && (
                        <div className="p-1.5 border border-gray-200 bg-gray-50 rounded-xl inline-block">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`Vista previa ${campo.label}`}
                                className="max-w-[200px] max-h-[130px] object-contain rounded-lg bg-white"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function CampoGenerico({ campo, ctx }: { campo: FormFieldConfig; ctx: StepsProps }) {
    const { values, errors, isTouched, onFieldChange, onBlur } = ctx
    const value = values[campo.id]
    const error = errors[campo.id]
    const touched = isTouched(campo.id)
    const valid = isValid(value, error, touched)
    const str = typeof value === "string" ? value : ""

    const wrap = (node: ReactNode) => <div className={spanClass(campo.span)}>{node}</div>

    switch (campo.kind) {
        case "text":
            return wrap(
                <TextInput
                    label={campo.label}
                    name={campo.id}
                    value={str}
                    placeholder={campo.placeholder}
                    hint={campo.hint}
                    error={error}
                    valid={valid}
                    required={campo.required}
                    onChange={(e) => onFieldChange(campo.id, e.target.value)}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        case "email":
            return wrap(
                <TextInput
                    label={campo.label}
                    name={campo.id}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={str}
                    placeholder={campo.placeholder}
                    hint={campo.hint}
                    error={error}
                    valid={valid}
                    required={campo.required}
                    onChange={(e) => onFieldChange(campo.id, e.target.value)}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        case "textarea":
            return wrap(
                <TextAreaInput
                    label={campo.label}
                    name={campo.id}
                    value={str}
                    placeholder={campo.placeholder}
                    hint={campo.hint}
                    error={error}
                    required={campo.required}
                    onChange={(e) => onFieldChange(campo.id, e.target.value)}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        case "date":
            return wrap(
                <TextInput
                    label={campo.label}
                    name={campo.id}
                    type="date"
                    value={str}
                    hint={campo.hint}
                    error={error}
                    valid={valid}
                    required={campo.required}
                    autoComplete="bday"
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => onFieldChange(campo.id, e.target.value)}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        case "doc":
            return wrap(
                <DocInput
                    label={campo.label}
                    placeholder={campo.placeholder}
                    value={str}
                    error={error}
                    valid={valid}
                    required={campo.required}
                    onChange={(d) => onFieldChange(campo.id, d)}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        case "cuil":
            return wrap(
                <CuilInput
                    label={campo.label}
                    placeholder={campo.placeholder}
                    value={str}
                    error={error}
                    valid={valid}
                    required={campo.required}
                    onChange={(d) => onFieldChange(campo.id, d)}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        case "phone":
            return wrap(
                <PhoneInput
                    label={campo.label}
                    name={campo.id}
                    value={str}
                    defaultCountry="AR"
                    autoComplete="tel-national"
                    hint={campo.hint}
                    error={error}
                    valid={valid}
                    required={campo.required}
                    onChange={(e164) => onFieldChange(campo.id, e164)}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        case "select":
            return wrap(
                <SelectInput
                    label={campo.label}
                    name={campo.id}
                    value={str}
                    options={campo.options ?? []}
                    placeholderOption={campo.placeholderOption}
                    hint={campo.hint}
                    error={error}
                    valid={valid}
                    required={campo.required}
                    onChange={(e) => {
                        onFieldChange(campo.id, e.target.value)
                        if (campo.id === "c_discapacidad" && e.target.value !== "Sí") onFieldChange("cud", "")
                        if (campo.id === "c_pais_nacimiento" && e.target.value !== "Argentina") onFieldChange("c_provincia_nacimiento", "")
                    }}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        case "career": {
            const allCareers = getCareers(ctx.config)
            const careerOptions = allCareers
                .filter((c) => (ctx.tipo ? (ctx.tipo === "carrera" ? c.id.startsWith("tec-") : !c.id.startsWith("tec-")) : true))
                .map((c) => ({
                    value: c.id,
                    label: c.title,
                    group: c.id.startsWith("tec-") ? "Carreras" : "Cursos",
                }))
            const label =
                campo.label !== "Carrera / Curso"
                    ? campo.label
                    : ctx.tipo === "curso"
                      ? "Curso"
                      : ctx.tipo === "carrera"
                        ? "Carrera"
                        : campo.label
            return wrap(
                <SearchableSelect
                    label={label}
                    name={campo.id}
                    value={str}
                    options={careerOptions}
                    placeholderOption={campo.placeholderOption}
                    hint={campo.hint}
                    error={error}
                    valid={valid}
                    required={campo.required}
                    onChange={(v) => onFieldChange(campo.id, v)}
                    onBlur={() => onBlur(campo.id)}
                />,
            )
        }
        case "file":
            return <FileField campo={campo} ctx={ctx} />
        default:
            return null
    }
}

/** Campos de un paso, en el orden guardado, visibles. */
function camposDelPaso(campos: FormFieldConfig[], step: 1 | 2 | 3 | 4): FormFieldConfig[] {
    return campos.filter((c) => c.step === step && c.visible)
}

export function StepTipoPropuesta({ values, errors, isTouched, onFieldChange, onBlur }: StepsProps) {
    const opciones = [
        {
            id: "curso" as const,
            label: "Curso",
            desc: "Capacitación corta para aprender un oficio. Cualquier edad.",
            icon: GraduationCap,
        },
        {
            id: "carrera" as const,
            label: "Carrera",
            desc: "Formación técnica completa. Requiere mínimo 17 años.",
            icon: Briefcase,
        },
    ]

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Tipo de propuesta</legend>

            <p className="text-sm font-medium text-gray-500">
                Seleccioná la categoría
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {opciones.map((opt) => {
                    const selected = values.tipoPropuesta === opt.id
                    const Icon = opt.icon
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                                onFieldChange("tipoPropuesta", opt.id)
                                onBlur("tipoPropuesta")
                            }}
                            aria-pressed={selected}
                            className={`text-left rounded-2xl border-2 p-4 sm:p-5 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffcc00]/40 ${
                                selected
                                    ? "border-[#4d0706] bg-[#4d0706]/5 shadow-lg shadow-[#4d0706]/10"
                                    : "border-gray-200 bg-white hover:border-[#4d0706]/40 hover:bg-[#4d0706]/[0.03]"
                            }`}
                        >
                            <span
                                className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${
                                    selected ? "bg-[#4d0706] text-[#ffcc00]" : "bg-[#4d0706]/10 text-[#4d0706]"
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                            </span>
                            <span className="block text-sm font-black uppercase tracking-widest text-[#4d0706]">
                                {opt.label}
                            </span>
                            <span className="block mt-1 text-xs font-medium leading-relaxed text-gray-500">
                                {opt.desc}
                            </span>
                        </button>
                    )
                })}
            </div>

            {isTouched("tipoPropuesta") && errors.tipoPropuesta && (
                <p role="alert" className="text-xs font-bold text-red-700">
                    {errors.tipoPropuesta}
                </p>
            )}
        </fieldset>
    )
}

export function StepDatosPersonales(ctx: StepsProps) {
    const { campos, values } = ctx
    const render = (c: FormFieldConfig) => <CampoGenerico key={c.id} campo={c} ctx={ctx} />
    const paisVisible = campoPorId(campos, "c_pais_nacimiento")?.visible === true

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Datos personales</legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {camposDelPaso(campos, 1).map((c) => {
                    if (c.id === "c_pais_nacimiento") {
                        const prov = campoPorId(campos, "c_provincia_nacimiento")
                        const lugar = campoPorId(campos, "lugar_nacimiento")
                        const esArgentina = values.c_pais_nacimiento === "Argentina"
                        return (
                            <Fragment key={c.id}>
                                {render(c)}
                                {esArgentina ? (
                                    <>
                                        {prov?.visible && render(prov)}
                                        {lugar?.visible && render(lugar)}
                                    </>
                                ) : (
                                    lugar?.visible && render(lugar)
                                )}
                            </Fragment>
                        )
                    }
                    // La provincia y el lugar dependen del país: se dibujan junto
                    // a él para mantener la lógica, salvo que el país esté oculto.
                    if (c.id === "c_provincia_nacimiento" || c.id === "lugar_nacimiento") {
                        return paisVisible ? null : render(c)
                    }
                    return render(c)
                })}
            </div>
        </fieldset>
    )
}

export function StepContacto(ctx: StepsProps) {
    const { campos } = ctx
    const render = (c: FormFieldConfig) => <CampoGenerico key={c.id} campo={c} ctx={ctx} />

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Contacto</legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {camposDelPaso(campos, 2).map((c) => render(c))}
            </div>
        </fieldset>
    )
}

export function StepInscripcion({ campos, config, tipo, ...rest }: StepsProps & { careerLocked?: boolean }) {
    const ctx: StepsProps = { campos, config, tipo, ...rest }
    const render = (c: FormFieldConfig) => <CampoGenerico key={c.id} campo={c} ctx={ctx} />

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Inscripción y formación</legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {camposDelPaso(campos, 3).map((c) => {
                    // En el detalle de una carrera la elección ya viene fijada.
                    if (c.id === "careerId" && rest.careerLocked) return null
                    return render(c)
                })}
            </div>
        </fieldset>
    )
}

export function StepDocumentacion(ctx: StepsProps) {
    const { campos, values } = ctx
    const render = (c: FormFieldConfig) => <CampoGenerico key={c.id} campo={c} ctx={ctx} />
    const discVisible = campoPorId(campos, "c_discapacidad")?.visible === true

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Documentación y datos complementarios</legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {camposDelPaso(campos, 4).map((c) => {
                    if (c.id === "c_discapacidad") {
                        const cud = campoPorId(campos, "cud")
                        return (
                            <Fragment key={c.id}>
                                {render(c)}
                                {values.c_discapacidad === "Sí" && cud?.visible && render(cud)}
                            </Fragment>
                        )
                    }
                    if (c.id === "cud") {
                        return discVisible ? null : render(c)
                    }
                    return render(c)
                })}
            </div>
        </fieldset>
    )
}
