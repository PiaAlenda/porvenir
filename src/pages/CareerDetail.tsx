import { useEffect, useState } from "react";
import { FileEdit, Users } from "lucide-react";
import { type Career } from "@/config/careerData";
import CareerDetailHero from "@/components/features/career/CareerDetailHero";
import { CareerSyllabus, CareerOutcomes, CareerRequirements } from "@/components/features/career/CareerDetailAbout";
import { CareerEnrollPanel, CareerTeachersList } from "@/components/features/career/CareerDetailSidebar";
import InfoForm from "@/components/features/home/InfoForm";
import { getCareerById, isAvailableFor, useSiteConfig } from "@/siteConfig";

interface CareerDetailProps {
    careerId: string;
    onBack: () => void;
}

const CareerDetail = ({ careerId, onBack }: CareerDetailProps) => {
    const { config } = useSiteConfig();
    const career: Career | undefined = getCareerById(careerId, config);
    const available = career ? isAvailableFor(career.id, config) : true;
    /*
     * El formulario de inscripción se despliega dentro de esta misma página
     * (con la carrera ya fija) en vez de volver al Home.
     */
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (career) {
            document.title = `${career.title} - Obreros del Porvenir`;
        }
        return () => {
            document.title = "Obreros del Porvenir - Escuela Técnica de Capacitación Laboral N° 917";
        };
    }, [careerId, career]);

    if (!career) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="text-center p-10 bg-white rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-black text-gray-900 mb-4">Carrera no encontrada</h2>
                    <p className="text-stone-500 mb-8">Lo sentimos, no pudimos encontrar la información solicitada.</p>
                    <button onClick={onBack} className="btn-brand cursor-pointer">Volver al inicio</button>
                </div>
            </div>
        );
    }

    const handleEnroll = () => {
        setShowForm(true);
        // Se espera un instante a que React monte la sección antes de bajar.
        setTimeout(() => {
            document.getElementById("inscripcion-form")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-24 lg:pb-0 relative">
            <CareerDetailHero career={career} onBack={onBack} />

            <main className="py-10 lg:py-14">
                {/*
                  * Una sola columna de contenido + un panel lateral. El panel va primero en
                  * el DOM para que en mobile quede arriba; `lg:order-2` lo manda a la derecha.
                  */}
                <div className="site-container grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
                    <aside className="reveal lg:sticky lg:top-6 lg:order-2">
                        <CareerEnrollPanel career={career} onEnroll={handleEnroll} available={available} />
                    </aside>

                    <div className="min-w-0 divide-y-2 divide-stone-200">
                        <CareerSyllabus career={career} index={1} />
                        <CareerOutcomes career={career} index={2} />
                        <CareerRequirements career={career} index={3} />
                        {career.teachers.length > 0 && <CareerTeachersList career={career} index={4} />}
                    </div>
                </div>
            </main>

            {available && showForm && (
                <div className="border-t border-stone-200/70">
                    {/* Formulario inline: carrera ya elegida, sin paso de tipo ni selector */}
                    <InfoForm careerId={career.id} embedded />
                </div>
            )}

            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-stone-200/80 z-50">
                {available ? (
                    <button
                        onClick={handleEnroll}
                        className="w-full py-3 bg-[#4d0706] text-[#ffcc00] font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#300404] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-out cursor-pointer"
                    >
                        <FileEdit className="w-3.5 h-3.5" />
                        Inscribite Ahora
                    </button>
                ) : (
                    <div className="w-full py-3 bg-gray-200 text-gray-500 font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Sin cupo
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareerDetail;