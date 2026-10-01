/**
 * Videos explicativos que ya estaban en el repo. Viven acá y no en un
 * componente para que `siteConfig` pueda usarlos como fallback cuando el
 * admin todavía no cargó un video propio para esa carrera.
 */
export const CAREER_VIDEOS: Record<string, string[]> = {
    "tec-mecanica-automotor": ["/videos/MECANICA AUTOMOTOR.webm"],
    "tec-metalmecanica": ["/videos/video metal mecanica.webm"],
    "tec-torneria-mecanica": ["/videos/torneria mecanica.webm"],
    "tec-dibujo-publicitario": ["/videos/video dibujo.webm"],
    "tec-administracion-contable": ["/videos/administracion contable.webm"],
    "tec-refrigeracion-aire-acondicionado": ["/videos/Refrigeracion.webm"],
    "tec-electronica-domiciliaria": ["/videos/Electricidad domiciliaria.webm"],
    "tec-industria-madera": ["/videos/Carrera Industria de la madera.webm"],
    "tec-reparacion-pc": ["/videos/Reparacion de PC.webm"],
    "tec-gastronomia-profesional": ["/videos/video gastronomia.webm"],
};
