import { memo, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
    Library, Calendar, Newspaper, MapPin, Users,
    ChevronRight, type LucideIcon
} from "lucide-react";

interface SliderItem {
    text: string;
    href: string;
    icon: LucideIcon;
}

const sliderItems: SliderItem[] = [
    { text: "Nosotros", href: "#nosotros", icon: Users },
    { text: "Biblioteca", href: "#inscripciones", icon: Library },
    { text: "Eventos", href: "#eventos", icon: Calendar },
    { text: "Novedades", href: "#novedades", icon: Newspaper },
    { text: "Sedes", href: "#location", icon: MapPin },
];

interface HeroProps {
    onNavigateAbout?: () => void;
    onNavigateLocation?: () => void;
    onNavigateToProgram?: (id: string, modality: "virtual" | "presencial") => void;
}

const carouselSlides = [
    {
        id: "institucion",
        tag: "Nuestra Institución",
        title: "Tu Futuro está Porvenir",
        description: "Con más de 150 años de excelencia educativa, formamos profesionales que transforman la sociedad.",
        buttonText: "Nuestra Historia",
        href: "#nosotros",
        bgImage: "/img/baner 1 medida nueva nueva 3.jpg.jpeg",
    },
    {
        id: "distancia",
        tag: "Ciclo Lectivo 2027",
        title: "Inscribite Ahora",
        description: "Asegurá tu lugar en la Escuela Superior de Comercio N° 44. Inscripciones abiertas para todas las carreras y cursos.",
        buttonText: "Inscribite ahora",
        href: "#inscripciones",
        bgImage: "/img/seminario.webp",
    },
    {
        id: "carreras",
        tag: "Formación Integral",
        title: "Carreras y Cursos",
        description: "Explorá nuestra oferta académica con carreras de grado y cursos de formación profesional.",
        buttonText: "Ver oferta académica",
        href: "#academic-offer-section",
        bgImage: "/img/baner 3 jpg.jpeg",
    }
];

const Hero = ({ onNavigateAbout, onNavigateLocation, onNavigateToProgram }: HeroProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        setIsLoaded(true);
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 15, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    const handleItemClick = (e: React.MouseEvent, href: string) => {
        e.preventDefault();
        if (href === "#nosotros" && onNavigateAbout) {
            onNavigateAbout();
        } else if (href === "#location" && onNavigateLocation) {
            onNavigateLocation();
        } else if ((href === "#virtual" || href === "#presencial") && onNavigateToProgram) {
            onNavigateToProgram(href === "#virtual" ? "bach" : "tec", href === "#virtual" ? "virtual" : "presencial");
        } else if (href && href.startsWith("#")) {
            const el = document.getElementById(href.replace("#", ""));
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="relative w-full bg-[#050505] overflow-hidden">
            <div className="absolute inset-0 z-0">
                {carouselSlides.map((slide, index) => (
                    index === currentSlide && (
                        <motion.div
                            key={slide.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0"
                        >
                            <img src={slide.bgImage} alt="" className="w-full h-full object-[right_center] sm:object-cover brightness-[0.4]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-black/60" />
                        </motion.div>
                    )
                ))}
            </div>

            <section className="relative z-10 min-h-[50vh] sm:min-h-[60vh] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
                <motion.div
                    key={currentSlide}
                    className="w-full max-w-[90vw] flex flex-col items-center text-center space-y-5 sm:space-y-6 h-[280px] sm:h-[320px] justify-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate={isLoaded ? "visible" : "hidden"}
                >
                    <motion.h1 variants={itemVariants} className="text-5xl sm:text-7xl md:text-8xl font-black text-white leading-[1.1] sm:leading-[0.9] tracking-tighter">
                        <span className="text-gold italic drop-shadow-[0_0_30px_rgba(245,197,24,0.2)]">
                            {carouselSlides[currentSlide].id === "institucion" ? (
                                <>Tu Futuro está <span className="text-[#b91c1c]">Porvenir</span></>
                            ) : carouselSlides[currentSlide].id === "distancia" ? (
                                <>Inscribite <span className="text-[#b91c1c]">Ahora</span></>
                            ) : carouselSlides[currentSlide].id === "carreras" ? (
                                <>Carreras y <span className="text-[#b91c1c]">Cursos</span></>
                            ) : (
                                carouselSlides[currentSlide].title
                            )}
                        </span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="max-w-4xl text-sm sm:text-lg text-white leading-relaxed font-medium px-4">
                        {carouselSlides[currentSlide].description}
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-4 px-4 sm:px-0">
                        <a
                            href={carouselSlides[currentSlide].href || ""}
                            onClick={(e) => handleItemClick(e, carouselSlides[currentSlide].href || "")}
                            className="w-full sm:w-auto h-10 sm:h-12 flex items-center justify-center px-5 bg-[#b91c1c] text-white font-black uppercase tracking-widest text-xs transition-transform active:scale-95 no-underline"
                        >
                            {carouselSlides[currentSlide].buttonText || ""}
                            <ChevronRight className="ml-2 w-3.5 h-3.5" />
                        </a>
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex gap-2.5 justify-center mt-4">
                        {carouselSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? "w-8 bg-gold" : "w-2 bg-white/20 hover:bg-white/40"}`}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            <div className="hidden lg:block relative z-20 w-full bg-white/95 backdrop-blur-md border-t border-gray-100">
                <div className="flex items-center justify-center divide-x divide-gray-100">
                    {sliderItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <a
                                key={index}
                                href={item.href}
                                onClick={(e) => handleItemClick(e, item.href)}
                                className="flex items-center gap-3 px-10 py-6 text-gray-500 hover:text-[#7a0d0b] transition-colors group no-underline"
                            >
                                <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#7a0d0b]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{item.text}</span>
                            </a>
                        );
                    })}
                </div>
            </div>


        </div>
    );
};


export default memo(Hero);