import { Award, BookOpen, Users2, CheckCircle2 } from "lucide-react";

const AboutValues = () => {
    return (
        <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-12 space-y-6">
                <div className="bg-[#4d0706] rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl shadow-[#4d0706]/20">
                    <Award className="w-12 h-12 text-[#ffcc00] mb-8" />
                    <h3 className="text-2xl sm:text-3xl font-black mb-6">Valores Institucionales</h3>

                    <ul className="space-y-4 sm:space-y-6">
                        {[
                            { icon: BookOpen, title: "Excelencia", desc: "Compromiso con la calidad educativa constante." },
                            { icon: Users2, title: "Inclusion", desc: "Educación accesible para todos los sectores." },
                            { icon: CheckCircle2, title: "Integridad", desc: "Actuamos con honestidad y transparencia." }
                        ].map((v, i) => (
                            <li key={i} className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                    <v.icon className="w-5 h-5 text-[#ffcc00]" />
                                </div>
                                <div>
                                    <p className="font-black text-sm text-white uppercase tracking-widest">{v.title}</p>
                                    <p className="text-xs text-white/60 font-medium mt-1">{v.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-[#4d0706] mb-2">Reconocimiento Oficial</p>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Nuestros títulos cuentan con validez nacional y respaldo del Ministerio de Educación.
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default AboutValues;