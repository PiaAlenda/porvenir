import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const EXCLUDE = new Set([path.join(PUBLIC_DIR, "icons", "escuela.png")]);
const IMAGE_RE = /\.(jpe?g|png)$/i;
const QUALITY = 80;

function cleanWebpName(file) {
    return file.replace(/(\.(jpe?g|png))+$/i, ".webp");
}

async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walk(full)));
        } else if (IMAGE_RE.test(entry.name) && !EXCLUDE.has(full)) {
            files.push(full);
        }
    }
    return files;
}

async function main() {
    const files = await walk(PUBLIC_DIR);
    let converted = 0;
    let skipped = 0;
    let bytesBefore = 0;
    let bytesAfter = 0;

    for (const file of files) {
        const outPath = path.join(path.dirname(file), cleanWebpName(path.basename(file)));

        if (outPath === file && file.toLowerCase().endsWith(".webp")) continue;

        try {
            await stat(outPath);
            console.warn(`SKIP (ya existe): ${path.relative(PUBLIC_DIR, outPath)}`);
            skipped++;
            continue;
        } catch {
            // el destino no existe, continuar
        }

        const inputStat = await stat(file);
        await sharp(file).webp({ quality: QUALITY }).toFile(outPath);
        const outputStat = await stat(outPath);

        await unlink(file);

        converted++;
        bytesBefore += inputStat.size;
        bytesAfter += outputStat.size;
        console.log(
            `OK: ${path.relative(PUBLIC_DIR, file)} -> ${path.relative(PUBLIC_DIR, outPath)} ` +
            `(${(inputStat.size / 1024).toFixed(1)} KB -> ${(outputStat.size / 1024).toFixed(1)} KB)`
        );
    }

    const savedMB = ((bytesBefore - bytesAfter) / (1024 * 1024)).toFixed(2);
    console.log(`\nListo: ${converted} convertidas, ${skipped} omitidas. Ahorro: ${savedMB} MB`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
