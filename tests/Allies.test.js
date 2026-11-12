// Ejecutar con:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ALLIES } from '../js/data/allyCatalog.js';
import { BOSSES } from '../js/data/bossCatalog.js';
import { ENEMY_DECKS } from '../js/data/enemyDecks.js';
import { FALLBACK_LINES } from '../js/data/npcLines.js';
import { NPC_DATABASE } from '../js/data/npcs.js';
import { PARTY, PERSUASION } from '../js/data/gameConfig.js';
import { Party, buildAllyCard } from '../js/systems/Party.js';
import { Persuasion } from '../js/systems/Persuasion.js';
import { getBossForFloor, isBossFloor } from '../js/systems/Bosses.js';
import { resolvePlayerCard } from '../js/systems/JugadorCards.js';

const PERSUASION_KEYS = ['chat_values', 'chat_persuade_good', 'chat_persuade_bad', 'chat_recruited', 'chat_locked'];

// ───────── Datos de los aliados ─────────

test('cada aliado está completo: PNJ real, carta, habilidad, valores y cuatro argumentos', () => {
    for (const [key, ally] of Object.entries(ALLIES)) {
        assert.equal(ally.id, key);
        assert.ok(NPC_DATABASE[key], `${key}: no es un PNJ de npcs.js`);
        assert.ok(ally.name.length > 3);
        assert.match(ally.card, /^img\/npcs\/carta\w+\.png$/, `${key}: ruta de carta`);

        const { ability } = ally;
        assert.ok(['atk', 'def', 'drain', 'poison', 'heal'].includes(ability.type), `${key}: tipo de habilidad`);
        assert.ok(ability.base > 0 && ability.perLevel > 0 && ability.every >= 1, `${key}: números de la habilidad`);
        assert.ok(ability.text.length > 10);

        assert.ok(ally.values.length >= 2 && ally.values.every(v => v.length > 20), `${key}: valores`);
        assert.equal(ally.arguments.length, 4, `${key}: cuatro argumentos`);
        assert.equal(ally.arguments.filter(a => a.good).length, 2, `${key}: dos buenos`);
        assert.equal(ally.arguments.filter(a => !a.good).length, 2, `${key}: dos malos`);
        assert.equal(new Set(ally.arguments.map(a => a.id)).size, 4, `${key}: ids únicos`);
        ally.arguments.forEach(a => assert.ok(a.label.length > 15 && a.label.length <= 160, `${key}/${a.id}: longitud`));
    }
});

test('las seis cartas de aliado son las que tienes dibujadas', () => {
    const cards = Object.values(ALLIES).map(ally => ally.card.split('/').pop()).sort();
    assert.deepEqual(cards, ['cartaArquero.png', 'cartaConde.png', 'cartaNecro.png', 'cartaPirata.png', 'cartaVampira.png', 'cartaVikinga.png']);
});

test('la habilidad de cada aliado se resuelve como una carta y hace lo que dice', () => {
    const expected = { atk: 'damage', def: 'shield', drain: 'damage', poison: 'poison', heal: 'heal' };

    for (const ally of Object.values(ALLIES)) {
        const enemy = { hp: 100, shield: 0, poison: null };
        const hero = { health: 50, maxHealth: 100, shield: 0, poison: null };
        const events = resolvePlayerCard(buildAllyCard(ally, 3), enemy, hero);
        assert.equal(events[0].kind, expected[ally.ability.type], ally.id);
    }
});

test('cada aliado tiene todas sus frases de respaldo de persuasión', () => {
    for (const id of Object.keys(ALLIES)) {
        for (const key of PERSUASION_KEYS) assert.ok(FALLBACK_LINES[id]?.[key]?.length >= 2, `${id}.${key}`);
    }
    for (const key of PERSUASION_KEYS) assert.ok(FALLBACK_LINES.default[key]?.length >= 2, `default.${key}`);
});

// ───────── PNJ nuevos y jefe esqueleto ─────────

test('los PNJ nuevos están completos y cada uno en su planta', () => {
    const expectedFloors = { necro: 7, pirata: 8, vampira: 9 };

    for (const [id, floor] of Object.entries(expectedFloors)) {
        const npc = NPC_DATABASE[id];
        assert.equal(npc.dungeonLevel, floor, id);
        assert.ok(!isBossFloor(floor));
        assert.ok(npc.images.room && npc.images.talk && npc.images.enraged, `${id}: imágenes`);
        assert.ok(npc.archetype.length > 30 && npc.voice.length > 30, `${id}: personalidad`);
        assert.ok(npc.baseHp > 0 && npc.baseAtk > 0);
        assert.ok(ENEMY_DECKS[id]?.length >= 5, `${id}: mazo de combate`);
        assert.ok(npc.interactions.choices.some(c => c.action === 'combat'), `${id}: se le puede combatir`);
    }
});

test('ningún PNJ comparte planta con otro', () => {
    const floors = Object.values(NPC_DATABASE).map(npc => npc.dungeonLevel);
    assert.equal(new Set(floors).size, floors.length);
});

test('el jefe de la planta 10 es el Guerrero Esqueleto y la Dama de la Noche ya no es jefe', () => {
    const boss = getBossForFloor(10);
    assert.equal(boss.id, 'skull_jefe');
    assert.equal(boss.name, 'Skrull, el Guerrero Esqueleto');
    assert.equal(boss.img, 'img/skrullWarrior.jpg');
    assert.deepEqual(boss.phases.map(p => p.img), ['img/skrullWarrior1.jpg', 'img/skrullWarrior2.jpg']);

    assert.ok(!BOSSES.some(b => b.id === 'vampira_jefa'));
    assert.equal(ENEMY_DECKS.vampira_jefa, undefined);
    assert.equal(FALLBACK_LINES.vampira_jefa, undefined);
    assert.ok(NPC_DATABASE.vampira, 'ahora es un PNJ (y posible aliada)');
});

// ───────── El grupo ─────────

test('reclutar añade al aliado y respeta el máximo del grupo', () => {
    const party = new Party();
    assert.deepEqual(party.members, []);

    const first = party.recruit('mongol');
    assert.equal(first.ok, true);
    assert.equal(first.ally.name, 'Batu Jan');
    assert.ok(party.has('mongol'));

    party.recruit('vikinga');
    assert.equal(party.isFull(), true);
    assert.equal(party.members.length, PARTY.MAX);
    assert.deepEqual(party.recruit('valerius'), { ok: false, reason: 'full' });
    assert.deepEqual(party.members.map(m => m.id), ['mongol', 'vikinga'], 'en orden de llegada');
});

test('no se puede reclutar dos veces al mismo ni a quien no es aliado', () => {
    const party = new Party();
    party.recruit('necro');
    assert.deepEqual(party.recruit('necro'), { ok: false, reason: 'already' });
    assert.deepEqual(party.recruit('barnaby'), { ok: false, reason: 'unknown' });
    assert.equal(party.members.length, 1);
});

test('despedir a un aliado hace sitio para otro', () => {
    const party = new Party();
    party.recruit('mongol');
    party.recruit('vikinga');
    assert.equal(party.dismiss('mongol'), true);
    assert.equal(party.dismiss('mongol'), false);
    assert.equal(party.dismiss('nadie'), false);
    assert.equal(party.recruit('valerius').ok, true);
    assert.deepEqual(party.members.map(m => m.id), ['vikinga', 'valerius']);
});

test('el máximo del grupo se puede configurar', () => {
    const party = new Party(1);
    party.recruit('mongol');
    assert.equal(party.recruit('vikinga').reason, 'full');
});

test('cada aliado actúa con su cadencia: los de cada turno siempre, los de cada dos turnos, alternos', () => {
    const party = new Party(3);
    ['mongol', 'pirata', 'vampira'].forEach(id => party.recruit(id)); // cada 1, cada 2, cada 2

    const actors = (turn) => party.actionsFor({ turn, level: 1 }).map(a => a.ally.id);
    assert.deepEqual(actors(1), ['mongol', 'pirata', 'vampira']);
    assert.deepEqual(actors(2), ['mongol']);
    assert.deepEqual(actors(3), ['mongol', 'pirata', 'vampira']);
    assert.deepEqual(actors(4), ['mongol']);
});

test('la carta de un aliado crece con tu nivel y no cuesta energía', () => {
    const { base, perLevel } = ALLIES.mongol.ability;
    const card1 = buildAllyCard(ALLIES.mongol, 1);
    const card5 = buildAllyCard(ALLIES.mongol, 5);
    assert.equal(card1.val, base + perLevel * 1);
    assert.equal(card5.val, base + perLevel * 5);
    assert.ok(card5.val > card1.val);
    assert.equal(card1.cost, 0);
    assert.equal(card1.id, 'ally_mongol');
    assert.equal(buildAllyCard(ALLIES.necro, 2).turns, 3, 'el veneno lleva su duración');
});

// ───────── Persuasión ─────────

test('canTry: primero hace falta confianza, y no se puede con un grupo lleno ni con quien no es aliado', () => {
    const persuasion = new Persuasion();
    assert.deepEqual(persuasion.canTry('barnaby', { asked: 9, partyFull: false }), { ok: false, reason: 'no_ally' });
    assert.deepEqual(persuasion.canTry('mongol', { asked: 0, partyFull: false }), { ok: false, reason: 'rapport' });
    assert.deepEqual(persuasion.canTry('mongol', { asked: PERSUASION.RAPPORT_TOPICS - 1, partyFull: false }), { ok: false, reason: 'rapport' });
    assert.deepEqual(persuasion.canTry('mongol', { asked: PERSUASION.RAPPORT_TOPICS, partyFull: true }), { ok: false, reason: 'full' });
    assert.deepEqual(persuasion.canTry('mongol', { asked: PERSUASION.RAPPORT_TOPICS, partyFull: false }), { ok: true });
});

test('evaluate dice qué pasaría sin cambiar nada', () => {
    const persuasion = new Persuasion();
    const before = JSON.stringify([...persuasion.stateFor('mongol').used]);

    assert.deepEqual(persuasion.evaluate('mongol', 'path'), { good: true, willRecruit: false, willLock: false });
    assert.deepEqual(persuasion.evaluate('mongol', 'path'), { good: true, willRecruit: false, willLock: false }, 'se puede repetir la consulta');
    assert.equal(JSON.stringify([...persuasion.stateFor('mongol').used]), before);
});

test('con los argumentos buenos necesarios el personaje se une; con malos de más deja de escuchar', () => {
    const persuasion = new Persuasion();

    assert.equal(persuasion.commit('mongol', 'path').willRecruit, false);
    assert.equal(persuasion.commit('mongol', 'sky').willRecruit, true);
    assert.equal(persuasion.stateFor('mongol').recruited, true);
    assert.deepEqual(persuasion.canTry('mongol', { asked: 9, partyFull: false }), { ok: false, reason: 'recruited' });

    assert.equal(persuasion.commit('vikinga', 'rest').willLock, false);
    assert.equal(persuasion.commit('vikinga', 'flee').willLock, true);
    assert.deepEqual(persuasion.canTry('vikinga', { asked: 9, partyFull: false }), { ok: false, reason: 'locked' });
});

test('un argumento malo antes de los buenos no impide convencer; dos malos seguidos, sí', () => {
    const lucky = new Persuasion();
    lucky.commit('necro', 'light');
    lucky.commit('necro', 'tomes');
    assert.equal(lucky.commit('necro', 'craft').willRecruit, true);

    const unlucky = new Persuasion();
    unlucky.commit('necro', 'light');
    assert.equal(unlucky.commit('necro', 'peace').willLock, true);
    assert.equal(unlucky.evaluate('necro', 'tomes'), null, 'ya no escucha');
});

test('un argumento solo se puede usar una vez y uno inventado no vale', () => {
    const persuasion = new Persuasion();
    assert.ok(persuasion.commit('pirata', 'treasure'));
    assert.equal(persuasion.commit('pirata', 'treasure'), null);
    assert.equal(persuasion.evaluate('pirata', 'inventado'), null);
    assert.equal(persuasion.evaluate('barnaby', 'cualquiera'), null);
    assert.equal(persuasion.stateFor('pirata').good, 1, 'el repetido no suma');
});

test('argumentsFor marca los ya usados', () => {
    const persuasion = new Persuasion();
    persuasion.commit('vampira', 'monster');
    const args = persuasion.argumentsFor('vampira');
    assert.equal(args.length, 4);
    assert.deepEqual(args.filter(a => a.used).map(a => a.id), ['monster']);
    assert.deepEqual(persuasion.argumentsFor('barnaby'), []);
});

test('cada aliado puede configurar cuántos argumentos necesita', () => {
    const catalog = { x: { arguments: [{ id: 'a', good: true, label: '' }, { id: 'b', good: true, label: '' }, { id: 'c', good: false, label: '' }], needed: 1, badLimit: 1 } };
    const persuasion = new Persuasion(catalog);
    assert.equal(persuasion.evaluate('x', 'a').willRecruit, true);
    assert.equal(persuasion.evaluate('x', 'c').willLock, true);
});

test('los argumentos buenos son siempre los de lo que el personaje dice valorar (la pista es honesta)', () => {
    const goodWords = {
        mongol: [/jinete|camino/i, /palabra|cielo/i], vikinga: [/Valhalla|luchemos/i, /valor|retroceda/i],
        valerius: [/noble|temido/i, /pacto|iguales/i], necro: [/tomos/i, /arte|cadáveres/i],
        pirata: [/tesoro/i, /aventura/i], vampira: [/juego|aburren/i, /dama|entretenerte/i]
    };
    for (const [id, patterns] of Object.entries(goodWords)) {
        const good = ALLIES[id].arguments.filter(a => a.good);
        patterns.forEach((pattern, i) => assert.match(good[i].label, pattern, `${id}: argumento bueno ${i + 1}`));
    }
});
