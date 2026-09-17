import { CAREER_DATA } from "@/config/careerData"
import CuilInput from "./CuilInput"
import DocInput from "./DocInput"
import { PhoneInput } from "./PhoneInput"
import { SearchableSelect, SelectInput, TextInput, TextAreaInput } from "./fields"
import {
    PAISES,
    NACIONALIDADES,
    PROVINCIAS_ARGENTINA,
    DEPARTAMENTOS_SAN_JUAN,
    DISCAPACIDAD,
    PUEBLOS_INDIGENAS,
    ESPECIALIDADES,
} from "./options"
import type { FormErrors, InscriptionFormValues } from "./validation"

export interface StepsProps {
    values: InscriptionFormValues
    errors: FormErrors
    isTouched: (name: keyof InscriptionFormValues) => boolean
    onFieldChange: (name: keyof InscriptionFormValues, value: string) => void
    onFileChange: (name: "fotoDni" | "fotoCertificado", file: File | null) => void
    onBlur: (name: keyof InscriptionFormValues) => void
}

const SEXO_OPTIONS = [
    { value: "M", label: "Masculino" },
    { value: "F", label: "Femenino" },
    { value: "X", label: "Otro (X)" },
]

function isValid(value: string | File | null, error: string | undefined, touched: boolean): boolean {
    if (typeof value === "string") {
        return touched && value.trim() !== "" && !error
    }
    return touched && value !== null && !error
}

export function StepDatosPersonales({ values, errors, isTouched, onFieldChange, onBlur }: StepsProps) {
    const paisOptions = PAISES.map((p) => ({ value: p, label: p }))
    const provOptions = PROVINCIAS_ARGENTINA.map((p) => ({ value: p, label: p }))
    const nacOptions = NACIONALIDADES.map((n) => ({ value: n, label: n }))

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
                <div className="sm:col-span-6 min-w-0">
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
                        hint="Mínimo 17 años"
                        onChange={(e) => onFieldChange("fechaNacimiento", e.target.value)}
                        onBlur={() => onBlur("fechaNacimiento")}
                    />
                </div>
                <div className="sm:col-span-6 min-w-0">
                    <SelectInput
                        label="Nacionalidad"
                        name="c_nacionalidad"
                        value={values.c_nacionalidad}
                        options={nacOptions}
                        placeholderOption="Seleccioná nacionalidad"
                        error={errors.c_nacionalidad}
                        valid={isValid(values.c_nacionalidad, errors.c_nacionalidad, isTouched("c_nacionalidad"))}
                        required
                        onChange={(e) => onFieldChange("c_nacionalidad", e.target.value)}
                        onBlur={() => onBlur("c_nacionalidad")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">
                <div className="sm:col-span-6 min-w-0">
                    <SelectInput
                        label="País de nacimiento"
                        name="c_pais_nacimiento"
                        value={values.c_pais_nacimiento}
                        options={paisOptions}
                        placeholderOption="Seleccioná país"
                        error={errors.c_pais_nacimiento}
                        valid={isValid(values.c_pais_nacimiento, errors.c_pais_nacimiento, isTouched("c_pais_nacimiento"))}
                        required
                        onChange={(e) => {
                            onFieldChange("c_pais_nacimiento", e.target.value)
                            if (e.target.value !== "Argentina") {
                                onFieldChange("c_provincia_nacimiento", "")
                            }
                        }}
                        onBlur={() => onBlur("c_pais_nacimiento")}
                    />
                </div>
                {values.c_pais_nacimiento === "Argentina" ? (
                    <div className="sm:col-span-6 min-w-0">
                        <SelectInput
                            label="Provincia de nacimiento"
                            name="c_provincia_nacimiento"
                            value={values.c_provincia_nacimiento}
                            options={provOptions}
                            placeholderOption="Seleccioná provincia"
                            error={errors.c_provincia_nacimiento}
                            valid={isValid(values.c_provincia_nacimiento, errors.c_provincia_nacimiento, isTouched("c_provincia_nacimiento"))}
                            required
                            onChange={(e) => onFieldChange("c_provincia_nacimiento", e.target.value)}
                            onBlur={() => onBlur("c_provincia_nacimiento")}
                        />
                    </div>
                ) : (
                    <div className="sm:col-span-6 min-w-0">
                        <TextInput
                            label="Lugar de nacimiento (Ciudad/Localidad)"
                            name="lugar_nacimiento"
                            value={values.lugar_nacimiento}
                            error={errors.lugar_nacimiento}
                            valid={isValid(values.lugar_nacimiento, errors.lugar_nacimiento, isTouched("lugar_nacimiento"))}
                            required
                            placeholder="Ej.: Santiago, Montevideo..."
                            onChange={(e) => onFieldChange("lugar_nacimiento", e.target.value)}
                            onBlur={() => onBlur("lugar_nacimiento")}
                        />
                    </div>
                )}
            </div>

            {values.c_pais_nacimiento === "Argentina" && (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <TextInput
                        label="Lugar de nacimiento (Ciudad/Localidad)"
                        name="lugar_nacimiento"
                        value={values.lugar_nacimiento}
                        error={errors.lugar_nacimiento}
                        valid={isValid(values.lugar_nacimiento, errors.lugar_nacimiento, isTouched("lugar_nacimiento"))}
                        required
                        placeholder="Ej.: Capital, Caucete, Jáchal..."
                        onChange={(e) => onFieldChange("lugar_nacimiento", e.target.value)}
                        onBlur={() => onBlur("lugar_nacimiento")}
                    />
                </div>
            )}
        </fieldset>
    )
}

export function StepContacto({ values, errors, isTouched, onFieldChange, onBlur }: StepsProps) {
    const deptoOptions = DEPARTAMENTOS_SAN_JUAN.map((d) => ({ value: d, label: d }))

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Contacto</legend>

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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">
                <div className="sm:col-span-6 min-w-0">
                    <PhoneInput
                        label="Celular particular"
                        name="celular"
                        value={values.celular}
                        error={errors.celular}
                        valid={isValid(values.celular, errors.celular, isTouched("celular"))}
                        required
                        autoComplete="tel-national"
                        hint="Mínimo 8 dígitos"
                        onChange={(e164) => onFieldChange("celular", e164)}
                        onBlur={() => onBlur("celular")}
                    />
                </div>
                <div className="sm:col-span-6 min-w-0">
                    <PhoneInput
                        label="Celular de urgencia"
                        name="celularUrgencia"
                        value={values.celularUrgencia}
                        error={errors.celularUrgencia}
                        valid={isValid(values.celularUrgencia, errors.celularUrgencia, isTouched("celularUrgencia"))}
                        required
                        autoComplete="tel-national"
                        hint="Contacto ante emergencias"
                        onChange={(e164) => onFieldChange("celularUrgencia", e164)}
                        onBlur={() => onBlur("celularUrgencia")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <TextInput
                    label="Domicilio (calle y número)"
                    name="domicilio"
                    value={values.domicilio}
                    error={errors.domicilio}
                    valid={isValid(values.domicilio, errors.domicilio, isTouched("domicilio"))}
                    required
                    autoComplete="street-address"
                    placeholder="Ej.: Av. Libertador 250, Piso 2"
                    onChange={(e) => onFieldChange("domicilio", e.target.value)}
                    onBlur={() => onBlur("domicilio")}
                />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <SelectInput
                    label="Departamento de residencia (San Juan)"
                    name="departamento"
                    value={values.departamento}
                    options={deptoOptions}
                    placeholderOption="Seleccioná un departamento"
                    error={errors.departamento}
                    valid={isValid(values.departamento, errors.departamento, isTouched("departamento"))}
                    required
                    onChange={(e) => onFieldChange("departamento", e.target.value)}
                    onBlur={() => onBlur("departamento")}
                />
            </div>
        </fieldset>
    )
}

export function StepInscripcion({ values, errors, isTouched, onFieldChange, onBlur }: StepsProps) {
    const careerOptions = Object.values(CAREER_DATA).map((c) => ({ value: c.id, label: c.title }))
    const espOptions = ESPECIALIDADES.map((e) => ({ value: e, label: e }))

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Inscripción y formación</legend>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
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

                <SelectInput
                    label="Especialidad"
                    name="especialidad"
                    value={values.especialidad}
                    options={espOptions}
                    placeholderOption="Seleccioná una especialidad"
                    error={errors.especialidad}
                    valid={isValid(values.especialidad, errors.especialidad, isTouched("especialidad"))}
                    required
                    onChange={(e) => onFieldChange("especialidad", e.target.value)}
                    onBlur={() => onBlur("especialidad")}
                />
            </div>
        </fieldset>
    )
}

export function StepDocumentacion({
    values,
    errors,
    isTouched,
    onFieldChange,
    onFileChange,
    onBlur,
}: StepsProps) {
    const discOptions = DISCAPACIDAD.map((d) => ({ value: d, label: d }))
    const pueblosOptions = PUEBLOS_INDIGENAS.map((p) => ({ value: p, label: p }))

    return (
        <fieldset className="space-y-3 sm:space-y-4">
            <legend className="sr-only">Documentación y datos complementarios</legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">
                <div className="sm:col-span-6 min-w-0">
                    <SelectInput
                        label="¿Posee discapacidad?"
                        name="c_discapacidad"
                        value={values.c_discapacidad}
                        options={discOptions}
                        placeholderOption="Seleccioná opción"
                        error={errors.c_discapacidad}
                        valid={isValid(values.c_discapacidad, errors.c_discapacidad, isTouched("c_discapacidad"))}
                        required
                        onChange={(e) => {
                            onFieldChange("c_discapacidad", e.target.value)
                            if (e.target.value !== "Sí") {
                                onFieldChange("cud", "")
                            }
                        }}
                        onBlur={() => onBlur("c_discapacidad")}
                    />
                </div>
                {values.c_discapacidad === "Sí" && (
                    <div className="sm:col-span-6 min-w-0">
                        <TextInput
                            label="Número de CUD (Certificado)"
                            name="cud"
                            value={values.cud}
                            error={errors.cud}
                            valid={isValid(values.cud, errors.cud, isTouched("cud"))}
                            required
                            placeholder="Ej.: 12345678"
                            onChange={(e) => onFieldChange("cud", e.target.value)}
                            onBlur={() => onBlur("cud")}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <SelectInput
                    label="Pueblo Indígena u originario"
                    name="c_pueblo_indigena"
                    value={values.c_pueblo_indigena}
                    options={pueblosOptions}
                    placeholderOption="Seleccioná un pueblo u originario"
                    error={errors.c_pueblo_indigena}
                    valid={isValid(values.c_pueblo_indigena, errors.c_pueblo_indigena, isTouched("c_pueblo_indigena"))}
                    required
                    onChange={(e) => onFieldChange("c_pueblo_indigena", e.target.value)}
                    onBlur={() => onBlur("c_pueblo_indigena")}
                />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <TextAreaInput
                    label="Problemática integrado / Observaciones (opcional)"
                    name="problematicaIntegrado"
                    value={values.problematicaIntegrado}
                    placeholder="Detallá cualquier observación o necesidad específica..."
                    error={errors.problematicaIntegrado}
                    onChange={(e) => onFieldChange("problematicaIntegrado", e.target.value)}
                    onBlur={() => onBlur("problematicaIntegrado")}
                />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4 pt-2">
                <div className="sm:col-span-6 min-w-0">
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">
                        Foto de DNI (opcional)
                    </label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            onFileChange("fotoDni", file)
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#4d0706]/10 file:text-[#4d0706] hover:file:bg-[#4d0706]/20 cursor-pointer border border-gray-200 rounded-2xl p-2 bg-white"
                    />
                    {values.fotoDni && (
                        <div className="mt-2 space-y-1">
                            <p className="text-xs font-semibold text-emerald-600 truncate">
                                Seleccionado: {values.fotoDni.name}
                            </p>
                            {values.fotoDni.type.startsWith("image/") && (
                                <div className="p-1.5 border border-gray-200 bg-gray-50 rounded-xl inline-block">
                                    <img
                                        src={URL.createObjectURL(values.fotoDni)}
                                        alt="Vista previa DNI"
                                        className="max-w-[200px] max-h-[130px] object-contain rounded-lg bg-white"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="sm:col-span-6 min-w-0">
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-gray-500">
                        Foto Certificado Estudios (opcional)
                    </label>
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            onFileChange("fotoCertificado", file)
                        }}
                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#4d0706]/10 file:text-[#4d0706] hover:file:bg-[#4d0706]/20 cursor-pointer border border-gray-200 rounded-2xl p-2 bg-white"
                    />
                    {values.fotoCertificado && (
                        <div className="mt-2 space-y-1">
                            <p className="text-xs font-semibold text-emerald-600 truncate">
                                Seleccionado: {values.fotoCertificado.name}
                            </p>
                            {values.fotoCertificado.type.startsWith("image/") && (
                                <div className="p-1.5 border border-gray-200 bg-gray-50 rounded-xl inline-block">
                                    <img
                                        src={URL.createObjectURL(values.fotoCertificado)}
                                        alt="Vista previa Certificado"
                                        className="max-w-[200px] max-h-[130px] object-contain rounded-lg bg-white"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </fieldset>
    )
}