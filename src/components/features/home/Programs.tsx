"use client"

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { CAREER_DATA, type Career } from "../../../config/careerData";

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
                                                className="cursor-pointer group flex flex-col items-center gap-1.5 lg:gap-2 p-2.5 lg:p-5 bg-gray-50/50 rounded-xl lg:rounded-2xl border border-gray-100 hover:bg-white hover:border-[#4d0706]/30 hover:shadow-lg hover:shadow-[#4d0706]/5 transition-all duration-300 text-center w-full lg:bg-white lg:border-gray-200"
                                            >
                                                {/* Icon */}
                                                <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-white shadow-sm text-[#4d0706] flex items-center justify-center overflow-hidden shrink-0">
                                                    {imgError[career.id] ? (
                                                        <GraduationCap className="w-4 h-4 lg:w-6 lg:h-6" />
                                                    ) : (
                                                        <img
                                                            src={`/icons/${career.id}.png`}
                                                            alt={career.title}
                                                            onError={() => setImgError(prev => ({ ...prev, [career.id]: true }))}
                                                            className="w-full h-full object-cover rounded-full"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-center gap-1 lg:gap-1.5">
                                                    <h3 className="text-[11px] lg:text-sm font-black text-gray-800 group-hover:text-[#4d0706] transition-colors leading-tight break-words">
                                                        {career.title}
                                                    </h3>
                                                    
                                                    {/* Mobile Duration */}
                                                    <span className="text-[9px] font-bold text-[#4d0706]/60 bg-[#4d0706]/5 px-2 py-0.5 rounded-full leading-none lg:hidden">
                                                        {career.duration}
                                                    </span>
                                                    
                                                    {/* Desktop Duration */}
                                                    <div className="hidden lg:flex items-center gap-1.5 text-[#333] font-medium text-[14px]">
                                                        <Clock className="w-[18px] h-[18px]" />
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