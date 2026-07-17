import { ArrowLeft } from "lucide-react";

interface AboutHeroProps {
    onBack?: () => void;
}

const AboutHero = ({ onBack }: AboutHeroProps) => {
    return (
        <header className="relative py-12 sm:py-24 lg:py-32 overflow-hidden bg-[#4d0706] text-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-[#ffcc00] font-bold text-xs sm:text-sm uppercase tracking-widest mb-8 sm:mb-12 hover:-translate-x-1 transition-transform bg-transparent border-none cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    Volver al inicio
                </button>

                <div className="max-w-3xl">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#ffcc00] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                        Desde 1915
                    </span>
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tighter">
                        Nuestra <br />
                        <span className="text-[#ffcc00]">Trayectoria</span>
                    </h1>
                    <p className="text-base sm:text-xl text-white/70 mt-6 sm:mt-8 font-medium leading-relaxed max-w-2xl">
                        100 años formando profesionales con valores sólidos y excelencia académica en toda la región.
                    </p>
                </div>
            </div>
            <div className="absolute inset-0 opacity-10 z-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke="white" strokeWidth="0.2" />
                    <path d="M0,70 Q25,50 50,70 T100,70" fill="none" stroke="white" strokeWidth="0.2" />
                </svg>
            </div>
        </header>
    );
};

export default AboutHero;