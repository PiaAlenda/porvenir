import { MapPin, Clock, CheckCircle2 } from "lucide-react";

export interface LocationItem {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    hours: string;
    isMain: boolean;
    features: string[];
}

interface LocationCardProps {
    loc: LocationItem;
}

const LocationCard = ({ loc }: LocationCardProps) => {
    return (
        <div
            className={`p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border transition-all duration-300 ${loc.isMain
                ? "bg-white border-[#4d0706]/10 shadow-xl shadow-[#4d0706]/5 ring-1 ring-[#4d0706]/5"
                : "bg-white/50 border-gray-100 hover:bg-white hover:shadow-lg"
                }`}
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <span className={`w-fit px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${loc.isMain ? "bg-[#4d0706] text-white" : "bg-gray-100 text-gray-400"}`}>
                            {loc.isMain ? "Sede Central" : "Anexo Regional"}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                            {loc.name}
                        </h3>
                    </div>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.address} ${loc.city}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[#4d0706]/5 text-[#4d0706] text-xs font-black uppercase tracking-widest hover:bg-[#4d0706] hover:text-white transition-all no-underline"
                    >
                        Ver Mapa
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-gray-50 pt-6">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#4d0706]/5 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-[#4d0706]" />
                        </div>
                        <div className="text-sm">
                            <p className="font-black text-gray-900 uppercase text-[9px] tracking-widest mb-1">Dirección</p>
                            <p className="text-gray-500 font-medium">{loc.address}, {loc.city}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#4d0706]/5 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-[#4d0706]" />
                        </div>
                        <div className="text-sm">
                            <p className="font-black text-gray-900 uppercase text-[9px] tracking-widest mb-1">Horarios</p>
                            <p className="text-gray-500 font-medium">{loc.hours}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    {loc.features.map((f, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 text-[10px] font-bold text-gray-500 border border-gray-100">
                            <CheckCircle2 className="w-3 h-3 text-[#ffcc00]" />
                            {f}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LocationCard;