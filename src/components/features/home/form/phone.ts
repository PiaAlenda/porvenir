import {
    getCountries,
    getCountryCallingCode,
    Metadata,
    type CountryCode,
} from "libphonenumber-js"

export interface CountryEntry {
    iso: string
    name: string
    callingCode: string
}

const COUNTRY_NAMES: Record<string, string> = {
    // América del Sur
    AR: "Argentina",
    BO: "Bolivia",
    BR: "Brasil",
    CL: "Chile",
    CO: "Colombia",
    EC: "Ecuador",
    GY: "Guyana",
    PY: "Paraguay",
    PE: "Perú",
    SR: "Surinam",
    UY: "Uruguay",
    VE: "Venezuela",
    // América del Norte y Central
    CA: "Canadá",
    US: "Estados Unidos",
    MX: "México",
    BZ: "Belice",
    CR: "Costa Rica",
    CU: "Cuba",
    DO: "República Dominicana",
    SV: "El Salvador",
    GT: "Guatemala",
    HN: "Honduras",
    NI: "Nicaragua",
    PA: "Panamá",
    PR: "Puerto Rico",
    HT: "Haití",
    JM: "Jamaica",
    TT: "Trinidad y Tobago",
    // Europa
    GB: "Reino Unido",
    IE: "Irlanda",
    PT: "Portugal",
    ES: "España",
    FR: "Francia",
    BE: "Bélgica",
    NL: "Países Bajos",
    LU: "Luxemburgo",
    DE: "Alemania",
    AT: "Austria",
    CH: "Suiza",
    LI: "Liechtenstein",
    IT: "Italia",
    VA: "Vaticano",
    SM: "San Marino",
    MC: "Mónaco",
    AD: "Andorra",
    MT: "Malta",
    CY: "Chipre",
    GR: "Grecia",
    DK: "Dinamarca",
    NO: "Noruega",
    SE: "Suecia",
    FI: "Finlandia",
    IS: "Islandia",
    EE: "Estonia",
    LV: "Letonia",
    LT: "Lituania",
    PL: "Polonia",
    CZ: "República Checa",
    SK: "Eslovaquia",
    HU: "Hungría",
    RO: "Rumania",
    BG: "Bulgaria",
    HR: "Croacia",
    BA: "Bosnia y Herzegovina",
    RS: "Serbia",
    SI: "Eslovenia",
    MK: "Macedonia",
    AL: "Albania",
    UA: "Ucrania",
    BY: "Bielorrusia",
    RU: "Rusia",
    TR: "Turquía",
    // Asia y Medio Oriente
    IL: "Israel",
    AE: "Emiratos Árabes",
    SA: "Arabia Saudita",
    QA: "Catar",
    KW: "Kuwait",
    BH: "Bahréin",
    OM: "Omán",
    JO: "Jordania",
    LB: "Líbano",
    SY: "Siria",
    IQ: "Irak",
    IR: "Irán",
    IN: "India",
    PK: "Pakistán",
    BD: "Bangladés",
    LK: "Sri Lanka",
    NP: "Nepal",
    CN: "China",
    HK: "Hong Kong",
    TW: "Taiwán",
    JP: "Japón",
    KR: "Corea del Sur",
    SG: "Singapur",
    MY: "Malasia",
    TH: "Tailandia",
    VN: "Vietnam",
    PH: "Filipinas",
    ID: "Indonesia",
    KZ: "Kazajistán",
    UZ: "Uzbekistán",
    GE: "Georgia",
    AM: "Armenia",
    AZ: "Azerbaiyán",
    // África
    EG: "Egipto",
    MA: "Marruecos",
    TN: "Túnez",
    DZ: "Argelia",
    NG: "Nigeria",
    GH: "Ghana",
    CI: "Costa de Marfil",
    SN: "Senegal",
    KE: "Kenia",
    ET: "Etiopía",
    TZ: "Tanzania",
    ZA: "Sudáfrica",
    // Oceanía
    AU: "Australia",
    NZ: "Nueva Zelanda",
}

export const COUNTRIES: CountryEntry[] = getCountries()
    .filter((iso) => COUNTRY_NAMES[iso])
    .map((iso) => ({
        iso,
        name: COUNTRY_NAMES[iso],
        callingCode: `+${getCountryCallingCode(iso as CountryCode)}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"))

export function flagEmoji(iso: string): string {
    return iso
        .toUpperCase()
        .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
}

export function detectCountry(): string {
    try {
        const parts = (navigator.language || "es-AR").toUpperCase().replace(/_/g, "-").split("-")
        const iso = parts[parts.length - 1]
        if (/^[A-Z]{2}$/.test(iso) && COUNTRIES.some((c) => c.iso === iso)) return iso
    } catch {
        // fallback
    }
    return "AR"
}

const maxLengthCache = new Map<string, number>()

export function maxNationalDigits(iso: string): number {
    const cached = maxLengthCache.get(iso)
    if (cached !== undefined) return cached

    let max = 15
    try {
        const metadata = new Metadata()
        metadata.selectNumberingPlan(iso as CountryCode)
        const plan = metadata.numberingPlan as
            | {
                  possibleLengths(): number[]
                  nationalPrefix?: () => string | undefined
              }
            | undefined
        const possible = (plan?.possibleLengths() ?? []) as number[]
        const top = possible.reduce((a, b) => Math.max(a, b), 0)
        const hasPrefix = Boolean(plan?.nationalPrefix?.())
        max = top > 0 ? top + (hasPrefix ? 1 : 0) : 15
    } catch {
        // fallback
    }
    if (max < 4) max = 15
    maxLengthCache.set(iso, max)
    return max
}