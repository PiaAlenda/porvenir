import { useRef, useState, useEffect } from "react";
import { Clock, FileText, CheckCircle2, BookOpen } from "lucide-react";
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
    "Taller Integrador": "Integración práctica de conocimientos en proyectos reales de taller metalmecánico.",
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