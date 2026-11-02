import { useRef } from "react";
import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useSpring,
    useVelocity,
} from "framer-motion";

const SPEED = 0.14; // px por ms (~140 px/s)

interface MarqueeProps {
    items: string[];
}

/** Cinta infinita: avanza sola, cambia de lado según el scroll y se puede arrastrar. */
const Marquee = ({ items }: MarqueeProps) => {
    const reduce = useReducedMotion();
    const x = useMotionValue(0);
    const setRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const dir = useRef(1); // 1 = izquierda, -1 = derecha

    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });

    useAnimationFrame((_, delta) => {
        if (dragging.current) return;
        const w = setRef.current?.offsetWidth ?? 0;
        if (!w) return;

        const vel = smoothVelocity.get();
        if (!reduce && vel < -20) dir.current = -1;
        else if (!reduce && vel > 20) dir.current = 1;

        // Con "reducir movimiento": deriva lenta, sin efecto de scroll.
        const boost = reduce ? 0.7 : 1 + Math.min(Math.abs(vel) / 400, 3);
        let v = x.get() - dir.current * delta * SPEED * boost;
        // Los sets son idénticos, así que el salto es invisible.
        if (v <= -w) v += w;
        if (v > 0) v -= w;
        x.set(v);
    });

    return (
        <div
            aria-hidden
            className="overflow-hidden bg-[#ffcc00] text-[#4d0706] py-5 sm:py-7 cursor-grab active:cursor-grabbing select-none"
            style={{ touchAction: "pan-y" }}
        >
            <motion.div
                className="flex w-max"
                style={{ x }}
                drag="x"
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => (dragging.current = true)}
                onDragEnd={() => (dragging.current = false)}
            >
                {[0, 1, 2, 3].map((k) => (
                    <div key={k} ref={k === 0 ? setRef : undefined} className="flex shrink-0">
                        {items.map((t, i) => (
                            <span key={i} className="flex items-center text-3xl sm:text-5xl font-black uppercase tracking-tight whitespace-nowrap">
                                {t}
                                <span className="mx-6 sm:mx-10 text-xl sm:text-3xl">✦</span>
                            </span>
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default Marquee;
