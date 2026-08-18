import React from "react";
import { motion } from "framer-motion";
import { Library, MapPin, Users, GraduationCap, Briefcase } from "lucide-react";

interface FloatingNavProps {
    currentView: string;
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

const FloatingNav = ({ currentView, onNavigate, onScrollToSection, onNavigateToProgram }: FloatingNavProps) => {

    const handleClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
        e.preventDefault();
        if (item.type === "view") {
            onNavigate(item.id as any);
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
        <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-[#7a0d0b] backdrop-blur-xl rounded-full py-2 px-4 shadow-[0_20px_50px_rgba(122,13,11,0.5)] flex items-center justify-between border border-white/10"
            >
                {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isCenter = index === 2;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={(e) => handleClick(e, item)}
                            className="relative flex flex-col items-center justify-center border-none bg-transparent cursor-pointer py-1"
                        >
                            <motion.div
                                animate={{
                                    scale: isActive ? (isCenter ? 1.1 : 1.2) : 1,
                                    opacity: isActive ? 1 : 0.5
                                }}
                                className={`flex items-center justify-center transition-colors
                                    ${isCenter ? 'w-10 h-10 bg-white/20 rounded-full' : 'w-8 h-8'}
                                    ${isActive ? 'text-[#ffcc00]' : 'text-white'}
                                `}
                            >
                                <Icon className={isCenter ? 'w-5 h-5' : 'w-4 h-4'} />
                            </motion.div>
                            {isActive && (
                                <motion.div
                                    layoutId="navIndicator"
                                    className={`absolute -bottom-1 h-1 rounded-full bg-[#ffcc00]
                                        ${isCenter ? 'w-1' : 'w-1'}
                                    `}
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
            </motion.div>
        </nav>
    );
};

export default FloatingNav;
