// js/systems/Persuasion.js
// Convencer a un personaje para que se una a tu grupo. Lógica pura, sin DOM.
//
// Reglas: primero hay que conversar un poco con él (RAPPORT_TOPICS temas). Entonces puedes probar argumentos,
// cada uno una sola vez. Con NEEDED argumentos buenos se une; con BAD_LIMIT malos deja de escucharte.

import { ALLIES } from '../data/allyCatalog.js';
import { PERSUASION } from '../data/gameConfig.js';

export class Persuasion {
    constructor(catalog = ALLIES) {
        this.catalog = catalog;
        this.states = new Map(); // npcId -> { used, good, bad, locked, recruited }
    }

    isCandidate(npcId) { return Boolean(this.catalog[npcId]); }

    stateFor(npcId) {
        if (!this.states.has(npcId)) this.states.set(npcId, { used: new Set(), good: 0, bad: 0, locked: false, recruited: false });
        return this.states.get(npcId);
    }

    /** ¿Se puede intentar ahora? `asked` = temas que ya has hablado con él; `partyFull` = tu grupo está completo. */
    canTry(npcId, { asked, partyFull }) {
        if (!this.isCandidate(npcId)) return { ok: false, reason: 'no_ally' };
        const state = this.stateFor(npcId);
        if (state.recruited) return { ok: false, reason: 'recruited' };
        if (state.locked) return { ok: false, reason: 'locked' };
        if (asked < PERSUASION.RAPPORT_TOPICS) return { ok: false, reason: 'rapport' };
        if (partyFull) return { ok: false, reason: 'full' };
        return { ok: true };
    }

    argumentsFor(npcId) {
        const used = this.stateFor(npcId).used;
        return (this.catalog[npcId]?.arguments ?? []).map(arg => ({ id: arg.id, label: arg.label, used: used.has(arg.id) }));
    }

    /** Qué pasaría con ese argumento, sin cambiar nada. null si no existe o ya lo usaste. */
    evaluate(npcId, argId) {
        const ally = this.catalog[npcId];
        const arg = ally?.arguments.find(a => a.id === argId);
        const state = this.stateFor(npcId);
        if (!arg || state.used.has(argId) || state.locked || state.recruited) return null;

        const needed = ally.needed ?? PERSUASION.NEEDED;
        const badLimit = ally.badLimit ?? PERSUASION.BAD_LIMIT;

        return {
            good: arg.good,
            willRecruit: arg.good && state.good + 1 >= needed,
            willLock: !arg.good && state.bad + 1 >= badLimit
        };
    }

    /** Aplica el argumento. Devuelve el mismo resultado que evaluate, o null si no era válido. */
    commit(npcId, argId) {
        const result = this.evaluate(npcId, argId);
        if (!result) return null;

        const state = this.stateFor(npcId);
        state.used.add(argId);
        if (result.good) state.good += 1; else state.bad += 1;
        if (result.willRecruit) state.recruited = true;
        if (result.willLock) state.locked = true;
        return result;
    }
}
