"use client"

import { useEffect } from "react";
import AboutHero from "@/components/features/about/AboutHero";
import AboutHistory from "@/components/features/about/AboutHistory";
import AboutValues from "@/components/features/about/AboutValues";

interface AboutProps {
    onBack?: () => void;
    onBackNavigation?: () => void;
    onBackAction?: () => void;
    onBackToHome?: () => void;
}

const About = ({ onBack }: AboutProps) => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Nuestra Institución - Obreros del Porvenir";
        return () => {
            document.title = "Obreros del Porvenir - Escuela Técnica de Capacitación Laboral N° 917";
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#fcfaf7] overflow-x-clip">
            <AboutHero onBack={onBack} />
            <main>
                <AboutHistory />
                <AboutValues />
            </main>
        </div>
    );
};

export default About;