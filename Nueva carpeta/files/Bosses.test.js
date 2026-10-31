// Ejecutar con:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { BOSSES } from '../js/data/bossCatalog.js';
import { ENEMY_DECKS } from '../js/data/enemyDecks.js';
import { BOSS } from '../js/data/gameConfig.js';
import { FALLBACK_LINES } from '../js/data/npcLines.js';
import { NPC_DATABASE } from '../js/data/npcs.js';
import { buildBossEnemy, getBossForFloor, isBossFloor } from '../js/systems/Bosses.js';

const CARD_TYPES = ['atk', 'multi', 'drain', 'def', 'heal', 'poison', 'buff'];

// ───────── Qué planta tiene jefe ─────────

test('hay jefe cada 5 plantas y en ninguna otra', () => {
    for (const floor of [5, 10, 15, 20, 100]) assert.ok(isBossFloor(floor), `planta ${floor}`);
    for (const floor of [-5, 0, 1, 4, 6, 9, 11, 99]) assert.ok(!isBossFloor(floor), `planta ${floor}`);
});

test('los jefes se turnan en orden y vuelven a empezar al acabar la lista', () => {
    BOSSES.forEach((boss, i) => assert.equal(getBossForFloor(5 * (i + 1)), boss));
    assert.equal(getBossForFloor(5 * (BOSSES.length + 1)), BOSSES[0]);
    assert.equal(getBossForFloor(5 * (BOSSES.length + 2)), BOSSES[1]);
    assert.equal(getBossForFloor(7), null);
});

test('ningún PNJ fijo ocupa una planta de jefe', () => {
    for (const npc of Object.values(NPC_DATABASE)) {
        assert.ok(!isBossFloor(npc.dungeonLevel), `${npc.id} está en la planta ${npc.dungeonLevel}`);
    }
});

// ───────── Del jefe al enemigo de combate ─────────

test('el jefe se convierte en un enemigo con vida, ataque y armadura que crecen con la planta', () => {
    const boss = BOSSES[0];
    const early = buildBossEnemy(boss, 5);
    const late = buildBossEnemy(boss, 25);

    assert.equal(early.hp, boss.baseHp + boss.hpPerFloor * 5);
    assert.equal(early.maxHp, early.hp);
    assert.equal(early.atk, Math.round(boss.baseAtk + boss.atkPerFloor * 5));
    assert.equal(early.armor, boss.armor);
    assert.equal(early.isBoss, true);
    assert.equal(early.speaker, boss);
    assert.equal(early.deckId, boss.deckId);
    assert.ok(late.hp > early.hp && late.atk > early.atk);
});

test('cada combate recibe su propia copia de las fases (el jefe del catálogo no se altera)', () => {
    const boss = BOSSES.find(b => b.phases.length > 0);
    const enemy = buildBossEnemy(boss, 5);
    enemy.phases[0].at = 0.99;
    enemy.phases[0].addCards = [];
    assert.notEqual(boss.phases[0].at, 0.99);
    assert.ok(boss.phases[0].addCards === undefined || boss.phases[0].addCards.length > 0);
});

test('los jefes son bastante más duros que un enemigo normal de su planta', () => {
    for (const boss of BOSSES) {
        const normalHp = 40 + 18 * 5;
        assert.ok(buildBossEnemy(boss, 5).hp > normalHp, boss.id);
    }
});

// ───────── Datos de los jefes ─────────

test('cada jefe está completo: identidad, personalidad, mazo y fases válidas', () => {
    const ids = new Set();

    for (const boss of BOSSES) {
        assert.ok(!ids.has(boss.id), `${boss.id}: id repetido`);
        ids.add(boss.id);
        assert.ok(boss.name && boss.img.startsWith('img/'), `${boss.id}: nombre o imagen`);
        assert.ok(boss.archetype.length > 30 && boss.voice.length > 30, `${boss.id}: falta personalidad`);
        assert.ok(boss.baseHp > 0 && boss.hpPerFloor > 0 && boss.baseAtk > 0 && boss.armor > 0, `${boss.id}: números`);

        assert.ok(ENEMY_DECKS[boss.deckId]?.length >= 5, `${boss.id}: mazo propio de al menos 5 cartas`);
        assert.ok(boss.phases.length >= 1, `${boss.id}: sin fases`);

        let previous = 1;
        for (const phase of boss.phases) {
            assert.ok(phase.at > 0 && phase.at < previous, `${boss.id}: las fases deben ir de mayor a menor vida`);
            previous = phase.at;
            assert.ok(phase.announce.length > 5, `${boss.id}: falta announce`);
            assert.ok(phase.atkBonus || phase.shield || phase.heal || phase.armor || phase.addCards?.length, `${boss.id}: una fase no hace nada`);

            for (const card of phase.addCards ?? []) {
                assert.ok(CARD_TYPES.includes(card.type), `${boss.id}/${card.name}: tipo inválido`);
                if (['atk', 'multi', 'drain'].includes(card.type)) assert.ok(card.power > 0, `${card.name}: falta power`);
                else assert.ok(card.val > 0, `${card.name}: falta val`);
            }
        }
    }
});

test('el mazo de un jefe es más fuerte que el de un enemigo normal', () => {
    const damage = (deck) => deck.reduce((sum, c) => sum + (['atk', 'multi', 'drain'].includes(c.type) ? (c.power * (c.hits ?? 1)) * (c.copies ?? 1) : 0), 0);
    const normal = Math.max(...['corrupto', 'automata', 'orco', 'gargola', 'hechicero'].map(id => damage(ENEMY_DECKS[id])));
    for (const boss of BOSSES) assert.ok(damage(ENEMY_DECKS[boss.deckId]) > normal, boss.id);
});

// ───────── Frases de los jefes ─────────

const BOSS_KEYS = ['greeting', 'combat_start', 'combat_attack', 'combat_other', 'combat_hurt', 'combat_phase', 'combat_defeat', 'combat_victory'];

test('cada jefe tiene su banco de frases completo, incluida la de cambio de fase', () => {
    for (const boss of BOSSES) {
        for (const key of BOSS_KEYS) {
            assert.ok(FALLBACK_LINES[boss.id]?.[key]?.length >= 2, `${boss.id}.${key}`);
        }
    }
});

test('ninguna frase se repite en dos personajes distintos: cada uno suena a sí mismo', () => {
    const owner = new Map();
    for (const [id, kinds] of Object.entries(FALLBACK_LINES)) {
        for (const lines of Object.values(kinds)) {
            for (const line of lines) {
                assert.ok(!owner.has(line) || owner.get(line) === id, `"${line}" está en ${owner.get(line)} y en ${id}`);
                owner.set(line, id);
            }
        }
    }
});
