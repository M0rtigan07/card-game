// Comprueba que cada `import` relativo de js/ apunta a un archivo que existe.
// Uso (desde la carpeta del proyecto):   node tools/check-imports.mjs
//
// Compara el nombre EXACTO (mayúsculas incluidas), como hace Vercel/Linux, aunque
// Windows sea más permisivo. Si un archivo no está donde toca, te dice dónde lo ha visto.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, basename, relative, resolve, sep } from 'node:path';

const projectRoot = resolve(process.argv[2] ?? '.');
const jsRoot = join(projectRoot, 'js');

function walk(dir) {
    return readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

let allFiles;
try {
    allFiles = walk(jsRoot);
} catch {
    console.error(`❌ No encuentro la carpeta "js" en ${projectRoot}\n   Ejecuta el comando desde la carpeta del proyecto (la que contiene index.html).`);
    process.exit(1);
}

const rel = (p) => relative(projectRoot, p).split(sep).join('/');
const sources = allFiles.filter(f => f.endsWith('.js'));
const importRe = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;

const exactExists = (target) => {
    try { return readdirSync(dirname(target)).includes(basename(target)); } catch { return false; }
};

let checked = 0;
const problems = [];

for (const file of sources) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(importRe)) {
        checked++;
        const target = resolve(dirname(file), match[1]);
        if (exactExists(target)) continue;

        const wanted = basename(target).toLowerCase();
        const sameNameElsewhere = allFiles.filter(f => basename(f).toLowerCase() === wanted);
        problems.push({ from: rel(file), spec: match[1], expected: rel(target), found: sameNameElsewhere.map(rel) });
    }
}

// Nombres que solo se distinguen por mayúsculas (se pisan al copiarlos en Windows)
const byLower = new Map();
for (const f of allFiles) {
    const key = `${dirname(f)}/${basename(f).toLowerCase()}`;
    byLower.set(key, [...(byLower.get(key) ?? []), f]);
}
const clashes = [...byLower.values()].filter(list => list.length > 1);
const similar = new Map();
for (const f of sources) {
    const key = basename(f).toLowerCase();
    similar.set(key, [...(similar.get(key) ?? []), f]);
}
const lookAlikes = [...similar.values()].filter(list => list.length > 1 && new Set(list.map(f => basename(f))).size > 1);

if (problems.length === 0) {
    console.log(`✅ Los ${checked} imports de js/ apuntan a archivos que existen.`);
} else {
    console.log(`❌ ${problems.length} import(s) roto(s) de ${checked}:\n`);
    for (const p of problems) {
        console.log(`  • ${p.from}  importa  "${p.spec}"`);
        console.log(`      esperaba el archivo: ${p.expected}`);
        if (p.found.length) {
            console.log(`      pero he encontrado:  ${p.found.join(', ')}   ← muévelo/renómbralo a la ruta de arriba`);
        } else {
            console.log(`      y no existe en ninguna parte de js/   ← falta copiarlo`);
        }
    }
}

for (const list of [...clashes, ...lookAlikes]) {
    console.log(`\n⚠️  Nombres casi iguales (solo cambian mayúsculas): ${list.map(rel).join(' | ')}`);
}

process.exit(problems.length ? 1 : 0);
