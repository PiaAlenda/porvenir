import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import Marquee from "@/components/ui/Marquee";

const EASE = [0.23, 1, 0.32, 1] as const;

const statements = [
    "Más de 100 años de trayectoria.",
    "Docentes de primer nivel.",
    "Talleres a la altura del mercado.",
    "Egresados que se destacan en su oficio.",
];

const pillars = [
    {
        id: "mision",
        title: "Misión",
        text: "Formar profesionales técnicos capaces de liderar procesos administrativos y tecnológicos con ética y responsabilidad social.",
    },
    {
        id: "vision",
        title: "Visión",
        text: "Ser la institución referente en formación técnico-comercial, reconocida por su innovación pedagógica y su impacto en la comunidad.",
    },
];

const marqueeItems = ["Obreros del Porvenir", "Desde 1915", "Escuela Técnica N° 917"];

/** Línea que se ilumina a medida que se scrollea. */
const Statement = ({ children }: { children: string }) => {
    const ref = useRef<HTMLParagraphElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.45"] });
    const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);
    const x = useTransform(scrollYProgress, [0, 1], [24, 0]);

    return (
        <motion.p
            ref={ref}
            style={{ opacity, x }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-[#4d0706] text-balance"
        >
            {children}
        </motion.p>
    );
};

/** Palabra que se ilumina según el progreso del scroll. */
const Word = ({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) => {
    const opacity = useTransform(progress, range, [0.18, 1]);
    return (
        <motion.span style={{ opacity }} className="inline-block mr-[0.28em]">
            {word}
        </motion.span>
    );
};

const Pillar = ({ index, title, text }: { index: number; title: string; text: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.3"] });
    const words = text.split(" ");

    return (
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 py-12 sm:py-16 border-t border-[#4d0706]/15 first:border-t-0">
            <div className="lg:col-span-5">
                <span className="text-sm font-bold tabular-nums text-[#4d0706]/50">0{index + 1}</span>
                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="text-6xl sm:text-8xl font-black tracking-tight text-[#4d0706] leading-none"
                >
                    {title}
                </motion.h2>
            </div>
            <p className="lg:col-span-7 text-2xl sm:text-3xl font-bold leading-snug text-gray-900 lg:pt-6">
                {words.map((w, i) => {
                    const start = (i / words.length) * 0.8;
                    return <Word key={i} word={w} progress={scrollYProgress} range={[start, start + 0.2]} />;
                })}
            </p>
        </div>
    );
};

const Pillars = () => (
    <section className="max-w-6xl mx-auto px-6 lg:px-12 py-16 sm:py-24">
        {pillars.map((p, i) => (
            <Pillar key={p.id} index={i} title={p.title} text={p.text} />
        ))}
    </section>
);

const AboutHistory = () => {
    return (
        <>
            <section className="max-w-6xl mx-auto px-6 lg:px-12 py-24 sm:py-36 space-y-6 sm:space-y-10">
                {statements.map((s) => (
                    <Statement key={s}>{s}</Statement>
                ))}
            </section>

            <Marquee items={marqueeItems} />
            <Pillars />
        </>
    );
};

export default AboutHistory;
