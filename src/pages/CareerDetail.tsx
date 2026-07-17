import { useEffect } from "react";
import { FileEdit } from "lucide-react";
import { CAREER_DATA, type Career } from "@/config/careerData";
import CareerDetailHero from "@/components/features/career/CareerDetailHero";
import { CareerSyllabus, CareerDetailsGrid } from "@/components/features/career/CareerDetailAbout";
import { CareerCohortCard, CareerTeachersList } from "@/components/features/career/CareerDetailSidebar";
import CareerMobileQuickInfo from "@/components/features/career/CareerMobileQuickInfo";

interface CareerDetailProps {
    careerId: string;
    onBack: () => void;
}

const CareerDetail = ({ careerId, onBack }: CareerDetailProps) => {
    const career: Career | undefined = CAREER_DATA[careerId];

    useEffect(() => {
        window.scrollTo(0, 0);
        if (career) {
            document.title = `${career.title} - Obreros del Porvenir`;
        }
        return () => {
            document.title = "Obreros del Porvenir - Escuela Superior de Comercio N° 44";
        };
    }, [careerId, career]);

    if (!career) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="text-center p-10 bg-white rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-black text-gray-900 mb-4">Carrera no encontrada</h2>
                    <p className="text-stone-500 mb-8">Lo sentimos, no pudimos encontrar la información solicitada.</p>
                    <button onClick={onBack} className="btn-brand">Volver al inicio</button>
                </div>
            </div>
        );
    }

    const handleEnroll = () => {
        onBack();
        setTimeout(() => {
            const el = document.getElementById("inscripciones");
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-24 lg:pb-16 relative">
            <CareerDetailHero career={career} onBack={onBack} />

                <main className="py-8 lg:py-16">
                <div className="site-container max-w-7xl mx-auto px-4 lg:px-6 space-y-8 lg:space-y-12">
                    {/* Mobile: quick info (horario + cohorte grid, duración banner) */}
                    <div className="lg:hidden">
                        <CareerMobileQuickInfo career={career} onBack={onBack} />
                    </div>

                    {/* Desktop: syllabus + cohort sidebar */}
                    <div className="hidden lg:grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                        <div className="lg:col-span-8 col-span-1">
                            <CareerSyllabus career={career} />
                        </div>
                        <div className="lg:col-span-4 col-span-1 hidden lg:block">
                            <CareerCohortCard career={career} onBack={onBack} />
                        </div>
                    </div>

                    {/* Syllabus - mobile only (on desktop it's rendered next to the cohort card) */}
                    <div className="lg:hidden">
                        <CareerSyllabus career={career} />
                    </div>

                    {/* Details: salida laboral, horario, requisitos */}
                    <CareerDetailsGrid career={career} />

                    {/* Teachers: full width on mobile after all content, desktop sidebar */}
                    <div>
                        <CareerTeachersList career={career} />
                    </div>
                </div>
            </main>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-stone-200/80 z-50">
                <button
                    onClick={handleEnroll}
                    className="w-full py-3 bg-[#4d0706] text-[#ffcc00] font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2 hover:bg-[#300404] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#4d0706]/15"
                >
                    <FileEdit className="w-3.5 h-3.5" />
                    Inscribite Ahora
                </button>
            </div>
        </div>
    );
};

export default CareerDetail;