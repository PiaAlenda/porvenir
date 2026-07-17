import { GraduationCap, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { type Career, type Teacher } from "@/config/careerData";

interface CohortCardProps {
    career: Career;
    onBack: () => void;
}

export const CareerCohortCard = ({ career, onBack }: CohortCardProps) => {
    const handleEnroll = () => {
        onBack();
        setTimeout(() => {
            const el = document.getElementById("inscripciones");
            if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
    };

    return (
        <div className="bg-[#4d0706] text-white rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col justify-between h-full border border-white/10 relative overflow-hidden group">
            {/* Subtle brand color accent background glow */}
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#ffcc00]/10 rounded-full blur-xl group-hover:bg-[#ffcc00]/25 transition-all duration-500" />
            
            <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]/90">
                    Próxima Cohorte
                </span>
                <h4 className="text-xl lg:text-2xl font-black mt-1 mb-6 text-white leading-tight">
                    {career.inscriptionDate || "Septiembre 2026"}
                </h4>

                <div className="space-y-4 border-t border-white/10 pt-5">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-stone-300">Arancel Mensual</span>
                        <span className="text-sm font-black text-[#ffcc00]">{career.inscriptionFee || "Consultar"}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                        <span className="text-xs font-bold text-stone-300">Modalidad</span>
                        <span className="text-sm font-black text-white">{career.modality}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleEnroll}
                className="mt-8 w-full py-4 bg-[#ffcc00] text-[#4d0706] font-black uppercase tracking-wider text-xs rounded-xl hover:bg-white hover:text-[#4d0706] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-none shadow-lg shadow-black/25"
            >
                Iniciar Inscripción
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

// Teacher initials helper
function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .filter((char) => char >= "A" && char <= "Z")
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

interface TeachersListProps {
    career: Career;
}

function getProfileSrc(legajo: string): string {
    const normalized = legajo.replace(/[\s/]+/g, "");
    return `/profile/${normalized}.png`;
}

export const CareerTeachersList = ({ career }: TeachersListProps) => {
    const teacherCount = career.teachers.length;
    const MOBILE_LIMIT = 3;
    const [showAll, setShowAll] = useState(false);
    const visibleTeachers = showAll ? career.teachers : career.teachers.slice(0, MOBILE_LIMIT);

    const gridCols =
        teacherCount === 1
            ? "grid-cols-1 max-w-sm mx-auto"
            : "grid-cols-1 lg:grid-cols-2";

    return (
        <div className="bg-white rounded-2xl border border-stone-200/60 p-6 lg:p-8 shadow-sm w-full">
            <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-7 h-7 text-[#4d0706]" />
                <h3 className="text-xl lg:text-2xl font-black text-gray-900">Docentes de la carrera</h3>
            </div>

            <div className={`grid ${gridCols} gap-5`}>
                {visibleTeachers.map((teacher: Teacher, idx: number) => (
                    <TeacherCard key={idx} teacher={teacher} />
                ))}
            </div>

            {teacherCount > MOBILE_LIMIT && (
                <div className="lg:hidden mt-4">
                    <button
                        onClick={() => setShowAll((prev) => !prev)}
                        className="w-full py-3 flex items-center justify-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-sm font-bold text-[#4d0706] transition-all duration-200 cursor-pointer"
                    >
                        {showAll ? (
                            <>Ver menos <ChevronUp className="w-4 h-4" /></>
                        ) : (
                            <>Ver más ({teacherCount - MOBILE_LIMIT} restantes) <ChevronDown className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

function TeacherCard({ teacher }: { teacher: Teacher }) {
    const [imgError, setImgError] = useState(false);
    const profileSrc = teacher.image || getProfileSrc(teacher.legajo);

    return (
        <div className="flex items-center gap-3 lg:gap-5 p-3 lg:p-5 rounded-xl border border-stone-100 hover:border-[#4d0706]/20 transition-all duration-300 hover:bg-stone-50/50 hover:scale-[1.02] cursor-default">
            <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-stone-200/60 bg-stone-50">
                {imgError ? (
                    <span className="w-full h-full flex items-center justify-center bg-[#4d0706] text-white font-black text-xl">
                        {getInitials(teacher.name)}
                    </span>
                ) : (
                    <img
                        src={profileSrc}
                        alt={teacher.name}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover scale-[1.25] origin-center"
                    />
                )}
            </div>
            <div className="min-w-0">
                <h4 className="font-black text-gray-900 text-sm lg:text-base leading-tight">{teacher.name}</h4>
                <p className="text-xs lg:text-sm font-bold text-[#4d0706]/75 mt-1">{teacher.title}</p>
                <p className="text-[10px] lg:text-xs font-semibold text-stone-400 mt-0.5">
                    Legajo: {teacher.legajo}
                </p>
            </div>
        </div>
    );
}