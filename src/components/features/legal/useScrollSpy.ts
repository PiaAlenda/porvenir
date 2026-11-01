import { useCallback, useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Devuelve el id de la sección que está "bajo la línea de lectura" (≈ 30% desde
 * arriba). Se calcula en scroll con rAF en vez de IntersectionObserver para que
 * también funcione bien con secciones cortas y al llegar al final de la página.
 */
export function useScrollSpy(ids: string[]) {
    const [activeId, setActiveId] = useState(ids[0] ?? "");
    const lockUntil = useRef(0);

    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            // Mientras dura el scroll disparado por un click, se respeta el destino elegido.
            if (performance.now() < lockUntil.current) return;
            const line = window.innerHeight * 0.3;
            let current = ids[0];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= line) current = id;
            }
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
            if (atBottom) current = ids[ids.length - 1];
            setActiveId(current);
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [ids]);

    const goTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        setActiveId(id);
        lockUntil.current = performance.now() + 900;
        el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }, []);

    return { activeId, goTo };
}
