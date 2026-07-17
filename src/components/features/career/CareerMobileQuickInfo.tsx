import { Clock, Calendar } from "lucide-react";
import { type Career } from "@/config/careerData";

interface Props {
    career: Career;
    onBack: () => void;
}

const CareerMobileQuickInfo = ({ career }: Props) => {
    const scheduleParts = career.schedule.split(" de ");
    const days = scheduleParts[0] || "Consultar";
    const hours = scheduleParts[1] || "";

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-stone-200/60 p-3 shadow-sm flex flex-col justify-between">
                    <div>
                        <Clock className="w-4 h-4 text-[#c85a17] mb-1" />
                        <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                            Cronograma
                        </h4>
                    </div>
                    <div className="mt-2">
                        <p className="text-[11px] font-black text-[#0b1b33] leading-tight">
                            {days}
                        </p>
                        {hours && (
                            <p className="text-[9px] font-bold text-stone-500 mt-0.5">
                                {hours}
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-stone-200/60 p-3 shadow-sm flex flex-col justify-between">
                    <div>
                        <Calendar className="w-4 h-4 text-[#c85a17] mb-1" />
                        <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                            Próxima Cohorte
                        </h4>
                    </div>
                    <div className="mt-2">
                        <p className="text-[11px] font-black text-[#0b1b33] leading-tight">
                            {career.inscriptionDate || "Septiembre 2026"}
                        </p>
                        <p className="text-[9px] font-bold text-stone-500 mt-0.5">
                            {career.inscriptionFee || "Consultar"} · {career.modality}
                        </p>
                    </div>
                </div>
            </div>

            {/* Duración Dark Bar */}
            <div className="bg-[#4d0706] text-white rounded-xl p-3 flex items-center border border-white/5 shadow-md">
                <div className="flex items-center w-full gap-3">
                    <Clock className="w-4 h-4 text-[#ffcc00] shrink-0" />

                    <div className="flex-1 text-center pr-4">
                        <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest block leading-none">
                            Duración Total
                        </span>
                        <span className="text-[11px] font-black text-white block mt-1 leading-none">
                            {career.duration} Académicos
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareerMobileQuickInfo;