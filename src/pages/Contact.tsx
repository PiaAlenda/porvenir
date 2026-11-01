import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, Clock, MapPin, MessageCircle, Navigation, Phone, Send } from "lucide-react";
import LegalLayout from "@/components/features/legal/LegalLayout";
import { api } from "@/api";
const MAPS_URL =
    "https://www.google.com/maps/place/Escuela+T%C3%A9cnica+de+Capacitaci%C3%B3n+Laboral+N%C2%B0+917+%22Obreros+del+Porvenir%22/@-31.5412373,-68.5362055,17z/data=!3m1!4b1!4m16!1m9!4m8!1m0!1m6!1m2!1s0x96814025cfa112c5:0x6a87c5233dab7f3d!2sEscuela+T%C3%A9cnica+de+Capacitaci%C3%B3n+Laboral+N%C2%B0+917+%22Obreros+del+Porvenir%22,+J5402+San+Juan!2m2!1d-68.5316472!2d-31.5412444!3m5!1s0x96814025cfa112c5:0x6a87c5233dab7f3d!8m2!3d-31.541242!4d-68.5315921!16s%2Fg%2F11fy2lrfsf";
const WHATSAPP_URL = "https://wa.me/542645815111?text=" + encodeURIComponent("Hola, quisiera hacer una consulta.");

const channels = [
    { icon: Phone, label: "Teléfono", value: "+54 264 581-5111", href: "tel:+542645815111" },
    { icon: MapPin, label: "Dirección", value: "Avenida Alem, San Juan", href: MAPS_URL },
    { icon: Clock, label: "Horario de atención", value: "Lunes a Viernes de 18:00 a 22:30 hs", href: undefined },
];

const field =
    "w-full rounded-xl border border-gray-200 bg-[#fcfaf7] px-4 py-3.5 text-[15px] text-[#1a1a1a] placeholder:text-gray-400 transition-[border-color,box-shadow,background-color] duration-150 ease-out focus:outline-none focus:bg-white focus:border-[#4d0706] focus:ring-4 focus:ring-[#4d0706]/10";

const Contact = ({ onBack }: { onBack: () => void }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
    const [error, setError] = useState("");
    const [website, setWebsite] = useState(""); // campo trampa anti-bots

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (status === "sending") return;
        setStatus("sending");
        setError("");
        try {
            await api.enviarContacto({ nombre: name.trim(), email: email.trim(), mensaje: message.trim(), website });
            setStatus("sent");
            setName("");
            setEmail("");
            setMessage("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "No pudimos enviar tu consulta. Probá de nuevo.");
            setStatus("error");
        }
    };

    return (
        <LegalLayout
            eyebrow="Estamos para ayudarte"
            title="Ponete en"
            highlight="Contacto"
            intro="Escribinos, llamanos o visitanos. Te respondemos lo antes posible."
            docTitle="Contacto"
            onBack={onBack}
        >
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 lg:gap-8 items-start">
                {/* Canales */}
                <aside className="lg:pr-4">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#4d0706] mb-1">Datos de contacto</h2>
                    <p className="text-sm text-gray-500 mb-6">Elegí el canal que te quede más cómodo.</p>

                    <ul className="flex flex-col gap-1 -mx-2">
                        {channels.map(({ icon: Icon, label, value, href }) => {
                            const inner = (
                                <>
                                    <span className="w-11 h-11 shrink-0 rounded-xl bg-[#4d0706] text-[#ffcc00] flex items-center justify-center">
                                        <Icon className="w-5 h-5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">{label}</span>
                                        <span className="block font-semibold text-[15px] leading-snug text-[#1a1a1a] break-words">{value}</span>
                                    </span>
                                    {href && (
                                        <ArrowUpRight
                                            className="w-4 h-4 shrink-0 text-gray-300 transition-[transform,color] duration-200 ease-out group-hover:text-[#4d0706] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                            aria-hidden="true"
                                        />
                                    )}
                                </>
                            );
                            const row = "group flex items-center gap-4 rounded-xl px-2 py-3";
                            return (
                                <li key={label}>
                                    {href ? (
                                        <a
                                            href={href}
                                            target={href.startsWith("http") ? "_blank" : undefined}
                                            rel={href.startsWith("http") ? "noreferrer" : undefined}
                                            className={`${row} transition-colors duration-150 hover:bg-[#4d0706]/5 active:scale-[0.99]`}
                                        >
                                            {inner}
                                        </a>
                                    ) : (
                                        <div className={row}>{inner}</div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 mt-7">
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#4d0706] text-white font-bold text-sm px-5 py-3.5 no-underline transition-[transform,background-color] duration-150 ease-out hover:bg-[#6b0a09] active:scale-[0.97]"
                        >
                            <MessageCircle className="w-4 h-4" aria-hidden="true" />
                            WhatsApp
                        </a>
                        <a
                            href={MAPS_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#4d0706]/25 text-[#4d0706] font-bold text-sm px-5 py-3.5 no-underline transition-[transform,background-color] duration-150 ease-out hover:bg-[#4d0706]/5 active:scale-[0.97]"
                        >
                            <Navigation className="w-4 h-4" aria-hidden="true" />
                            Cómo llegar
                        </a>
                    </div>
                </aside>

                {/* Formulario */}
                {status === "sent" ? (
                    <div role="status" className="rounded-2xl sm:rounded-3xl bg-white border border-black/5 shadow-[0_2px_16px_rgba(77,7,6,0.05)] p-8 sm:p-12 flex flex-col items-center text-center gap-3">
                        <CheckCircle2 className="w-12 h-12 text-[#4d0706]" aria-hidden="true" />
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#4d0706]">¡Consulta enviada!</h2>
                        <p className="text-sm text-gray-500 max-w-sm">Gracias por escribirnos. Te vamos a responder al correo que indicaste lo antes posible.</p>
                        <button type="button" onClick={() => setStatus("idle")} className="mt-3 rounded-full border border-[#4d0706]/25 bg-transparent text-[#4d0706] font-bold text-sm px-6 py-3 cursor-pointer transition-[transform,background-color] duration-150 ease-out hover:bg-[#4d0706]/5 active:scale-[0.97]">
                            Enviar otra consulta
                        </button>
                    </div>
                ) : (
                <form
                    onSubmit={handleSubmit}
                    className="relative rounded-2xl sm:rounded-3xl bg-white border border-black/5 shadow-[0_2px_16px_rgba(77,7,6,0.05)] p-6 sm:p-8 flex flex-col gap-5"
                >
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#4d0706]">Envianos tu consulta</h2>
                        <p className="text-sm text-gray-500 mt-1">Completá el formulario y te escribimos a la brevedad.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="c-name" className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                                Nombre y apellido
                            </label>
                            <input
                                id="c-name"
                                required
                                autoComplete="name"
                                placeholder="María Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={field}
                            />
                        </div>
                        <div>
                            <label htmlFor="c-email" className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                                Correo electrónico
                            </label>
                            <input
                                id="c-email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="tu@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={field}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="c-msg" className="block text-sm font-semibold text-[#1a1a1a] mb-2">
                            Mensaje
                        </label>
                        <textarea
                            id="c-msg"
                            required
                            rows={6}
                            placeholder="Contanos en qué podemos ayudarte…"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={`${field} resize-y min-h-32`}
                        />
                    </div>

                    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                        <label htmlFor="c-web">No completar este campo</label>
                        <input id="c-web" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </div>

                    <button
                        type="submit"
                        disabled={status === "sending"}
                        className="w-full sm:w-fit sm:self-start inline-flex items-center justify-center gap-2 rounded-full bg-[#4d0706] text-white font-bold text-sm px-8 py-3.5 cursor-pointer border-none disabled:opacity-60 disabled:cursor-wait transition-[transform,background-color] duration-150 ease-out hover:bg-[#6b0a09] active:scale-[0.97]"
                    >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        {status === "sending" ? "Enviando…" : "Enviar consulta"}
                    </button>

                    {status === "error" && (
                        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            {error}
                        </p>
                    )}

                    <p className="text-xs text-gray-500 leading-relaxed">
                        Tus datos se tratan según nuestra{" "}
                        <a href="#privacidad" className="font-semibold text-[#4d0706] underline underline-offset-2">
                            Política de Privacidad
                        </a>
                        .
                    </p>
                </form>
                )}
            </div>
        </LegalLayout>
    );
};

export default Contact;
