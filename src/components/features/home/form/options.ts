export const PAISES = [
    "Argentina",
    "Bolivia",
    "Brasil",
    "Chile",
    "Colombia",
    "Paraguay",
    "Perú",
    "Uruguay",
    "Venezuela",
    "Otro",
]

export const NACIONALIDADES = [
    "Argentina",
    "Boliviana",
    "Brasileña",
    "Chilena",
    "Colombiana",
    "Paraguaya",
    "Peruana",
    "Uruguaya",
    "Venezolana",
    "Otra",
]

export const PROVINCIAS_ARGENTINA = [
    "Buenos Aires",
    "Ciudad Autónoma de Buenos Aires",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
    "Tucumán",
]

export const DEPARTAMENTOS_SAN_JUAN = [
    "Capital",
    "Rawson",
    "Chimbas",
    "Rivadavia",
    "Santa Lucía",
    "Pocito",
    "Caucete",
    "Albardón",
    "Sarmiento",
    "25 de Mayo",
    "Jáchal",
    "San Martín",
    "Calingasta",
    "9 de Julio",
    "Angaco",
    "Valle Fértil",
    "Ullum",
    "Iglesia",
    "Zonda",
]

export const DISCAPACIDAD = ["No", "Sí"]

/**
 * `c_sexo` se guarda con el código corto porque es lo que viaja en el payload.
 * Esta es la única fuente de verdad de qué código es qué texto: la usan la
 * ficha del alumno del panel y la exportación a Excel, para que un `F` nunca
 * se lea de dos maneras distintas.
 */
export const SEXO_LABELS: Record<string, string> = {
    M: "Masculino",
    F: "Femenino",
    X: "Otro",
}

/** Texto visible de un código de sexo, o el mismo código si no está en el catálogo. */
export function sexoLabel(codigo?: string): string {
    if (!codigo) return "—"
    return SEXO_LABELS[codigo] ?? codigo
}

export const PUEBLOS_INDIGENAS = [
    "Ninguno",
    "Kolla",
    "Wichí",
    "Guaraní",
    "Mapuche",
    "Diaguita",
    "Comechingón",
    "Huarpe",
    "Toba/Qom",
    "Otro",
]

export const ESPECIALIDADES = [
    "General / Sin especialidad",
    "Electricidad",
    "Carpintería",
    "Gastronomía / Cocina",
    "Peluquería y Estética",
    "Corte y Confección Textil",
    "Computación e Informática",
    "Administración y Comercio",
    "Mecánica",
    "Manualidades y Artesanías",
]
