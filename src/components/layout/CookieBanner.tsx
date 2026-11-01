import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "cookieConsent";

type Consent = "all" | "necessary";

const readConsent = (): Consent | null => {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === "all" || v === "necessary" ? v : null;
    } catch {
        return null;
    }
};

interface CookieBannerProps {
    /** Oculta el aviso (por ejemplo en el panel de administración y el login). */
    hidden?: boolean;
}

const CookieBanner = ({ hidden = false }: CookieBannerProps) => {
    const [needsAnswer, setNeedsAnswer] = useState(() => readConsent() === null);
    const [visible, setVisible] = useState(false);

    // Pequeña espera para no competir con la carga inicial, y para que la entrada se anime.
    useEffect(() => {
        if (!needsAnswer) return;
        const t = window.setTimeout(() => setVisible(true), 900);
        return () => window.clearTimeout(t);
    }, [needsAnswer]);

    const answer = (value: Consent) => {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch {
            /* sin almacenamiento: se oculta igual durante la sesión */
        }
        setVisible(false);
        // Se desmonta una vez terminada la salida.
        window.setTimeout(() => setNeedsAnswer(false), 250);
    };

    if (!needsAnswer || hidden) return null;

    return (
        <div
            role="dialog"
            aria-label="Aviso de cookies"
            aria-hidden={!visible}
            className={`fixed z-[110] bottom-28 left-4 right-4 sm:left-6 sm:right-auto sm:w-[400px] lg:bottom-6 rounded-2xl bg-[#1a1a1a] text-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-white/10 transition-[opacity,transform] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                visible ? "opacity-100 translate-y-0 duration-300" : "opacity-0 translate-y-4 pointer-events-none duration-200"
            }`}
        >
            <div className="flex items-start gap-3">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-[#ffcc00]/15 text-[#ffcc00] flex items-center justify-center">
                    <Cookie className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="font-bold text-[15px] mb-1">Usamos cookies</p>
                    <p className="text-[13px] text-white/70 leading-relaxed">
                        Guardamos información en tu navegador para recordar tus preferencias y mantener el sitio funcionando. Al aceptar, confirmás
                        que leíste nuestros{" "}
                        <a href="#terminos" className="text-[#ffcc00] font-semibold underline underline-offset-2">
                            Términos y Condiciones
                        </a>{" "}
                        y la{" "}
                        <a href="#privacidad" className="text-[#ffcc00] font-semibold underline underline-offset-2">
                            Política de Privacidad
                        </a>
                        .
                    </p>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 mt-4">
                <button
                    type="button"
                    onClick={() => answer("necessary")}
                    className="flex-1 rounded-full border border-white/25 bg-transparent text-white font-bold text-[13px] px-4 py-2.5 cursor-pointer transition-[transform,background-color] duration-150 ease-out hover:bg-white/10 active:scale-[0.97]"
                >
                    Solo necesarias
                </button>
                <button
                    type="button"
                    onClick={() => answer("all")}
                    className="flex-1 rounded-full border-none bg-[#ffcc00] text-[#1a1a1a] font-bold text-[13px] px-4 py-2.5 cursor-pointer transition-[transform,background-color] duration-150 ease-out hover:bg-[#ffd633] active:scale-[0.97]"
                >
                    Aceptar
                </button>
            </div>
        </div>
    );
};

export default CookieBanner;
