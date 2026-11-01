/**
 * Achica una foto antes de subirla.
 *
 * Una foto de celular pesa 3–8MB y el servidor la recibe entera en memoria:
 * con muchas inscripciones en paralelo eso alcanza para tumbar la instancia.
 * Para leer un DNI o un certificado sobran 1600px de lado, y en JPEG al 80%
 * queda en unos 200–400KB.
 *
 * Si algo falla (formato que el navegador no decodifica, canvas no
 * disponible) se devuelve el archivo original: comprimir es una mejora, no un
 * requisito para poder inscribirse. Los PDF se mandan tal cual.
 */

const MAX_SIDE = 1600
const QUALITY = 0.8
/** Por debajo de esto no vale la pena recomprimir. */
const SKIP_BELOW_BYTES = 500 * 1024

const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"])

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === "function") {
        try {
            // `imageOrientation: "from-image"` respeta la rotación EXIF de las
            // fotos de celular; sin eso el DNI puede quedar acostado.
            return await createImageBitmap(file, { imageOrientation: "from-image" })
        } catch {
            // Algunos navegadores no aceptan las opciones: se cae al <img>.
        }
    }
    const url = URL.createObjectURL(file)
    try {
        const img = new Image()
        img.decoding = "async"
        img.src = url
        await img.decode()
        return img
    } finally {
        URL.revokeObjectURL(url)
    }
}

export async function compressImage(file: File): Promise<File> {
    if (!COMPRESSIBLE.has(file.type) || file.size < SKIP_BELOW_BYTES) return file

    try {
        const source = await decode(file)
        const width = "naturalWidth" in source ? source.naturalWidth : source.width
        const height = "naturalHeight" in source ? source.naturalHeight : source.height
        if (!width || !height) return file

        const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(width * scale)
        canvas.height = Math.round(height * scale)

        const ctx = canvas.getContext("2d")
        if (!ctx) return file
        // Fondo blanco: un PNG con transparencia pasado a JPEG quedaría negro.
        ctx.fillStyle = "#fff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
        if ("close" in source) source.close()

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY))
        // Si por algún motivo salió más pesado, se queda el original.
        if (!blob || blob.size >= file.size) return file

        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg"
        return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() })
    } catch {
        return file
    }
}
