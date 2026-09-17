# Templates oficiales del contrato

Esta carpeta conserva las plantillas PDF oficiales de la escuela como respaldo.

## Archivos

- `CONTRATOS CARRERAS 2026.pdf` — plantilla original (sin rellenar), con logos e imágenes de la institución.
- `CONTRATOS CARRERAS 2026_FILLABLE.pdf` — versión con campos AcroForm generada por `scripts/crear-contrato-fillable.mjs`.
- `contrato-fields.json` — ancho de cada campo (`FECHA`, `NOMBRE`, `DNI`, `DOMICILIO`, etc.) usado por el relleno AcroForm.

## Estado actual

El contrato **no** se genera con estas plantillas. Desde el panel Admin el botón "Contrato" genera el PDF en el navegador con `@react-pdf/renderer` a partir de los datos del alumno (ver `src/pdf/`). Estas plantillas se conservan únicamente como documentación oficial en caso de que se quiera volver a generar la versión con la plantilla original en el servidor.