// Comprueba que todas las imágenes que nombra el código existen en disco (mayúsculas incluidas).
// Uso (desde la carpeta del proyecto, la que contiene index.html y la carpeta img):   node tools/check-images.mjs
//
// Si una imagen no está donde toca, te dice dónde la ha visto para que la muevas o corrijas la ruta.
// Windows no distingue mayúsculas, pero Vercel (Linux) sí: aquí se compara el nombre EXACTO.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

const projectRoot = resolve(process.argv[2] ?? '.');
const jsRoot = join(projectRoot, 'js');
const imgRoot = join(projectRoot, 'img');

const walk = (dir) => readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
});

let sources, onDisk;
try {
    sources = walk(jsRoot).filter(f => f.endsWith('.js'));
    onDisk = walk(imgRoot);
} catch {
    console.error('❌ No encuentro las carpetas "js" e "img". Ejecuta el comando desde la carpeta del proyecto (la que contiene index.html).');
    process.exit(1);
}

const rel = (p) => relative(projectRoot, p).split(sep).join('/');
const exact = new Set(onDisk.map(rel));
const byLowerName = new Map();
for (const file of onDisk) {
    const key = basename(file).toLowerCase();
    byLowerName.set(key, [...(byLowerName.get(key) ?? []), rel(file)]);
}

const refs = new Map(); // ruta -> archivos que la usan
for (const file of sources) {
    for (const match of readFileSync(file, 'utf8').matchAll(/['"`](img\/[^'"`$]+?\.(?:png|jpe?g|gif|webp|svg))['"`]/gi)) {
        refs.set(match[1], [...new Set([...(refs.get(match[1]) ?? []), rel(file)])]);
    }
}

const missing = [...refs.keys()].filter(path => !exact.has(path)).sort();

if (missing.length === 0) {
    console.log(`✅ Las ${refs.size} imágenes que nombra el código existen en disco.`);
    process.exit(0);
}

console.log(`❌ Faltan ${missing.length} de ${refs.size} imágenes:\n`);
for (const path of missing) {
    console.log(`  • ${path}`);
    console.log(`      la usa: ${refs.get(path).join(', ')}`);
    const similar = byLowerName.get(basename(path).toLowerCase());
    if (similar?.length) console.log(`      pero he encontrado: ${similar.join(', ')}   ← muévela o corrige la ruta`);
    else console.log('      y no existe en ninguna parte de img/   ← falta copiarla');
}
process.exit(1);
