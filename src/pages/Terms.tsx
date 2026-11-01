import LegalLayout, { type LegalSection } from "@/components/features/legal/LegalLayout";

const sections: LegalSection[] = [
    {
        title: "Aceptación de los términos",
        content: (
            <p>
                Al acceder y utilizar este sitio web aceptás estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, te pedimos que
                no utilices el sitio.
            </p>
        ),
    },
    {
        title: "Objeto del sitio",
        content: (
            <p>
                El sitio brinda información sobre la oferta académica de la Escuela Técnica de Capacitación Laboral N° 917 "Obreros del Porvenir" y
                permite realizar pre-inscripciones y consultas. La información publicada tiene carácter informativo y puede modificarse sin previo aviso.
            </p>
        ),
    },
    {
        title: "Pre-inscripción",
        content: (
            <ul>
                <li>Completar el formulario no garantiza una vacante: la inscripción se confirma una vez validada la documentación y cumplidos los requisitos de cada propuesta.</li>
                <li>Los cupos, aranceles, fechas de inicio y modalidades pueden variar según cada carrera o curso.</li>
                <li>Los datos que ingreses deben ser verdaderos, completos y actualizados. Sos responsable de su exactitud.</li>
            </ul>
        ),
    },
    {
        title: "Uso adecuado",
        content: (
            <>
                <p>Te comprometés a no:</p>
                <ul>
                    <li>Suministrar datos falsos o suplantar la identidad de otra persona.</li>
                    <li>Intentar acceder sin autorización a áreas restringidas o vulnerar la seguridad del sitio.</li>
                    <li>Usar el sitio para fines ilícitos, o enviar contenido malicioso, ofensivo o masivo no solicitado.</li>
                </ul>
            </>
        ),
    },
    {
        title: "Propiedad intelectual",
        content: (
            <p>
                Los textos, logotipos, imágenes, videos y demás contenidos del sitio pertenecen a la institución o se utilizan con autorización de sus
                titulares. Queda prohibida su reproducción o uso comercial sin consentimiento previo y por escrito.
            </p>
        ),
    },
    {
        title: "Limitación de responsabilidad",
        content: (
            <p>
                Procuramos que la información sea correcta y que el sitio esté disponible de forma continua, pero no garantizamos la ausencia de
                errores ni interrupciones. La institución no será responsable por daños derivados del uso del sitio o de enlaces a sitios de terceros.
            </p>
        ),
    },
    {
        title: "Protección de datos",
        content: (
            <p>
                El tratamiento de tus datos personales se rige por nuestra <a href="#privacidad">Política de Privacidad</a>.
            </p>
        ),
    },
    {
        title: "Modificaciones",
        content: (
            <p>
                Podemos modificar estos términos en cualquier momento. Los cambios entran en vigencia desde su publicación en esta página.
            </p>
        ),
    },
    {
        title: "Ley aplicable y contacto",
        content: (
            <p>
                Estos términos se rigen por las leyes de la República Argentina. Ante cualquier controversia, serán competentes los tribunales
                ordinarios de la ciudad de San Juan. Consultas: <a href="#contacto">la página de contacto</a>.
            </p>
        ),
    },
];

const Terms = ({ onBack }: { onBack: () => void }) => (
    <LegalLayout
        eyebrow="Legal"
        title="Términos y"
        highlight="Condiciones"
        intro="Estas son las reglas básicas para usar nuestro sitio y gestionar tu pre-inscripción."
        updated="noviembre de 2026"
        docTitle="Términos y Condiciones"
        sections={sections}
        onBack={onBack}
    />
);

export default Terms;
