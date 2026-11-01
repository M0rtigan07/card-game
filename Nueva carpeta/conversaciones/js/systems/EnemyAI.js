// js/systems/EnemyAI.js
// Lógica del mazo enemigo. No toca el DOM, así que se puede testear con `node --test`.
//
// Estructuras que recibe:
//   enemy = { hp, maxHp, atk, atkBonus?, shield }
//   hero  = { health, shield, poison: { dmg, turns } | null }
// Las funciones las modifican directamente y devuelven una lista de "eventos"
// ({ kind: 'damage' | 'shield' | 'heal' | 'poison' | 'buff', ... }) para que
// la interfaz pueda contarle al jugador qué ha pasado.

import { ENEMY_DECKS, DEFAULT_DECK_ID } from '../data/enemyDecks.js';

const DEFAULT_ATK = 10;
const HEAL_ONLY_BELOW = 0.6;  // no se cura si tiene más del 60 % de vida
const MAX_BUFF_STACKS = 2;    // máximo de veces que acumula un mismo buff

export const effectiveAtk = (enemy) => (enemy.atk ?? DEFAULT_ATK) + (enemy.atkBonus || 0);

const damageOf = (card, enemy) => Math.max(1, Math.round(effectiveAtk(enemy) * (card.power ?? 1)));

export function expandDeck(deckId) {
    const cards = ENEMY_DECKS[deckId] ?? ENEMY_DECKS[DEFAULT_DECK_ID];
    return cards.flatMap(card => Array.from({ length: card.copies ?? 1 }, () => ({ ...card })));
}

export function shuffle(list, rng = Math.random) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/** Texto del efecto con los números ya calculados para ESTE enemigo. */
export function describeCard(card, enemy) {
    const dmg = damageOf(card, enemy);
    switch (card.type) {
        case 'atk': return `Inflige ${dmg} de daño`;
        case 'multi': return `${card.hits ?? 2} golpes de ${dmg} de daño`;
        case 'drain': return `Inflige ${dmg} y roba hasta ${Math.round(dmg * (card.leech ?? 1))} de vida`;
        case 'def': return `Gana ${card.val} de escudo`;
        case 'heal': return `Recupera ${card.val} de vida`;
        case 'poison': return `Te envenena: ${card.val} de daño durante ${card.turns ?? 3} turnos`;
        case 'buff': return `Su ataque sube +${card.val}`;
        default: return '';
    }
}

function hitHero(hero, amount) {
    const absorbed = Math.min(hero.shield, amount);
    hero.shield -= absorbed;
    const dealt = amount - absorbed;
    hero.health -= dealt;
    return { absorbed, dealt };
}

function healEnemy(enemy, amount) {
    const healed = Math.max(0, Math.min(amount, enemy.maxHp - enemy.hp));
    enemy.hp += healed;
    return healed;
}

/** Aplica una carta enemiga. Devuelve los eventos para narrarla. */
export function resolveEnemyCard(card, enemy, hero) {
    const events = [];

    switch (card.type) {
        case 'atk': {
            const { absorbed, dealt } = hitHero(hero, damageOf(card, enemy));
            events.push({ kind: 'damage', hits: 1, dealt, absorbed });
            break;
        }
        case 'multi': {
            const hits = card.hits ?? 2;
            const perHit = damageOf(card, enemy);
            let dealt = 0, absorbed = 0;
            for (let i = 0; i < hits; i++) {
                const r = hitHero(hero, perHit);
                dealt += r.dealt;
                absorbed += r.absorbed;
            }
            events.push({ kind: 'damage', hits, dealt, absorbed });
            break;
        }
        case 'drain': {
            const { absorbed, dealt } = hitHero(hero, damageOf(card, enemy));
            events.push({ kind: 'damage', hits: 1, dealt, absorbed });
            const healed = healEnemy(enemy, Math.round(dealt * (card.leech ?? 1)));
            if (healed > 0) events.push({ kind: 'heal', amount: healed });
            break;
        }
        case 'def':
            enemy.shield = (enemy.shield || 0) + card.val;
            events.push({ kind: 'shield', amount: card.val });
            break;
        case 'heal':
            events.push({ kind: 'heal', amount: healEnemy(enemy, card.val) });
            break;
        case 'poison': {
            // Un veneno nuevo no se suma: refresca con el más fuerte y el más largo
            hero.poison = {
                dmg: Math.max(card.val, hero.poison?.dmg ?? 0),
                turns: Math.max(card.turns ?? 3, hero.poison?.turns ?? 0)
            };
            events.push({ kind: 'poison', dmg: hero.poison.dmg, turns: hero.poison.turns });
            break;
        }
        case 'buff':
            enemy.atkBonus = (enemy.atkBonus || 0) + card.val;
            events.push({ kind: 'buff', amount: card.val });
            break;
        default:
            console.warn(`[EnemyAI] Tipo de carta desconocido: "${card.type}"`);
    }

    return events;
}

/**
 * Aplica una fase de jefe (ver data/bossCatalog.js): bonos inmediatos y cartas nuevas para su mazo.
 * Devuelve la lista de bonos aplicados, para poder narrarlos.
 */
export function applyPhase(enemy, phase, brain) {
    const applied = [];

    if (phase.atkBonus) {
        enemy.atkBonus = (enemy.atkBonus || 0) + phase.atkBonus;
        applied.push({ kind: 'buff', amount: phase.atkBonus });
    }
    if (phase.armor) enemy.armor = (enemy.armor || 0) + phase.armor;
    if (phase.shield) {
        enemy.shield = (enemy.shield || 0) + phase.shield;
        applied.push({ kind: 'shield', amount: phase.shield });
    }
    if (phase.heal) {
        const healed = healEnemy(enemy, phase.heal);
        if (healed > 0) applied.push({ kind: 'heal', amount: healed });
    }
    if (phase.addCards?.length) brain?.addCards(phase.addCards);

    return applied;
}

// Evita jugadas inútiles (curarse con la vida llena, acumular furia sin fin...)
function isUseful(card, enemy, hero) {
    switch (card.type) {
        case 'heal': return enemy.hp <= enemy.maxHp * HEAL_ONLY_BELOW;
        case 'buff': return (enemy.atkBonus || 0) < card.val * MAX_BUFF_STACKS;
        case 'poison': return (hero?.poison?.turns ?? 0) < 2;
        default: return true;
    }
}

export class EnemyBrain {
    constructor(deckId, rng = Math.random) {
        this.deckId = deckId;
        this.rng = rng;
        this.drawPile = shuffle(expandDeck(deckId), rng);
        this.discard = [];
        this.intent = null; // la carta que jugará en su próximo turno
    }

    get cardsLeft() {
        return this.drawPile.length;
    }

    /** Mete cartas nuevas en el mazo (por ejemplo al cambiar de fase). Se barajan con las que quedan y ya no se pierden. */
    addCards(cards) {
        const added = cards.flatMap(card => Array.from({ length: card.copies ?? 1 }, () => ({ ...card })));
        this.drawPile = shuffle([...this.drawPile, ...added], this.rng);
    }

    /** Roba la próxima jugada, descartando mentalmente las inútiles. */
    drawIntent(enemy, hero) {
        if (this.drawPile.length === 0) {
            this.drawPile = shuffle(this.discard, this.rng);
            this.discard = [];
        }
        if (this.drawPile.length === 0) {
            this.drawPile = shuffle(expandDeck(this.deckId), this.rng);
        }

        let index = this.drawPile.findIndex(card => isUseful(card, enemy, hero));
        if (index === -1) index = 0;

        this.intent = this.drawPile.splice(index, 1)[0];
        return this.intent;
    }

    /** Juega la carta anunciada y la manda al descarte. */
    play(enemy, hero) {
        if (!this.intent) this.drawIntent(enemy, hero);
        const card = this.intent;
        const events = resolveEnemyCard(card, enemy, hero);
        this.discard.push(card);
        this.intent = null;
        return { card, events };
    }
}
