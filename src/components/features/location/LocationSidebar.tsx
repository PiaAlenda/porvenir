import { Map as MapIcon, Phone, Mail, Building2 } from "lucide-react";

const LocationSidebar = () => {
    return (
        <div className="lg:col-span-5">
            <div className="sticky top-12 space-y-6">
                <div className="bg-[#4d0706] rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl shadow-[#4d0706]/20">
                    <MapIcon className="w-12 h-12 text-[#ffcc00] mb-8" />
                    <h3 className="text-2xl sm:text-3xl font-black mb-4 leading-none">Contacto General</h3>
                    <p className="text-white/70 font-medium mb-8">
                        ¿Tenés dudas sobre qué sede te corresponde? Comunicate con nuestra oficina central.
                    </p>

                    <div className="space-y-4">
                        <a href="tel:+542645815111" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors no-underline">
                            <Phone className="w-5 h-5 text-[#ffcc00]" />
                            <span className="font-bold text-sm text-white">+54 264 581-5111</span>
                        </a>
                        <a href="mailto:info@porvenir.edu.ar" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors no-underline">
                            <Mail className="w-5 h-5 text-[#ffcc00]" />
                            <span className="font-bold text-sm text-white">info@porvenir.edu.ar</span>
                        </a>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 text-center">
                    <Building2 className="w-8 h-8 text-[#4d0706] mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-[#4d0706] mb-2">Trámites Presenciales</p>
                    <p className="text-sm text-gray-500 font-medium">
                        Recordá que para inscripción presencial debés presentarte con DNI original y copia en cualquiera de nuestras sedes.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LocationSidebar;