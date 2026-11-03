import { useEffect, useRef } from "react";

export interface TocItem {
    id: string;
    label: string;
}

import { prefersReducedMotion } from "./useScrollSpy";

interface TocProps {
    items: TocItem[];
    activeId: string;
    onSelect: (id: string) => void;
}

/** Subrayado animado: se dibuja de izquierda a derecha en el ítem activo. */
const Underline = ({ active }: { active: boolean }) => (
    <span
        aria-hidden="true"
        className={`absolute left-0 right-0 -bottom-1 h-0.5 rounded-full bg-[#4d0706] origin-left transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
            active ? "scale-x-100" : "scale-x-0"
        }`}
    />
);

/** Índice lateral (desktop). */
export const LegalSidebarToc = ({ items, activeId, onSelect }: TocProps) => (
    <nav aria-label="Índice de la página" className="hidden lg:block lg:sticky lg:top-8 self-start">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4d0706]/60 mb-4">En esta página</p>
        <ol className="flex flex-col border-l-2 border-[#4d0706]/10">
            {items.map((item, i) => {
                const active = item.id === activeId;
                return (
                    <li key={item.id} className="relative">
                        <span
                            aria-hidden="true"
                            className={`absolute -left-0.5 top-0 bottom-0 w-0.5 bg-[#f5c518] origin-center transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                                active ? "scale-y-100" : "scale-y-0"
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => onSelect(item.id)}
                            aria-current={active ? "true" : undefined}
                            className={`w-full text-left cursor-pointer bg-transparent border-none pl-4 pr-2 py-2.5 text-sm leading-snug transition-colors duration-150 hover:text-[#4d0706] active:scale-[0.98] ${
                                active ? "text-[#4d0706] font-bold" : "text-[#6b7280] font-medium"
                            }`}
                        >
                            <span className="relative inline-block">
                                <span className="tabular-nums opacity-60 mr-1.5">{i + 1}.</span>
                                {item.label}
                                <Underline active={active} />
                            </span>
                        </button>
                    </li>
                );
            })}
        </ol>
    </nav>
);

/** Índice horizontal pegajoso (móvil y tablet). */
export const LegalMobileToc = ({ items, activeId, onSelect }: TocProps) => {
    const scroller = useRef<HTMLDivElement>(null);

    // Mantiene visible el ítem activo dentro de la barra, sin mover la página.
    useEffect(() => {
        const box = scroller.current;
        const btn = box?.querySelector<HTMLElement>(`[data-toc="${activeId}"]`);
        if (!box || !btn) return;
        const left = btn.offsetLeft - box.clientWidth / 2 + btn.clientWidth / 2;
        box.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }, [activeId]);

    return (
        <nav
            aria-label="Índice de la página"
            className="lg:hidden sticky top-0 z-30 bg-[#fcfaf7] border-b border-black/5"
        >
            <div ref={scroller} className="flex gap-1 overflow-x-auto px-4 sm:px-6 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((item, i) => {
                    const active = item.id === activeId;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            data-toc={item.id}
                            onClick={() => onSelect(item.id)}
                            aria-current={active ? "true" : undefined}
                            className={`shrink-0 cursor-pointer bg-transparent border-none px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors duration-150 active:scale-[0.97] ${
                                active ? "text-[#4d0706] font-bold" : "text-[#6b7280] font-medium"
                            }`}
                        >
                            <span className="relative inline-block">
                                {i + 1}. {item.label}
                                <Underline active={active} />
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
