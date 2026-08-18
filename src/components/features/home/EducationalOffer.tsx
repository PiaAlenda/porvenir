import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Laptop, MapPin, CheckCircle, GraduationCap, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { CAREER_DATA } from "../../../config/careerData";

interface EducationalOfferProps {
    onViewDetail: (id: string) => void;
    activeSelection: { id: string; modality: "virtual" | "presencial" } | null;
    onSelectProgram?: (id: string | null, modality?: "virtual" | "presencial") => void;
}

const cards = [
    {
        id: "bach",
        label: "Cursos",
        title: "Secundario y Terciario",
        description: "Modalidad a distancia para jóvenes y adultos. Estudiá a tu ritmo desde donde estés.",
        points: ["Plataforma 24/7", "Títulos oficiales"],
        animClass: "animate-slide-left",
        defaultModality: "virtual" as const,
        icon: Laptop,
    },
    {
        id: "tec",
        label: "Carrera",
        title: "Oferta Presencial",
        description: "Clases en nuestra sede con un entorno colaborativo y profesores especializados.",
        points: ["Atención personalizada", "Prácticas"],
        animClass: "animate-slide-right",
        defaultModality: "presencial" as const,
        icon: MapPin,
    },
];

const COURSE_IMAGES: Record<string, string> = {
    "curso-danza": "/img/cursos/CURSO DE DANZA.jpg.jpeg",
    "curso-estilismo-moda": "/img/cursos/ESTILISMO DE MODA.jpg.jpeg",
    "curso-franquicia-septiembre": "/img/cursos/franquicia septiembre.jpg.jpeg",
    "curso-higiene-seguridad": "/img/cursos/higiene y seguridad 2 SEPTIEMBRE NUEVO.jpg.jpeg",
    "curso-maquillaje-profesional": "/img/cursos/mAQUILLAJE PROFESIONAL AGOSTO.jpg.jpeg",
    "curso-peinado-profesional": "/img/cursos/peinadp profesional AGOSTO.jpg.jpeg",
    "curso-plomero-cloaquista": "/img/cursos/Plomero cloaquista SEPTIEMBRE.jpg.jpeg",
    "curso-secretariado-administrativo": "/img/cursos/secretariado administrativo.jpg.jpeg",
    "curso-soldadura": "/img/cursos/soldadura SEPTIEMBRE -.jpg.jpeg",
    "curso-instalacion-paneles": "/img/cursos/Instalacion paneles 2026- 2 QR AGOSTO ----.jpg.jpeg",
};

const COURSES_PER_PAGE = 6;

let lastOfferSelectionKey: string | null = null;

const EducationalOffer = ({ onViewDetail, activeSelection, onSelectProgram }: EducationalOfferProps) => {
    const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
    const [expandedCard, setExpandedCard] = useState<string | null>(activeSelection?.id ?? null);
    const [selectedModality, setSelectedModality] = useState<"virtual" | "presencial">(activeSelection?.modality ?? "virtual");
    const [imgError, setImgError] = useState<Record<string, boolean>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const expandedRef = useRef<HTMLDivElement>(null);
    
    const elementsRef = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        if (activeSelection) {
            setExpandedCard(activeSelection.id);
            setSelectedModality(activeSelection.modality);
            setCurrentPage(1);

            const selectionKey = `${activeSelection.id}-${activeSelection.modality}`;
            if (lastOfferSelectionKey !== selectionKey) {
                lastOfferSelectionKey = selectionKey;
                const timer = setTimeout(() => {
                    expandedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [activeSelection]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute("data-id") || "";
                        setIsVisible((prev) => ({ ...prev, [id]: true }));
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        elementsRef.current.forEach((el) => el && observer.observe(el));
        return () => {
            elementsRef.current.forEach((el) => el && observer.unobserve(el));
        };
    }, []);

    const handleCardClick = (cardId: string, defaultMod: "virtual" | "presencial") => {
        setCurrentPage(1);
        if (expandedCard === cardId) {
            setExpandedCard(null);
            if (onSelectProgram) onSelectProgram(null);
        } else {
            setExpandedCard(cardId);
            setSelectedModality(defaultMod);
            if (onSelectProgram) onSelectProgram(cardId, defaultMod);
        }
    };

    return (
        <section className="bg-[#fcfaf7] py-12 sm:py-24 w-full overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-12">
                <header
                    className={`mb-10 sm:mb-16 transition-all duration-700 ${isVisible["header"] ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                    data-id="header"
                    ref={(el) => { elementsRef.current[0] = el; }}
                >
                    <span className="inline-block px-3 py-1 rounded-full bg-[#4d0706]/10 text-[#4d0706] text-[10px] font-bold uppercase tracking-widest mb-4">
                        Oferta Académica
                    </span>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <h2 className="text-3xl sm:text-6xl font-black text-[#4d0706] leading-none">
                            Elegí tu<br className="hidden sm:block" /> Modalidad
                        </h2>
                        <div className="max-w-xs">
                            <p className="text-gray-500 text-xs sm:text-base font-medium">
                                Seleccioná una categoría para ver los cursos.
                            </p>
                        </div>
                    </div>
                </header>

                {/* 2 Columns Grid: Cursos on the Left, Carrera on the Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-12">
                    {cards.map((card, idx) => {
                        const isExpanded = expandedCard === card.id;

                        return (
                            <div
                                key={card.id}
                                data-id={card.id}
                                ref={(el) => { elementsRef.current[idx + 1] = el as HTMLElement; }}
                                className={`${isVisible[card.id] ? "translate-x-0 opacity-100" : (idx === 0 ? "-translate-x-10" : "translate-x-10") + " opacity-0"} transition-all duration-500 col-span-1`}
                            >
                                <button
                                    onClick={() => handleCardClick(card.id, card.defaultModality)}
                                    className={`cursor-pointer group relative flex flex-col p-6 sm:p-10 rounded-[2rem] text-left transition-all duration-500 ease-out bg-white border w-full
                                    ${isExpanded ? "border-[#4d0706] ring-4 ring-[#4d0706]/5 shadow-xl animate-pulse-subtle" : "border-gray-100 shadow-md hover:shadow-lg"}`}
                                >
                                    <div className="flex items-center justify-between mb-6 w-full">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#4d0706]/5 text-[#4d0706] flex items-center justify-center">
                                                <card.icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Modalidad</span>
                                                <h3 className="text-xl font-black text-[#4d0706] leading-none">{card.label}</h3>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-[#ffcc00] text-black rotate-90' : 'bg-[#4d0706] text-white'}`}>
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed line-clamp-2">
                                        {card.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50 w-full">
                                        {card.points.map((p, i) => (
                                            <span key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                                <CheckCircle className="w-3 h-3 text-[#ffcc00]" />
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Unified dropdown container below the 2 columns */}
                {expandedCard && (
                    <div ref={expandedRef} className="mt-8 sm:mt-12 w-full transition-all duration-500 ease-out animate-fade-in">
                        {(() => {
                            const activeCard = cards.find(c => c.id === expandedCard);
                            if (!activeCard) return null;

                            const isCursos = activeCard.id === "bach";

                            const filteredCourses = Object.values(CAREER_DATA).filter((career) => {
                                if (isCursos) {
                                    return career.category === "curso-presencial" || career.category === "curso-virtual";
                                }
                                const matchesCategory = career.id.startsWith("tec");
                                const matchesModality = career.modality.toLowerCase().includes(selectedModality.toLowerCase());
                                return matchesCategory && matchesModality;
                            }).sort((a, b) => {
                                if (isCursos) {
                                    const aIsPresencial = a.category === "curso-presencial" ? 0 : 1;
                                    const bIsPresencial = b.category === "curso-presencial" ? 0 : 1;
                                    return aIsPresencial - bIsPresencial;
                                }
                                return 0;
                            });

                            const displayTitle = isCursos ? "Cursos" : "Carreras Presenciales";

                            const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
                            const paginatedCourses = filteredCourses.slice(
                                (currentPage - 1) * COURSES_PER_PAGE,
                                currentPage * COURSES_PER_PAGE
                            );

                            return (
                                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-6 sm:p-12 bg-white rounded-[2rem] border border-gray-100 shadow-md">
                                    
                                    {/* Left Info Column */}
                                    <div className="w-full lg:w-1/3 flex flex-col justify-between">
                                        <div>
                                            <span className="inline-block px-3 py-1 rounded-full bg-[#4d0706]/10 text-[#4d0706] text-[10px] font-bold uppercase tracking-[0.2em] mb-2 lg:mb-3">
                                                Oferta Académica
                                            </span>
                                            <h3 className="text-2xl lg:text-4xl font-black text-[#4d0706] mt-2 leading-tight">
                                                {displayTitle}
                                            </h3>
                                            <p className="text-gray-500 mt-3 font-medium leading-relaxed text-sm max-w-md">
                                                Programas diseñados para brindarte las mejores herramientas profesionales en el mercado actual.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Courses Grid */}
                                    <div className="w-full lg:w-2/3">
                                        {isCursos ? (
                                            /* Image Grid for Cursos Presenciales and Online */
                                            <>
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={currentPage}
                                                        initial={{ opacity: 0, x: 40 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -40 }}
                                                        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                                    >
                                                    {paginatedCourses.length > 0 ? (
                                                        paginatedCourses.map((career) => (
                                                            <button
                                                                key={career.id}
                                                                type="button"
                                                                onClick={() => onViewDetail(career.id)}
                                                                className="cursor-pointer group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:border-[#4d0706]/30 hover:shadow-lg hover:shadow-[#4d0706]/5 transition-all duration-300 text-center w-full bg-white"
                                                            >
                                                                {/* Course Image */}
                                                                <div className="w-full aspect-[1090/1350] overflow-hidden bg-gray-100">
                                                                    {imgError[career.id] ? (
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
                                                                No hay cursos disponibles para esta modalidad actualmente.
                                                            </span>
                                                        </div>
                                                    )}
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
                                            </>
                                        ) : (
                                            /* Original Icon Grid for Carreras Presenciales */
                                            <>
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={currentPage}
                                                        initial={{ opacity: 0, x: 40 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -40 }}
                                                        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                                                    >
                                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
                                                            {paginatedCourses.length > 0 ? (
                                                                paginatedCourses.map((career) => (
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
                                            </>
                                        )}
                                    </div>

                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </section>
    );
};

export default EducationalOffer;
