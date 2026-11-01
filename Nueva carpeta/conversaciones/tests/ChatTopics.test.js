// Ejecutar con:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CHAT_TOPICS, GENERAL_TOPICS, NPC_TOPICS } from '../js/data/topicCatalog.js';
import { FALLBACK_LINES } from '../js/data/npcLines.js';
import { NPC_DATABASE } from '../js/data/npcs.js';
import { BOSS, CHAT } from '../js/data/gameConfig.js';
import { adviceFacts, bossFacts, buildFacts, cleanChatInput, nextBossFloor, topicsFor, waresFacts } from '../js/systems/ChatTopics.js';
import { itemIdForAction } from '../js/systems/Items.js';

const makePlayer = (over = {}) => ({ classKey: 'warrior', health: 100, maxHealth: 100, inventory: [], deckSize: 8, ...over });

// ───────── Datos ─────────

test('todos los temas están bien definidos', () => {
    for (const [key, topic] of Object.entries(CHAT_TOPICS)) {
        assert.equal(topic.id, key);
        assert.ok(topic.label.startsWith('¿') && topic.label.endsWith('?'), `${key}: la pregunta`);
        assert.ok(topic.xp > 0, `${key}: xp`);
        assert.ok([undefined, 'advice', 'boss', 'wares'].includes(topic.facts), `${key}: facts desconocido`);
    }
    for (const id of [...GENERAL_TOPICS, ...Object.values(NPC_TOPICS).flat()]) assert.ok(CHAT_TOPICS[id], `tema "${id}" sin definir`);
});

test('cada personaje ofrece los temas generales y uno propio, sin repetir', () => {
    for (const npc of Object.values(NPC_DATABASE)) {
        const topics = topicsFor(npc);
        const ids = topics.map(topic => topic.id);
        assert.equal(new Set(ids).size, ids.length, npc.id);
        assert.deepEqual(ids.slice(0, GENERAL_TOPICS.length), GENERAL_TOPICS);
        assert.equal(ids.length, GENERAL_TOPICS.length + 1, `${npc.id}: un tema propio`);
        topics.forEach(topic => assert.equal(topic.pool, `chat_${topic.id}`));
    }
});

test('un personaje sin temas propios solo ofrece los generales', () => {
    assert.deepEqual(topicsFor({ id: 'nuevo' }).map(topic => topic.id), GENERAL_TOPICS);
});

test('cada tema de cada personaje tiene su banco de respaldo, y también la bienvenida y la entrada libre', () => {
    for (const npc of Object.values(NPC_DATABASE)) {
        for (const topic of topicsFor(npc)) {
            assert.ok(FALLBACK_LINES[npc.id]?.[topic.pool]?.length >= 2, `${npc.id}.${topic.pool}`);
        }
        assert.ok(FALLBACK_LINES[npc.id].chat_open.length >= 2, `${npc.id}.chat_open`);
        assert.ok(FALLBACK_LINES[npc.id].chat_free.length >= 3, `${npc.id}.chat_free`);
    }
});

// ───────── Datos reales para la IA ─────────

test('nextBossFloor da la planta del próximo jefe', () => {
    assert.deepEqual([1, 4, 5, 6, 10, 11].map(nextBossFloor), [5, 5, 5, 10, 10, 15]);
    assert.equal(nextBossFloor(0), BOSS.EVERY);
});

test('bossFacts habla del jefe real, de su armadura, sus fases y sus jugadas', () => {
    const facts = bossFacts(3);
    assert.match(facts[0], /A 2 plantas de aquí espera un jefe: Gorgrim, Jefe Orco/);
    assert.ok(facts.some(fact => /de guardia que hay que romper/.test(fact)));
    assert.ok(facts.some(fact => /Cuando le queda un 50 % de vida, entra en un frenesí sangriento/.test(fact)));
    assert.ok(facts.at(-1).startsWith('Entre sus jugadas se cuentan: Embestida Brutal'), 'los nombres van sin emoji');
});

test('bossFacts distingue "esta planta", "la siguiente" y "a N plantas"', () => {
    assert.match(bossFacts(5)[0], /^En esta misma planta espera un jefe/);
    assert.match(bossFacts(4)[0], /^En la planta siguiente espera un jefe/);
    assert.match(bossFacts(6)[0], /^A 4 plantas de aquí espera un jefe: La Dama de la Noche/);
});

test('adviceFacts avisa de vida baja, de la falta de pociones y de que los consumibles se usan desde el inventario', () => {
    const hurt = adviceFacts(makePlayer({ health: 30 }));
    assert.ok(hurt.some(fact => fact.includes('malherido')));
    assert.ok(hurt.some(fact => fact.includes('no lleva pociones')));

    const ready = adviceFacts(makePlayer({ inventory: [{ id: 'health_potion', kind: 'consumable', qty: 1 }] }));
    assert.ok(ready.some(fact => fact.includes('botón "Usar"')));
    assert.ok(!ready.some(fact => fact.includes('no lleva pociones')));
    assert.ok(!ready.some(fact => fact.includes('malherido')));
});

test('adviceFacts menciona el mazo pequeño solo cuando lo es y nunca pasa de 4 datos', () => {
    assert.ok(adviceFacts(makePlayer({ deckSize: 4 })).some(fact => fact.includes('mazo todavía es pequeño')));
    assert.ok(!adviceFacts(makePlayer({ deckSize: 12 })).some(fact => fact.includes('mazo todavía es pequeño')));
    assert.ok(adviceFacts(makePlayer({ health: 10, deckSize: 3 })).length <= 4);
    assert.ok(adviceFacts(makePlayer()).some(fact => fact.includes('anuncia su próxima jugada')));
});

test('waresFacts lista lo que Barnaby vende de verdad a cada clase, con sus precios', () => {
    const warrior = waresFacts(NPC_DATABASE.barnaby, 'warrior').join(' ');
    assert.match(warrior, /Poción de Salud por 30 de oro/);
    assert.match(warrior, /Frasco de Fuego por 35 de oro/);

    const mage = waresFacts(NPC_DATABASE.barnaby, 'mage').join(' ');
    assert.match(mage, /Grimorio Arcano por 40 de oro: \+1 de energía cada turno/);

    const rogue = waresFacts(NPC_DATABASE.barnaby, 'rogue').join(' ');
    assert.match(rogue, /Antídoto por 25 de oro/);
    assert.ok(!rogue.includes('Grimorio'));
});

test('waresFacts de un PNJ sin tienda avisa de que no tiene nada que ofrecer', () => {
    assert.deepEqual(waresFacts(NPC_DATABASE.valerius, 'mage').length, 1);
    assert.match(waresFacts({ interactions: {} }, 'warrior')[0], /nada que ofrecer/);
});

test('buildFacts reparte según el tipo de tema', () => {
    const context = { npc: NPC_DATABASE.barnaby, player: makePlayer(), floor: 2 };
    assert.ok(buildFacts(CHAT_TOPICS.boss, context)[0].includes('Gorgrim'));
    assert.ok(buildFacts(CHAT_TOPICS.advice, context).length > 0);
    assert.ok(buildFacts(CHAT_TOPICS.wares, context)[0].includes('Vendes'));
    assert.deepEqual(buildFacts(CHAT_TOPICS.who, context), []);
});

// ───────── Lo que escribe el jugador ─────────

test('cleanChatInput quita caracteres de control y espacios de más', () => {
    assert.equal(cleanChatInput('  Hola\n\n   mundo\u0000\t! '), 'Hola mundo !');
    assert.equal(cleanChatInput('   '), '');
    assert.equal(cleanChatInput(undefined), '');
    assert.equal(cleanChatInput(12345), '12345');
});

test('cleanChatInput corta al máximo configurado', () => {
    assert.equal(cleanChatInput('x'.repeat(1000)).length, CHAT.MAX_INPUT);
    assert.equal(cleanChatInput('abcdef', 3), 'abc');
});

// ───────── Acciones de tienda ─────────

test('itemIdForAction reconoce los alias antiguos y buy:<id>', () => {
    assert.equal(itemIdForAction('buy_potion'), 'health_potion');
    assert.equal(itemIdForAction('buy_mana'), 'arcane_grimoire');
    assert.equal(itemIdForAction('buy_poison'), 'blade_venom');
    assert.equal(itemIdForAction('buy:fire_flask'), 'fire_flask');
    assert.equal(itemIdForAction('combat'), null);
    assert.equal(itemIdForAction(undefined), null);
});
