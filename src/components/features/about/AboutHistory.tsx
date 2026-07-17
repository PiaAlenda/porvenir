import { History, Target, Eye } from "lucide-react";

const AboutHistory = () => {
    return (
        <div className="lg:col-span-7 space-y-8 sm:space-y-12">
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-[#4d0706]" />
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Nuestra Historia</h2>
                </div>
                <div className="prose prose-sm sm:prose-base text-gray-600 font-medium leading-relaxed space-y-4">
                    <p>
                        Nuestra institución fue creada en el año 1915. Tenemos más de 100 años de trayectoria en los que siempre se destacó la calidad en la educación y el profesionalismo de nuestro plantel docente. El equipamiento de los talleres hace que los contenidos aprendidos estén a la altura de las demandas del mercado. Así logramos que nuestros egresados se destaquen en el oficio que eligieron aprender.
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="p-6 sm:p-8 bg-white rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-200/50">
                    <div className="w-12 h-12 rounded-2xl bg-[#4d0706]/5 flex items-center justify-center mb-6">
                        <Target className="w-6 h-6 text-[#4d0706]" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">Misión</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Formar profesionales técnicos capaces de liderar procesos administrativos y tecnológicos con ética y responsabilidad social.
                    </p>
                </div>
                <div className="p-6 sm:p-8 bg-white rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-200/50">
                    <div className="w-12 h-12 rounded-2xl bg-[#4d0706]/5 flex items-center justify-center mb-6">
                        <Eye className="w-6 h-6 text-[#4d0706]" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-3">Visión</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Ser la institución referente en formación técnico-comercial, reconocida por su innovación pedagógica y su impacto en la comunidad.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default AboutHistory;