// Ejecutar con:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CARD_LIBRARY, STARTER_DECKS, REWARD_CONFIG } from '../js/data/cardCatalog.js';
import { PlayerDeck, instantiateCard, resolvePlayerCard, rollRewards, tickPoison } from '../js/systems/JugadorCards.js';

const makeEnemy = (over = {}) => ({ hp: 100, shield: 0, poison: null, ...over });
const makeHero = (over = {}) => ({ health: 50, maxHealth: 100, shield: 0, ...over });
const card = (over) => ({ type: 'atk', val: 20, ...over });

// Generador pseudoaleatorio fijo para que los tests sean repetibles
const seeded = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ───────── Datos ─────────

test('todas las cartas del catálogo están bien definidas', () => {
    const types = new Set(['atk', 'def', 'heal', 'drain', 'poison', 'draw', 'energy']);
    const rarities = new Set(['starter', 'common', 'uncommon', 'rare']);
    const ids = new Set();

    for (const c of CARD_LIBRARY) {
        assert.ok(!ids.has(c.id), `${c.id}: id repetido`);
        ids.add(c.id);
        assert.ok(types.has(c.type), `${c.id}: tipo inválido`);
        assert.ok(rarities.has(c.rarity), `${c.id}: rareza inválida`);
        assert.ok(Number.isInteger(c.cost) && c.cost >= 0 && c.cost <= 3, `${c.id}: coste fuera de rango`);
        assert.ok(c.base > 0, `${c.id}: falta base`);
        assert.ok(c.text.includes('{val}'), `${c.id}: el texto no muestra su valor`);
        assert.ok(c.classes === null || Array.isArray(c.classes), `${c.id}: classes inválido`);
    }
});

test('los mazos iniciales usan cartas que existen y de su clase', () => {
    for (const [classKey, ids] of Object.entries(STARTER_DECKS)) {
        assert.equal(ids.length, 4);
        for (const id of ids) {
            const c = instantiateCard(id, 1);
            assert.equal(c.rarity, 'starter');
            assert.ok(c.classes.includes(classKey), `${id} no es de ${classKey}`);
        }
    }
});

test('las cartas iniciales conservan los números de siempre (nivel 1)', () => {
    assert.equal(instantiateCard('strike', 1).val, 20);
    assert.equal(instantiateCard('whirlwind', 1).val, 36);
    assert.equal(instantiateCard('fireball', 1).val, 32);
    assert.equal(instantiateCard('poison_blade', 2).val, 48);
});

test('instantiateCard escribe la descripción con los números reales', () => {
    assert.equal(instantiateCard('strike', 3).desc, 'Inflige 30 daño físico');
    assert.match(instantiateCard('flask', 1).desc, /4 de daño durante 3 turnos/);
    assert.throws(() => instantiateCard('no_existe', 1), /desconocida/);
});

// ───────── Efectos ─────────

test('atk: el escudo enemigo absorbe antes que la vida y el veneno de objeto suma', () => {
    const enemy = makeEnemy({ shield: 10 });
    const [ev] = resolvePlayerCard(card({ val: 20 }), enemy, makeHero(), { attackBonus: 5 });
    assert.deepEqual([ev.absorbed, ev.dealt], [10, 15]);
    assert.equal(enemy.hp, 85);
    assert.equal(enemy.shield, 0);
});

test('drain: te curas el daño real, sin pasar de tu vida máxima', () => {
    const hero = makeHero({ health: 95 });
    const enemy = makeEnemy();
    const events = resolvePlayerCard(card({ type: 'drain', val: 20 }), enemy, hero);
    assert.equal(enemy.hp, 80);
    assert.equal(hero.health, 100);
    assert.equal(events[1].amount, 5);
});

test('drain: si el escudo lo absorbe todo, no te curas', () => {
    const hero = makeHero();
    const events = resolvePlayerCard(card({ type: 'drain', val: 20 }), makeEnemy({ shield: 50 }), hero);
    assert.equal(hero.health, 50);
    assert.equal(events.length, 1);
});

test('def y heal actúan sobre ti', () => {
    const hero = makeHero();
    resolvePlayerCard(card({ type: 'def', val: 14 }), makeEnemy(), hero);
    resolvePlayerCard(card({ type: 'heal', val: 80 }), makeEnemy(), hero);
    assert.equal(hero.shield, 14);
    assert.equal(hero.health, 100);
});

test('poison: refresca con el más fuerte y el más largo, y se agota', () => {
    const enemy = makeEnemy({ poison: { dmg: 6, turns: 1 } });
    resolvePlayerCard(card({ type: 'poison', val: 4, turns: 3 }), enemy, makeHero());
    assert.deepEqual(enemy.poison, { dmg: 6, turns: 3 });

    assert.equal(tickPoison(enemy), 6);
    assert.equal(tickPoison(enemy), 6);
    assert.equal(tickPoison(enemy), 6);
    assert.equal(enemy.hp, 82);
    assert.equal(enemy.poison, null);
    assert.equal(tickPoison(enemy), 0);
});

test('draw y energy devuelven su evento para que el juego los aplique', () => {
    assert.deepEqual(resolvePlayerCard(card({ type: 'draw', val: 2 }), makeEnemy(), makeHero()), [{ kind: 'draw', amount: 2 }]);
    assert.deepEqual(resolvePlayerCard(card({ type: 'energy', val: 1 }), makeEnemy(), makeHero()), [{ kind: 'energy', amount: 1 }]);
});

// ───────── Mazo ─────────

test('un mazo de 4 cartas entrega las 4 aunque la mano sea de 5', () => {
    const deck = new PlayerDeck(STARTER_DECKS.warrior);
    deck.startCombat();
    assert.equal(deck.draw(5).length, 4);
});

test('el mazo baraja el descarte al agotarse y nunca pierde ni duplica cartas', () => {
    const deck = new PlayerDeck([...STARTER_DECKS.mage, 'lightning', 'guard'], seeded(7));
    deck.startCombat();
    const total = deck.counts.total;
    let hand = [];

    for (let turn = 0; turn < 10; turn++) {
        hand.forEach(id => deck.discard(id));
        hand = deck.draw(5);
        assert.equal(hand.length, 5);
        assert.equal(deck.drawPile.length + deck.discardPile.length + hand.length, total);
    }
});

test('addCard amplía la colección pero no el combate en curso', () => {
    const deck = new PlayerDeck(STARTER_DECKS.rogue);
    deck.startCombat();
    deck.addCard('assassinate');
    assert.equal(deck.counts.total, 5);
    assert.equal(deck.drawPile.length, 4);
    deck.startCombat();
    assert.equal(deck.drawPile.length, 5);
    assert.throws(() => deck.addCard('no_existe'));
});

// ───────── Recompensas ─────────

test('rollRewards ofrece 3 cartas distintas, de tu clase y sin cartas iniciales', () => {
    for (const classKey of ['warrior', 'mage', 'rogue']) {
        for (let i = 1; i <= 30; i++) {
            const ids = rollRewards({ classKey, level: 4, rng: seeded(i) });
            assert.equal(ids.length, REWARD_CONFIG.count);
            assert.equal(new Set(ids).size, ids.length);
            for (const id of ids) {
                const c = instantiateCard(id, 1);
                assert.notEqual(c.rarity, 'starter');
                assert.ok(c.classes === null || c.classes.includes(classKey), `${id} no es para ${classKey}`);
            }
        }
    }
});

test('rollRewards respeta el máximo de copias', () => {
    const owned = ['guard', 'guard', 'flask', 'flask', 'bandage', 'bandage'];
    for (let i = 1; i <= 50; i++) {
        const ids = rollRewards({ classKey: 'warrior', owned, rng: seeded(i) });
        for (const banned of ['guard', 'flask', 'bandage']) assert.ok(!ids.includes(banned));
    }
});

test('rollRewards devuelve menos cartas si no quedan suficientes, sin romperse', () => {
    const owned = CARD_LIBRARY.filter(c => c.rarity !== 'starter').flatMap(c => [c.id, c.id]);
    assert.deepEqual(rollRewards({ classKey: 'mage', owned }), []);
});

test('las cartas raras salen más en plantas altas', () => {
    const countRares = (level) => {
        let rares = 0;
        for (let i = 1; i <= 400; i++) {
            rollRewards({ classKey: 'warrior', level, rng: seeded(i) })
                .forEach(id => { if (instantiateCard(id, 1).rarity === 'rare') rares++; });
        }
        return rares;
    };
    assert.ok(countRares(15) > countRares(1));
});
