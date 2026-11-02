import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { LegalMobileToc, LegalSidebarToc } from "./LegalToc";
import { useScrollSpy } from "./useScrollSpy";

export interface LegalSection {
    title: string;
    content: ReactNode;
}

interface LegalLayoutProps {
    title: string;
    highlight: string;
    eyebrow: string;
    intro: string;
    updated?: string;
    docTitle: string;
    sections?: LegalSection[];
    onBack: () => void;
    children?: ReactNode;
}

const DEFAULT_TITLE = "Obreros del Porvenir - Escuela Técnica de Capacitación Laboral N° 917";

/** Aparece suavemente la primera vez que entra en pantalla. */
const Reveal = ({ children }: { children: ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === "undefined") {
            setShown(true);
            return;
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { rootMargin: "0px 0px -8% 0px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 motion-reduce:opacity-100 motion-reduce:translate-y-0"
            }`}
        >
            {children}
        </div>
    );
};

const LegalLayout = ({ title, highlight, eyebrow, intro, updated, docTitle, sections, onBack, children }: LegalLayoutProps) => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = `${docTitle} - Obreros del Porvenir`;
        return () => {
            document.title = DEFAULT_TITLE;
        };
    }, [docTitle]);

    const tocItems = useMemo(() => (sections ?? []).map((s, i) => ({ id: `sec-${i}`, label: s.title })), [sections]);
    const ids = useMemo(() => tocItems.map((t) => t.id), [tocItems]);
    const { activeId, goTo } = useScrollSpy(ids);

    return (
        <div className="min-h-screen bg-[#fcfaf7] flex flex-col">
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

                <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pb-20">
                    <button
                        onClick={onBack}
                        className="flex w-fit items-center gap-2 text-[#ffcc00] font-bold text-xs sm:text-sm uppercase tracking-widest mb-10 sm:mb-14 bg-transparent border-none cursor-pointer p-0 transition-transform duration-200 ease-out hover:-translate-x-1 active:scale-[0.97]"
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                        Volver al inicio
                    </button>

                    <span className="block w-fit px-3 py-1 rounded-full bg-white/10 text-[#ffcc00] text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
                        {eyebrow}
                    </span>
                    <h1 className="text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-7xl font-black tracking-tighter">
                        {title} <span className="text-[#ffcc00] whitespace-nowrap">{highlight}</span>
                    </h1>
                    <p className="text-base sm:text-lg text-white/70 mt-5 sm:mt-6 font-medium leading-relaxed max-w-2xl">{intro}</p>
                    {updated && (
                        <p className="inline-flex items-center gap-2 text-xs text-white/60 mt-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffcc00]" aria-hidden="true" />
                            Última actualización: {updated}
                        </p>
                    )}
                </div>
            </header>

            {sections && <LegalMobileToc items={tocItems} activeId={activeId} onSelect={goTo} />}

            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-16">
                {sections ? (
                    <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
                        <LegalSidebarToc items={tocItems} activeId={activeId} onSelect={goTo} />

                        <div className="flex flex-col gap-5 sm:gap-6 min-w-0">
                            {sections.map((s, i) => (
                                <Reveal key={s.title}>
                                    <section
                                        id={`sec-${i}`}
                                        aria-labelledby={`sec-${i}-title`}
                                        className="scroll-mt-20 lg:scroll-mt-8 bg-white rounded-2xl sm:rounded-3xl border border-black/5 shadow-[0_2px_16px_rgba(77,7,6,0.04)] p-5 sm:p-8"
                                    >
                                        <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                            <span
                                                aria-hidden="true"
                                                className="shrink-0 w-9 h-9 rounded-xl bg-[#4d0706] text-[#ffcc00] text-sm font-black flex items-center justify-center tabular-nums"
                                            >
                                                {i + 1}
                                            </span>
                                            <h2 id={`sec-${i}-title`} className="text-lg sm:text-2xl font-extrabold text-[#4d0706] leading-tight pt-1">
                                                {s.title}
                                            </h2>
                                        </div>
                                        <div className="text-[#374151] leading-relaxed flex flex-col gap-3 text-[15px] sm:text-base sm:pl-[3.25rem] [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:list-none [&_ul]:p-0 [&_li]:relative [&_li]:pl-5 [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.65em] [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:rounded-full [&_li]:before:bg-[#f5c518] [&_a]:text-[#4d0706] [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-semibold [&_a]:break-words">
                                            {s.content}
                                        </div>
                                    </section>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                ) : (
                    children
                )}
            </main>
        </div>
    );
};

export default LegalLayout;
