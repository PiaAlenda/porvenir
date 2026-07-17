import { Clock, MapPin, ArrowLeft, GraduationCap } from "lucide-react";
import { useState } from "react";
import { type Career } from "@/config/careerData";

interface CareerDetailHeroProps {
    career: Career;
    onBack: () => void;
}

function getCareerBadge(id: string) {
    if (id.startsWith("tec-")) return "CARRERA TÉCNICA SUPERIOR";
    if (id.startsWith("bachiller-")) return "EDUCACIÓN SECUNDARIA / BACHILLERATO";
    if (id === "adultos-2000") return "BACHILLERATO ACELERADO";
    return "FORMACIÓN PROFESIONAL";
}

const CareerDetailHero = ({ career, onBack }: CareerDetailHeroProps) => {
    const [imgError, setImgError] = useState(false);

    return (
        <header className="relative min-h-[380px] lg:min-h-[480px] flex items-center overflow-hidden bg-[#4d0706] border-b-4 border-[#ffcc00]">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#4d0706] via-[#4d0706]/95 to-[#4d0706]/80 z-10" />

                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-[0.07] pointer-events-none z-0">
                    {!imgError && (
                        <img
                            src={`/icons/${career.id}.png`}
                            alt=""
                            aria-hidden="true"
                            className="w-72 h-72 lg:w-96 lg:h-96 object-contain"
                        />
                    )}
                </div>
            </div>

            <div className="site-container relative z-20 w-full py-8 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    <div className="lg:col-span-8">
                        <button
                            onClick={onBack}
                            className="inline-flex items-center gap-2 text-[#ffcc00] font-bold text-xs uppercase tracking-widest mb-6 hover:translate-x-[-5px] transition-transform bg-transparent border-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffcc00]"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio
                        </button>

                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-4 lg:hidden">
                            {imgError ? (
                                <GraduationCap className="w-8 h-8 text-[#ffcc00]" />
                            ) : (
                                <img
                                    src={`/icons/${career.id}.png`}
                                    alt={career.title}
                                    onError={() => setImgError(true)}
                                    className="w-8 h-8 object-contain"
                                />
                            )}
                        </div>

                        <h1 className="text-3xl lg:text-6xl font-black text-white leading-tight tracking-tight max-w-3xl">
                            {career.title}
                        </h1>
                        <p className="text-sm lg:text-base text-stone-200 mt-4 max-w-2xl font-medium leading-relaxed">
                            {career.description}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-6">
                            <div className="hidden lg:inline-flex items-center gap-2 bg-[#ffcc00] text-[#4d0706] text-[10px] lg:text-xs font-black tracking-widest px-4 py-2 rounded-xl uppercase whitespace-nowrap">
                                {getCareerBadge(career.id)}
                            </div>
                            <div className="hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
                                <Clock className="w-4 h-4 text-[#ffcc00]" />
                                <span className="text-white font-bold text-xs">{career.duration}</span>
                            </div>
                            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15">
                                <MapPin className="w-4 h-4 text-[#ffcc00]" />
                                <span className="text-white font-bold text-xs">Modalidad {career.modality}</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:col-span-4 lg:flex justify-center lg:justify-end">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-[#ffcc00] opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity duration-500" />

                            <div className="relative w-48 h-48 lg:w-56 lg:h-56 flex items-center justify-center">
                                <svg
                                    viewBox="0 0 100 100"
                                    className="absolute inset-0 w-full h-full text-[#ffcc00] fill-transparent stroke-current stroke-[2.5]"
                                    style={{ filter: "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.4))" }}
                                >
                                    <polygon points="50,3 93,28 93,78 50,97 7,78 7,28" />
                                    <polygon points="50,9 88,31 88,74 50,91 12,74 12,31" className="opacity-40 stroke-[1]" />
                                </svg>

                                {imgError ? (
                                    <GraduationCap className="z-10 w-20 h-20 lg:w-24 lg:h-24 text-[#ffcc00] transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <img
                                        src={`/icons/${career.id}.png`}
                                        alt={career.title}
                                        onError={() => setImgError(true)}
                                        className="z-10 w-28 h-28 lg:w-32 lg:h-32 object-contain transition-transform duration-500 group-hover:scale-110"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default CareerDetailHero;