"use client"

import { useEffect } from "react";
import LocationHeader from "@/components/features/location/LocationHeader";
import LocationInfo from "@/components/features/location/LocationInfo";
import LocationFacilities from "@/components/features/location/LocationFacilities";
import { MotionConfig } from "framer-motion";

interface LocationProps {
    onBack: () => void;
}

export const mainLocation = {
    name: "Sede Central - San Juan",
    address: "Avenida Alem",
    city: "San Juan, San Juan",
    phone: "+54 264 581-5111",
    phoneHref: "tel:+542645815111",
    hours: "Lunes a Viernes de 18:00 a 22:30 hs",
    features: ["Biblioteca Central", "Laboratorio de Informática", "Salón de Actos"],
};

const query = encodeURIComponent(`${mainLocation.address}, ${mainLocation.city}, Argentina`);
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
const embedUrl = `https://maps.google.com/maps?q=${query}&z=15&output=embed`;

const Location = ({ onBack }: LocationProps) => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Sede Central - Obreros del Porvenir";
        return () => {
            document.title = "Obreros del Porvenir - Escuela Técnica de Capacitación Laboral N° 917";
        };
    }, []);

    const fullAddress = `${mainLocation.address}, San Juan`;

    return (
        <MotionConfig reducedMotion="user">
            <div className="min-h-screen bg-[#fcfaf7] overflow-x-clip">
                <LocationHeader
                    onBack={onBack}
                    address={fullAddress}
                    mapsUrl={mapsUrl}
                    phone={mainLocation.phone}
                    phoneHref={mainLocation.phoneHref}
                />
                <main>
                    <LocationInfo
                        address={fullAddress}
                        hours={mainLocation.hours}
                        phone={mainLocation.phone}
                        phoneHref={mainLocation.phoneHref}
                        embedUrl={embedUrl}
                    />
                    <LocationFacilities features={mainLocation.features} />
                </main>
            </div>
        </MotionConfig>
    );
};

export default Location;
