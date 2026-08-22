"use client"

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { CAREER_DATA, type Career } from "../../../config/careerData";

const COURSE_IMAGES: Record<string, string> = {
    "curso-danza": "/img/cursos/CURSO DE DANZA.webp",
    "curso-estilismo-moda": "/img/cursos/ESTILISMO DE MODA.webp",
    "curso-franquicia-septiembre": "/img/cursos/franquicia septiembre.webp",
    "curso-higiene-seguridad": "/img/cursos/higiene y seguridad 2 SEPTIEMBRE NUEVO.webp",
    "curso-maquillaje-profesional": "/img/cursos/mAQUILLAJE PROFESIONAL AGOSTO.webp",
    "curso-peinado-profesional": "/img/cursos/peinadp profesional AGOSTO.webp",
    "curso-plomero-cloaquista": "/img/cursos/Plomero cloaquista SEPTIEMBRE.webp",
    "curso-secretariado-administrativo": "/img/cursos/secretariado administrativo.webp",
    "curso-soldadura": "/img/cursos/soldadura SEPTIEMBRE -.webp",
    "curso-instalacion-paneles": "/img/cursos/Instalacion paneles 2026- 2 QR AGOSTO ----.webp",
};

interface ProgramsProps {
    selection: {
        id: string;
        modality: "virtual" | "presencial";
    };
    onViewDetail: (id: string) => void;
}

const ITEMS_PER_PAGE = 6;

// Stored outside component so it persists across mounts/unmounts
let lastSelectionKey: string | null = null;

const Programs = ({ selection, onViewDetail }: ProgramsProps) => {
    const sectionRef = useRef<HTMLElement>(null);
    const [imgError, setImgError] = useState<Record<string, boolean>>({});
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => () => { lastSelectionKey = null; }, []);

    useEffect(() => {
        if (!sectionRef.current) return;
        const selectionKey = `${selection.id}-${selection.modality}`;
        if (lastSelectionKey !== selectionKey) {
            lastSelectionKey = selectionKey;
            setCurrentPage(1);
            const timer = setTimeout(() => {
                sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [selection]);

    const selectedId = selection.id;
    const selectedModality = selection.modality;

    const data: Career[] = Object.values(CAREER_DATA).filter((career) => {
        const matchesCategory = selectedId === "bach"
            ? career.id.startsWith("bachiller") || career.id.includes("adultos")
            : career.id.startsWith("tec");
        const matchesModality = career.modality.toLowerCase().includes(selectedModality.toLowerCase());
        return matchesCategory && matchesModality;
    });

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const paginatedData = data.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const title = selectedModality === "virtual" ? "Cursos" : "Carrera";

    return (
        <motion.section
            ref={sectionRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="site-section bg-white border-t border-gray-100 py-12 lg:py-16"
        >
            <div className="site-container max-w-7xl mx-auto px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

                    <div className="w-full lg:w-1/3">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#4d0706]/10 text-[#4d0706] text-[10px] font-bold uppercase tracking-[0.2em] mb-2 lg:mb-3">
                            Oferta Académica
                        </span>
                        <h2 className="text-2xl lg:text-4xl font-black text-[#4d0706] mt-2 leading-tight">
                            {title}
                        </h2>
                        <p className="text-gray-500 mt-3 font-medium leading-relaxed text-sm max-w-md">
                            Programas diseñados para brindarte las mejores herramientas profesionales en el mercado actual.
                        </p>
                    </div>

                    <div className="w-full lg:w-2/3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPage}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((career) => (
                                            <button
                                                key={career.id}
                                                type="button"
                                                onClick={() => onViewDetail(career.id)}
                                                className="cursor-pointer group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:border-[#4d0706]/30 hover:shadow-lg hover:shadow-[#4d0706]/5 transition-all duration-300 text-center w-full bg-white"
                                            >
                                                {/* Course Image */}
                                                <div className="w-full aspect-[1090/1350] overflow-hidden bg-gray-100">
                                                    {imgError[career.id] || !COURSE_IMAGES[career.id] ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                            <GraduationCap className="w-10 h-10 text-gray-300" />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={COURSE_IMAGES[career.id]}
                                                            alt={career.title}
                                                            onError={() => setImgError(prev => ({ ...prev, [career.id]: true }))}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    )}
                                                </div>

                                                {/* Course Info */}
                                                <div className="flex flex-col items-center gap-1.5 p-3 lg:p-4">
                                                    <h3 className="text-xs lg:text-sm font-black text-gray-800 group-hover:text-[#4d0706] transition-colors leading-tight">
                                                        {career.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-[#333] font-medium text-xs">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{career.duration}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="w-full text-center py-10 bg-gray-50/80 rounded-2xl border border-dashed border-gray-200 col-span-full">
                                            <span className="text-sm text-gray-500 font-medium">
                                                No hay programas disponibles para esta modalidad actualmente.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-6">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`cursor-pointer flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${
                                        currentPage === 1
                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                            : "bg-white text-[#4d0706] border-[#4d0706] hover:bg-[#4d0706] hover:text-white"
                                    }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Anterior
                                </button>
                                
                                <span className="text-xs font-bold text-gray-500">
                                    Página {currentPage} de {totalPages}
                                </span>
                                
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`cursor-pointer flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${
                                        currentPage === totalPages
                                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                            : "bg-[#4d0706] text-white border-[#4d0706] hover:bg-[#3a0504]"
                                    }`}
                                >
                                    Siguiente
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </motion.section>
    );
};

export default Programs;