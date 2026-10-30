// js/systems/DialogueMemory.js
// Recuerda lo último que dijo cada personaje para no repetirse. Lógica pura, sin DOM.

const normalize = (line) => String(line ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // sin tildes: "qué" y "que" cuentan como la misma palabra
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export class DialogueMemory {
    constructor({ limit = 6, rng = Math.random } = {}) {
        this.limit = limit;
        this.rng = rng;
        this.lines = new Map(); // speakerId -> [líneas, de la más antigua a la más reciente]
    }

    remember(speakerId, line) {
        const list = this.lines.get(speakerId) ?? [];
        list.push(line);
        while (list.length > this.limit) list.shift();
        this.lines.set(speakerId, list);
    }

    /** Últimas frases de ese personaje (de la más antigua a la más reciente). */
    recent(speakerId) {
        return [...(this.lines.get(speakerId) ?? [])];
    }

    /** ¿Ya dijo esa frase hace poco? Ignora mayúsculas, tildes y puntuación. */
    has(speakerId, line) {
        const target = normalize(line);
        return this.recent(speakerId).some(previous => normalize(previous) === target);
    }

    /** Elige una frase del banco que no haya dicho hace poco; si las ha dicho todas, la que lleve más tiempo sin decir. */
    pick(speakerId, pool) {
        if (!pool || pool.length === 0) return null;

        const seen = this.recent(speakerId).map(normalize);
        const age = (line) => seen.lastIndexOf(normalize(line)); // -1 = no dicha; menor = más antigua
        const lowest = Math.min(...pool.map(age));
        const candidates = pool.filter(line => age(line) === lowest);

        return candidates[Math.floor(this.rng() * candidates.length)];
    }
}
