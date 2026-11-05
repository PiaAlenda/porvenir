import type { Alumno } from "@/api"
import type { InscriptionFormValues } from "@/components/features/home/form/validation"
import { separarMultiple } from "@/components/features/home/form/formSchema"
import { SEXO_LABELS } from "@/components/features/home/form/options"
import type { ContractPDFProps } from "./ContractPDFDocument"
import { getContractFormFields } from "./contractContent"

function pad(n: number): string {
    return String(n).padStart(2, "0")
}

function formatDate(iso?: string): string {
    if (!iso) return ""
    const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
    if (Number.isNaN(date.getTime())) return String(iso)
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function calcAge(iso?: string): string {
    if (!iso) return ""
    const birth = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
    if (Number.isNaN(birth.getTime())) return ""
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const beforeBirthday =
        now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
    if (beforeBirthday) age -= 1
    return age >= 0 && age < 130 ? String(age) : ""
}

function todayFormatted(): string {
    const date = new Date()
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

interface ExtraSource {
    apellido?: string
    nombre?: string
    c_sexo?: string
    c_nacionalidad?: string
    lugar_nacimiento?: string
    celularUrgencia?: string
    anioDivision?: string
    extras?: Record<string, string>
}

/** Valores de los marcadores que no son los 10 de siempre: otros datos y preguntas del formulario. */
function extraValues(src: ExtraSource): Record<string, string> {
    const values: Record<string, string> = {
        APELLIDO: src.apellido || "",
        NOMBRE: src.nombre || "",
        SEXO: src.c_sexo ? (SEXO_LABELS[src.c_sexo] ?? src.c_sexo) : "",
        NACIONALIDAD: src.c_nacionalidad || "",
        LUGAR_NACIMIENTO: src.lugar_nacimiento || "",
        CELULAR_URGENCIA: src.celularUrgencia || "",
        ANIO_DIVISION: src.anioDivision || "",
    }
    for (const field of getContractFormFields()) {
        const raw = (src.extras?.[field.id] ?? "").trim()
        if (!raw) continue
        const label = (v: string) => field.options?.find((o) => o.value === v)?.label ?? v
        values[field.id] =
            field.kind === "checkbox"
                ? separarMultiple(raw).map(label).join(", ")
                : field.kind === "date"
                  ? formatDate(raw)
                  : label(raw)
    }
    return values
}

export function mapAlumnoToContractProps(alumno: Alumno): ContractPDFProps {
    return {
        values: extraValues(alumno),
        fullName: `${alumno.apellido} ${alumno.nombre}`.trim(),
        dni: alumno.numeroDocumento || "",
        cuil: alumno.cuil || "",
        edad: calcAge(alumno.fechaNacimiento),
        address: alumno.domicilio || "",
        departamento: alumno.departamento || "",
        celular: alumno.celular || "",
        birthDate: formatDate(alumno.fechaNacimiento),
        email: alumno.email || "",
        courseName: alumno.courseTitle || "",
        currentDate: todayFormatted(),
    }
}

export function mapFormValuesToContractProps(
    values: Partial<InscriptionFormValues> & { courseTitle?: string; address?: string; departamento?: string; celular?: string },
    courseTitleFallback?: string
): ContractPDFProps {
    return {
        values: extraValues(values),
        fullName: `${values.apellido || ""} ${values.nombre || ""}`.trim(),
        dni: values.numeroDocumento || "",
        cuil: values.cuil || "",
        edad: calcAge(values.fechaNacimiento),
        address: values.address || "",
        departamento: values.departamento || "",
        celular: values.celular || "",
        birthDate: formatDate(values.fechaNacimiento),
        email: values.email || "",
        courseName: values.courseTitle || courseTitleFallback || "",
        currentDate: todayFormatted(),
    }
}

export async function generateContractBlob(props: ContractPDFProps): Promise<Blob> {
    const [{ pdf }, { default: ContractPDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ContractPDFDocument"),
    ])
    return await pdf(<ContractPDFDocument {...props} />).toBlob()
}

export async function downloadContractPdf(alumno: Alumno): Promise<void> {
    const props = mapAlumnoToContractProps(alumno)
    const blob = await generateContractBlob(props)
    const url = URL.createObjectURL(blob)
    const safeName = (alumno.apellido || "alumno").replace(/[^a-zA-Z0-9]+/g, "_")
    const link = document.createElement("a")
    link.href = url
    link.download = `${safeName}_contrato.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

export async function downloadContractFromFormData(
    values: Partial<InscriptionFormValues> & { courseTitle?: string; address?: string; departamento?: string; celular?: string },
    courseTitleFallback?: string
): Promise<void> {
    const props = mapFormValuesToContractProps(values, courseTitleFallback)
    const blob = await generateContractBlob(props)
    const url = URL.createObjectURL(blob)
    const safeName = (values.apellido || "alumno").replace(/[^a-zA-Z0-9]+/g, "_")
    const link = document.createElement("a")
    link.href = url
    link.download = `${safeName}_contrato.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}