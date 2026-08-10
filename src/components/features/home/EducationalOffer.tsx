import { useState, useRef, useEffect } from "react";
import { ArrowRight, Laptop, MapPin, CheckCircle } from "lucide-react";

interface EducationalOfferProps {
    onSelectProgram: (id: string | null, modality?: "virtual" | "presencial") => void;
    activeSelection: { id: string; modality: "virtual" | "presencial" } | null;
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

const EducationalOffer = ({ onSelectProgram, activeSelection }: EducationalOfferProps) => {
    const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
    const elementsRef = useRef<(HTMLElement | null)[]>([]);

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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-12">
                    {cards.map((card, idx) => {
                        const isActive = activeSelection?.id === card.id;

                        return (
                            <button
                                key={card.id}
                                data-id={card.id}
                                ref={(el) => { elementsRef.current[idx + 1] = el as HTMLElement; }}
                                onClick={() => {
                                    if (isActive) {
                                        onSelectProgram(null);
                                    } else {
                                        onSelectProgram(card.id, card.defaultModality);
                                    }
                                }}
                                className={`cursor-pointer group relative flex flex-col p-6 sm:p-10 rounded-[2rem] text-left transition-all duration-500 ease-out bg-white border 
                                ${isVisible[card.id] ? "translate-x-0 opacity-100" : (idx === 0 ? "-translate-x-10" : "translate-x-10") + " opacity-0"} 
                                ${isActive ? "border-[#4d0706] ring-4 ring-[#4d0706]/5 shadow-xl" : "border-gray-100 shadow-md hover:shadow-lg"}`}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#4d0706]/5 text-[#4d0706] flex items-center justify-center">
                                            <card.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Modalidad</span>
                                            <h3 className="text-xl font-black text-[#4d0706] leading-none">{card.label}</h3>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-[#ffcc00] text-black rotate-90' : 'bg-[#4d0706] text-white'}`}>
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed line-clamp-2">
                                    {card.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50">
                                    {card.points.map((p, i) => (
                                        <span key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                            <CheckCircle className="w-3 h-3 text-[#ffcc00]" />
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default EducationalOffer;