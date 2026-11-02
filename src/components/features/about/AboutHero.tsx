import { useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

interface AboutHeroProps {
    onBack?: () => void;
}

const EASE = [0.23, 1, 0.32, 1] as const;
const DIGITS = ["1", "9", "1", "5"];

const AboutHero = ({ onBack }: AboutHeroProps) => {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    return (
        <header ref={ref} className="relative overflow-hidden bg-[#4d0706] text-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-8 pb-10 sm:pb-16 min-h-[55svh] sm:min-h-[80svh] flex flex-col">
                <button
                    onClick={onBack}
                    className="group self-start inline-flex items-center gap-2 text-[#ffcc00] font-bold text-xs uppercase tracking-widest bg-transparent border-none cursor-pointer p-0 active:scale-[0.97] transition-transform duration-150 ease-out"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform duration-200 ease-out group-hover:-translate-x-1" />
                    Volver al inicio
                </button>

                <motion.div style={{ y, opacity }} className="mt-auto pt-16">
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                        className="text-[#ffcc00] text-xs font-bold uppercase tracking-[0.2em] mb-2"
                    >
                        Nuestra historia
                    </motion.p>

                    <h1
                        aria-label="1915"
                        className="flex font-black leading-[0.85] tracking-normal select-none text-[clamp(6.5rem,39vw,17rem)]"
                    >
                        {DIGITS.map((d, i) => (
                            <span key={i} aria-hidden className="overflow-hidden inline-block pb-[0.08em] pr-[0.03em]">
                                <motion.span
                                    initial={{ y: "105%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.8, ease: EASE, delay: 0.15 + i * 0.07 }}
                                    className={`inline-block ${i === 3 ? "text-[#ffcc00]" : "text-white"}`}
                                >
                                    {d}
                                </motion.span>
                            </span>
                        ))}
                    </h1>
                </motion.div>
            </div>
        </header>
    );
};

export default AboutHero;
