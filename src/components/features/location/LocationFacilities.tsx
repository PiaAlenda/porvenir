import { Check } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.23, 1, 0.32, 1] as const;

interface LocationFacilitiesProps {
    features: string[];
}

const LocationFacilities = ({ features }: LocationFacilitiesProps) => {
    return (
        <section aria-labelledby="instalaciones" className="mt-20 sm:mt-28 bg-[#4d0706]/[0.04]">
            <div className="max-w-6xl mx-auto px-6 lg:px-12 py-14 sm:py-20">
                <h2 id="instalaciones" className="text-3xl sm:text-4xl font-black tracking-tight text-[#4d0706]">
                    Qué vas a encontrar
                </h2>

                <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {features.map((f, i) => (
                        <motion.li
                            key={f}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
                            className="flex items-center gap-3 text-xl font-semibold text-gray-900"
                        >
                            <span className="shrink-0 w-8 h-8 rounded-full bg-[#ffcc00] flex items-center justify-center" aria-hidden>
                                <Check className="w-4 h-4 text-[#4d0706]" strokeWidth={3} />
                            </span>
                            {f}
                        </motion.li>
                    ))}
                </ul>

                <p className="mt-10 text-lg text-gray-700 leading-relaxed max-w-xl">
                    Para inscribirte de forma presencial, traé tu DNI original y una copia.{" "}
                    <a
                        href="#contacto"
                        className="font-semibold text-[#4d0706] underline underline-offset-4 decoration-[#4d0706]/30 hover:decoration-[#4d0706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d0706] rounded"
                    >
                        Escribinos una consulta
                    </a>
                </p>
            </div>
        </section>
    );
};

export default LocationFacilities;
