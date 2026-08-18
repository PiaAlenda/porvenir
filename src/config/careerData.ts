export interface CareerSubject {
    year: string;
    subjects: string[];
}

export interface Teacher {
    name: string;
    title: string;
    legajo?: string;
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
    category?: "carrera" | "curso-presencial" | "curso-virtual";
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
                legajo: "14594- L.8 - F. 106/107",
                image: "/img/profile/ariel.jpg"
            },
            {
                name: "Becerra, Gustavo",
                title: "Técnico en Automotores",
                legajo: "11767- L.06- F. 184/185",
                image: "/img/profile/becerra.jpg"
            },
            {
                name: "Cabrera, Juan",
                title: "Aux. Tec. en Mec. del Autom.",
                legajo: "8459-L-5-F-126/127",
                image: "/img/profile/cabrera.jpg"
            },
            {
                name: "Ghione, Santiago",
                title: "Ingeniero Mecánico",
                legajo: "13386 -L-7-F-168/169",
                image: "/img/profile/santiago.jpg"
            },
            {
                name: "Montiel, Andrés",
                title: "Técnico Mecánico",
                legajo: "10262- L.06- F.74/75",
                image: "/img/profile/montiel.jpg"
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
                legajo: "9557 - L. 06 - F. 26/27",
                image: "/img/profile/Profe Lucas.jpg.jpeg"
            },
            {
                name: "Zanino, Renzo Leonardo",
                title: "Aux. Téc. Tornero",
                legajo: "10568 - L. 6 - F. 96/97",
                image: "/img/profile/Profe renzo.jpg.jpeg"
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
                legajo: "13544-L-7-F-186/187",
                image: "/img/profile/garro.jpg"
            },
            {
                name: "Ortiz, Bruno",
                title: "Auxiliar Tec. Tornero",
                legajo: "1184-L-06, F-193/193",
                image: "/img/profile/ortiz.jpg"
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
                image: "/img/profile/elisa.jpg"
            },
            {
                name: "Rojas, Sofia",
                title: "Diseñador Gráfico",
                legajo: "14787-L-8-F-128/129",
                image: "/img/profile/rojas.jpg"
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
                legajo: "11849- L.6- F. 190/191",
                image: "/img/profile/guillermo.jpg"
            },
            {
                name: "Davila, Cecilia",
                title: "Contador Público Nacional",
                legajo: "9850- L. 6- F. 46/47",
                image: "/img/profile/cecilia.jpg"
            },
            {
                name: "Diaz, Pablo",
                title: "Contador Público Nacional",
                legajo: "10503- L.6- F.92/93",
                image: "/img/profile/pablo.jpg"
            },
            {
                name: "Nuñez, Rogelio",
                title: "Contador Público Nacional",
                legajo: "5342- L. 4- F. 10/11",
                image: "/img/profile/rogelio.jpg"
            },
            {
                name: "Caballero, Juan Marcelo",
                title: "Adm. de Empresas",
                legajo: "9071-L.06-F.36/37",
                image: "/img/profile/Marcelo.jpg"
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
    },
    "tec-refrigeracion-aire-acondicionado": {
        id: "tec-refrigeracion-aire-acondicionado",
        title: "Refrigeración y Aire Acondicionado",
        icon: "Wrench",
        description: "Habilidades y conocimiento en reparación de heladeras y aires acondicionados e instalación domiciliaria.",
        longDescription: "Formación integral en refrigeración y aire acondicionado con enfoque en la reparación de heladeras y aires acondicionados y la instalación domiciliaria. Preparación para el desempeño en el servicio técnico y la instalación de equipos de refrigeración domiciliarios y comerciales.",
        duration: "2 años",
        modality: "Presencial",
        perfilEgresado: [
            "Reparación de heladeras y aires acondicionados",
            "Instalación domiciliaria"
        ],
        syllabus: [
            {
                year: "1° Año",
                subjects: [
                    "Reparación de Heladeras y Aires Acondicionados",
                    "Instalación Domiciliaria"
                ]
            }
        ],
        teachers: [
            {
                name: "Lain, Francisco Javier",
                title: "Técnico Medio en Equip. e Instalac. Electromecan."
            },
            {
                name: "Tores, Catriel",
                title: "Téc. Medio en Equipos e Instal. Elect.",
                legajo: "14057-L8-F44/45"
            }
        ],
        schedule: "De Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Reparación de heladeras y aires acondicionados",
            "Instalación domiciliaria"
        ]
    },
    "tec-industria-madera": {
        id: "tec-industria-madera",
        title: "Industria de la Madera",
        icon: "Hammer",
        description: "Habilidades y conocimiento en carpintería general, manipulación de herramientas y maquinarias, confección de mobiliarios en madera y MDF, diseño y realización de aberturas.",
        longDescription: "Formación integral en industria de la madera con enfoque en carpintería general, manipulación de herramientas y maquinarias, confección de mobiliarios en madera y MDF, y diseño y realización de aberturas. Preparación para el desempeño en mueblerías, empresas constructoras y talleres de confección y diseño de mobiliario.",
        duration: "2 años",
        modality: "Presencial",
        perfilEgresado: [
            "Carpintería general",
            "Manipulación de herramientas y maquinarias",
            "Confección de mobiliarios en madera y MDF",
            "Diseño y realización de aberturas"
        ],
        syllabus: [
            {
                year: "1° Año",
                subjects: [
                    "Carpintería General",
                    "Manipulación de Herramientas y Maquinarias",
                    "Confección de Mobiliarios en Madera y MDF",
                    "Diseño y Realización de Aberturas"
                ]
            }
        ],
        teachers: [
            {
                name: "Fernandez, Mauricio",
                title: "Auxiliar Tec. en Industria de la Mad.",
                legajo: "1184-L-06, F-193/193"
            },
            {
                name: "Molina, Ricardo Fabio",
                title: "Profesional Técnico Carpintero",
                legajo: "5963- L.4 - F.76/77"
            },
            {
                name: "Rodriguez, Juan Ramon",
                title: "PROF. TÉC.CARPINTERO – Cat. I y II",
                legajo: "L: 05 Folio: 160/161"
            }
        ],
        schedule: "De Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Mueblería y confección de mobiliarios",
            "Empresas constructoras",
            "Diseño de mobiliario"
        ]
    },
    "tec-gastronomia-profesional": {
        id: "tec-gastronomia-profesional",
        title: "Gastronomía Profesional",
        icon: "ChefHat",
        description: "Habilidades y conocimiento en panificación, técnicas de decorado, parrilla, conservas y cocina para celíacos y diabéticos.",
        longDescription: "Formación integral en gastronomía profesional con enfoque en panificación, técnicas de decorado, parrilla, conservas y cocina para celíacos y diabéticos. Preparación para el desempeño en panaderías, restaurantes, cocina de alta montaña, cocinas industriales, pastelerías y emprendimientos personales.",
        duration: "2 años",
        modality: "Presencial",
        perfilEgresado: [
            "Panificación",
            "Técnicas de decorado",
            "Parrilla",
            "Conservas",
            "Cocina para celíacos y diabéticos"
        ],
        syllabus: [
            {
                year: "1° Año",
                subjects: [
                    "Panificación",
                    "Técnicas de Decorado",
                    "Parrilla",
                    "Conservas",
                    "Cocina para Celíacos y Diabéticos"
                ]
            }
        ],
        teachers: [
            {
                name: "Herrero, Mercedes",
                title: "Tecnico Superior en Gastronomia",
                legajo: "8673-L-05-F-146/147"
            },
            {
                name: "Navas, Nélida",
                title: "Tec.Univ.en Gestión Gastronómica",
                legajo: "9352-L.06- F.10/11"
            }
        ],
        schedule: "De Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Panaderías",
            "Restaurantes",
            "Cocina de alta montaña",
            "Cocinas industriales",
            "Pastelerías",
            "Emprendimientos personales"
        ]
    },
    "tec-electronica-general-industrial": {
        id: "tec-electronica-general-industrial",
        title: "Electrónica General e Industrial",
        icon: "Cpu",
        description: "Especialización en audio y video, mantenimiento de PC, cálculos y dimensionamientos.",
        longDescription: "Formación integral en electrónica general e industrial con especialización en audio y video, mantenimiento de PC y cálculos y dimensionamientos. Preparación para el desempeño en servicio y mantenimiento de PC, mantenimiento industrial, instalación y mantenimiento de sistemas de audio e imágenes y comercio de electrónica.",
        duration: "2 años",
        modality: "Presencial",
        perfilEgresado: [
            "Especialización en audio y video",
            "Mantenimiento de PC",
            "Cálculos y dimensionamientos"
        ],
        syllabus: [
            {
                year: "1° Año",
                subjects: [
                    "Especialización en Audio y Video",
                    "Mantenimiento de PC",
                    "Cálculos y Dimensionamientos"
                ]
            }
        ],
        teachers: [
            {
                name: "Calderón, Marcelo Fabián",
                title: "Téc. Electrónico",
                legajo: "5515 - L. 4 - F. 30/31"
            },
            {
                name: "Rivas, Alejandro",
                title: "Ingeniero Electromecanico",
                legajo: "10354- L-06- F-82/83"
            },
            {
                name: "Varas, Mario Miguel",
                title: "Tec.en Electronica Gral. e Industrial",
                legajo: "13598-L-07-F-192/193"
            }
        ],
        schedule: "De Lunes a Jueves de 20:30hs a 23:15hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$50.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: [
            "Servicio y mantenimiento de PC",
            "Mantenimiento industrial",
            "Instalación y mantenimiento de sistemas de audio e imágenes",
            "Comercio de electrónica"
        ]
    },
    "curso-instalacion-paneles": {
        id: "curso-instalacion-paneles",
        title: "Instalación de Paneles Solares",
        icon: "Sun",
        description: "Aprendé a instalar y mantener sistemas de energía solar fotovoltaica.",
        longDescription: "Curso completo de instalación de paneles solares que te prepara para instalar, configurar y mantener sistemas fotovoltaicos. Capacitación práctica con tecnología actual del mercado.",
        duration: "3 meses",
        modality: "Virtual",
        category: "curso-virtual",
        perfilEgresado: ["Instalación de paneles solares", "Mantenimiento de sistemas fotovoltaicos", "Diseño de instalaciones", "Normativas de seguridad"],
        syllabus: [{ year: "Nivel Único", subjects: ["Fundamentos de Energía Solar", "Instalación de Paneles", "Mantenimiento", "Normativas"] }],
        teachers: [{ name: "Especialista en Energía Solar", title: "Técnico en Sistemas Fotovoltaicos" }],
        schedule: "Plataforma disponible 24/7",
        inscriptionDate: "Agosto 2026",
        inscriptionFee: "$25.000",
        inscriptionDocs: "DNI",
        salidaLaboral: ["Instalador solar", "Mantenimiento de sistemas fotovoltaicos", "Consultor energético", "Emprendimientos verdes"]
    },
    "curso-danza": {
        id: "curso-danza",
        title: "Curso de Danza",
        icon: "Music",
        description: "Aprendé técnicas de danza contemporánea, folclórica y urbana con profesores especializados.",
        longDescription: "Curso integral de danza que abarca múltiples estilos y expresiones artísticas. Desarrollá coordinación, ritmo y expresión corporal en un ambiente divertido y profesional.",
        duration: "3 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Expresión corporal", "Técnicas de danza contemporánea", "Danza folclórica", "Danza urbana"],
        syllabus: [{ year: "Nivel Único", subjects: ["Danza Contemporánea", "Danza Folclórica", "Danza Urbana", "Expresión Corporal"] }],
        teachers: [{ name: "Instructor de Danza", title: "Profesor de Danza" }],
        schedule: "Martes y Jueves 18:00 a 20:00hs",
        inscriptionDate: "Agosto 2026",
        inscriptionFee: "$15.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Instructor de danza", "Animación cultural", "Emprendimientos artísticos"]
    },
    "curso-estilismo-moda": {
        id: "curso-estilismo-moda",
        title: "Estilismo de Moda",
        icon: "Scissors",
        description: "Dominá el mundo de la moda con técnicas de estilismo, coordinación de outfits y tendencias actuales.",
        longDescription: "Curso completo de estilismo de moda que te prepara para asesorar imagen personal, crearlooks profesionales y trabajar en la industria de la moda.",
        duration: "4 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Asesoramiento de imagen", "Coordinación de outfits", "Tendencias de moda", "Styling personal y profesional"],
        syllabus: [{ year: "Nivel Único", subjects: ["Fundamentos de Estilismo", "Tendencias Actuales", "Asesoramiento de Imagen", "Styling Profesional"] }],
        teachers: [{ name: "Instructora de Moda", title: "Estilista Profesional" }],
        schedule: "Lunes y Miércoles 19:00 a 21:00hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$20.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Estilista personal", "Asesor de imagen", "Moda y retail", "Producción de eventos"]
    },
    "curso-franquicia-septiembre": {
        id: "curso-franquicia-septiembre",
        title: "Franquicia",
        icon: "Building2",
        description: "Learné a emprender con una franquicia: gestión, administración y marketing para tu negocio.",
        longDescription: "Curso que te enseña todo lo necesario para montar y gestionar una franquicia exitosa. Desde la planificación estratégica hasta la operación diaria del negocio.",
        duration: "2 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Gestión de franquicias", "Planificación estratégica", "Administración de negocios", "Marketing comercial"],
        syllabus: [{ year: "Nivel Único", subjects: ["Introducción a Franquicias", "Plan de Negocio", "Gestión Operativa", "Marketing para Franquicias"] }],
        teachers: [{ name: "Experto en Franquicias", title: "Consultor de Negocios" }],
        schedule: "Viernes 18:00 a 21:00hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$18.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Emprendedor de franquicias", "Consultor de negocios", "Gestión de sucursales"]
    },
    "curso-higiene-seguridad": {
        id: "curso-higiene-seguridad",
        title: "Higiene y Seguridad",
        icon: "ShieldCheck",
        description: "Capacitación en normativas de higiene y seguridad laboral para ambientes de trabajo seguros.",
        longDescription: "Curso completo de higiene y seguridad en el trabajo. Aprendé a prevenir riesgos laborales, implementar normativas de seguridad y crear ambientes de trabajo seguros.",
        duration: "3 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Prevención de riesgos laborales", "Normativas de seguridad", "Gestión de seguridad industrial", "Primeros auxilios"],
        syllabus: [{ year: "Nivel Único", subjects: ["Riesgos Laborales", "Normativas de Seguridad", "Seguridad Industrial", "Primeros Auxilios"] }],
        teachers: [{ name: "Especialista en Seguridad", title: "Técnico en Seguridad Laboral" }],
        schedule: "Sábados 09:00 a 12:00hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$12.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Responsable de seguridad", "Auditor de seguridad", "Consultor en prevención"]
    },
    "curso-maquillaje-profesional": {
        id: "curso-maquillaje-profesional",
        title: "Maquillaje Profesional",
        icon: "Palette",
        description: "Dominá técnicas de maquillaje profesional para eventos, moda y belleza.",
        longDescription: "Curso intensivo de maquillaje profesional que cubre desde técnicas básicas hasta looks de alta costura. Prepará tu carrera en el mundo de la belleza y el maquillaje.",
        duration: "3 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Maquillaje para eventos", "Maquillaje de moda", "Técnicas de contouring", "Maquillaje de novias"],
        syllabus: [{ year: "Nivel Único", subjects: ["Técnicas Básicas", "Maquillaje de Eventos", "Maquillaje de Novias", "Maquillaje Artístico"] }],
        teachers: [{ name: "Maquilladora Profesional", title: "Especialista en Belleza" }],
        schedule: "Martes y Jueves 18:30 a 20:30hs",
        inscriptionDate: "Agosto 2026",
        inscriptionFee: "$18.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Maquilladora profesional", "Belleza y eventos", "Productora de moda", "Autónoma"]
    },
    "curso-peinado-profesional": {
        id: "curso-peinado-profesional",
        title: "Peinado Profesional",
        icon: "Sparkles",
        description: "Aprendé técnicas de peinado profesional para eventos, novias y Looks cotidianos.",
        longDescription: "Curso completo de peinado que abarca desde técnicas básicas hasta peinados de alta complejidad para eventos especiales. Desarrollá tu creatividad y habilidades manuales.",
        duration: "3 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Peinados para eventos", "Peinados de novias", "Técnicas de trenzado", "Peinados artísticos"],
        syllabus: [{ year: "Nivel Único", subjects: ["Técnicas Básicas", "Peinados de Novias", "Trenzado Profesional", "Peinados Artísticos"] }],
        teachers: [{ name: "Peinadora Profesional", title: "Especialista en Peinado" }],
        schedule: "Miércoles y Viernes 18:00 a 20:00hs",
        inscriptionDate: "Agosto 2026",
        inscriptionFee: "$15.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Peinadora profesional", "Belleza y eventos", "Cabeceras de moda", "Autónoma"]
    },
    "curso-plomero-cloaquista": {
        id: "curso-plomero-cloaquista",
        title: "Plomero Cloaquista",
        icon: "Wrench",
        description: "Capacitación completa en instalación y reparación de sistemas cloacales y de agua.",
        longDescription: "Curso técnico de plomería cloacal que te prepara para instalar, mantener y reparar sistemas de agua y desagüe. Habilidades prácticas para el mercado laboral.",
        duration: "4 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Instalación de sistemas cloacales", "Reparación de cañerías", "Mantenimiento de agua", "Técnicas de soldadura para plomería"],
        syllabus: [{ year: "Nivel Único", subjects: ["Sistemas Cloacales", "Instalación de Agua", "Reparación de Cañerías", "Soldadura para Plomería"] }],
        teachers: [{ name: "Plomero Profesional", title: "Técnico en Instalaciones" }],
        schedule: "Lunes a Jueves 20:00 a 22:00hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$22.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Plomero profesional", "Construcción", "Mantenimiento edilicio", "Autónomo"]
    },
    "curso-secretariado-administrativo": {
        id: "curso-secretariado-administrativo",
        title: "Secretariado Administrativo",
        icon: "Briefcase",
        description: "Herramientas administrativas y de gestión para desempeñarte en oficinas y consultorios.",
        longDescription: "Capacitación integral en organización de agendas, redacción administrativa, técnicas de archivo, facturación y atención al público de manera profesional.",
        duration: "6 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Gestión administrativa", "Atención al público", "Manejo de office", "Facturación y archivo"],
        syllabus: [{ year: "Nivel Único", subjects: ["Administración de Oficinas", "Manejo de Office", "Atención al Cliente", "Facturación"] }],
        teachers: [{ name: "Secretaria Ejecutiva", title: "Especialista en Administración" }],
        schedule: "Lunes a Viernes 18:00 a 20:00hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$16.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Secretaria administrativa", "Asistente ejecutivo", "Recepcionista", "Oficinas y consultorios"]
    },
    "curso-soldadura": {
        id: "curso-soldadura",
        title: "Soldadura",
        icon: "Flame",
        description: "Técnicas de soldadura industrial: MIG, MAG, TIG y soldadura por arco.",
        longDescription: "Curso técnico de soldadura que cubre las principales técnicas utilizadas en la industria. Preparación para el desempeño en talleres metalúrgicos, construcción e industria pesada.",
        duration: "3 meses",
        modality: "Presencial",
        category: "curso-presencial",
        perfilEgresado: ["Soldadura MIG/MAG", "Soldadura TIG", "Soldadura por arco", "Corte y preparación de metales"],
        syllabus: [{ year: "Nivel Único", subjects: ["Soldadura MIG/MAG", "Soldadura TIG", "Soldadura por Arco", "Corte de Metales"] }],
        teachers: [{ name: "Soldador Profesional", title: "Técnico en Soldadura" }],
        schedule: "Martes y Jueves 20:00 a 22:00hs",
        inscriptionDate: "Septiembre 2026",
        inscriptionFee: "$18.000",
        inscriptionDocs: "Fotocopia de DNI",
        salidaLaboral: ["Soldador industrial", "Construcción metalúrgica", "Talleres de soldadura", "Industria pesada"]
    }
};
