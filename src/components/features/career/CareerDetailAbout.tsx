import { useMemo, useRef, useState, useEffect, type ReactNode } from "react";
import { Check, FileText, GraduationCap, IdCard, Play, X } from "lucide-react";
import { type Career } from "@/config/careerData";
import { parseRequisitos } from "@/lib/requisitos";

// Detailed mapping of subject descriptions to make the syllabus look complete and professional
const SUBJECT_DESCRIPTIONS: Record<string, string> = {
    // Mecánica del Automotor
    "Funcionamiento de un Motor": "Estudio de los principios termodinámicos y mecánicos del motor de combustión interna, sus componentes y ciclos de funcionamiento.",
    "Puesta a Punto": "Técnicas de ajuste y calibración de motores para optimizar rendimiento, consumo y emisiones según especificaciones del fabricante.",
    "Distribuciones": "Análisis de sistemas de distribución variable, sincronización de válvulas y mantenimiento de componentes del tren valvular.",
    "Inyección Electrónica": "Diagnóstico y reparación de sistemas de inyección electrónica, sensores, actuadores y unidades de control del motor (ECU).",
    // Metalmecánica
    "Herramientas de Corte": "Estudio de cinemática de corte, materiales de herramientas y optimización de vida útil.",
    "Procesos de Soldadura": "Técnicas avanzadas MIG, TIG y arco sumergido para estructuras de alta exigencia.",
    "Procesos Siderúrgicos": "Metalurgia extractiva, fundición y laminación de aleaciones industriales.",
    "Taller Integrador": "Integración práctica de conocimientos en proyectos reales de taller, combinando técnicas aprendidas en un entorno profesional.",
    // Tornería Mecánica
    "Mecanizado de Piezas Metálicas y No Metálicas": "Estudio de técnicas de mecanizado en torno para el trabajo con materiales ferrosos, no ferrosos y sintéticos, incluyendo selección de velocidades, avances y herramientas de corte.",
    "Desbaste": "Técnicas de desbaste de materiales mediante arranque de viruta, uso de herramientas de corte y ajuste de parámetros de mecanizado para lograr formas y dimensiones preliminares.",
    "Pulidos": "Métodos de pulido y acabado superficial de piezas mecanizadas, empleando abrasivos, lijas y compuestos para obtener tolerancias y rugosidades específicas.",
    "Conos": "Procedimientos para el torneado de conos y superficies cónicas, cálculo de conicidad, uso de desplazamiento del carro superior y métodos de copiado.",
    "Roscas": "Técnicas de roscado interior y exterior en torno, identificación de perfiles de rosca, cálculos de paso y profundidad, y verificación con calibres.",
    "Soldadura": "Procesos de soldadura eléctrica y oxiacetilénica aplicados a la unión de piezas metálicas, incluyendo preparación de bordes, selección de electrodos y control de calidad.",
    // Dibujo Publicitario
    "Dibujo Artístico": "Fundamentos del dibujo artístico, trazo, proporción, composición y técnicas de representación visual aplicadas a la comunicación gráfica.",
    "Figura Humana": "Estudio anatómico y proporcional de la figura humana, técnicas de encaje, canon y expresión del movimiento en el dibujo.",
    "Técnicas de Sombreado y Pintado": "Métodos de sombreado, degradado, claroscuro y pintado con diferentes herramientas y soportes tradicionales y digitales.",
    "Programas de Diseño": "Dominio de software de diseño gráfico vectorial y edición de imágenes para la producción de piezas visuales profesionales.",
    "Creación de Piezas Gráficas": "Desarrollo de piezas de comunicación visual como afiches, folletos, banners, identidad corporativa y contenido para redes sociales.",
    // Programación
    "Algoritmos": "Fundamentos de lógica de programación y resolución de problemas algorítmicos complejos.",
    "Bases de Datos": "Diseño, modelado e implementación de bases de datos relacionales y no relacionales.",
    "Web I": "Desarrollo de interfaces web responsivas utilizando estándares modernos de HTML, CSS y JavaScript.",
    // Marketing
    "Marketing Estratégico": "Análisis de mercado, posicionamiento de marca y definición de públicos objetivos.",
    "Social Media": "Gestión profesional de comunidades online, creación de contenido y optimización de perfiles.",
    "Publicidad": "Planificación y ejecución de campañas publicitarias pagas en plataformas de búsqueda y redes.",
    // Administración
    "Administración I": "Principios básicos de organización, planificación y control dentro de la empresa.",
    "Contabilidad": "Registro de operaciones financieras, balances y análisis contable de las organizaciones.",
    "RH": "Administración del capital humano, relaciones laborales y compensaciones.",
    // Administración Contable
    "Auxiliar Administrativo": "Formación en tareas administrativas de oficina, archivo, atención al cliente, comunicación interna y manejo de documentación comercial y contable.",
    "Liquidación de Sueldos": "Cálculo y confección de recibos de sueldo, cargas sociales, aportes patronales, convenios colectivos y presentación de declaraciones juradas.",
    "Ofimática": "Manejo de herramientas ofimáticas aplicadas a la administración, incluyendo planillas de cálculo, procesadores de texto y software contable.",
    "Introducción a la Contabilidad": "Principios contables básicos, registración de operaciones, libro diario, libro mayor y confección de balances.",
    "Liquidación de Impuestos": "Régimen impositivo nacional y provincial, cálculo y presentación de IVA, ganancias, ingresos brutos y demás tributos.",
    "Administración de Comercios": "Gestión integral de comercios y PYMES, control de stock, facturación, costos, presupuestos y atención al proveedor.",
    // Diseño
    "Diseño I": "Fundamentos de composición visual, teoría del color y comunicación gráfica efectiva.",
    "Tipografía": "Estudio del diseño y uso de fuentes tipográficas para mejorar la legibilidad y estética visual.",
    "Herramientas Digitales": "Dominio del software estándar de la industria para diseño vectorial y edición de imágenes.",
    // Enfermería
    "Anatomía": "Estudio estructural del cuerpo humano y sus diferentes sistemas biológicos.",
    "Salud Pública": "Políticas sanitarias, epidemiología y prevención de enfermedades en la comunidad.",
    "Enfermería I": "Técnicas de cuidado básico del paciente y procedimientos asistenciales de enfermería.",
    // Higiene y Seguridad
    "Seguridad I": "Normativas de seguridad e higiene industrial para prevención de accidentes laborales.",
    "Legislación": "Marco legal laboral, leyes de riesgos del trabajo y responsabilidades civiles.",
    "Higiene Industrial": "Evaluación y control de factores ambientales que pueden afectar la salud del trabajador.",
    // Recursos Humanos
    "Selección": "Procesos de reclutamiento, de entrevistas y selección del talento idóneo.",
    "Capacitación": "Diagnóstico de necesidades, diseño y ejecución de planes de formación corporativa.",
    "Derecho Laboral": "Estudio del marco regulatorio de las relaciones de trabajo y convenios colectivos.",
    // Bachilleratos y generales
    "Historia": "Análisis del desarrollo histórico de las sociedades humanas y sus transformaciones.",
    "Sociología": "Comprensión de las dinámicas sociales, grupales e institucionales modernas.",
    "Economía": "Principios de micro y macroeconomía orientados al entendimiento del mercado global.",
    "Filosofía": "Indagación del pensamiento crítico, ética y corrientes filosóficas fundamentales.",
    "Literatura": "Análisis y apreciación de las obras cumbres literarias y estilos de redacción.",
    "Historia del Arte": "Recorrido de la evolución de las artes visuales y movimientos estéticos en la historia.",
    "Biología": "Estudio del origen, evolución y funciones vitales de los seres vivos.",
    "Química": "Estructura de la materia, reacciones químicas básicas y su aplicación en la vida cotidiana.",
    "Física": "Leyes fundamentales de la naturaleza, mecánica, energía y su relación con el entorno.",
    "Lengua": "Comprensión lectora, gramática, oratoria y habilidades de comunicación escrita.",
    "Matemática": "Álgebra elemental, geometría, análisis de datos y resolución de problemas lógicos.",
    "Ciencias Naturales": "Estudio multidisciplinar del ecosistema, recursos de la Tierra y conservación ambiental."
};

/**
 * Bloque de contenido de la página: título a la izquierda y contenido a la
 * derecha, separados por una línea. Reemplaza a las tarjetas: menos cajas,
 * más aire útil y una lectura de arriba hacia abajo.
 */
export const CareerSection = ({
    title,
    index = 0,
    children,
}: {
    title: string;
    index?: number;
    children: ReactNode;
}) => (
    <section
        className="reveal grid gap-4 py-8 first:pt-0 last:pb-0 md:grid-cols-[8.5rem_minmax(0,1fr)] md:gap-8"
        style={{ "--i": index } as React.CSSProperties}
    >
        <h3 className="self-start text-sm font-black uppercase tracking-[0.12em] text-[#4d0706] md:sticky md:top-6 md:pt-0.5">
            {title}
            <span className="mt-2 block h-1 w-9 rounded-full bg-[#ffcc00]" aria-hidden="true" />
        </h3>
        <div>{children}</div>
    </section>
);

const CheckList = ({ items }: { items: string[] }) => (
    <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[15px] font-medium leading-snug text-stone-700">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4d0706]">
                    <Check className="h-3 w-3 text-[#ffcc00]" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
            </li>
        ))}
    </ul>
);

export const CareerSyllabus = ({ career, index = 0 }: { career: Career; index?: number }) => {
    /* Un bloque por año; los años sin ejes no se muestran. */
    const years = useMemo(
        () => (career.syllabus || []).filter((entry) => (entry.subjects || []).length > 0),
        [career.syllabus],
    );
    /* Con un solo año el rótulo sería ruido: se muestra la lista sin encabezado. */
    const showYear = years.length > 1;

    return (
        <CareerSection title="Ejes de formación" index={index}>
            {years.length === 0 ? (
                <p className="text-sm italic text-stone-400">Sin ejes de formación disponibles.</p>
            ) : (
                <div className="space-y-10">
                    {years.map((entry, yearIdx) => (
                        <div key={`${entry.year}-${yearIdx}`}>
                            {showYear && (
                                <div className="mb-5 flex items-center gap-3">
                                    <h4 className="rounded-md bg-[#ffcc00] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-[#4d0706]">
                                        {entry.year}
                                    </h4>
                                    <span className="h-px flex-1 bg-stone-200" aria-hidden="true" />
                                </div>
                            )}
                            <ol className="divide-y divide-stone-200">
                                {entry.subjects.map((subject, idx) => {
                                    const description = SUBJECT_DESCRIPTIONS[subject.trim()];
                                    return (
                                        <li key={idx} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                                            <span className="w-7 shrink-0 text-lg font-black leading-none tabular-nums text-[#4d0706]">
                                                {String(idx + 1).padStart(2, "0")}
                                            </span>
                                            <div className="min-w-0">
                                                <h4 className="text-[15px] font-extrabold leading-snug text-stone-900">
                                                    {subject}
                                                </h4>
                                                {description && (
                                                    <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                                                        {description}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    ))}
                </div>
            )}
        </CareerSection>
    );
};

export const CareerOutcomes = ({ career, index = 0 }: { career: Career; index?: number }) => {
    if (!career.salidaLaboral?.length) return null;
    return (
        <CareerSection title="Salida laboral" index={index}>
            <CheckList items={career.salidaLaboral} />
        </CareerSection>
    );
};

const requisitoIcon = (item: string) => {
    const t = item.toLowerCase();
    if (t.includes("dni")) return IdCard;
    if (t.includes("anal")) return GraduationCap;
    return FileText;
};

export const CareerRequirements = ({ career, index = 0 }: { career: Career; index?: number }) => {
    /* Los requisitos salen de lo que se cargó en el panel (uno por línea). */
    const requisitos = useMemo(() => parseRequisitos(career.inscriptionDocs), [career.inscriptionDocs]);
    return (
        <CareerSection title="Requisitos" index={index}>
            <ul className="grid gap-3 sm:grid-cols-2">
                {requisitos.map((item, idx) => {
                    const Icon = requisitoIcon(item);
                    return (
                        <li
                            key={idx}
                            className="flex items-center gap-3 border-l-4 border-[#ffcc00] bg-white py-3 pl-4 pr-3"
                        >
                            <Icon className="h-6 w-6 shrink-0 text-[#4d0706]" aria-hidden="true" />
                            <span className="text-[15px] font-extrabold text-stone-900">{item}</span>
                        </li>
                    );
                })}
            </ul>
        </CareerSection>
    );
};

export { CAREER_VIDEOS } from "@/config/careerVideos";

/**
 * El tipo sale de la extensión. Estaba fijo en `video/webm`, así que un
 * archivo mp4 cargado desde el admin se reproducía con el codec equivocado.
 */
function videoMimeFor(src: string): string {
    const ext = src.split("?")[0].split(".").pop()?.toLowerCase() || "";
    if (ext === "mp4") return "video/mp4";
    if (ext === "ogv" || ext === "ogg") return "video/ogg";
    return "video/webm";
}

export const ExpandableVideo = ({ src, center }: { src: string; center?: boolean }) => {
    const [open, setOpen] = useState(false);
    const fullRef = useRef<HTMLVideoElement>(null);

    /*
     * El modal nunca se desmonta, siempre está en el árbol: por eso la
     * transición de `opacity-0` a `opacity-100` funciona sin necesidad de un
     * estado `visible` que se setease en un effect (y que provocaba un render
     * en cascada). Acá solo se maneja el `<video>`, que sí es un sistema
     * externo al que hay que imperarle play/pause.
     */
    useEffect(() => {
        const el = fullRef.current;
        if (!el) return;
        if (open) {
            el.play();
        } else {
            el.pause();
            el.currentTime = 0;
        }
    }, [open]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        if (open) document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open]);

    return (
        <>
            <div className={`mt-3 space-y-1.5 ${center ? "flex flex-col items-center" : ""}`}>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                    Video explicativo de la carrera
                </p>
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 text-[11px] font-black text-[#4d0706] bg-stone-100 hover:bg-stone-200 border border-stone-200/60 px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer"
                >
                    <Play className="w-3.5 h-3.5 fill-[#4d0706]" />
                    Ver video
                </button>
            </div>

            <div
                className={`fixed inset-0 z-[999] flex items-center justify-center p-4 transition-all duration-300 ${
                    open ? "bg-black/80 opacity-100" : "bg-black/0 opacity-0 pointer-events-none"
                }`}
                onClick={() => setOpen(false)}
            >
                <div
                    className={`relative w-full max-w-5xl transition-all duration-300 ${
                        open ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="relative">
                            <video
                                ref={fullRef}
                                controls
                                className="w-full rounded-xl shadow-2xl max-h-[70vh]"
                            >
                                <source src={src} type={videoMimeFor(src)} />
                            </video>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
