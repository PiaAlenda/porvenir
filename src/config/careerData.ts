export interface CareerSubject {
    year: string;
    subjects: string[];
}

export interface Teacher {
    name: string;
    title: string;
    legajo: string;
    image?: string;
}

export interface Career {
    id: string;
    title: string;
    icon: string;
    description: string;
    longDescription: string;
    duration: string;
    modality: string;
    perfilEgresado: string[];
    syllabus: CareerSubject[];
    teachers: Teacher[];
    schedule: string;
    inscriptionDate: string;
    inscriptionFee: string;
    inscriptionDocs: string;
    salidaLaboral: string[];
}

export const CAREER_DATA: Record<string, Career> = {
    "tec-mecanica-automotor": {
        id: "tec-mecanica-automotor",
        title: "Mecánica del Automotor",
        icon: "Cog",
        description: "Habilidades y conocimiento en funcionamiento de un motor, puesta a punto, distribuciones e inyección electrónica.",
        longDescription: "Formación integral en mecánica del automotor con enfoque en diagnóstico, mantenimiento y reparación de sistemas mecánicos y electrónicos de vehículos. Preparación para el desempeño en talleres, concesionarias, flotas de transporte, minería e industria pesada, con conocimientos avanzados en inyección electrónica y sistemas de distribución.",
        duration: "3 años",
        modality: "Presencial",
        perfilEgresado: [
            "Diagnóstico y reparación de motores de combustión interna",
            "Puesta a punto de sistemas mecánicos y eléctricos",
            "Mantenimiento de sistemas de distribución",
            "Diagnóstico y reparación de sistemas de inyección electrónica",
            "Gestión y administración de talleres mecánicos"
        ],
        syllabus: [
            {
                year: "1° Año",
                subjects: [
                    "Funcionamiento de un Motor",
                    "Puesta a Punto",
                    "Distribuciones",
                    "Inyección Electrónica"
                ]
            }
        ],
        teachers: [
            {
                name: "Alonzo, Ariel Alberto",
                title: "Auxiliar Técnico Automotor",
                legajo: "14594- L.8 - F. 106/107"
            },
            {
                name: "Becerra, Gustavo",
                title: "Técnico en Automotores",
                legajo: "11767- L.06- F. 184/185"
            },
            {
                name: "Cabrera, Juan",
                title: "Aux. Tec. en Mec. del Autom.",
                legajo: "8459-L-5-F-126/127"
            },
            {
                name: "Ghione, Santiago",
                title: "Ingeniero Mecánico",
                legajo: "13386 -L-7-F-168/169"
            },
            {
                name: "Montiel, Andrés",
                title: "Técnico Mecánico",
                legajo: "10262- L.06- F.74/75",
                image: "/profile/Profe Andres Montiel.webp"
            },
            {
                name: "Olmedo, David",
                title: "Técnico en Automotores",
                legajo: "12463- L.07- F. 60/61"
            },
            {
                name: "Rodriguez, Juan Ramon",
                title: "PROF. TÉC. CARPINTERO – Cat. I y II",
                legajo: "L: 05 Folio: 160/161"
            }
        ],
        schedule: "De Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Agencias y Concesionarias Oficiales",
            "Flotas de Transporte y Logística",
            "Taller mecánico en minería e Industria Pesada",
            "Talleres de GNC",
            "Taller empresas privadas o particular",
            "Comercio (venta de repuestos)"
        ]
    },
    "tec-metalmecanica": {
        id: "tec-metalmecanica",
        title: "Metal Mecánica",
        icon: "Wrench",
        description: "Habilidades y conocimiento en herramientas de corte, procesos de soldaduras y procesos siderúrgicos.",
        longDescription: "Formación especializada en metalmecánica con enfoque en herramientas de corte, procesos de soldaduras y procesos siderúrgicos. Preparación integral para el desempeño en industrias metalúrgicas domiciliarias e industriales, con conocimiento avanzado para el desarrollo minero.",
        duration: "1 año",
        modality: "Presencial",
        perfilEgresado: [
            "Manejo avanzado de herramientas de corte",
            "Procesos de soldadura industrial",
            "Procesos siderúrgicos",
            "Metalúrgica domiciliaria e industrial"
        ],
        syllabus: [
            {
                year: "Formación General",
                subjects: [
                    "Herramientas de Corte",
                    "Procesos de Soldadura",
                    "Procesos Siderúrgicos"
                ]
            }
        ],
        teachers: [
            {
                name: "Moncunill Mauro Lucas",
                title: "Técnico en Automotores",
                legajo: "9557 - L. 06 - F. 26/27"
            },
            {
                name: "Zanino, Renzo Leonardo",
                title: "Aux. Téc. Tornero",
                legajo: "10568 - L. 6 - F. 96/97"
            }
        ],
        schedule: "Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Metalúrgica domiciliaria e industrial en general",
            "Industrias y desarrollo minero"
        ]
    }
};
