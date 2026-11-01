import LegalLayout, { type LegalSection } from "@/components/features/legal/LegalLayout";

const sections: LegalSection[] = [
    {
        title: "Nuestro compromiso",
        content: (
            <p>
                En Obreros del Porvenir creemos que la educación debe ser para todas las personas. Trabajamos para que este sitio sea accesible,
                tomando como referencia las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 nivel AA y la Ley N° 26.653 de Accesibilidad
                de la Información en las Páginas Web.
            </p>
        ),
    },
    {
        title: "Medidas implementadas",
        content: (
            <ul>
                <li>Estructura de encabezados y regiones semánticas para facilitar la navegación con lectores de pantalla.</li>
                <li>Textos alternativos en imágenes informativas.</li>
                <li>Navegación mediante teclado, con indicadores de foco visibles.</li>
                <li>Contraste de color suficiente entre texto y fondo en los contenidos principales.</li>
                <li>Diseño adaptable a distintos tamaños de pantalla y compatible con el zoom del navegador.</li>
                <li>Video explicativo del formulario de inscripción con subtítulos.</li>
            </ul>
        ),
    },
    {
        title: "Atajos de teclado útiles",
        content: (
            <ul>
                <li><strong>Tab / Shift + Tab:</strong> avanzar o retroceder entre enlaces, botones y campos.</li>
                <li><strong>Enter o Espacio:</strong> activar el elemento seleccionado.</li>
                <li><strong>Ctrl + / Ctrl −:</strong> aumentar o reducir el tamaño del texto (Cmd en Mac).</li>
            </ul>
        ),
    },
    {
        title: "Limitaciones conocidas",
        content: (
            <p>
                Estamos mejorando de forma continua. Algunos contenidos, como imágenes de flyers o documentos subidos por terceros, pueden no ser
                totalmente accesibles. Si encontrás una barrera, queremos saberlo para corregirla.
            </p>
        ),
    },
    {
        title: "Ayuda y comentarios",
        content: (
            <p>
                Si tenés dificultades para usar el sitio, necesitás información en otro formato o querés hacernos llegar una sugerencia, escribinos desde la{" "}
                <a href="#contacto">página de contacto</a> o llamanos al +54 264 581-5111. También
                podés realizar tu inscripción de forma presencial en nuestra sede.
            </p>
        ),
    },
];

const Accessibility = ({ onBack }: { onBack: () => void }) => (
    <LegalLayout
        eyebrow="Inclusión"
        title="Declaración de"
        highlight="Accesibilidad"
        intro="Queremos que todas las personas puedan informarse e inscribirse sin barreras."
        updated="noviembre de 2026"
        docTitle="Accesibilidad"
        sections={sections}
        onBack={onBack}
    />
);

export default Accessibility;
