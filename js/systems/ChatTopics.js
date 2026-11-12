// js/systems/ChatTopics.js
// Lógica pura de las conversaciones: qué temas hay, qué datos reales se le pasan a la IA y cómo se limpia lo que escribes.
// No toca el DOM, así que se puede testear con `node --test`.

import { CHAT_TOPICS, GENERAL_TOPICS, NPC_TOPICS } from '../data/topicCatalog.js';
import { BOSS, CHAT } from '../data/gameConfig.js';
import { ENEMY_DECKS } from '../data/enemyDecks.js';
import { ALLIES } from '../data/allyCatalog.js';
import { getBossForFloor } from './Bosses.js';
import { getItem, itemIdForAction } from './Items.js';

/** Temas que ofrece ese personaje: los generales, los suyos y, si puede ser tu aliado, el de sus valores. Cada tema trae `pool`, la clave de su banco de respaldo. */
export function topicsFor(npc) {
    const ids = [...GENERAL_TOPICS, ...(NPC_TOPICS[npc.id] ?? []), ...(ALLIES[npc.id] ? ['values'] : [])];
    return ids.map(id => ({ ...CHAT_TOPICS[id], pool: `chat_${id}` }));
}

/** Planta del próximo jefe (la propia planta si es de jefe). */
export const nextBossFloor = (floor) => Math.ceil(Math.max(1, floor) / BOSS.EVERY) * BOSS.EVERY;

const withoutEmoji = (name) => name.replace(/^[^\p{L}]+/u, '');

/** Datos del próximo jefe, para que el PNJ los cuente a su manera. */
export function bossFacts(floor) {
    const bossFloor = nextBossFloor(floor);
    const boss = getBossForFloor(bossFloor);
    const away = bossFloor - floor;

    const where = away === 0 ? 'En esta misma planta espera un jefe'
        : away === 1 ? 'En la planta siguiente espera un jefe'
            : `A ${away} plantas de aquí espera un jefe`;

    const facts = [
        `${where}: ${boss.name}, ${boss.archetype}.`,
        `Empieza cada uno de sus turnos con ${boss.armor} de guardia que hay que romper.`
    ];
    for (const phase of boss.phases.slice(0, 2)) {
        facts.push(`Cuando le queda un ${Math.round(phase.at * 100)} % de vida, ${phase.announce}.`);
    }
    const plays = ENEMY_DECKS[boss.deckId].slice(0, 3).map(card => withoutEmoji(card.name));
    facts.push(`Entre sus jugadas se cuentan: ${plays.join(', ')}.`);
    return facts;
}

/** Consejos de verdad según cómo va tu héroe (máximo 4). */
export function adviceFacts(player) {
    const facts = [];
    const consumables = player.inventory.filter(entry => entry.kind === 'consumable');

    if (player.health < player.maxHealth * 0.5) facts.push('El héroe está malherido: le convendría curarse antes de seguir.');
    if (consumables.length === 0) facts.push('El héroe no lleva pociones ni consumibles.');
    else facts.push('El héroe lleva consumibles que puede gastar con el botón "Usar" de su inventario, sin coste de energía.');
    if ((player.deckSize ?? 0) > 0 && player.deckSize <= 5) facts.push('Su mazo todavía es pequeño: ganar combates le ofrece cartas nuevas.');
    facts.push('Cada enemigo anuncia su próxima jugada antes de hacerla: conviene mirarla antes de decidir.');
    facts.push('La energía por turno es limitada: no se pueden jugar todas las cartas, hay que elegir.');

    return facts.slice(0, 4);
}

/** Lo que ese personaje vende de verdad a un héroe de esa clase. */
export function waresFacts(npc, classKey) {
    const choices = npc.interactions?.[classKey]?.choices ?? npc.interactions?.choices ?? npc.interactions?.warrior?.choices ?? [];
    const ids = [...new Set(choices.map(choice => itemIdForAction(choice.action)).filter(Boolean))];

    const facts = ids.map(getItem).filter(Boolean).map(item => `Vendes ${item.name} por ${item.price} de oro: ${item.effect}.`);
    return facts.length ? facts : ['Ahora mismo no tienes nada que ofrecer a este viajero.'];
}

/** Datos que acompañan a un tema (vacío si el tema no tiene). */
export function buildFacts(topic, { npc, player, floor }) {
    switch (topic.facts) {
        case 'advice': return adviceFacts(player);
        case 'boss': return bossFacts(floor);
        case 'wares': return waresFacts(npc, player.classKey);
        case 'values': return ALLIES[npc.id]?.values ?? [];
        default: return [];
    }
}

/** Limpia lo que escribe el jugador: sin caracteres de control ni espacios de más, y con tope de longitud. */
export function cleanChatInput(text, max = CHAT.MAX_INPUT) {
    return String(text ?? '')
        .replace(/[\u0000-\u001f\u007f]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
}
