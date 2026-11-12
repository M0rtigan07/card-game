// Ejecutar con:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ITEM_CATALOG, LOOT } from '../js/data/itemCatalog.js';
import { addItem, canUseItem, findEntry, getItem, getModifiers, owns, removeOne, rollLoot } from '../js/systems/Items.js';
import { resolvePlayerCard } from '../js/systems/JugadorCards.js';

const seeded = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const makePlayer = (over = {}) => ({ health: 50, maxHealth: 100, gold: 0, inventory: [], ...over });

// ───────── Catálogo ─────────

test('todos los objetos del catálogo están bien definidos', () => {
    const ids = new Set();
    const cardTypes = new Set(['heal', 'atk', 'def', 'poison', 'draw', 'energy', 'cleanse']);
    const modKeys = new Set(['attackBonus', 'energyBonus', 'startShield', 'extraDraw', 'regen', 'goldPercent']);

    for (const item of ITEM_CATALOG) {
        assert.ok(!ids.has(item.id), `${item.id}: id repetido`);
        ids.add(item.id);
        assert.ok(item.name && item.effect, `${item.id}: falta nombre o efecto`);
        assert.ok(['relic', 'consumable'].includes(item.kind), `${item.id}: tipo inválido`);

        if (item.kind === 'consumable') {
            assert.ok(cardTypes.has(item.card?.type), `${item.id}: efecto de consumible inválido`);
            assert.ok(item.price > 0, `${item.id}: un consumible debe poder comprarse`);
        } else {
            const keys = Object.keys(item.mods ?? {});
            assert.ok(keys.length > 0 || item.onAcquire, `${item.id}: la reliquia no hace nada`);
            assert.ok(keys.every(key => modKeys.has(key)), `${item.id}: modificador desconocido`);
        }
    }
});

test('toda acción buy:<id> de npcs.js apunta a un objeto que se puede comprar', async () => {
    const { NPC_DATABASE } = await import('../js/data/npcs.js');
    const actions = JSON.stringify(NPC_DATABASE).match(/buy:[a-z_]+/g) ?? [];
    assert.ok(actions.length >= 2);
    for (const action of actions) assert.ok(getItem(action.slice(4))?.price > 0, action);
});

// ───────── Inventario ─────────

test('los consumibles se acumulan y se gastan de uno en uno', () => {
    const player = makePlayer();
    addItem(player, 'health_potion');
    addItem(player, 'health_potion');
    assert.equal(player.inventory.length, 1);
    assert.equal(findEntry(player, 'health_potion').qty, 2);

    assert.ok(removeOne(player, 'health_potion'));
    assert.equal(findEntry(player, 'health_potion').qty, 1);
    assert.ok(removeOne(player, 'health_potion'));
    assert.ok(!owns(player, 'health_potion'), 'al gastar la última desaparece');
    assert.equal(removeOne(player, 'health_potion'), false);
});

test('los consumibles tienen un tope de unidades', () => {
    const player = makePlayer();
    for (let i = 0; i < LOOT.maxStack; i++) assert.ok(addItem(player, 'antidote').ok);
    const result = addItem(player, 'antidote');
    assert.deepEqual([result.ok, result.reason], [false, 'full']);
    assert.equal(findEntry(player, 'antidote').qty, LOOT.maxStack);
});

test('una reliquia solo se puede tener una vez', () => {
    const player = makePlayer();
    assert.ok(addItem(player, 'arcane_grimoire').ok);
    const second = addItem(player, 'arcane_grimoire');
    assert.deepEqual([second.ok, second.reason], [false, 'owned']);
    assert.equal(player.inventory.length, 1);
});

test('la Poción de Subsistencia sube la vida máxima y cura del todo al conseguirla', () => {
    const player = makePlayer();
    addItem(player, 'subsistence_potion');
    assert.equal(player.maxHealth, 120);
    assert.equal(player.health, 120);
});

test('un objeto desconocido da error claro', () => {
    assert.throws(() => addItem(makePlayer(), 'no_existe'), /desconocido/);
});

test('las entradas del inventario llevan nombre y efecto para mostrarlos', () => {
    const player = makePlayer();
    addItem(player, 'iron_charm');
    assert.deepEqual(player.inventory[0], { id: 'iron_charm', name: '🛡️ Amuleto de Hierro', effect: 'Empiezas cada combate con 8 de guardia', kind: 'relic', qty: 1 });
});

// ───────── Modificadores ─────────

test('los modificadores suman todas las reliquias y los consumibles no cuentan', () => {
    const player = makePlayer();
    ['arcane_grimoire', 'blade_venom', 'iron_charm', 'sap_ring', 'golden_purse', 'strategist_scroll', 'health_potion'].forEach(id => addItem(player, id));

    assert.deepEqual(getModifiers(player), { attackBonus: 5, energyBonus: 1, startShield: 8, extraDraw: 1, regen: 3, goldPercent: 25 });
    assert.deepEqual(getModifiers(makePlayer()), { attackBonus: 0, energyBonus: 0, startShield: 0, extraDraw: 0, regen: 0, goldPercent: 0 });
});

// ───────── Uso de consumibles ─────────

test('canUseItem: las curas sirven en cualquier sitio salvo con la vida llena', () => {
    const potion = getItem('health_potion');
    assert.ok(canUseItem(potion, { inCombat: false, player: makePlayer(), poisoned: false }).ok);
    assert.ok(canUseItem(potion, { inCombat: true, player: makePlayer(), poisoned: false }).ok);

    const full = canUseItem(potion, { inCombat: false, player: makePlayer({ health: 100 }), poisoned: false });
    assert.deepEqual([full.ok, full.reason], [false, 'ya tienes la vida al máximo']);
});

test('canUseItem: el resto de consumibles solo en combate, y el Antídoto solo si estás envenenado', () => {
    const player = makePlayer();
    for (const id of ['fire_flask', 'energy_elixir', 'antidote']) {
        const outside = canUseItem(getItem(id), { inCombat: false, player, poisoned: true });
        assert.deepEqual([outside.ok, outside.reason], [false, 'solo se puede usar en combate'], id);
    }
    assert.ok(canUseItem(getItem('fire_flask'), { inCombat: true, player, poisoned: false }).ok);
    assert.ok(canUseItem(getItem('energy_elixir'), { inCombat: true, player, poisoned: false }).ok);

    const clean = canUseItem(getItem('antidote'), { inCombat: true, player, poisoned: false });
    assert.deepEqual([clean.ok, clean.reason], [false, 'no estás envenenado']);
    assert.ok(canUseItem(getItem('antidote'), { inCombat: true, player, poisoned: true }).ok);
});

test('el efecto cleanse quita el veneno y avisa si había', () => {
    const hero = { health: 50, maxHealth: 100, shield: 0, poison: { dmg: 4, turns: 3 } };
    const events = resolvePlayerCard({ type: 'cleanse', val: 0 }, { hp: 10, shield: 0 }, hero);
    assert.equal(hero.poison, null);
    assert.deepEqual(events, [{ kind: 'cleanse', removed: true }]);

    const again = resolvePlayerCard({ type: 'cleanse', val: 0 }, { hp: 10, shield: 0 }, hero);
    assert.deepEqual(again, [{ kind: 'cleanse', removed: false }]);
});

// ───────── Botín ─────────

test('rollLoot respeta la probabilidad', () => {
    const player = makePlayer();
    assert.equal(rollLoot({ player, rng: () => 0.99 }), null);
    assert.ok(rollLoot({ player, rng: seeded(3), chance: 1 }));
    assert.equal(rollLoot({ player, rng: seeded(3), chance: 0 }), null);
});

test('el botín solo ofrece objetos lootables y nunca reliquias que ya tienes', () => {
    const player = makePlayer();
    const lootable = new Set(ITEM_CATALOG.filter(item => item.lootWeight > 0).map(item => item.id));
    const found = new Set();

    for (let i = 1; i <= 500; i++) {
        const id = rollLoot({ player, rng: seeded(i * 104729), chance: 1 });
        assert.ok(lootable.has(id), `${id} no debería salir como botín`);
        found.add(id);
    }
    assert.ok(found.size >= 6, 'sale variedad');
    for (const shopOnly of ['arcane_grimoire', 'blade_venom', 'subsistence_potion']) assert.ok(!found.has(shopOnly));

    addItem(player, 'iron_charm');
    for (let i = 1; i <= 300; i++) assert.notEqual(rollLoot({ player, rng: seeded(i * 7919), chance: 1 }), 'iron_charm');
});

test('si lo tienes todo, el botín no devuelve nada en vez de romperse', () => {
    const player = makePlayer();
    for (const item of ITEM_CATALOG) {
        const copies = item.kind === 'relic' ? 1 : LOOT.maxStack;
        for (let i = 0; i < copies; i++) addItem(player, item.id);
    }
    assert.equal(rollLoot({ player, rng: seeded(5), chance: 1 }), null);
});

test('los objetos más comunes salen más que los raros', () => {
    const player = makePlayer();
    const counts = {};
    for (let i = 1; i <= 3000; i++) {
        const id = rollLoot({ player, rng: seeded(i * 15485863), chance: 1 });
        counts[id] = (counts[id] ?? 0) + 1;
    }
    assert.ok(counts.health_potion > counts.strategist_scroll * 2);
});

// ───────── Reliquia de jefe ─────────

import { rollBossRelic } from '../js/systems/Items.js';

test('el jefe suelta una reliquia que no tienes, nunca consumibles ni objetos exclusivos de tienda', () => {
    const player = makePlayer();
    const seen = new Set();
    for (let i = 1; i <= 300; i++) seen.add(rollBossRelic({ player, rng: seeded(i * 104729) }));

    assert.ok(seen.size >= 3, 'sale variedad');
    for (const id of seen) {
        assert.equal(getItem(id).kind, 'relic', id);
        assert.ok(getItem(id).lootWeight > 0, `${id} es exclusivo de tienda`);
    }
});

test('el jefe no repite una reliquia que ya tienes y devuelve null cuando las tienes todas', () => {
    const player = makePlayer();
    const lootable = ITEM_CATALOG.filter(item => item.kind === 'relic' && item.lootWeight > 0);

    for (const relic of lootable.slice(0, -1)) addItem(player, relic.id);
    for (let i = 1; i <= 50; i++) assert.equal(rollBossRelic({ player, rng: seeded(i) }), lootable.at(-1).id);

    addItem(player, lootable.at(-1).id);
    assert.equal(rollBossRelic({ player }), null);
});
