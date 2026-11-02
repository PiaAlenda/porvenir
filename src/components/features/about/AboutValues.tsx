import { motion } from "framer-motion";

const EASE = [0.23, 1, 0.32, 1] as const;

const values = [
    { title: "Excelencia", desc: "Calidad educativa constante." },
    { title: "Inclusión", desc: "Educación para todos los sectores." },
    { title: "Integridad", desc: "Honestidad y transparencia." },
];

const AboutValues = () => {
    return (
        <section className="bg-[#4d0706] text-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-12 py-20 sm:py-28">
                <p className="text-[#ffcc00] text-xs font-bold uppercase tracking-[0.2em] mb-12 sm:mb-16">
                    Valores
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10">
                    {values.map((v, i) => (
                        <motion.div
                            key={v.title}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
                            className="group relative py-8 md:py-0 md:pt-8"
                        >
                            <motion.span
                                aria-hidden
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true, margin: "-80px" }}
                                transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
                                className="absolute top-0 left-0 h-px w-full origin-left bg-white/30"
                            />
                            <span className="block text-sm font-bold tabular-nums text-[#ffcc00]">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <h3 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight transition-transform duration-300 ease-out md:group-hover:translate-x-2">
                                {v.title}
                            </h3>
                            <p className="mt-3 text-white/60 font-medium">{v.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <p className="mt-16 sm:mt-24 text-sm text-white/50 max-w-md leading-relaxed">
                    Títulos con validez nacional y respaldo del Ministerio de Educación.
                </p>
            </div>
        </section>
    );
};

export default AboutValues;
