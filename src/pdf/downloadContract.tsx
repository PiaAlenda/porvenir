import type { Alumno } from "@/api"
import type { InscriptionFormValues } from "@/components/features/home/form/validation"
import type { ContractPDFProps } from "./ContractPDFDocument"

function pad(n: number): string {
    return String(n).padStart(2, "0")
}

function formatDate(iso?: string): string {
    if (!iso) return ""
    const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
    if (Number.isNaN(date.getTime())) return String(iso)
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function todayFormatted(): string {
    const date = new Date()
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

export function mapAlumnoToContractProps(alumno: Alumno): ContractPDFProps {
    return {
        fullName: `${alumno.apellido} ${alumno.nombre}`.trim(),
        dni: alumno.numeroDocumento || "",
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
        fullName: `${values.apellido || ""} ${values.nombre || ""}`.trim(),
        dni: values.numeroDocumento || "",
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