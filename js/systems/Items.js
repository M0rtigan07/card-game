// js/systems/Items.js
// Lógica pura de los objetos: inventario, modificadores de las reliquias, uso de consumibles y botín.
// No toca el DOM, así que se puede testear con `node --test`.
//
// El inventario es player.inventory = [{ id, name, effect, kind, qty }].

import { ITEM_CATALOG, LOOT } from '../data/itemCatalog.js';

const BY_ID = new Map(ITEM_CATALOG.map(item => [item.id, item]));

export const getItem = (id) => BY_ID.get(id);
export const findEntry = (player, id) => player.inventory.find(entry => entry.id === id);
export const owns = (player, id) => Boolean(findEntry(player, id));

/** Suma los modificadores de todas las reliquias que lleva el jugador. */
export function getModifiers(player) {
    const total = { attackBonus: 0, energyBonus: 0, startShield: 0, extraDraw: 0, regen: 0, goldPercent: 0 };

    for (const entry of player.inventory) {
        const mods = BY_ID.get(entry.id)?.mods;
        if (!mods) continue;
        for (const [key, value] of Object.entries(mods)) total[key] += value;
    }
    return total;
}

/**
 * Añade un objeto al inventario.
 * Devuelve { ok: true, item } o { ok: false, reason: 'owned' | 'full', item }.
 */
export function addItem(player, id) {
    const item = BY_ID.get(id);
    if (!item) throw new Error(`Objeto desconocido: "${id}"`);

    const entry = findEntry(player, id);

    if (item.kind === 'relic') {
        if (entry) return { ok: false, reason: 'owned', item };

        player.inventory.push({ id, name: item.name, effect: item.effect, kind: 'relic', qty: 1 });
        const gain = item.onAcquire ?? { maxHealth: 0, fullHeal: false };
        if (gain.maxHealth) {
            player.maxHealth += gain.maxHealth;
            player.health += gain.maxHealth;
        }
        if (gain.fullHeal) player.health = player.maxHealth;
        return { ok: true, item };
    }

    if (entry) {
        if (entry.qty >= LOOT.maxStack) return { ok: false, reason: 'full', item };
        entry.qty += 1;
    } else {
        player.inventory.push({ id, name: item.name, effect: item.effect, kind: 'consumable', qty: 1 });
    }
    return { ok: true, item };
}

/** Gasta una unidad de un consumible. Devuelve false si no lo tenía. */
export function removeOne(player, id) {
    const entry = findEntry(player, id);
    if (!entry) return false;

    entry.qty -= 1;
    if (entry.qty <= 0) player.inventory.splice(player.inventory.indexOf(entry), 1);
    return true;
}

/** ¿Se puede usar ahora este consumible? Devuelve { ok: true } o { ok: false, reason }. */
export function canUseItem(item, { inCombat, player, poisoned }) {
    const type = item.card.type;

    if (type === 'heal') {
        return player.health < player.maxHealth ? { ok: true } : { ok: false, reason: 'ya tienes la vida al máximo' };
    }
    if (!inCombat) return { ok: false, reason: 'solo se puede usar en combate' };
    if (type === 'cleanse' && !poisoned) return { ok: false, reason: 'no estás envenenado' };
    return { ok: true };
}

/**
 * ¿Aparece un objeto tras ganar un combate? Devuelve su id o null.
 * No ofrece reliquias que ya tienes ni consumibles que ya no te caben.
 */
export function rollLoot({ player, rng = Math.random, chance = LOOT.chance }) {
    if (rng() >= chance) return null;

    const pool = ITEM_CATALOG.filter(item => {
        if (!(item.lootWeight > 0)) return false;
        const entry = findEntry(player, item.id);
        if (item.kind === 'relic') return !entry;
        return !entry || entry.qty < LOOT.maxStack;
    });
    if (pool.length === 0) return null;

    const total = pool.reduce((sum, item) => sum + item.lootWeight, 0);
    let roll = rng() * total;
    const index = pool.findIndex(item => (roll -= item.lootWeight) < 0);
    return pool[index === -1 ? pool.length - 1 : index].id;
}

/**
 * Selecciona una reliquia especial como botín de jefe (por ejemplo, reliquias que aún no posea el jugador).
 */
export function rollBossRelic({ player, rng = Math.random }) {
    const pool = ITEM_CATALOG.filter(item => {
        if (item.kind !== 'relic') return false;
        return !owns(player, item.id);
    });
    if (pool.length === 0) return null;

    const index = Math.floor(rng() * pool.length);
    return pool[index].id;
}