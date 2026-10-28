// Ejecutar con:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ENEMY_DECKS } from '../js/data/enemyDecks.js';
import { EnemyBrain, expandDeck, resolveEnemyCard, describeCard, effectiveAtk } from '../js/systems/EnemyAI.js';

const makeEnemy = (over = {}) => ({ hp: 100, maxHp: 100, atk: 20, atkBonus: 0, shield: 0, ...over });
const makeHero = (over = {}) => ({ health: 100, shield: 0, poison: null, ...over });

test('expandDeck respeta las copias de cada carta', () => {
    assert.equal(expandDeck('valerius').length, 7);
    assert.equal(expandDeck('morgana').length, 6);
});

test('un mazo desconocido usa el del guerrero corrupto', () => {
    assert.equal(expandDeck('no_existe').length, expandDeck('corrupto').length);
});

test('atk: el daño escala con el ATK del enemigo', () => {
    const hero = makeHero();
    resolveEnemyCard({ type: 'atk', power: 1.5 }, makeEnemy({ atk: 20 }), hero);
    assert.equal(hero.health, 70);
});

test('atk: el escudo absorbe antes que la vida', () => {
    const hero = makeHero({ shield: 10 });
    const [ev] = resolveEnemyCard({ type: 'atk', power: 1 }, makeEnemy({ atk: 25 }), hero);
    assert.equal(hero.shield, 0);
    assert.equal(hero.health, 85);
    assert.deepEqual([ev.absorbed, ev.dealt], [10, 15]);
});

test('multi: cada golpe consume escudo por separado', () => {
    const hero = makeHero({ shield: 12 });
    const [ev] = resolveEnemyCard({ type: 'multi', power: 0.5, hits: 3 }, makeEnemy({ atk: 20 }), hero);
    // 3 golpes de 10: 12 de escudo absorben 10 + 2, quedan 18 de daño real
    assert.equal(ev.hits, 3);
    assert.equal(ev.dealt, 18);
    assert.equal(hero.health, 82);
});

test('drain: cura según el daño real hecho y respeta la vida máxima', () => {
    const enemy = makeEnemy({ hp: 90 });
    const hero = makeHero();
    const events = resolveEnemyCard({ type: 'drain', power: 1, leech: 1 }, enemy, hero);
    assert.equal(hero.health, 80);
    assert.equal(enemy.hp, 100); // quería curar 20 pero solo faltaban 10
    assert.equal(events[1].amount, 10);
});

test('drain: si el escudo lo absorbe todo, no cura', () => {
    const enemy = makeEnemy({ hp: 50 });
    const events = resolveEnemyCard({ type: 'drain', power: 1 }, enemy, makeHero({ shield: 99 }));
    assert.equal(enemy.hp, 50);
    assert.equal(events.length, 1);
});

test('def y heal actúan sobre el enemigo', () => {
    const enemy = makeEnemy({ hp: 40 });
    resolveEnemyCard({ type: 'def', val: 12 }, enemy, makeHero());
    resolveEnemyCard({ type: 'heal', val: 15 }, enemy, makeHero());
    assert.equal(enemy.shield, 12);
    assert.equal(enemy.hp, 55);
});

test('poison: un veneno nuevo refresca con el más fuerte y el más largo', () => {
    const hero = makeHero({ poison: { dmg: 6, turns: 1 } });
    resolveEnemyCard({ type: 'poison', val: 4, turns: 3 }, makeEnemy(), hero);
    assert.deepEqual(hero.poison, { dmg: 6, turns: 3 });
});

test('buff: sube el ATK y las cartas siguientes pegan más', () => {
    const enemy = makeEnemy({ atk: 20 });
    resolveEnemyCard({ type: 'buff', val: 5 }, enemy, makeHero());
    assert.equal(effectiveAtk(enemy), 25);
    const hero = makeHero();
    resolveEnemyCard({ type: 'atk', power: 1 }, enemy, hero);
    assert.equal(hero.health, 75);
});

test('describeCard muestra los números reales del enemigo', () => {
    assert.equal(describeCard({ type: 'atk', power: 1.5 }, makeEnemy({ atk: 20 })), 'Inflige 30 de daño');
    assert.equal(describeCard({ type: 'multi', power: 0.5, hits: 4 }, makeEnemy({ atk: 14 })), '4 golpes de 7 de daño');
});

test('la IA no se cura con la vida llena, pero sí cuando está herida', () => {
    const brain = new EnemyBrain('barnaby');
    const heal = { name: 'Cura', type: 'heal', val: 10 };
    const hit = { name: 'Golpe', type: 'atk', power: 1 };

    brain.drawPile = [heal, hit];
    assert.equal(brain.drawIntent(makeEnemy({ hp: 100 }), makeHero()), hit);

    brain.drawPile = [hit, heal];
    assert.equal(brain.drawIntent(makeEnemy({ hp: 30 }), makeHero()), hit); // el orden manda si ambas sirven

    brain.drawPile = [heal, hit];
    assert.equal(brain.drawIntent(makeEnemy({ hp: 30 }), makeHero()), heal);
});

test('la IA no acumula furia sin límite', () => {
    const brain = new EnemyBrain('vikinga');
    const buff = { name: 'Furia', type: 'buff', val: 4 };
    const hit = { name: 'Hacha', type: 'atk', power: 1 };
    brain.drawPile = [buff, hit];
    assert.equal(brain.drawIntent(makeEnemy({ atkBonus: 8 }), makeHero()), hit);
});

test('el mazo se baraja de nuevo al agotarse y nunca pierde cartas', () => {
    const brain = new EnemyBrain('valerius');
    const total = expandDeck('valerius').length;
    const enemy = makeEnemy();
    const hero = makeHero({ health: 1e6 });

    for (let turn = 0; turn < total * 3; turn++) {
        brain.drawIntent(enemy, hero);
        brain.play(enemy, hero);
        assert.equal(brain.drawPile.length + brain.discard.length, total);
    }
});

test('play sin intención previa roba una carta automáticamente', () => {
    const brain = new EnemyBrain('corrupto');
    const { card } = brain.play(makeEnemy(), makeHero());
    assert.ok(card.name);
    assert.equal(brain.discard.length, 1);
});

test('todas las cartas de enemyDecks.js están bien definidas', () => {
    const valid = new Set(['atk', 'multi', 'drain', 'def', 'heal', 'poison', 'buff']);
    for (const [deckId, cards] of Object.entries(ENEMY_DECKS)) {
        assert.ok(cards.length >= 3, `${deckId}: muy pocas cartas`);
        for (const c of cards) {
            const where = `${deckId} / ${c.name}`;
            assert.ok(valid.has(c.type), `${where}: tipo inválido "${c.type}"`);
            if (['atk', 'multi', 'drain'].includes(c.type)) assert.ok(c.power > 0, `${where}: falta power`);
            if (['def', 'heal', 'poison', 'buff'].includes(c.type)) assert.ok(c.val > 0, `${where}: falta val`);
        }
    }
});
