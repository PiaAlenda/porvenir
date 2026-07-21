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
    },
    "tec-torneria-mecanica": {
        id: "tec-torneria-mecanica",
        title: "Tornería Mecánica",
        icon: "Wrench",
        description: "Habilidades y conocimiento en mecanizado de piezas metálicas y no metálicas, desbaste, pulidos, conos, roscas y soldadura.",
        longDescription: "Formación integral en tornería mecánica con enfoque en el mecanizado de piezas metálicas y no metálicas, técnicas de desbaste, pulido, elaboración de conos y roscas, y procesos de soldadura. Preparación para el desempeño en talleres mecánicos, industria metalúrgica, minería y reparación de piezas y maquinaria industrial.",
        duration: "2 años",
        modality: "Presencial",
        perfilEgresado: [
            "Mecanizado de piezas metálicas y no metálicas en torno",
            "Técnicas de desbaste y pulido de superficies",
            "Elaboración de conos y roscas en piezas mecánicas",
            "Procesos de soldadura industrial",
            "Reparación y mantenimiento de piezas y maquinaria"
        ],
        syllabus: [
            {
                year: "1° Año",
                subjects: [
                    "Mecanizado de Piezas Metálicas y No Metálicas",
                    "Desbaste",
                    "Pulidos",
                    "Conos"
                ]
            },
            {
                year: "2° Año",
                subjects: [
                    "Roscas",
                    "Soldadura",
                    "Taller Integrador"
                ]
            }
        ],
        teachers: [
            {
                name: "Garro, Leonardo",
                title: "Tec. en Equipos e Instal. Electromecanica",
                legajo: "13544-L-7-F-186/187"
            },
            {
                name: "Ortiz, Bruno",
                title: "Auxiliar Tec. Tornero",
                legajo: "1184-L-06, F-193/193",
                image: "/profile/Profe Bruno Ortiz.jpg"
            }
        ],
        schedule: "De Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Reparación de piezas y mantenimiento de máquinas mineras",
            "Auxiliar en asentamientos mineros",
            "Taller mecánico automotriz",
            "Industria metalúrgica",
            "Tornería general"
        ]
    },
    "tec-dibujo-publicitario": {
        id: "tec-dibujo-publicitario",
        title: "Dibujo Publicitario",
        icon: "Image",
        description: "Habilidades y conocimiento en dibujo artístico, figura humana, técnicas de sombreado y pintado, programas de diseño y creación de piezas gráficas.",
        longDescription: "Formación integral en dibujo publicitario con enfoque en dibujo artístico, estudio de la figura humana, técnicas de sombreado y pintado, dominio de programas de diseño y creación de piezas gráficas. Preparación para el desempeño en agencias publicitarias, estudios de diseño, medios de comunicación y producción de contenido visual.",
        duration: "2 años",
        modality: "Presencial",
        perfilEgresado: [
            "Dibujo artístico y representación de la figura humana",
            "Técnicas de sombreado y pintado tradicional y digital",
            "Manejo de programas de diseño gráfico",
            "Creación de piezas gráficas publicitarias",
            "Desarrollo de contenido visual para redes sociales"
        ],
        syllabus: [
            {
                year: "1° Año",
                subjects: [
                    "Dibujo Artístico",
                    "Figura Humana",
                    "Técnicas de Sombreado y Pintado",
                    "Programas de Diseño"
                ]
            },
            {
                year: "2° Año",
                subjects: [
                    "Creación de Piezas Gráficas",
                    "Taller Integrador"
                ]
            }
        ],
        teachers: [
            {
                name: "Nuñez, María Elisa",
                title: "Lic. en Comunicación Social",
                legajo: "5639- L.4- F.42/43",
                image: "/profile/Profe Elisa nueñez.jpg"
            },
            {
                name: "Rojas, Sofia",
                title: "Diseñador Gráfico",
                legajo: "14787-L-8-F-128/129"
            }
        ],
        schedule: "De Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Agencia Publicitaria",
            "Estudios de diseño",
            "Consultoras de marketing",
            "Medios de comunicación",
            "Productoras audiovisuales",
            "Creadora de contenido para redes sociales",
            "Docencia"
        ]
    },
    "tec-administracion-contable": {
        id: "tec-administracion-contable",
        title: "Administración Contable",
        icon: "Calculator",
        description: "Habilidades y conocimiento en auxiliar administrativo, liquidación de sueldos e impuestos y operador de PC.",
        longDescription: "Formación integral en administración contable con enfoque en tareas administrativas, liquidación de sueldos, liquidación de impuestos y manejo de herramientas informáticas. Preparación para el desempeño en estudios contables, empresas privadas, consultoras de recursos humanos y administración de comercios.",
        duration: "2 años",
        modality: "Presencial",
        perfilEgresado: [
            "Gestión administrativa y documentación contable",
            "Liquidación de sueldos y cargas sociales",
            "Liquidación de impuestos nacionales y provinciales",
            "Manejo de PC y software administrativo-contable",
            "Administración de comercios y pequeñas empresas"
        ],
        syllabus: [
            {
                year: "1° Año",
                subjects: [
                    "Auxiliar Administrativo",
                    "Liquidación de Sueldos",
                    "Operador de PC",
                    "Introducción a la Contabilidad"
                ]
            },
            {
                year: "2° Año",
                subjects: [
                    "Liquidación de Impuestos",
                    "Administración de Comercios",
                    "Taller Integrador"
                ]
            }
        ],
        teachers: [
            {
                name: "Aceituno, Guillermo",
                title: "Tec. Programador Universitario",
                legajo: "11849- L.6- F. 190/191"
            },
            {
                name: "Davila, Cecilia",
                title: "Contador Público Nacional",
                legajo: "9850- L. 6- F. 46/47"
            },
            {
                name: "Diaz, Pablo",
                title: "Contador Público Nacional",
                legajo: "10503- L.6- F.92/93"
            },
            {
                name: "Nuñez, Rogelio",
                title: "Contador Público Nacional",
                legajo: "5342- L. 4- F. 10/11",
                image: "/profile/Profe Rogelio nueñez.jpg"
            }
        ],
        schedule: "De Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Auxiliar en estudio contable",
            "Auxiliar contable en empresas privadas",
            "Auxiliar en consultoras de Recursos Humanos",
            "Administración de comercios",
            "Docencia"
        ]
    }
};
