import { ArrowRight, UserX } from "lucide-react";
import { useState } from "react";
import { type Career, type Teacher } from "@/config/careerData";
import { CareerSection } from "@/components/features/career/CareerDetailAbout";

interface EnrollPanelProps {
    career: Career;
    onEnroll: () => void;
    available?: boolean;
}

/**
 * Único bloque "destacado" de la página: resume lo que decide la inscripción
 * (cuándo, cuánto, cómo y en qué horario). En desktop queda fijo al costado;
 * en mobile va arriba y el botón vive en la barra inferior.
 */
export const CareerEnrollPanel = ({ career, onEnroll, available = true }: EnrollPanelProps) => {
    const rows: { label: string; value: string }[] = [
        { label: "Inscripción", value: career.inscriptionFee || "Consultar" },
        { label: "Modalidad", value: career.modality },
        ...(career.month ? [{ label: "Inicio", value: career.month }] : []),
        { label: "Cursada", value: career.schedule },
    ];

    return (
        <div className="rounded-2xl bg-[#4d0706] p-6 text-white lg:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ffcc00]">
                Próxima cohorte · Ciclo lectivo 2027
            </p>
            <p className="mt-2 text-2xl font-black leading-tight">{career.inscriptionDate || "Septiembre 2026"}</p>

            <dl className="mt-5 divide-y divide-white/10 border-t border-white/10">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                        <dt className="text-xs font-medium text-stone-300">{label}</dt>
                        <dd className="text-right text-sm font-bold">{value}</dd>
                    </div>
                ))}
            </dl>

            <div className="hidden lg:block">
                {available ? (
                    <button
                        onClick={onEnroll}
                        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-[#ffcc00] py-3.5 text-xs font-black uppercase tracking-wider text-[#4d0706] transition-[transform,background-color] duration-150 ease-out hover:bg-white active:scale-[0.97]"
                    >
                        Iniciar inscripción
                        <ArrowRight className="h-4 w-4" />
                    </button>
                ) : (
                    <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3.5 text-xs font-black uppercase tracking-wider text-stone-300">
                        <UserX className="h-4 w-4" />
                        Sin cupo
                    </div>
                )}
            </div>
        </div>
    );
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .filter((char) => char >= "A" && char <= "Z")
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function getProfileSrc(legajo: string): string {
    const normalized = legajo.replace(/[\s/]+/g, "");
    return `/img/profile/${normalized}.webp`;
}

const INITIAL_VISIBLE = 6;

export const CareerTeachersList = ({ career, index = 0 }: { career: Career; index?: number }) => {
    const [expanded, setExpanded] = useState(false);
    const teachers = career.teachers;
    const visible = expanded ? teachers : teachers.slice(0, INITIAL_VISIBLE);
    const hidden = teachers.length - INITIAL_VISIBLE;

    return (
        <CareerSection title="Docentes" index={index}>
            <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {/* Key con índice: los docentes cargados desde el panel pueden no tener legajo. */}
                {visible.map((teacher, idx) => (
                    <TeacherItem key={`${teacher.legajo || teacher.name}-${idx}`} teacher={teacher} />
                ))}
            </ul>
            {hidden > 0 && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-6 cursor-pointer border-none bg-transparent p-0 text-sm font-bold text-[#4d0706] underline-offset-4 transition-opacity duration-150 hover:underline active:opacity-70"
                >
                    {expanded ? "Ver menos" : `Ver los ${teachers.length} docentes`}
                </button>
            )}
        </CareerSection>
    );
};

function TeacherItem({ teacher }: { teacher: Teacher }) {
    const [imgError, setImgError] = useState(false);
    const profileSrc = teacher.image || (teacher.legajo ? getProfileSrc(teacher.legajo) : "");

    return (
        <li className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200">
                {imgError || !profileSrc ? (
                    <span className="flex h-full w-full items-center justify-center bg-[#4d0706] text-base font-black text-white">
                        {getInitials(teacher.name)}
                    </span>
                ) : (
                    <img
                        src={profileSrc}
                        alt={teacher.name}
                        onError={() => setImgError(true)}
                        className="h-full w-full origin-center scale-[1.25] object-cover"
                    />
                )}
            </div>
            <div className="min-w-0">
                <p className="text-[15px] font-bold leading-tight text-stone-900">{teacher.name}</p>
                <p className="mt-0.5 text-sm text-stone-500">{teacher.title}</p>
            </div>
        </li>
    );
}
