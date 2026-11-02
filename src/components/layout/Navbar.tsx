import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Briefcase, ChevronDown, Clock, GraduationCap, History, MapPin, Menu,
    Search, User, X, type LucideIcon
} from "lucide-react";
import { type Career } from "@/config/careerData";
import { getImageFor, getCareers, useSiteConfig } from "@/siteConfig";

interface NavbarProps {
    onNavigateHome?: () => void;
    onNavigateToProgram?: (id: string, modality: "virtual" | "presencial") => void;
    onNavigateToAbout?: () => void;
    onNavigateToLocation?: () => void;
    onNavigateToLogin?: () => void;
    onScrollToSection?: (sectionId: string) => void;
    onNavigateToDetail?: (id: string) => void;
    showSearchBanner?: boolean;
}

interface MenuItem {
    label: string;
    description?: string;
    icon: LucideIcon;
    action: () => void;
}

const SCROLL_THRESHOLD = 150;

const Navbar = ({
    onNavigateHome,
    onNavigateToProgram,
    onNavigateToAbout,
    onNavigateToLocation,
    onNavigateToLogin,
    onScrollToSection,
    onNavigateToDetail,
    showSearchBanner = true,
}: NavbarProps) => {
    const { config } = useSiteConfig();
    const headerRef = useRef<HTMLElement | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showDesktopResults, setShowDesktopResults] = useState(false);
    const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
    const [imgError, setImgError] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const onScroll = () => {
            setIsScrolled(window.scrollY >= SCROLL_THRESHOLD);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
                setOpenMenu(null);
                setShowDesktopResults(false);
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpenMenu(null);
                setShowDesktopResults(false);
                setSearchOverlayOpen(false);
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const mq = window.matchMedia("(min-width: 1024px)");
        const onChange = () => {
            if (mq.matches) setMobileMenuOpen(false);
        };
        mq.addEventListener("change", onChange);
        return () => {
            document.body.style.overflow = prev;
            mq.removeEventListener("change", onChange);
        };
    }, [mobileMenuOpen]);

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
        setMobileCategoriesOpen(false);
    };

    const closeMenus = () => {
        setOpenMenu(null);
        setShowDesktopResults(false);
    };

    const toggleMenu = (menu: string) => {
        setOpenMenu((prev) => (prev === menu ? null : menu));
        setShowDesktopResults(false);
    };

    const results = useMemo<Career[]>(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return getCareers(config)
            .filter(
                (c) =>
                    c.title.toLowerCase().includes(q) ||
                    c.description.toLowerCase().includes(q)
            )
            .slice(0, 6);
    }, [searchQuery, config]);

    const selectCareer = (id: string) => {
        setSearchQuery("");
        setShowDesktopResults(false);
        setSearchOverlayOpen(false);
        closeMenus();
        onNavigateToDetail?.(id);
    };

    const goToOffer = () => {
        setSearchQuery("");
        setShowDesktopResults(false);
        setSearchOverlayOpen(false);
        closeMenus();
        onScrollToSection?.("academic-offer-section");
    };

    const categoriaItems: MenuItem[] = [
        {
            label: "Carreras",
            description: "Oferta presencial de formación profesional",
            icon: Briefcase,
            action: () => {
                closeMenus();
                onNavigateToProgram?.("tec", "presencial");
            },
        },
        {
            label: "Cursos",
            description: "Secundario, terciario y cursos de formación",
            icon: GraduationCap,
            action: () => {
                closeMenus();
                onNavigateToProgram?.("bach", "virtual");
            },
        },
    ];

    const institucionalItems: MenuItem[] = [
        {
            label: "Nuestra Historia",
            description: "Trayectoria e identidad institucional",
            icon: History,
            action: () => {
                closeMenus();
                onNavigateToAbout?.();
            },
        },
        {
            label: "Sede",
            description: "Ubicación y cómo llegar",
            icon: MapPin,
            action: () => {
                closeMenus();
                onNavigateToLocation?.();
            },
        },
    ];

    const renderDropdown =(menu: string, items: MenuItem[]) => (
        <AnimatePresence>
            {openMenu === menu && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 top-full pt-2 z-50"
                >
                    <div className="w-60 rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 p-2">
                        {items.map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={item.action}
                                className="group flex items-start gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#4d0706]/5 text-left cursor-pointer"
                            >
                                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#4d0706]/5 text-[#4d0706] group-hover:bg-[#4d0706] group-hover:text-white transition-colors flex-shrink-0">
                                    <item.icon className="w-4 h-4" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-bold text-gray-800 group-hover:text-[#4d0706] transition-colors">
                                        {item.label}
                                    </span>
                                    {item.description && (
                                        <span className="block text-[11px] text-gray-400 font-medium mt-0.5 leading-snug">
                                            {item.description}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const renderResultsList = () => {
        if (searchQuery.trim().length === 0) {
            return (
                <div className="p-6 text-center">
                    <Search className="w-7 h-7 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">
                        Escribí para buscar carreras y cursos.
                    </p>
                </div>
            );
        }
        if (results.length === 0) {
            return (
                <div className="p-6 text-center">
                    <Search className="w-7 h-7 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">
                        No se encontraron resultados para “{searchQuery}”.
                    </p>
                </div>
            );
        }
        return (
            <div className="max-h-80 overflow-y-auto no-scrollbar">
                {results.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCareer(c.id)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#4d0706]/5 text-left cursor-pointer"
                    >
                        <span className="w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {imgError[c.id] ? (
                                <GraduationCap className="w-4 h-4 text-gray-300" />
                            ) : (
                                <img
                                    src={getImageFor(c.id, config)}
                                    alt=""
                                    loading="lazy"
                                    onError={() =>
                                        setImgError((prev) => ({ ...prev, [c.id]: true }))
                                    }
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-gray-800 truncate">
                                {c.title}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mt-0.5">
                                <Clock className="w-3 h-3" />
                                {c.duration}
                            </span>
                        </span>
                        <span
                            className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                c.id.startsWith("tec")
                                    ? "bg-[#4d0706]/10 text-[#7a0d0b]"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                        >
                            {c.id.startsWith("tec") ? "Carrera" : "Curso"}
                        </span>
                    </button>
                ))}
            </div>
        );
    };

    const renderMobileSearchTrigger = () => (
        <button
            type="button"
            onClick={() => {
                setSearchOverlayOpen(true);
                setOpenMenu(null);
            }}
            className="w-full flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/10 border border-white/20 text-gray-200 hover:bg-white/20 transition-colors cursor-pointer"
        >
            <Search className="w-4 h-4 flex-shrink-0 text-gray-300" />
            <span className="text-xs truncate">
                {searchQuery || "Buscar por tema o palabra clave"}
            </span>
        </button>
    );

    return (
        <>
            {/* Sticky Header Navbar */}
            <header
                ref={headerRef}
                className={`sticky top-0 z-50 bg-[#1e1e1e] text-white transition-all duration-300 ${
                    isScrolled ? "shadow-xl border-b border-white/10 bg-[#242426]/95 backdrop-blur-md" : ""
                }`}
            >
                {/* Top bar with Logo, Navigation Links, Compact Search (when scrolled), and Login Button */}
                <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-3 sm:px-8 gap-2.5 sm:gap-4">
                    {/* Left side: Logo + School title */}
                    <button
                        type="button"
                        onClick={() => {
                            closeMenus();
                            onNavigateHome?.();
                        }}
                        aria-label="Ir al inicio"
                        className="flex items-center gap-3 shrink-0 cursor-pointer group text-left"
                    >
                        <img
                            src="/icons/escuela.png"
                            alt="Obreros del Porvenir"
                            className="h-9 lg:h-10 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                        <div className="h-6 w-px bg-white/25 hidden sm:block" />
                        <div className="hidden sm:flex flex-col leading-tight">
                            <span className="text-[11px] lg:text-xs font-bold text-white tracking-tight group-hover:text-gray-200 transition-colors whitespace-nowrap">
                                Escuela Técnica de Capacitación Laboral N° 917
                            </span>
                            <span className="text-[10px] lg:text-xs text-gray-300 font-medium">
                                Obreros del Porvenir
                            </span>
                        </div>
                    </button>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-2 xl:gap-4">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => toggleMenu("categorias")}
                                aria-expanded={openMenu === "categorias"}
                                className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${
                                    openMenu === "categorias"
                                        ? "text-white bg-white/15"
                                        : "text-gray-200 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                Categorías
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 opacity-80 ${
                                        openMenu === "categorias" ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {renderDropdown("categorias", categoriaItems)}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => toggleMenu("institucional")}
                                aria-expanded={openMenu === "institucional"}
                                className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs xl:text-sm font-semibold transition-colors cursor-pointer ${
                                    openMenu === "institucional"
                                        ? "text-white bg-white/15"
                                        : "text-gray-200 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                Institucional
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform duration-200 opacity-80 ${
                                        openMenu === "institucional" ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {renderDropdown("institucional", institucionalItems)}
                        </div>
                    </nav>

                    {/* Compact search bar in navbar when scrolled */}
                    <AnimatePresence>
                        {(isScrolled || !showSearchBanner) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="hidden lg:flex items-center flex-1 max-w-md xl:max-w-lg mx-4 relative"
                            >
                                <div className="w-full bg-[#3d3d3f] hover:bg-[#464648] focus-within:bg-[#464648] border border-white/20 focus-within:border-white/40 rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2 transition-colors overflow-hidden">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowDesktopResults(true);
                                        }}
                                        onFocus={() => setShowDesktopResults(true)}
                                        placeholder="Buscar por tema o palabra clave"
                                        className="w-full bg-transparent text-white placeholder:text-gray-300 text-xs xl:text-sm outline-none font-normal"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setShowDesktopResults(false);
                                            }}
                                            aria-label="Limpiar búsqueda"
                                            className="text-gray-300 hover:text-white p-1 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={goToOffer}
                                        aria-label="Buscar"
                                        className="w-7 h-7 rounded-full bg-[#525254] hover:bg-[#626264] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                                    >
                                        <Search className="w-3.5 h-3.5 text-gray-200" />
                                    </button>
                                </div>

                                {/* Dropdown search results when scrolled */}
                                {showDesktopResults && (
                                    <div className="absolute left-0 right-0 top-full mt-2 z-50">
                                        <div className="rounded-2xl bg-white text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-gray-100 p-2">
                                            {renderResultsList()}
                                            {results.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={goToOffer}
                                                    className="w-full mt-1 px-3 py-2.5 rounded-xl text-center text-xs font-bold text-[#7a0d0b] hover:bg-[#4d0706]/5 transition-colors cursor-pointer"
                                                >
                                                    Ver toda la oferta académica
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Search Input Trigger */}
                    <div className="flex-1 lg:hidden min-w-0">
                        {renderMobileSearchTrigger()}
                    </div>

                    {/* Right side: Ingresar Button */}
                    <button
                        type="button"
                        onClick={onNavigateToLogin}
                        aria-label="Ingresar"
                        title="Acceso usuarios"
                        className="hidden lg:flex bg-[#7a0d0b] hover:bg-[#9a100d] text-white w-10 h-10 rounded-full transition-all border border-white/10 shadow-sm shrink-0 cursor-pointer items-center justify-center"
                    >
                        <User className="w-5 h-5" />
                    </button>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => {
                            setOpenMenu(null);
                            setMobileMenuOpen(true);
                        }}
                        aria-label="Abrir menú"
                        aria-expanded={mobileMenuOpen}
                        className="lg:hidden w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer flex items-center justify-center transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

            </header>

            {/* Big floating search bar section (outside sticky header, in page flow below header, z-40) */}
            {showSearchBanner && (
            <div className="hidden lg:block w-full bg-[#1e1e1e] relative z-40 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-3 pb-4">
                    <h2 className="text-xl xl:text-2xl font-extrabold text-white mb-3 tracking-tight">
                        ¿Qué quieres estudiar?
                    </h2>
                    
                    <div className="relative">
                        <div className="w-full bg-white rounded-full shadow-2xl py-1.5 pl-6 pr-1.5 flex items-center gap-3 border border-white/20">
                            <Search className="w-5 h-5 text-red-600 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDesktopResults(true);
                                }}
                                onFocus={() => setShowDesktopResults(true)}
                                placeholder="Buscar por tema o palabra clave"
                                className="w-full bg-transparent text-gray-800 placeholder:text-gray-400 text-sm xl:text-base font-medium outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setShowDesktopResults(false);
                                    }}
                                    aria-label="Limpiar búsqueda"
                                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <div className="h-7 w-px bg-gray-200 shrink-0 hidden sm:block" />
                            <button
                                type="button"
                                onClick={goToOffer}
                                className="shrink-0 bg-gray-400 hover:bg-gray-500 text-white font-bold text-xs xl:text-sm px-6 py-2 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                Buscar formación →
                            </button>
                        </div>

                        {/* Dropdown search results for big search field */}
                        {showDesktopResults && !isScrolled && (
                            <div className="absolute left-0 right-0 top-full mt-3 z-50">
                                <div className="rounded-2xl bg-white text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-gray-100 p-2">
                                    {renderResultsList()}
                                    {results.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={goToOffer}
                                            className="w-full mt-1 px-3 py-2.5 rounded-xl text-center text-xs font-bold text-[#7a0d0b] hover:bg-[#4d0706]/5 transition-colors cursor-pointer"
                                        >
                                            Ver toda la oferta académica
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            )}

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        className="lg:hidden fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeMobileMenu}
                    >
                        <motion.aside
                            role="dialog"
                            aria-label="Menú"
                            className="absolute right-0 top-0 h-full w-[84%] max-w-sm bg-white shadow-2xl flex flex-col"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 shrink-0">
                                <span className="text-sm font-extrabold text-[#4d0706]">Menú</span>
                                <button
                                    type="button"
                                    onClick={closeMobileMenu}
                                    aria-label="Cerrar menú"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeMobileMenu();
                                        onNavigateToAbout?.();
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-[#4d0706]/5 text-left cursor-pointer text-gray-800"
                                >
                                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#4d0706]/5 text-[#4d0706]">
                                        <History className="w-4 h-4" />
                                    </span>
                                    <span className="text-sm font-bold">Nuestra Historia</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        closeMobileMenu();
                                        onNavigateToLocation?.();
                                    }}
                                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-[#4d0706]/5 text-left cursor-pointer text-gray-800"
                                >
                                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#4d0706]/5 text-[#4d0706]">
                                        <MapPin className="w-4 h-4" />
                                    </span>
                                    <span className="text-sm font-bold">Sede</span>
                                </button>

                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setMobileCategoriesOpen((v) => !v)}
                                        aria-expanded={mobileCategoriesOpen}
                                        className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-[#4d0706]/5 text-left cursor-pointer text-gray-800"
                                    >
                                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#4d0706]/5 text-[#4d0706]">
                                            <GraduationCap className="w-4 h-4" />
                                        </span>
                                        <span className="flex-1 text-sm font-bold">Categorías</span>
                                        <ChevronDown
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                                mobileCategoriesOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {mobileCategoriesOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="ml-6 pl-3 border-l-2 border-[#4d0706]/10 py-1 space-y-1">
                                                    {categoriaItems.map((item) => (
                                                        <button
                                                            key={item.label}
                                                            type="button"
                                                            onClick={() => {
                                                                closeMobileMenu();
                                                                item.action();
                                                            }}
                                                            className="flex items-start gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[#4d0706]/5 text-left cursor-pointer"
                                                        >
                                                            <item.icon className="w-4 h-4 mt-0.5 text-[#4d0706] shrink-0" />
                                                            <span className="min-w-0">
                                                                <span className="block text-sm font-bold text-gray-800">
                                                                    {item.label}
                                                                </span>
                                                                {item.description && (
                                                                    <span className="block text-[11px] text-gray-400 font-medium mt-0.5 leading-snug">
                                                                        {item.description}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeMobileMenu();
                                        onNavigateToLogin?.();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-[#7a0d0b] hover:bg-[#9a100d] text-white text-sm font-bold transition-colors cursor-pointer"
                                >
                                    <User className="w-4 h-4" />
                                    Ingresar
                                </button>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Fullscreen Search Overlay */}
            <AnimatePresence>
                {searchOverlayOpen && (
                    <motion.div
                        className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSearchOverlayOpen(false)}
                    >
                        <motion.div
                            className="bg-white rounded-b-3xl shadow-2xl"
                            initial={{ y: -40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -40, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar por tema o palabra clave"
                                        className="w-full h-11 pl-9 pr-9 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#7a0d0b] focus:bg-white focus:ring-2 focus:ring-[#7a0d0b]/10 transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            aria-label="Limpiar búsqueda"
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSearchOverlayOpen(false)}
                                    aria-label="Cerrar búsqueda"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer flex-shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                        <motion.div
                            className="flex-1 overflow-y-auto px-4 py-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-gray-800">
                                {renderResultsList()}
                                {results.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={goToOffer}
                                        className="w-full px-3 py-3 text-center text-xs font-bold text-[#7a0d0b] hover:bg-[#4d0706]/5 border-t border-gray-100 transition-colors cursor-pointer"
                                    >
                                        Ver toda la oferta académica
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;