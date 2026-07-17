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
            document.title = "Obreros del Porvenir - Escuela Superior de Comercio N° 44";
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#fcfaf7] pb-24 lg:pb-0">
            <AboutHero onBack={onBack} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    <AboutHistory />
                    <AboutValues />

                </div>
            </main>
        </div>
    );
};

export default About;