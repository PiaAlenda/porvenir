"use client"

import { useEffect } from "react";
import { Navigation2 } from "lucide-react";
import LocationHeader from "@/components/features/location/LocationHeader";
import LocationCard from "@/components/features/location/LocationCard";
import LocationSidebar from "@/components/features/location/LocationSidebar";

interface LocationProps {
    onBack: () => void;
}

export const locations = [
    {
        name: "Sede Central - San Juan",
        address: "Avenida Alem",
        city: "San Juan, San Juan",
        phone: "+54 264 581-5111",
        email: "info@porvenir.edu.ar",
        hours: "Lunes a Viernes de 18:00 a 22:30 hs",
        isMain: true,
        features: ["Biblioteca Central", "Laboratorio de Informática", "Salón de Actos"]
    },
    {
        name: "Anexo Concepción",
        address: "España 1200",
        city: "Concepción, Tucumán",
        phone: "+54 3865 42-5678",
        email: "concepcion@obreros.edu.ar",
        hours: "Lunes a Viernes de 18:30 a 22:30 hs",
        isMain: false,
        features: ["Centro de Tutoría Virtual", "Secretaría de Alumnos"]
    },
    {
        name: "Anexo Yerba Buena",
        address: "Av. Aconquija 2100",
        city: "Yerba Buena, Tucumán",
        phone: "+54 381 431-9000",
        email: "yerbabuena@obreros.edu.ar",
        hours: "Lunes a Viernes de 18:00 a 22:00 hs",
        isMain: false,
        features: ["Sede de Exámenes", "Aula Híbrida"]
    }
];

const Location = ({ onBack }: LocationProps) => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Sedes - Obreros del Porvenir";
        return () => {
            document.title = "Obreros del Porvenir - Escuela Superior de Comercio N° 44";
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#fcfaf7] pb-24 lg:pb-0">
            {/* Header */}
            <LocationHeader onBack={onBack} />

            {/* Main Content: Grid Layout */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    {/* Left Column: List of locations */}
                    <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Navigation2 className="w-6 h-6 text-[#4d0706]" />
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Centros de Atención</h2>
                        </div>

                        {locations.map((loc, idx) => (
                            <LocationCard key={idx} loc={loc} />
                        ))}
                    </div>

                    {/* Right Column: General Info Card */}
                    <LocationSidebar />
                </div>
            </main>
        </div>
    );
};

export default Location;