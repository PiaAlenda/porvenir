import { ArrowLeft, ArrowUpRight, Phone } from "lucide-react";
import { motion } from "framer-motion";

interface LocationHeaderProps {
    onBack?: () => void;
    address: string;
    mapsUrl: string;
    phone: string;
    phoneHref: string;
}

const EASE = [0.23, 1, 0.32, 1] as const;

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcc00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4d0706]";

const LocationHeader = ({ onBack, address, mapsUrl, phone, phoneHref }: LocationHeaderProps) => {
    return (
        <header className="relative overflow-hidden bg-[#4d0706] text-white">
          <div
              aria-hidden="true"
              className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-[#ffcc00]/10 blur-3xl pointer-events-none"
          />
          <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
          >
              <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke="white" strokeWidth="0.2" />
              <path d="M0,70 Q25,50 50,70 T100,70" fill="none" stroke="white" strokeWidth="0.2" />
          </svg>
          <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 pt-8 pb-14 sm:pb-20">
            <button
                onClick={onBack}
                className={`group inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-lg text-[#ffcc00] font-semibold text-base bg-transparent border-none cursor-pointer active:scale-[0.97] transition-transform duration-150 ease-out ${focusRing}`}
            >
                <ArrowLeft className="w-5 h-5 transition-transform duration-200 ease-out group-hover:-translate-x-1" aria-hidden />
                Volver al inicio
            </button>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="mt-10 sm:mt-14"
            >
                <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.02] text-white text-balance">
                    Sede Central
                </h1>
                <p className="mt-5 text-xl sm:text-2xl text-white/80 leading-relaxed">{address}</p>

                <div className="mt-8 flex flex-wrap gap-3">
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#ffcc00] text-[#4d0706] text-base font-semibold no-underline hover:bg-[#ffd633] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-out ${focusRing}`}
                    >
                        Cómo llegar
                        <ArrowUpRight className="w-5 h-5" aria-hidden />
                        <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                    <a
                        href={phoneHref}
                        className={`inline-flex items-center gap-2 h-12 px-6 rounded-full border-2 border-white/30 text-white text-base font-semibold no-underline hover:border-white active:scale-[0.97] transition-[transform,border-color] duration-150 ease-out ${focusRing}`}
                    >
                        <Phone className="w-5 h-5" aria-hidden />
                        <span className="sr-only">Llamar al </span>
                        {phone}
                    </a>
                </div>
            </motion.div>
          </div>
        </header>
    );
};

export default LocationHeader;
