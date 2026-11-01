import LegalLayout, { type LegalSection } from "@/components/features/legal/LegalLayout";

const sections: LegalSection[] = [
    {
        title: "Responsable del tratamiento",
        content: (
            <p>
                La Escuela Técnica de Capacitación Laboral N° 917 "Obreros del Porvenir" (San Juan, Argentina) es la responsable de las bases de datos
                generadas a través de este sitio. Para consultas sobre esta política podés escribirnos desde la <a href="#contacto">página de contacto</a>.
            </p>
        ),
    },
    {
        title: "Datos que recopilamos",
        content: (
            <>
                <p>Recopilamos únicamente los datos que nos proporcionás al completar los formularios de inscripción o contacto:</p>
                <ul>
                    <li>Datos de identificación: nombre y apellido, DNI, CUIL, fecha de nacimiento y nacionalidad.</li>
                    <li>Datos de contacto: correo electrónico, teléfono y domicilio / localidad.</li>
                    <li>Datos académicos: carrera o curso elegido, modalidad y estudios previos.</li>
                    <li>Documentación que adjuntes para completar tu inscripción.</li>
                </ul>
            </>
        ),
    },
    {
        title: "Finalidad",
        content: (
            <ul>
                <li>Gestionar tu inscripción, seguimiento académico y administrativo.</li>
                <li>Responder consultas y comunicarnos con vos sobre propuestas formativas.</li>
                <li>Elaborar contratos y constancias vinculados a tu cursada.</li>
                <li>Cumplir obligaciones legales y requerimientos de las autoridades educativas.</li>
            </ul>
        ),
    },
    {
        title: "Cesión y seguridad de los datos",
        content: (
            <p>
                No vendemos ni cedemos tus datos personales a terceros con fines comerciales. Solo podrán ser compartidos con organismos educativos
                o autoridades cuando una norma lo exija, o con proveedores tecnológicos que nos asisten en el alojamiento del sitio, bajo deber de
                confidencialidad. Aplicamos medidas técnicas y organizativas razonables para proteger la información contra accesos no autorizados.
            </p>
        ),
    },
    {
        title: "Tus derechos",
        content: (
            <p>
                De acuerdo con la Ley N° 25.326 de Protección de los Datos Personales, tenés derecho a acceder, rectificar, actualizar y suprimir tus
                datos. Para ejercerlos escribinos desde la <a href="#contacto">página de contacto</a> indicando tu nombre y DNI. La Agencia de Acceso a la
                Información Pública, como órgano de control de la Ley N° 25.326, tiene la atribución de atender denuncias y reclamos relacionados con el
                incumplimiento de las normas de protección de datos personales.
            </p>
        ),
    },
    {
        title: "Conservación",
        content: (
            <p>
                Conservamos los datos mientras mantengas una relación académica con la institución y durante los plazos exigidos por la normativa
                aplicable. Luego serán eliminados o anonimizados.
            </p>
        ),
    },
    {
        title: "Cookies y almacenamiento local",
        content: (
            <p>
                El sitio utiliza almacenamiento local del navegador únicamente para recordar preferencias de uso (por ejemplo, el estado del menú
                flotante) y para mantener la sesión del personal administrativo. No empleamos cookies publicitarias.
            </p>
        ),
    },
    {
        title: "Cambios en esta política",
        content: <p>Podemos actualizar esta política cuando sea necesario. La versión vigente siempre estará disponible en esta página.</p>,
    },
];

const Privacy = ({ onBack }: { onBack: () => void }) => (
    <LegalLayout
        eyebrow="Legal"
        title="Política de"
        highlight="Privacidad"
        intro="Cuidamos tus datos personales. Acá te explicamos qué información recopilamos, para qué la usamos y cómo ejercer tus derechos."
        updated="noviembre de 2026"
        docTitle="Política de Privacidad"
        sections={sections}
        onBack={onBack}
    />
);

export default Privacy;
