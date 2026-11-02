import { Clock, MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";

const EASE = [0.23, 1, 0.32, 1] as const;

interface LocationInfoProps {
    address: string;
    hours: string;
    phone: string;
    phoneHref: string;
    embedUrl: string;
}

const LocationInfo = ({ address, hours, phone, phoneHref, embedUrl }: LocationInfoProps) => {
    const items = [
        { icon: MapPin, label: "Dirección", value: address },
        { icon: Clock, label: "Horarios", value: hours },
        { icon: Phone, label: "Teléfono", value: phone, href: phoneHref },
    ];

    return (
        <section aria-label="Ubicación y datos de contacto" className="max-w-6xl mx-auto px-6 lg:px-12 pt-10 sm:pt-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            <dl className="flex flex-col gap-10 lg:col-span-5">
                {items.map((it, i) => (
                    <motion.div
                        key={it.label}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
                        className="flex gap-4"
                    >
                        <span className="shrink-0 w-12 h-12 rounded-full bg-[#4d0706]/8 flex items-center justify-center" aria-hidden>
                            <it.icon className="w-5 h-5 text-[#4d0706]" />
                        </span>
                        <div>
                            <dt className="text-base font-semibold text-gray-600">{it.label}</dt>
                            <dd className="mt-1 text-xl font-semibold text-gray-900 leading-snug text-pretty">
                                {it.href ? (
                                    <a
                                        href={it.href}
                                        className="text-gray-900 underline decoration-[#4d0706]/30 underline-offset-4 hover:decoration-[#4d0706] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d0706] rounded"
                                    >
                                        {it.value}
                                    </a>
                                ) : (
                                    it.value
                                )}
                            </dd>
                        </div>
                    </motion.div>
                ))}
            </dl>

            <div className="lg:col-span-7">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: EASE }}
                className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[420px] rounded-3xl overflow-hidden bg-gray-100"
            >
                <iframe
                    title="Mapa con la ubicación de la Sede Central"
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </motion.div>

            </div>
            </div>
        </section>
    );
};

export default LocationInfo;
