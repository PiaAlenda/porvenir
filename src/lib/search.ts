import type { Career } from "@/config/careerData";

/**
 * Normaliza texto para comparar: minúsculas, sin tildes ni diacríticos
 * ("Mecánica" -> "mecanica"), y espacios colapsados.
 */
export function normalizeSearchText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

const MAX_RESULTS = 6;

/**
 * Busca carreras/cursos por palabras.
 * - Cada palabra escrita debe aparecer (en cualquier orden) en alguno de los
 *   campos buscables, así "mecanica automotor" encuentra solo lo correcto.
 * - Ignora mayúsculas y tildes.
 * - Los resultados que coinciden en el título van primero.
 */
export function searchCareers(careers: Career[], rawQuery: string): Career[] {
    const tokens = normalizeSearchText(rawQuery)
        .split(" ")
        .filter(Boolean);
    if (tokens.length === 0) return [];

    const scored: { career: Career; score: number }[] = [];

    for (const career of careers) {
        const title = normalizeSearchText(career.title);
        const other = normalizeSearchText(
            [
                career.description,
                ...career.perfilEgresado,
                ...career.syllabus.flatMap((y) => y.subjects),
            ].join(" ")
        );
        const haystack = `${title} ${other}`;

        const everyTokenMatches = tokens.every((t) => haystack.includes(t));
        if (!everyTokenMatches) continue;

        // Puntaje: cuántas palabras aparecen en el título (más relevante).
        const titleHits = tokens.filter((t) => title.includes(t)).length;
        scored.push({ career, score: titleHits * 10 + (title.startsWith(tokens[0]) ? 5 : 0) });
    }

    scored.sort((a, b) => b.score - a.score || a.career.title.localeCompare(b.career.title, "es"));
    return scored.slice(0, MAX_RESULTS).map((s) => s.career);
}
