import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Library, MapPin, Users, GraduationCap, Briefcase, X, House } from "lucide-react";

interface FloatingNavProps {
    currentView: string;
    activeNavId?: string | null;
    onNavigate: (view: "home" | "about" | "location") => void;
    onScrollToSection: (sectionId: string) => void;
    onNavigateToProgram?: (category: string, modality: "virtual" | "presencial") => void;
}

const navItems = [
    { id: "about", label: "Nosotros", icon: Users, type: "view" as const },
    { id: "inscripciones", label: "Biblioteca", icon: Library, type: "scroll" as const },
    { id: "cursos", label: "Cursos", icon: GraduationCap, type: "program" as const, category: "bach", modality: "virtual" as const },
    { id: "carrera", label: "Carrera", icon: Briefcase, type: "program" as const, category: "tec", modality: "presencial" as const },
    { id: "location", label: "Sedes", icon: MapPin, type: "view" as const },
];

const FloatingNav = ({ currentView, activeNavId, onNavigate, onScrollToSection, onNavigateToProgram }: FloatingNavProps) => {

    const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem("floatingNavCollapsed") === "true");

    useEffect(() => {
        localStorage.setItem("floatingNavCollapsed", String(collapsed));
    }, [collapsed]);

    const activeId = activeNavId ?? (currentView === "about" || currentView === "location" ? currentView : null);
    const activeItem = navItems.find((item) => item.id === activeId) ?? null;
    const CollapsedIcon = activeItem ? activeItem.icon : House;

    const handleClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
        e.preventDefault();
        if (item.type === "view") {
            onNavigate(item.id as "about" | "location");
        } else if (item.type === "program" && "category" in item && onNavigateToProgram) {
            if (currentView !== "home") {
                onNavigate("home");
                setTimeout(() => onNavigateToProgram(item.category, item.modality), 300);
            } else {
                onNavigateToProgram(item.category, item.modality);
            }
        } else {
            if (currentView !== "home") {
                onNavigate("home");
                setTimeout(() => onScrollToSection(item.id), 300);
            } else {
                onScrollToSection(item.id);
            }
        }
    };

    return (
        <>
            <nav className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md pointer-events-none">
                <AnimatePresence initial={false}>
                    {!collapsed && (
                        <motion.div
                            key="expanded"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            className="bg-[#7a0d0b] backdrop-blur-xl rounded-full py-3.5 pl-3.5 pr-2.5 shadow-[0_20px_50px_rgba(122,13,11,0.5)] flex items-center justify-between gap-1.5 sm:gap-3 border border-white/10 pointer-events-auto"
                        >
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeId === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={(e) => handleClick(e, item)}
                                        className="relative flex flex-col items-center justify-center border-none bg-transparent cursor-pointer py-1.5"
                                    >
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: isActive ? 1.2 : 1,
                                                opacity: isActive ? 1 : 0.5
                                            }}
                                            className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 transition-colors
                                                ${isActive ? 'text-[#ffcc00]' : 'text-white'}
                                            `}
                                        >
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </motion.div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="navIndicator"
                                                className="absolute -bottom-1.5 h-1.5 w-1.5 rounded-full bg-[#ffcc00]"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 380,
                                                    damping: 30
                                                }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCollapsed(true)}
                                className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer border-none flex-shrink-0"
                                aria-label="Minimizar menú"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <AnimatePresence initial={false}>
                {collapsed && (
                    <motion.button
                        key="collapsed"
                        onClick={() => setCollapsed(false)}
                        initial={{ scale: 0.6, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.6, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="lg:hidden fixed bottom-6 right-5 z-[100] flex items-center justify-center w-14 h-14 rounded-full bg-[#7a0d0b] text-white shadow-[0_20px_50px_rgba(122,13,11,0.5)] border border-white/10 cursor-pointer"
                        aria-label="Abrir menú"
                    >
                        <CollapsedIcon className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingNav;
