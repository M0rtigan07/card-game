// js/systems/Party.js
// El grupo de aliados que te acompañan. Lógica pura, sin DOM.

import { ALLIES } from '../data/allyCatalog.js';
import { PARTY } from '../data/gameConfig.js';

/** La habilidad del aliado convertida en una "carta" que el combate puede resolver (gratis y con tu nivel). */
export function buildAllyCard(ally, level) {
    const { ability } = ally;
    return {
        id: `ally_${ally.id}`,
        name: `${ability.name} (${ally.name})`,
        cost: 0,
        type: ability.type,
        val: ability.base + ability.perLevel * level,
        turns: ability.turns
    };
}

export class Party {
    constructor(max = PARTY.MAX, catalog = ALLIES) {
        this.max = max;
        this.catalog = catalog;
        this.members = []; // entradas del catálogo, en orden de llegada
    }

    has(id) { return this.members.some(member => member.id === id); }
    isFull() { return this.members.length >= this.max; }

    /** Añade un aliado. Devuelve { ok: true, ally } o { ok: false, reason: 'unknown' | 'already' | 'full' }. */
    recruit(id) {
        const ally = this.catalog[id];
        if (!ally) return { ok: false, reason: 'unknown' };
        if (this.has(id)) return { ok: false, reason: 'already' };
        if (this.isFull()) return { ok: false, reason: 'full' };

        this.members.push(ally);
        return { ok: true, ally };
    }

    /** Despide a un aliado. Devuelve false si no estaba en el grupo. */
    dismiss(id) {
        const index = this.members.findIndex(member => member.id === id);
        if (index === -1) return false;
        this.members.splice(index, 1);
        return true;
    }

    /** Qué aliados actúan en ese turno de combate (el 1 es el primero) y con qué carta. */
    actionsFor({ turn, level }) {
        return this.members
            .filter(ally => (turn - 1) % (ally.ability.every ?? 1) === 0)
            .map(ally => ({ ally, card: buildAllyCard(ally, level) }));
    }
}
