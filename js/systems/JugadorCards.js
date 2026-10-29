// js/systems/PlayerCards.js
// Lógica del mazo y las cartas del jugador. No toca el DOM, así que se puede testear con `node --test`.
//
//   enemy = { hp, shield, poison? }
//   hero  = { health, maxHealth, shield }
// resolvePlayerCard modifica esos objetos y devuelve "eventos"
// ({ kind: 'damage' | 'heal' | 'shield' | 'poison' | 'draw' | 'energy', ... })
// para que la interfaz pueda narrar lo ocurrido.

import { CARD_LIBRARY, REWARD_CONFIG } from '../data/cardCatalog.js';
import { shuffle } from './EnemyAI.js';

const BY_ID = new Map(CARD_LIBRARY.map(card => [card.id, card]));

export const getCardTemplate = (id) => BY_ID.get(id);

/** Crea la carta con sus números reales para el nivel actual. */
export function instantiateCard(id, level) {
    const template = BY_ID.get(id);
    if (!template) throw new Error(`Carta desconocida: "${id}"`);

    const val = template.base + (template.perLevel ?? 0) * level;
    const desc = template.text
        .replace('{val}', String(val))
        .replace('{turns}', String(template.turns ?? 3));

    return { ...template, val, desc };
}

/** Aplica una carta jugada y devuelve lo que ha pasado. */
export function resolvePlayerCard(card, enemy, hero, { attackBonus = 0 } = {}) {
    const events = [];

    const strike = () => {
        const total = card.val + attackBonus;
        const absorbed = Math.min(enemy.shield || 0, total);
        const dealt = total - absorbed;
        enemy.shield = (enemy.shield || 0) - absorbed;
        enemy.hp -= dealt;
        events.push({ kind: 'damage', dealt, absorbed });
        return dealt;
    };

    switch (card.type) {
        case 'atk':
            strike();
            break;
        case 'drain': {
            const dealt = strike();
            const healed = Math.max(0, Math.min(dealt, hero.maxHealth - hero.health));
            hero.health += healed;
            if (healed > 0) events.push({ kind: 'heal', amount: healed });
            break;
        }
        case 'def':
            hero.shield += card.val;
            events.push({ kind: 'shield', amount: card.val });
            break;
        case 'heal': {
            const healed = Math.max(0, Math.min(card.val, hero.maxHealth - hero.health));
            hero.health += healed;
            events.push({ kind: 'heal', amount: healed });
            break;
        }
        case 'poison': {
            // Un veneno nuevo no se suma: refresca con el más fuerte y el más largo
            enemy.poison = {
                dmg: Math.max(card.val, enemy.poison?.dmg ?? 0),
                turns: Math.max(card.turns ?? 3, enemy.poison?.turns ?? 0)
            };
            events.push({ kind: 'poison', dmg: enemy.poison.dmg, turns: enemy.poison.turns });
            break;
        }
        case 'draw':
            events.push({ kind: 'draw', amount: card.val });
            break;
        case 'energy':
            events.push({ kind: 'energy', amount: card.val });
            break;
        default:
            console.warn(`[PlayerCards] Tipo de carta desconocido: "${card.type}"`);
    }

    return events;
}

/** Aplica el veneno de un combatiente al empezar su turno. Devuelve el daño hecho. */
export function tickPoison(unit) {
    if (!unit.poison) return 0;

    const { dmg } = unit.poison;
    unit.hp -= dmg;
    unit.poison.turns -= 1;
    if (unit.poison.turns <= 0) unit.poison = null;
    return dmg;
}

/**
 * Mazo del jugador: la colección que posee, más la pila de robo y el descarte del combate actual.
 * Se guardan solo ids; los números de cada carta se calculan al robarla (instantiateCard).
 */
export class PlayerDeck {
    constructor(starterIds, rng = Math.random) {
        this.rng = rng;
        this.cards = [...starterIds];
        this.drawPile = [];
        this.discardPile = [];
    }

    get collection() {
        return [...this.cards];
    }

    get counts() {
        return { drawPile: this.drawPile.length, discardPile: this.discardPile.length, total: this.cards.length };
    }

    addCard(id) {
        if (!BY_ID.has(id)) throw new Error(`Carta desconocida: "${id}"`);
        this.cards.push(id);
    }

    /** Al empezar un combate: todo el mazo baraja y el descarte se vacía. */
    startCombat() {
        this.drawPile = shuffle(this.cards, this.rng);
        this.discardPile = [];
    }

    /** Roba hasta n cartas; si se acaba la pila, baraja el descarte. */
    draw(n) {
        const drawn = [];
        while (drawn.length < n) {
            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) break;
                this.drawPile = shuffle(this.discardPile, this.rng);
                this.discardPile = [];
            }
            drawn.push(this.drawPile.pop());
        }
        return drawn;
    }

    discard(id) {
        if (id) this.discardPile.push(id);
    }
}

/**
 * Elige las cartas que se ofrecen tras un combate: distintas entre sí, sin las del mazo inicial,
 * solo de tu clase o neutras, y sin pasar del máximo de copias. Las raras salen más en plantas altas.
 */
export function rollRewards({ classKey, owned = [], level = 1, count = REWARD_CONFIG.count, rng = Math.random }) {
    const copies = (id) => owned.filter(x => x === id).length;

    const pool = CARD_LIBRARY.filter(card =>
        card.rarity !== 'starter'
        && (!card.classes || card.classes.includes(classKey))
        && copies(card.id) < REWARD_CONFIG.maxCopies
    );

    const weight = (card) => card.rarity === 'rare'
        ? REWARD_CONFIG.weights.rare + Math.floor(level / 3)
        : REWARD_CONFIG.weights[card.rarity];

    const picks = [];
    while (picks.length < count && pool.length > 0) {
        const total = pool.reduce((sum, card) => sum + weight(card), 0);
        let roll = rng() * total;
        let index = pool.findIndex(card => (roll -= weight(card)) < 0);
        if (index === -1) index = pool.length - 1;

        picks.push(pool[index].id);
        pool.splice(index, 1);
    }
    return picks;
}
