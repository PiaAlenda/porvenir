import { useRef, useState, useEffect } from "react";
import { Clock, FileText, CheckCircle2, BookOpen, Play, X } from "lucide-react";
import { type Career } from "@/config/careerData";

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
    "Operador de PC": "Manejo de herramientas informáticas aplicadas a la administración, incluyendo planillas de cálculo, procesadores de texto y software contable.",
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

interface CareerSyllabusProps {
    career: Career;
}

export const CareerSyllabus = ({ career }: CareerSyllabusProps) => {
    const syllabusList = career.syllabus?.[0]?.subjects || [];
    const sliderRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const el = sliderRef.current;
        if (!el || syllabusList.length <= 1) return;

        const handleScroll = () => {
            const index = Math.round(el.scrollLeft / el.clientWidth);
            setActiveIndex(index);
        };

        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [syllabusList.length]);

    const showDots = syllabusList.length > 1;

    if (syllabusList.length === 0) {
        return (
            <div className="lg:bg-white lg:rounded-2xl lg:border lg:border-stone-200/60 lg:p-8 lg:shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
                    <BookOpen className="w-5 h-5 text-[#4d0706]" />
                    <h3 className="text-sm font-black text-stone-700 tracking-wider uppercase">
                        Ejes de Formación
                    </h3>
                </div>
                <p className="text-sm text-stone-400 italic">Sin ejes de formación disponibles.</p>
            </div>
        );
    }

    return (
        <div className="lg:bg-white lg:rounded-2xl lg:border lg:border-stone-200/60 lg:p-8 lg:shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
                <BookOpen className="w-5 h-5 text-[#4d0706]" />
                <h3 className="text-sm font-black text-stone-700 tracking-wider uppercase">
                    Ejes de Formación
                </h3>
            </div>

            {/* Desktop: 3-column grid */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
                {syllabusList.map((subject: string, idx: number) => {
                    const moduleNum = String(idx + 1).padStart(2, "0");
                    const description = SUBJECT_DESCRIPTIONS[subject] ||
                        `Formación integral y práctica en ${subject.toLowerCase()}, orientada a las necesidades del mercado laboral actual.`;

                    return (
                        <div key={idx} className="border-l-4 border-[#4d0706] pl-4 py-2 space-y-2">
                            <span className="text-[10px] font-black tracking-widest text-[#4d0706]/70 uppercase block">
                                Eje {moduleNum}
                            </span>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">
                                {subject}
                            </h4>
                            <p className="text-xs font-semibold text-stone-500 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Mobile: slider con mismo estilo border-left */}
            <style>{`.ejes-slider::-webkit-scrollbar { display: none; }`}</style>
            <div ref={sliderRef} className="lg:hidden flex overflow-x-auto snap-x snap-mandatory gap-6 ejes-slider" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {syllabusList.map((subject: string, idx: number) => {
                    const moduleNum = String(idx + 1).padStart(2, "0");
                    const description = SUBJECT_DESCRIPTIONS[subject] ||
                        `Formación integral y práctica en ${subject.toLowerCase()}, orientada a las necesidades del mercado laboral actual.`;

                    return (
                        <div key={idx} className="border-l-4 border-[#4d0706] pl-4 py-3 space-y-1.5 w-full shrink-0 snap-start">
                            <span className="text-[9px] font-black tracking-widest text-[#4d0706]/70 uppercase block leading-none">
                                Eje {moduleNum}
                            </span>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight">
                                {subject}
                            </h4>
                            <p className="text-xs font-semibold text-stone-500 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Dots indicator */}
            {showDots && (
                <div className="lg:hidden flex justify-center gap-1.5 mt-4">
                    {syllabusList.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                const el = sliderRef.current;
                                if (el) {
                                    el.scrollTo({ left: el.clientWidth * idx, behavior: "smooth" });
                                }
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer border-none ${
                                idx === activeIndex ? "bg-[#b91c1c] w-3" : "bg-[#b91c1c]/30"
                            }`}
                            aria-label={`Ir al eje ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface CareerDetailsGridProps {
    career: Career;
}

export const CAREER_VIDEOS: Record<string, string> = {
    "tec-mecanica-automotor": "/videos/MECANICA AUTOMOTOR.webm",
    "tec-metalmecanica": "/videos/video metal mecanica.webm",
    "tec-torneria-mecanica": "/videos/torneria mecanica.mp4 OK.webm",
    "tec-dibujo-publicitario": "/videos/video dibujo.mp4 OK.webm",
    "tec-administracion-contable": "/videos/administracion contable.mp4 OK.webm",
    "tec-refrigeracion-aire-acondicionado": "/videos/Refrigeracion.webm",
};

export const ExpandableVideo = ({ src, center }: { src: string; center?: boolean }) => {
    const [open, setOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const fullRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => setVisible(true));
            if (fullRef.current) fullRef.current.play();
        } else {
            setVisible(false);
            if (fullRef.current) {
                fullRef.current.pause();
                fullRef.current.currentTime = 0;
            }
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
                    visible ? "bg-black/80 opacity-100" : "bg-black/0 opacity-0 pointer-events-none"
                }`}
                onClick={() => setOpen(false)}
            >
                <div
                    className={`relative w-full max-w-5xl transition-all duration-300 ${
                        visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
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
                                <source src={src} type="video/webm" />
                            </video>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export const CareerDetailsGrid = ({ career }: CareerDetailsGridProps) => {
    return (
        <div className="w-full">
            {/* DESKTOP LAYOUT (Matches the desktop screenshot exactly) */}
            <div className="hidden lg:grid grid-cols-3 gap-6 w-full">
                {/* Salida Laboral Card */}
                <div className="bg-white rounded-2xl border border-stone-200/60 p-6 lg:p-8 shadow-sm flex flex-col">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-5">
                        Salida Laboral
                    </h4>
                    <ul className="space-y-3.5 flex-1">
                        {career.salidaLaboral.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-[#ffcc00] shrink-0 mt-0.5" />
                                <span className="text-xs font-bold text-stone-700 leading-normal">
                                    {item}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Cronograma de Cursada Card */}
                <div className="bg-white rounded-2xl border border-stone-200/60 p-6 lg:p-8 shadow-sm flex flex-col">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-5">
                        Cronograma de Cursada
                    </h4>
                    <div className="flex items-center gap-4 flex-1">
                        <Clock className="w-6 h-6 text-[#4d0706] shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-stone-800 leading-snug">
                                {career.schedule}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Requisitos Card */}
                <div className="bg-white rounded-2xl border border-stone-200/60 p-6 lg:p-8 shadow-sm flex flex-col">
                    <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-5">
                        Requisitos
                    </h4>
                    <div className="flex items-center gap-4 flex-1">
                        <FileText className="w-6 h-6 text-[#4d0706] shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-stone-800 leading-snug">
                                {career.inscriptionDocs || "Fotocopia de DNI (Original y Copia)"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE LAYOUT (Matches the mobile screenshot exactly) */}
            <div className="lg:hidden space-y-3 w-full">
                {/* Salida Laboral (Mobile Only) */}
                <div className="bg-stone-100/70 rounded-xl p-3 border-l-4 border-[#0b1b33]">
                    <h4 className="text-[10px] font-black text-[#0b1b33] uppercase tracking-widest mb-2">
                        Salida Laboral
                    </h4>
                    <ul className="space-y-2">
                        {career.salidaLaboral.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#c85a17] shrink-0 mt-0.5" />
                                <span className="text-[11px] font-bold text-stone-700 leading-normal">
                                    {item}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Requisitos (Mobile Only) */}
                <div className="bg-stone-100/70 rounded-xl p-3 border-l-4 border-[#0b1b33]">
                    <h4 className="text-[10px] font-black text-[#0b1b33] uppercase tracking-widest mb-2">
                        Requisitos
                    </h4>
                    <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-[#c85a17] shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-stone-700">
                            {career.inscriptionDocs || "Fotocopia de DNI (Original y Copia)"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};