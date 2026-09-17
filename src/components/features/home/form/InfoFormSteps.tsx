import { CAREER_DATA } from "@/config/careerData"
import CuilInput from "./CuilInput"
import DocInput from "./DocInput"
import { SearchableSelect, SelectInput, TextInput } from "./fields"
import type { FormErrors, InscriptionFormValues } from "./validation"

interface StepsProps {
    values: InscriptionFormValues
    errors: FormErrors
    isTouched: (name: keyof InscriptionFormValues) => boolean
    onFieldChange: (name: keyof InscriptionFormValues, value: string) => void
    onBlur: (name: keyof InscriptionFormValues) => void
}

const SEXO_OPTIONS = [
    { value: "M", label: "Masculino" },
    { value: "F", label: "Femenino" },
    { value: "X", label: "Otro (X)" },
]

function isValid(value: string, error: string | undefined, touched: boolean): boolean {
    return touched && value.trim() !== "" && !error
}

export function StepDatosPersonales({ values, errors, isTouched, onFieldChange, onBlur }: StepsProps) {
    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Datos personales</legend>

            <div className="grid grid-cols-12 gap-3 sm:gap-4">
                <div className="col-span-6 min-w-0">
                    <TextInput
                        label="Nombre"
                        name="nombre"
                        value={values.nombre}
                        error={errors.nombre}
                        valid={isValid(values.nombre, errors.nombre, isTouched("nombre"))}
                        required
                        autoComplete="given-name"
                        placeholder="Ej.: María"
                        onChange={(e) => onFieldChange("nombre", e.target.value)}
                        onBlur={() => onBlur("nombre")}
                    />
                </div>
                <div className="col-span-6 min-w-0">
                    <TextInput
                        label="Apellido"
                        name="apellido"
                        value={values.apellido}
                        error={errors.apellido}
                        valid={isValid(values.apellido, errors.apellido, isTouched("apellido"))}
                        required
                        autoComplete="family-name"
                        placeholder="Ej.: González"
                        onChange={(e) => onFieldChange("apellido", e.target.value)}
                        onBlur={() => onBlur("apellido")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <DocInput
                    value={values.numeroDocumento}
                    error={errors.numeroDocumento}
                    valid={isValid(values.numeroDocumento, errors.numeroDocumento, isTouched("numeroDocumento"))}
                    required
                    onChange={(digits) => onFieldChange("numeroDocumento", digits)}
                    onBlur={() => onBlur("numeroDocumento")}
                />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">
                <div className="sm:col-span-6 min-w-0">
                    <CuilInput
                        value={values.cuil}
                        error={errors.cuil}
                        valid={isValid(values.cuil, errors.cuil, isTouched("cuil"))}
                        required
                        onChange={(digits) => onFieldChange("cuil", digits)}
                        onBlur={() => onBlur("cuil")}
                    />
                </div>
                <div className="sm:col-span-6 min-w-0">
                    <SelectInput
                        label="Sexo"
                        name="c_sexo"
                        value={values.c_sexo}
                        options={SEXO_OPTIONS}
                        error={errors.c_sexo}
                        valid={isValid(values.c_sexo, errors.c_sexo, isTouched("c_sexo"))}
                        required
                        onChange={(e) => onFieldChange("c_sexo", e.target.value)}
                        onBlur={() => onBlur("c_sexo")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">
                <div className="sm:col-span-12">
                    <TextInput
                        label="Fecha de nacimiento"
                        name="fechaNacimiento"
                        type="date"
                        value={values.fechaNacimiento}
                        error={errors.fechaNacimiento}
                        valid={isValid(values.fechaNacimiento, errors.fechaNacimiento, isTouched("fechaNacimiento"))}
                        required
                        autoComplete="bday"
                        max={new Date().toISOString().split("T")[0]}
                        hint="Debés tener al menos 17 años"
                        onChange={(e) => onFieldChange("fechaNacimiento", e.target.value)}
                        onBlur={() => onBlur("fechaNacimiento")}
                    />
                </div>
            </div>
        </fieldset>
    )
}

export function StepContactoYInscripcion({ values, errors, isTouched, onFieldChange, onBlur }: StepsProps) {
    const careerOptions = Object.values(CAREER_DATA).map((c) => ({ value: c.id, label: c.title }))

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Contacto e inscripción</legend>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <TextInput
                    label="Correo electrónico (Gmail)"
                    name="email"
                    type="email"
                    value={values.email}
                    error={errors.email}
                    valid={isValid(values.email, errors.email, isTouched("email"))}
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="nombre@gmail.com"
                    hint="Usá tu cuenta de Gmail: nombre@gmail.com"
                    onChange={(e) => onFieldChange("email", e.target.value)}
                    onBlur={() => onBlur("email")}
                />

                <SearchableSelect
                    label="Carrera / Curso"
                    name="careerId"
                    value={values.careerId}
                    options={careerOptions}
                    placeholderOption="Buscá y seleccioná una opción"
                    error={errors.careerId}
                    valid={isValid(values.careerId, errors.careerId, isTouched("careerId"))}
                    required
                    hint="Elegí la propuesta a la que querés inscribirte"
                    onChange={(v) => onFieldChange("careerId", v)}
                    onBlur={() => onBlur("careerId")}
                />
            </div>
        </fieldset>
    )
}