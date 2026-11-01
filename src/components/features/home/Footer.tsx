import { Phone, Mail, MapPin } from "lucide-react";

const IconFacebook = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const IconInstagram = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
);

const IconLinkedin = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

interface FooterProps {
    onNavigateAbout?: () => void;
}

const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
};

const MAPS_URL =
    "https://www.google.com/maps/place/Escuela+T%C3%A9cnica+de+Capacitaci%C3%B3n+Laboral+N%C2%B0+917+%22Obreros+del+Porvenir%22/@-31.5412373,-68.5362055,17z/data=!3m1!4b1!4m16!1m9!4m8!1m0!1m6!1m2!1s0x96814025cfa112c5:0x6a87c5233dab7f3d!2sEscuela+T%C3%A9cnica+de+Capacitaci%C3%B3n+Laboral+N%C2%B0+917+%22Obreros+del+Porvenir%22,+J5402+San+Juan!2m2!1d-68.5316472!2d-31.5412444!3m5!1s0x96814025cfa112c5:0x6a87c5233dab7f3d!8m2!3d-31.541242!4d-68.5315921!16s%2Fg%2F11fy2lrfsf";

const contactItems = [
    { icon: Phone, text: "Ingresantes: +54 264 581-5111" },
    { icon: Phone, text: "Alumnos: +54 264 581-5111" },
    { icon: Mail, text: "Mail de consultas", href: "#contacto" },
    { icon: MapPin, text: "Avenida Alem, San Juan", href: MAPS_URL, external: true },
];

const legalLinks = [
    { label: "Privacidad", href: "#privacidad" },
    { label: "Términos", href: "#terminos" },
    { label: "Accesibilidad", href: "#accesibilidad" },
];

const socialLinks = [
    { icon: IconFacebook, href: "https://www.facebook.com/EscuelaObrerosdelProvenir", label: "Facebook" },
    { icon: IconInstagram, href: "https://www.instagram.com/obrerosdelporvenir", label: "Instagram" },
    { icon: IconLinkedin, href: "#", label: "LinkedIn" },
];

const Footer = ({ onNavigateAbout }: FooterProps) => {
    const footerLinks: { label: string; onClick: (e: React.MouseEvent) => void }[] = [
        {
            label: "Institucional",
            onClick: (e) => {
                e.preventDefault();
                if (onNavigateAbout) onNavigateAbout();
                else scrollToId("nosotros");
            },
        },
        {
            label: "Carreras",
            onClick: (e) => {
                e.preventDefault();
                scrollToId("academic-offer-section");
            },
        },
        {
            label: "Contacto",
            onClick: (e) => {
                e.preventDefault();
                window.location.hash = "contacto";
            },
        },
    ];

    return (
        <footer className="bg-[#1a1a1a] text-white">
            <div className="site-container py-16 lg:py-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
                    <div className="flex flex-col gap-5">
                        <div className="h-14 w-auto flex items-center">
                            <img
                                src="/icons/escuela.png"
                                alt="Obreros del Porvenir"
                                className="h-10 sm:h-12 w-auto object-contain"
                            />
                        </div>
                        <p className="text-sm text-[#9ca3af] leading-relaxed max-w-[280px]">
                            Más de 100 años formando profesionales comprometidos con la excelencia académica
                            y el desarrollo social.
                        </p>

                        <div className="flex items-center gap-3 mt-1">
                            {socialLinks.map(({ icon: Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center
                                               hover:bg-[#f5c518] hover:text-[#1a1a1a] text-white
                                               transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold tracking-widest uppercase text-[#f5c518] mb-5">
                            Contacto
                        </h4>
                        <ul className="flex flex-col gap-3.5">
                            {contactItems.map(({ icon: Icon, text, href, external }) => (
                                <li key={text} className="flex items-start gap-3 text-sm text-[#9ca3af]">
                                    <Icon className="w-4 h-4 text-[#f5c518] shrink-0 mt-0.5" strokeWidth={1.8} />
                                    {href ? (
                                        <a
                                            href={href}
                                            target={external ? "_blank" : undefined}
                                            rel={external ? "noreferrer" : undefined}
                                            className="leading-snug underline-offset-2 hover:text-white hover:underline transition-colors duration-200">
                                            {text}
                                        </a>
                                    ) : (
                                        <span className="leading-snug">{text}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold tracking-widest uppercase text-[#f5c518] mb-5">
                            Enlaces Rápidos
                        </h4>
                        <ul className="flex flex-col gap-3">
                            {footerLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href="#"
                                        onClick={link.onClick}
                                        className="text-sm text-[#9ca3af] hover:text-white transition-colors duration-200 relative group"
                                    >
                                        {link.label}
                                        <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-[#f5c518] group-hover:w-full transition-all duration-300" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="site-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-[#6b7280]">
                        © {new Date().getFullYear()} Obreros del Porvenir. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-5">
                        {legalLinks.map(({ label, href }) => (
                            <a
                                key={label}
                                href={href}
                                className="text-xs text-[#6b7280] hover:text-white transition-colors duration-200"
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

        </footer>
    );
};

export default Footer;