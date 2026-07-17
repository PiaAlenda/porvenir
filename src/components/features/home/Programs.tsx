"use client"

import { useEffect, useRef } from "react";
import { ArrowRight, Monitor, Users, GraduationCap, Clock } from "lucide-react";
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
        <section ref={sectionRef} className="site-section bg-white border-t border-gray-100 animate-fade-up py-16 lg:py-24">
            <div className="site-container max-w-7xl mx-auto px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row gap-12 items-start">

                    <div className="w-full lg:w-1/3">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#4d0706]/10 text-[#4d0706] text-[10px] font-bold uppercase tracking-[0.2em] mb-2 lg:mb-4">
                            Oferta Académica
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-black text-[#4d0706] mt-2 lg:mt-4 leading-tight">
                            {title}
                        </h2>
                        <p className="text-gray-500 mt-4 lg:mt-6 font-medium leading-relaxed text-sm lg:text-base max-w-md">
                            Programas diseñados para brindarte las mejores herramientas profesionales en el mercado actual.
                        </p>
                        <div className="mt-6 lg:mt-8 p-4 lg:p-6 bg-[#4d0706]/5 rounded-3xl border border-[#4d0706]/10 inline-flex items-center gap-3 text-[#4d0706] font-bold text-xs uppercase tracking-widest">
                            {selectedModality === "virtual" ? <Monitor className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                            Modalidad {selectedModality === "virtual" ? "Cursos" : "Carrera"}
                        </div>
                    </div>

                    <div className="w-full lg:w-2/3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                            {data.length > 0 ? (
                                data.map((career) => (
                                    <button
                                        key={career.id}
                                        type="button"
                                        onClick={() => onViewDetail(career.id)}
                                        className="cursor-pointer group flex lg:flex-col items-center lg:items-start justify-between lg:justify-start p-4 lg:p-8 bg-gray-50/50 rounded-2xl lg:rounded-[2rem] border border-gray-100 hover:bg-white hover:border-[#4d0706]/30 hover:shadow-xl hover:shadow-[#4d0706]/5 transition-all duration-300 text-left w-full"
                                    >
                                        <div className="flex items-center lg:items-start gap-4 lg:flex-col lg:w-full lg:justify-between">
                                            <div className="p-2 lg:p-3 bg-white rounded-xl lg:rounded-2xl shadow-sm text-[#4d0706] group-hover:bg-[#4d0706] group-hover:text-white transition-all duration-300">
                                                <GraduationCap className="w-5 h-5 lg:w-6 lg:h-6" />
                                            </div>

                                            <div className="flex-1 lg:mt-6 w-full min-w-0">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h3 className="text-sm lg:text-xl font-black text-gray-800 group-hover:text-[#4d0706] transition-colors leading-tight break-words">
                                                        {career.title}
                                                    </h3>
                                                    <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffcc00]/20 text-[#4d0706] text-[10px] font-black rounded-full tracking-widest shrink-0">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        3
                                                    </span>
                                                </div>
                                                <p className="hidden lg:block text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-3">
                                                    Plan de estudios
                                                </p>
                                            </div>
                                        </div>

                                        <div className="lg:hidden">
                                            <ArrowRight className="w-5 h-5 text-[#4d0706] opacity-30 group-hover:opacity-100 transition-all duration-300" />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="w-full text-center py-12 bg-gray-50/80 rounded-[2rem] border border-dashed border-gray-200 col-span-full">
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