"use client"

import { useEffect, useRef, useState } from "react";
import { GraduationCap, Clock } from "lucide-react";
import { CAREER_DATA, type Career } from "../../../config/careerData";

interface ProgramsProps {
    selection: {
        id: string;
        modality: "virtual" | "presencial";
    } | null;
    onViewDetail: (id: string) => void;
}

// Stored outside component so it persists across mounts/unmounts
let lastSelectionKey: string | null = null;

const Programs = ({ selection, onViewDetail }: ProgramsProps) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [imgError, setImgError] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!selection || !sectionRef.current) return;
        const selectionKey = `${selection.id}-${selection.modality}`;
        if (lastSelectionKey !== selectionKey) {
            lastSelectionKey = selectionKey;
            const timer = setTimeout(() => {
                sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [selection]);

    if (!selection) return null;

    const selectedId = selection.id;
    const selectedModality = selection.modality;

    const data: Career[] = Object.values(CAREER_DATA).filter((career) => {
        const matchesCategory = selectedId === "bach"
            ? career.id.startsWith("bachiller") || career.id.includes("adultos")
            : career.id.startsWith("tec");
        const matchesModality = career.modality.toLowerCase().includes(selectedModality.toLowerCase());
        return matchesCategory && matchesModality;
    });

    const title = selectedModality === "virtual" ? "Cursos" : "Carrera";

    return (
        <section ref={sectionRef} className="site-section bg-white border-t border-gray-100 animate-fade-up py-12 lg:py-16">
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
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
                            {data.length > 0 ? (
                                data.map((career) => (
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
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Programs;