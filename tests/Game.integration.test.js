// Pruebas de integración del juego con un navegador simulado.
// Ejecutar con:  node --test
// Comprueban que Game, Exploration, NpcActions y TcgCombat trabajan bien juntos.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers/fakeDom.js';

const dom = installFakeDom(); // debe ir antes de importar el juego

const { Game } = await import('../js/Game.js');
const { Player } = await import('../js/models/Player.js');
const { PlayerDeck, instantiateCard } = await import('../js/systems/JugadorCards.js');
const { STARTER_DECKS } = await import('../js/data/cardCatalog.js');
const { NPC_DATABASE } = await import('../js/data/npcs.js');
const { COMBAT } = await import('../js/data/gameConfig.js');
const { FALLBACK_LINES } = await import('../js/data/npcLines.js');
const { addItem, getModifiers, owns } = await import('../js/systems/Items.js');
const { BOSSES } = await import('../js/data/bossCatalog.js');
const { buildBossEnemy, getBossForFloor } = await import('../js/systems/Bosses.js');
const { ITEM_CATALOG } = await import('../js/data/itemCatalog.js');
const { CHAT } = await import('../js/data/gameConfig.js');
const { ALLIES } = await import('../js/data/allyCatalog.js');
const { PARTY } = await import('../js/data/gameConfig.js');
const { topicsFor } = await import('../js/systems/ChatTopics.js');
const { NpcChatView } = await import('../js/views/NpcChatView.js');

// ───────── Utilidades ─────────

/** Partida lista para probar: héroe, mazo inicial y avance de planta controlado. */
function newGame(classKey = 'warrior', { level = 3 } = {}) {
    const game = new Game();
    game.player = new Player(classKey);
    game.player.img = 'x';
    game.deck = new PlayerDeck(STARTER_DECKS[classKey]);
    game.dungeonLevel = level;

    game.floorsAdvanced = 0;
    game.advanceFloor = () => { game.dungeonLevel++; game.floorsAdvanced++; };

    game.chat.typeSpeed = 0;

    game.logs = [];
    game.ui.logEvent = (message) => game.logs.push(message);
    return game;
}

/** Espera (por tiempo, no por ciclos) a que se cumpla algo. Los temporizadores del juego son de ~1 ms, así que se espera con ellos. */
async function until(condition, tries = 300) {
    for (let i = 0; i < tries && !condition(); i++) await new Promise(resolve => setTimeout(resolve, 1));
    assert.ok(condition(), 'la condición no llegó a cumplirse');
}

/** Deja pasar unos milisegundos para que terminen las promesas pendientes. */
const settle = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));

const seeded = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const card = (over) => ({ id: 'strike', name: 'Carta de prueba', cost: 1, type: 'atk', val: 10, rarity: 'starter', ...over });

// ───────── PNJ ─────────

test('cada acción de cada PNJ funciona con las 3 clases y ninguna queda sin manejar', async () => {
    const warnings = [];
    const realWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    try {
        for (const classKey of ['warrior', 'mage', 'rogue']) {
            for (const npc of Object.values(NPC_DATABASE)) {
                const game = newGame(classKey);
                game.player.gold = 500;
                const { choices } = game.exploration.getNpcInteraction(npc);

                for (const choice of choices) {
                    await assert.doesNotReject(
                        () => game.exploration.npcActions.run(npc, choice.action),
                        `${npc.id}/${classKey}: ${choice.action}`
                    );
                }
            }
        }
    } finally {
        console.warn = realWarn;
    }
    assert.deepEqual(warnings, []);
});

test('las opciones de un PNJ no se repiten', () => {
    const game = newGame();
    for (const npc of Object.values(NPC_DATABASE)) {
        for (const classKey of ['warrior', 'mage', 'rogue']) {
            game.player.classKey = classKey;
            const texts = game.exploration.getNpcInteraction(npc).choices.map(c => c.text);
            assert.equal(new Set(texts).size, texts.length, `${npc.id}/${classKey}`);
        }
    }
});

test('una acción desconocida avisa y avanza de planta en vez de bloquear el juego', async () => {
    const game = newGame();
    const realWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => warnings.push(args.join(' '));
    try {
        await game.exploration.npcActions.run(NPC_DATABASE.valerius, 'accion_inventada');
    } finally {
        console.warn = realWarn;
    }
    assert.equal(game.floorsAdvanced, 1);
    assert.equal(warnings.length, 1);
});

test('combatir con un PNJ usa su nombre, su vida y su mazo', async () => {
    const game = newGame('warrior', { level: 2 });
    const npc = NPC_DATABASE.valerius;
    await game.exploration.npcActions.run(npc, 'combat');

    assert.equal(game.combat.enemy.name, npc.name);
    assert.equal(game.combat.enemy.hp, npc.baseHp + 2 * 10);
    assert.equal(game.combat.enemy.deckId, 'valerius');
    assert.ok(game.combat.brain.intent, 'el enemigo anuncia su primera jugada');
});

test('pagar el peaje cobra lo de cada PNJ, y sin oro se acaba en combate', async () => {
    const game = newGame();
    game.player.gold = 100;
    await game.exploration.npcActions.run(NPC_DATABASE.morgana, 'buy');
    assert.equal(game.player.gold, 40); // Morgana cobra 60

    const poor = newGame();
    poor.player.gold = 0;
    await poor.exploration.npcActions.run(NPC_DATABASE.morgana, 'buy');
    assert.equal(poor.combat.enemy?.name, NPC_DATABASE.morgana.name);
});

test('robar a Barnaby: con buena tirada ganas oro y con mala pierdes vida', async () => {
    const rich = newGame();
    rich.exploration.rollD20 = () => 15;
    await rich.exploration.npcActions.run(NPC_DATABASE.barnaby, 'steal');
    assert.equal(rich.player.gold, 50 + 60);

    const caught = newGame();
    caught.exploration.rollD20 = () => 3;
    const hp = caught.player.health;
    await caught.exploration.npcActions.run(NPC_DATABASE.barnaby, 'steal');
    assert.equal(caught.player.health, hp - 15);
});

test('comprar veneno da la reliquia +5 de daño; no se compra dos veces y sin oro no pasa nada', async () => {
    const game = newGame();
    game.player.gold = 100;
    await game.exploration.npcActions.run(NPC_DATABASE.mongol, 'buy_poison');
    assert.equal(getModifiers(game.player).attackBonus, 5);
    assert.equal(game.player.gold, 60);

    await game.exploration.npcActions.run(NPC_DATABASE.mongol, 'buy_poison');
    assert.equal(game.player.gold, 60, 'la segunda vez no cobra');
    assert.equal(getModifiers(game.player).attackBonus, 5, 'y no se acumula');

    const poor = newGame();
    poor.player.gold = 5;
    await poor.exploration.npcActions.run(NPC_DATABASE.mongol, 'buy_poison');
    assert.equal(getModifiers(poor.player).attackBonus, 0);
    assert.equal(poor.player.gold, 5);
});

test('morir por una acción de PNJ muestra el game over y no avanza', async () => {
    const game = newGame();
    let gameOver = false;
    game.ui.showGameOver = () => { gameOver = true; };
    game.player.health = 5;
    game.exploration.rollD20 = () => 1;
    await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'steal');
    assert.ok(game.player.health <= 0);
    assert.equal(gameOver, true);
    assert.equal(game.floorsAdvanced, 0);
});

// ───────── Exploración ─────────

test('una planta sin PNJ fijo pide un encuentro al backend', async () => {
    const requests = [];
    const game = newGame('warrior', { level: 12 });
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => { requests.push(JSON.parse(options.body).type); return realFetch(url, options); };
    try {
        await game.exploration.loadNext();
    } finally {
        globalThis.fetch = realFetch;
    }
    assert.ok(requests.includes('exploration'));
});

test('si el backend falla, el juego ofrece avanzar y no se queda parado', async () => {
    const game = newGame('warrior', { level: 12 });
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const realWarn = console.warn;
    console.warn = () => {};
    try {
        await game.exploration.loadNext();
    } finally {
        globalThis.fetch = realFetch;
        console.warn = realWarn;
    }
    assert.equal(dom.element('actionChoices').children.length, 1);
});

test('el enemigo genérico se deduce de la descripción del encuentro', () => {
    const game = newGame();
    game.combat.start({ description: 'Un autómata de bronce bloquea el puente' });
    assert.equal(game.combat.enemy.name, 'Autómata de Bronce');
    assert.equal(game.combat.enemy.deckId, 'automata');

    game.combat.start({ description: 'algo sin palabras clave' });
    assert.equal(game.combat.enemy.name, 'Guerrero Corrupto');
});

test('un enemigo genérico escala con la planta', () => {
    const early = newGame('warrior', { level: 1 });
    const late = newGame('warrior', { level: 9 });
    early.combat.start({ description: '' });
    late.combat.start({ description: '' });
    assert.ok(late.combat.enemy.hp > early.combat.enemy.hp);
    assert.ok(late.combat.enemy.atk > early.combat.enemy.atk);
});

// ───────── Combate: energía, mano y cartas ─────────

test('el combate empieza con tu energía llena y la mano completa del mazo inicial', () => {
    const game = newGame();
    game.combat.start({ name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });
    assert.equal(game.combat.energy, COMBAT.ENERGY_PER_TURN);
    assert.equal(game.combat.hand.length, 4);
});

test('jugar una carta gasta su coste y sin energía suficiente no se juega', () => {
    const game = newGame();
    game.combat.start({ name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });

    game.combat.playCard(card({ cost: 2 }), 0);
    assert.equal(game.combat.energy, 1);

    const hp = game.combat.enemy.hp;
    game.combat.playCard(card({ cost: 2 }), 0);
    assert.equal(game.combat.energy, 1);
    assert.equal(game.combat.enemy.hp, hp);

    game.combat.playCard(card({ cost: 1 }), 0);
    assert.equal(game.combat.energy, 0);
});

test('las cartas ya no gastan maná', () => {
    const game = newGame();
    const mana = game.player.mana;
    game.combat.start({ name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });
    game.combat.playCard(card({ cost: 2 }), 0);
    assert.equal(game.player.mana, mana);
});

test('la reliquia Veneno de Filo suma al daño de tus ataques', () => {
    const game = newGame();
    addItem(game.player, 'blade_venom');
    game.combat.start({ name: 'Saco', hp: 100, atk: 1, deckId: 'corrupto' });
    game.combat.playCard(card({ val: 15 }), 0);
    assert.equal(game.combat.enemy.hp, 80);
});

test('la carta jugada sale de la mano y va al descarte', () => {
    const game = newGame();
    game.combat.start({ name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });
    const first = game.combat.hand[0];
    game.combat.playCard(first, 0);
    assert.equal(game.combat.hand.length, 3);
    assert.equal(game.deck.counts.discardPile, 1);
});

test('al terminar el turno se restaura la energía y se roba mano nueva sin perder cartas', async () => {
    const game = newGame();
    game.combat.start({ name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });
    game.combat.playCard(game.combat.hand[0], 0);

    await game.combat.endTurn();

    assert.equal(game.combat.energy, 3);
    assert.equal(game.combat.hand.length, 4);
    const { drawPile, discardPile, total } = game.deck.counts;
    assert.equal(drawPile + discardPile + game.combat.hand.length, total);
});

test('el Grimorio Arcano da +1 de energía en cada turno', async () => {
    const game = newGame();
    addItem(game.player, 'arcane_grimoire');
    game.combat.start({ name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });
    assert.equal(game.combat.energy, COMBAT.ENERGY_PER_TURN + 1);

    game.combat.energy = 0;
    await game.combat.endTurn();
    assert.equal(game.combat.energy, COMBAT.ENERGY_PER_TURN + 1, 'se restaura con el bono');
});

test('Adrenalina da energía, Concentración roba cartas y el Frasco envenena al enemigo', async () => {
    const game = newGame();
    ['adrenaline', 'focus', 'flask'].forEach(id => game.deck.addCard(id));
    game.combat.start({ name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });

    game.combat.energy = 3;
    game.combat.hand = [instantiateCard('adrenaline', 1), instantiateCard('focus', 1), instantiateCard('flask', 1)];

    game.combat.playCard(game.combat.hand[0], 0);
    assert.equal(game.combat.energy, 4, 'Adrenalina cuesta 0 y da +1');

    const before = game.combat.hand.length;
    game.combat.playCard(game.combat.hand[0], 0);
    assert.equal(game.combat.hand.length, before - 1 + 2, 'Concentración roba 2');

    const flask = game.combat.hand.find(c => c.id === 'flask');
    game.combat.playCard(flask, game.combat.hand.indexOf(flask));
    assert.equal(game.combat.enemy.poison?.dmg, 4);

    const hp = game.combat.enemy.hp;
    await game.combat.endTurn();
    assert.equal(game.combat.enemy.hp, hp - 4, 'el veneno hace daño en el turno enemigo');
    assert.equal(game.combat.enemy.poison.turns, 2);
});

test('mientras juega el enemigo no puedes jugar cartas', () => {
    const game = newGame();
    game.combat.start({ name: 'Saco', hp: 100, atk: 1, deckId: 'corrupto' });
    game.combat.busy = true;
    game.combat.playCard(card({ val: 50 }), 0);
    assert.equal(game.combat.enemy.hp, 100);
    assert.equal(game.combat.energy, COMBAT.ENERGY_PER_TURN);
});

// ───────── Turno enemigo ─────────

test('cada PNJ juega 12 turnos con su mazo sin errores ni bloqueos', async () => {
    for (const npc of Object.values(NPC_DATABASE)) {
        const game = newGame();
        game.player.health = game.player.maxHealth = 100000;
        game.combat.startFromNpc(npc);
        assert.ok(game.combat.brain.intent, `${npc.id}: sin primera jugada`);

        for (let turn = 0; turn < 12; turn++) {
            await game.combat.endTurn();
            assert.equal(game.combat.busy, false, `${npc.id}: turno ${turn} dejó el combate bloqueado`);
            assert.ok(game.combat.brain.intent, `${npc.id}: se quedó sin próxima jugada`);
        }
    }
});

test('el veneno enemigo sobre ti baja vida al empezar tu turno y se agota', () => {
    const game = newGame();
    game.combat.start({ name: 'Bruja', hp: 100, atk: 14, deckId: 'morgana' });
    game.combat.heroPoison = { dmg: 4, turns: 2 };
    const hp = game.player.health;

    game.combat.startPlayerTurn();
    assert.equal(game.player.health, hp - 4);
    assert.equal(game.combat.heroPoison.turns, 1);

    game.combat.startPlayerTurn();
    assert.equal(game.combat.heroPoison, null);
});

test('si el héroe muere en el turno enemigo se muestra el game over y no empieza otro turno', async () => {
    const game = newGame();
    let gameOver = 0;
    game.ui.showGameOver = () => { gameOver++; };
    game.combat.start({ name: 'Dragón', hp: 100, atk: 500, deckId: 'dragon' });
    game.combat.brain.intent = { name: 'Golpe', type: 'atk', power: 1 };
    game.player.health = 5;

    await game.combat.endTurn();

    assert.equal(gameOver, 1);
    assert.equal(game.combat.busy, true);
});

test('si el veneno mata al enemigo en su turno, se gana el combate', async () => {
    const game = newGame();
    let wins = 0;
    game.combat.win = async () => { wins++; };
    game.combat.start({ name: 'Débil', hp: 3, atk: 1, deckId: 'corrupto' });
    game.combat.enemy.poison = { dmg: 5, turns: 2 };

    await game.combat.endTurn();

    assert.equal(wins, 1);
});

// ───────── Victoria y recompensa ─────────

test('ganar da oro y experiencia, ofrece 3 cartas y al elegir una crece el mazo', async () => {
    const game = newGame('mage', { level: 3 });
    let nextLoaded = 0;
    game.loadNextEvent = async () => { nextLoaded++; };
    game.combat.start({ name: 'Saco', hp: 10, atk: 1, deckId: 'corrupto' });

    const gold = game.player.gold;
    const size = game.deck.counts.total;
    const finished = game.combat.win();

    await until(() => dom.body.children.length > 0);
    const overlay = dom.body.children.at(-1);
    const [, row] = overlay.children;
    assert.equal(row.children.length, 3);

    row.children[0].click();
    await finished;

    assert.equal(game.deck.counts.total, size + 1);
    assert.equal(game.player.gold, gold + 100 + 3 * 15);
    assert.equal(nextLoaded, 1);
    assert.equal(game.dungeonLevel, 4);
    dom.body.children.length = 0;
});

test('saltar la recompensa da oro y no añade carta', async () => {
    const game = newGame('rogue', { level: 2 });
    game.loadNextEvent = async () => {};
    game.combat.start({ name: 'Saco', hp: 10, atk: 1, deckId: 'corrupto' });

    const size = game.deck.counts.total;
    const gold = game.player.gold + 100 + 2 * 15;
    const finished = game.combat.win();

    await until(() => dom.body.children.length > 0);
    const [, , skip] = dom.body.children.at(-1).children;
    skip.click();
    await finished;

    assert.equal(game.deck.counts.total, size);
    assert.equal(game.player.gold, gold + 25);
    dom.body.children.length = 0;
});

// ───────── Flujo del juego y menús ─────────

test('advanceFloor sube la planta y carga el siguiente encuentro tras la pausa', async () => {
    const game = new Game();
    game.player = new Player('warrior');
    let loaded = 0;
    game.loadNextEvent = async () => { loaded++; };

    game.advanceFloor(0);
    assert.equal(game.dungeonLevel, 2);
    await until(() => loaded === 1);
});

test('finishEncounter con el héroe muerto muestra el game over y no avanza', () => {
    const game = new Game();
    game.player = new Player('warrior');
    game.player.health = 0;
    let gameOver = 0, advanced = 0;
    game.ui.showGameOver = () => { gameOver++; };
    game.advanceFloor = () => { advanced++; };

    game.finishEncounter(100);

    assert.equal(gameOver, 1);
    assert.equal(advanced, 0);
});

test('el teclado del nombre escribe, borra y respeta el máximo de letras', () => {
    const keyA = dom.makeElement(); keyA.textContent = 'A';
    const back = dom.makeElement(); back.textContent = '⌫';
    dom.setQuery('.cv-key', [keyA, back]);

    const game = new Game();
    game.nameEntry.open();
    assert.equal(game.nameEntry.value, 'HERO');

    keyA.onclick();
    assert.equal(game.nameEntry.value, 'HEROA');

    for (let i = 0; i < 20; i++) keyA.onclick();
    assert.equal(game.nameEntry.value.length, 10);

    for (let i = 0; i < 20; i++) back.onclick();
    assert.equal(game.nameEntry.value, '');
});

test('no se puede confirmar un nombre vacío', () => {
    const game = new Game();
    game.nameEntry.draft = '';
    dom.storage.delete('mazo_hero_name');

    dom.element('btnConfirmName').click();

    assert.equal(dom.storage.has('mazo_hero_name'), false);
});

// ───────── Frases de los PNJ ─────────

test('el saludo de un PNJ lo genera la IA y las opciones aparecen con él', async () => {
    const game = newGame('warrior', { level: 2 });
    await game.exploration.showNpc('valerius');

    assert.match(dom.element('explorationText').textContent, /Línea generada \d+ \(greeting\)/);
    assert.equal(dom.element('actionChoices').children.length, game.exploration.getNpcInteraction(NPC_DATABASE.valerius).choices.length);
});

test('si la IA no contesta, el saludo sale de un banco de respaldo y el juego sigue', async () => {
    const game = newGame('mage', { level: 2 });
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const realWarn = console.warn;
    console.warn = () => {};
    try {
        await game.exploration.showNpc('valerius');
    } finally {
        globalThis.fetch = realFetch;
        console.warn = realWarn;
    }

    const text = dom.element('explorationText').textContent;
    assert.ok(text.length > 20 && !text.includes('te observa en silencio...'), text);
    assert.ok(dom.element('actionChoices').children.length > 0);
});

test('un saludo que llega tarde no pisa la escena en la que ya estás', async () => {
    const game = newGame('warrior', { level: 2 });
    const realFetch = globalThis.fetch;
    let release;
    globalThis.fetch = () => new Promise(resolve => { release = () => resolve({ ok: true, json: async () => ({ description: 'Saludo tardío' }) }); });

    let pending;
    try {
        pending = game.exploration.showNpc('valerius');
        await until(() => typeof release === 'function');
        game.exploration.render(); // el jugador ya está en otra escena
        dom.element('explorationText').textContent = 'OTRA ESCENA';
        release();
        await pending;
    } finally {
        globalThis.fetch = realFetch;
    }

    assert.equal(dom.element('explorationText').textContent, 'OTRA ESCENA');
});

test('la réplica del PNJ viaja con el contexto del héroe y las frases anteriores', async () => {
    const game = newGame('rogue', { level: 5 });
    game.playerName = 'MORTIGAN';
    game.player.health = 40;
    game.player.maxHealth = 80;
    game.player.gold = 77;

    const sent = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => { sent.push(JSON.parse(options.body)); return realFetch(url, options); };
    try {
        await game.dialogue.say(NPC_DATABASE.morgana, 'reaction', { action: 'Te ofrezco un trato' });
        await game.dialogue.say(NPC_DATABASE.morgana, 'reaction', { action: 'Me das miedo' });
    } finally {
        globalThis.fetch = realFetch;
    }

    assert.equal(sent[0].type, 'npc_interaction');
    assert.equal(sent[0].heroName, 'MORTIGAN');
    assert.equal(sent[0].heroHpPercent, 50);
    assert.equal(sent[0].gold, 77);
    assert.equal(sent[0].dungeonLevel, 5);
    assert.equal(sent[0].npcName, 'Bruja Morgana');
    assert.ok(sent[0].npcVoice.length > 10);
    assert.deepEqual(sent[0].avoid, []);
    assert.equal(sent[1].avoid.length, 1, 'la segunda petición lleva la primera frase para no repetirla');
});

test('tras comprar, el PNJ comenta lo ocurrido con una frase de la IA', async () => {
    const game = newGame();
    game.player.gold = 100;
    await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy_potion');

    const spoken = dom.element('mainContent').children.at(-1);
    assert.match(spoken.children.at(-1), /Línea generada \d+ \(outcome\)/);
    assert.equal(game.player.gold, 70);
});

// ───────── Enemigos que hablan en combate ─────────

/** Cambia la IA por una de mentira durante un bloque y devuelve las peticiones que recibió. */
async function withFetch(handler, run) {
    const realFetch = globalThis.fetch;
    const sent = [];
    globalThis.fetch = async (url, options) => { sent.push(JSON.parse(options.body)); return handler(url, options, realFetch); };
    try { await run(sent); } finally { globalThis.fetch = realFetch; }
}

const kinds = (sent) => sent.map(request => request.kind);

test('un PNJ saluda al empezar el combate con su estilo y se ve en pantalla', async () => {
    const game = newGame('warrior', { level: 2 });
    dom.element('enemySpeech').textContent = '';

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        game.combat.startFromNpc(NPC_DATABASE.valerius);
        await until(() => dom.element('enemySpeech').textContent !== '');

        const start = sent.find(request => request.kind === 'combat_start');
        assert.equal(start.npcName, 'Conde Valerius');
        assert.ok(start.npcVoice.length > 10);
        assert.equal(start.enemyHpPercent, 100);
    });

    assert.match(dom.element('enemySpeech').textContent, /combat_start/);
    assert.equal(dom.element('enemySpeech').className, 'enemy-speech speech-valerius');
});

test('un enemigo genérico habla con la voz de su tipo', async () => {
    const game = newGame();
    await withFetch((u, o, real) => real(u, o), async (sent) => {
        game.combat.start({ description: 'Un autómata de bronce bloquea el puente' });
        await until(() => sent.some(request => request.kind === 'combat_start'));

        const start = sent.find(request => request.kind === 'combat_start');
        assert.equal(start.npc, 'automata');
        assert.match(start.npcVoice, /máquina/);
    });
});

test('un enemigo sin speaker (datos manuales) no dice nada ni llama a la IA', async () => {
    const game = newGame();
    await withFetch((u, o, real) => real(u, o), async (sent) => {
        game.combat.start({ name: 'Saco', hp: 100, atk: 1, deckId: 'corrupto' });
        await game.combat.endTurn();
        assert.deepEqual(kinds(sent), []);
    });
});

test('el grito de la carta se pide al robarla y llega listo al jugarla', async () => {
    const game = newGame('warrior', { level: 2 });
    game.combat.rng = () => 0; // siempre habla

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        game.combat.startFromNpc(NPC_DATABASE.vikinga);
        const intent = game.combat.brain.intent;

        const cardRequest = sent.find(request => request.kind === 'combat_card');
        assert.equal(cardRequest.cardName, intent.name, 'se pide el grito de LA carta que jugará');
        assert.ok(cardRequest.cardEffect.length > 3);

        dom.element('enemySpeech').textContent = '';
        await game.combat.endTurn();
        assert.match(dom.element('enemySpeech').textContent, /combat_card/);
    });
});

test('el grito de la carta se pide al principio del turno del jugador, no del enemigo', async () => {
    const game = newGame('warrior', { level: 2 });
    game.combat.rng = () => 0;

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        game.combat.startFromNpc(NPC_DATABASE.morgana);
        await game.combat.endTurn();
        const requested = sent.filter(request => request.kind === 'combat_card').map(request => request.cardName);

        // una al empezar (carta 1) y otra al arrancar tu siguiente turno (carta 2): siempre un turno por delante
        assert.equal(requested.length, 2);
        assert.equal(requested[1], game.combat.brain.intent.name);
    });
});

test('la probabilidad de gritar se respeta: con mala suerte el enemigo calla', async () => {
    const game = newGame();
    game.combat.rng = () => 0.99;

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        game.combat.startFromNpc(NPC_DATABASE.mongol);
        await game.combat.endTurn();
        assert.ok(!kinds(sent).includes('combat_card'));
    });
});

test('el enemigo protesta una sola vez al bajar de la vida umbral', async () => {
    const game = newGame();
    game.combat.rng = () => 0.99;

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        game.combat.start({ description: 'un orco' });
        game.combat.enemy.hp = game.combat.enemy.maxHp; // vida llena
        game.combat.playCard(card({ val: 1 }), 0);
        assert.ok(!kinds(sent).includes('combat_hurt'), 'con la vida alta no protesta');

        game.combat.enemy.hp = Math.floor(game.combat.enemy.maxHp * 0.39);
        game.combat.playCard(card({ val: 1 }), 0);
        game.combat.playCard(card({ val: 1 }), 0);

        assert.equal(kinds(sent).filter(kind => kind === 'combat_hurt').length, 1);
        assert.ok(sent.find(request => request.kind === 'combat_hurt').enemyHpPercent <= 40);
    });
});

test('al ser derrotado el enemigo dice sus últimas palabras en el cartel de victoria y en el diario', async () => {
    const game = newGame('mage', { level: 2 });
    game.loadNextEvent = async () => {};
    game.combat.rng = () => 0.99;

    await withFetch((u, o, real) => real(u, o), async () => {
        game.combat.startFromNpc(NPC_DATABASE.barnaby);
        game.combat.enemy.hp = 1;
        const finished = game.combat.win();

        await until(() => dom.body.children.length > 0);
        dom.body.children.at(-1).children.at(2).click(); // saltar la recompensa
        await finished;
    });

    assert.match(dom.element('victoryRewardText').textContent, /^Barnaby el Buhonero: “.*combat_defeat/);
    assert.ok(game.logs.some(line => line.startsWith('💬 Barnaby el Buhonero:') && line.includes('combat_defeat')));
    dom.body.children.length = 0;
});

test('si el enemigo derrota al héroe celebra su victoria antes del game over', async () => {
    const game = newGame();
    const order = [];
    game.ui.showGameOver = () => order.push('gameover');
    game.combat.rng = () => 0.99;

    await withFetch((u, o, real) => real(u, o), async () => {
        game.combat.startFromNpc(NPC_DATABASE.valerius);
        game.combat.enemy.atk = 9999;
        game.combat.brain.intent = { name: 'Golpe', type: 'atk', power: 1 };
        game.player.health = 5;
        game.ui.logEvent = (message) => { game.logs.push(message); if (message.includes('combat_victory')) order.push('frase'); };
        await game.combat.endTurn();
    });

    assert.deepEqual(order, ['frase', 'gameover']);
});

test('si la IA falla, el enemigo sigue hablando con las frases de su propio banco', async () => {
    const game = newGame();
    const realWarn = console.warn;
    console.warn = () => {};
    dom.element('enemySpeech').textContent = '';

    try {
        await withFetch(async () => ({ ok: false, status: 500 }), async () => {
            game.combat.start({ description: 'un dragón ancestral' });
            await until(() => dom.element('enemySpeech').textContent !== '');
        });
    } finally {
        console.warn = realWarn;
    }

    const spoken = dom.element('enemySpeech').textContent.replace(/[“”]/g, '');
    assert.ok(FALLBACK_LINES.dragon.combat_start.includes(spoken), spoken);
});

test('una frase que llega cuando ya empezó otro combate no se enseña', async () => {
    const game = newGame();
    game.combat.rng = () => 0.99; // sin gritos de carta: solo la frase de inicio
    let said;
    const realSay = game.dialogue.say.bind(game.dialogue);
    game.dialogue.say = (...args) => (said = realSay(...args));

    let release;
    await withFetch(() => new Promise(resolve => { release = () => resolve({ ok: true, json: async () => ({ description: 'Frase vieja' }) }); }), async () => {
        game.combat.start({ description: 'un orco' });
        await until(() => typeof release === 'function');

        game.combat.enemy = { ...game.combat.enemy }; // otro combate distinto
        dom.element('enemySpeech').textContent = 'NADA';
        release();

        assert.equal(await said, 'Frase vieja', 'la frase sí llegó a generarse');
        await settle();
    });
    assert.equal(dom.element('enemySpeech').textContent, 'NADA');
});

// ───────── Objetos con efecto ─────────


/** Gana el combate en curso y resuelve la pantalla de recompensa ('card' = elige la primera carta, 'skip' = salta). */
async function winAndResolveReward(game, choice = 'card') {
    dom.body.children.length = 0;
    const finished = game.combat.win();
    await until(() => dom.body.children.length > 0);

    const [, row, skip] = dom.body.children.at(-1).children;
    (choice === 'skip' ? skip : row.children[0]).click();
    await finished;
    dom.body.children.length = 0;
}

const startQuiet = (game, enemy = { name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' }) => {
    game.combat.rng = () => 0.99; // sin gritos ni botín
    game.combat.start(enemy);
};

test('Amuleto de Hierro: empiezas el combate con guardia y absorbe el primer golpe', async () => {
    const game = newGame();
    addItem(game.player, 'iron_charm');
    startQuiet(game, { name: 'Pegón', hp: 5000, atk: 20, deckId: 'corrupto' });
    assert.equal(game.combat.heroShield, 8);

    game.combat.brain.intent = { name: 'Golpe', type: 'atk', power: 1 };
    const hp = game.player.health;
    await game.combat.endTurn();
    assert.equal(game.player.health, hp - 12, '20 de daño menos 8 de guardia');
});

test('Pergamino del Estratega: robas una carta más cada turno', () => {
    const game = newGame();
    ['guard', 'bandage'].forEach(id => game.deck.addCard(id)); // mazo de 6 para que se note
    startQuiet(game);
    assert.equal(game.combat.hand.length, 5);

    addItem(game.player, 'strategist_scroll');
    game.combat.startPlayerTurn();
    assert.equal(game.combat.hand.length, 6);
});

test('Anillo de Savia: te cura al empezar cada turno, sin pasarte de la vida máxima', () => {
    const game = newGame();
    addItem(game.player, 'sap_ring');
    startQuiet(game);

    game.player.health = 50;
    game.combat.startPlayerTurn();
    assert.equal(game.player.health, 53);

    game.player.health = game.player.maxHealth - 1;
    game.combat.startPlayerTurn();
    assert.equal(game.player.health, game.player.maxHealth);
});

test('Bolsa Dorada: +25 % de oro al ganar un combate', async () => {
    const game = newGame('warrior', { level: 2 });
    game.loadNextEvent = async () => {};
    addItem(game.player, 'golden_purse');
    startQuiet(game, { name: 'Saco', hp: 10, atk: 1, deckId: 'corrupto' });

    const gold = game.player.gold;
    await winAndResolveReward(game, 'card');

    assert.equal(game.player.gold, gold + Math.round((100 + 2 * 15) * 1.25));
});

test('tras ganar puede caer un objeto: se guarda en el inventario y se anuncia', async () => {
    const game = newGame('warrior', { level: 2 });
    game.loadNextEvent = async () => {};
    game.combat.start({ name: 'Saco', hp: 10, atk: 1, deckId: 'corrupto' });
    game.combat.rng = () => 0; // siempre hay botín

    await winAndResolveReward(game, 'skip');

    assert.equal(game.player.inventory.length, 1);
    const [entry] = game.player.inventory;
    assert.ok(game.logs.some(line => line.startsWith('🎁') && line.includes(entry.name)));
    assert.ok(dom.element('victoryRewardText').textContent.includes(entry.name));
});

test('sin suerte no cae botín', async () => {
    const game = newGame('warrior', { level: 2 });
    game.loadNextEvent = async () => {};
    startQuiet(game, { name: 'Saco', hp: 10, atk: 1, deckId: 'corrupto' });

    await winAndResolveReward(game, 'skip');

    assert.equal(game.player.inventory.length, 0);
});

test('Poción de Salud en combate: cura, se gasta una unidad y no cuesta energía', () => {
    const game = newGame();
    addItem(game.player, 'health_potion');
    addItem(game.player, 'health_potion');
    startQuiet(game);
    game.player.health = 30;
    const energy = game.combat.energy;

    assert.equal(game.useItem('health_potion'), true);
    assert.equal(game.player.health, 70);
    assert.equal(game.combat.energy, energy);
    assert.equal(findEntryQty(game, 'health_potion'), 1);
});

const findEntryQty = (game, id) => game.player.inventory.find(entry => entry.id === id)?.qty ?? 0;

test('Poción de Salud fuera de combate: cura sin pasarse y se niega con la vida llena', () => {
    const game = newGame();
    addItem(game.player, 'health_potion');
    game.player.health = game.player.maxHealth - 10;

    assert.equal(game.useItem('health_potion'), true);
    assert.equal(game.player.health, game.player.maxHealth);

    addItem(game.player, 'health_potion');
    assert.equal(game.useItem('health_potion'), false);
    assert.equal(findEntryQty(game, 'health_potion'), 1, 'no se gasta si no sirve');
    assert.ok(game.logs.some(line => line.includes('vida al máximo')));
});

test('Elixir de Energía: +2 de energía solo en combate', () => {
    const game = newGame();
    addItem(game.player, 'energy_elixir');
    assert.equal(game.useItem('energy_elixir'), false);
    assert.equal(findEntryQty(game, 'energy_elixir'), 1);

    startQuiet(game);
    game.combat.energy = 1;
    assert.equal(game.useItem('energy_elixir'), true);
    assert.equal(game.combat.energy, 3);
    assert.equal(findEntryQty(game, 'energy_elixir'), 0);
});

test('Frasco de Fuego: daño directo al enemigo (con tu bono de daño) y puede ganar el combate', async () => {
    const game = newGame();
    addItem(game.player, 'fire_flask');
    addItem(game.player, 'blade_venom');
    startQuiet(game, { name: 'Saco', hp: 100, atk: 1, deckId: 'corrupto' });

    assert.equal(game.useItem('fire_flask'), true);
    assert.equal(game.combat.enemy.hp, 100 - 35 - 5);

    const killer = newGame();
    let wins = 0;
    killer.combat.win = async () => { wins++; };
    addItem(killer.player, 'fire_flask');
    startQuiet(killer, { name: 'Débil', hp: 20, atk: 1, deckId: 'corrupto' });
    killer.useItem('fire_flask');
    assert.equal(wins, 1);
});

test('Antídoto: quita el veneno solo si lo tienes y no se desperdicia si no', () => {
    const game = newGame();
    addItem(game.player, 'antidote');
    startQuiet(game);

    assert.equal(game.useItem('antidote'), false);
    assert.equal(findEntryQty(game, 'antidote'), 1);

    game.combat.heroPoison = { dmg: 4, turns: 3 };
    assert.equal(game.useItem('antidote'), true);
    assert.equal(game.combat.heroPoison, null);
    assert.equal(findEntryQty(game, 'antidote'), 0);
});

test('no se pueden usar objetos mientras juega el enemigo, ni los que no tienes', () => {
    const game = newGame();
    addItem(game.player, 'fire_flask');
    startQuiet(game);

    game.combat.busy = true;
    assert.equal(game.useItem('fire_flask'), false);
    assert.equal(findEntryQty(game, 'fire_flask'), 1);
    assert.equal(game.combat.enemy.hp, 5000);

    game.combat.busy = false;
    assert.equal(game.useItem('energy_elixir'), false, 'no lo tienes');
    assert.equal(game.useItem('arcane_grimoire'), false, 'una reliquia no se "usa"');
});

// ───────── Tiendas ─────────

test('Grimorio Arcano de Barnaby: cuesta 40, da +1 de energía y no se compra dos veces', async () => {
    const game = newGame('mage');
    game.player.gold = 100;
    await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy_mana');

    assert.equal(game.player.gold, 60);
    assert.ok(owns(game.player, 'arcane_grimoire'));
    assert.equal(getModifiers(game.player).energyBonus, 1);

    await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy_mana');
    assert.equal(game.player.gold, 60);
    assert.ok(game.logs.some(line => line.includes('Ya tienes')));
});

test('comprar una poción la guarda en el inventario en vez de curarte al momento', async () => {
    const game = newGame();
    game.player.gold = 100;
    game.player.health = 50;
    await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy_potion');

    assert.equal(game.player.gold, 70);
    assert.equal(game.player.health, 50);
    assert.equal(findEntryQty(game, 'health_potion'), 1);
});

test('las ofertas "buy:<id>" de npcs.js venden cualquier objeto del catálogo', async () => {
    const game = newGame('rogue');
    game.player.gold = 100;
    await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy:antidote');
    assert.equal(game.player.gold, 75);
    assert.equal(findEntryQty(game, 'antidote'), 1);

    const warnings = [];
    const realWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
    try {
        await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy:objeto_que_no_existe');
        await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy:subsistence_potion'); // no está a la venta
    } finally {
        console.warn = realWarn;
    }
    assert.equal(warnings.length, 2);
    assert.equal(game.player.gold, 75);
});

test('sin oro no se compra y el PNJ lo comenta', async () => {
    const game = newGame('warrior');
    game.player.gold = 10;
    await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy:fire_flask');
    assert.equal(game.player.gold, 10);
    assert.equal(findEntryQty(game, 'fire_flask'), 0);
});

test('el romance con Morgana da la Poción de Subsistencia una sola vez', async () => {
    const game = newGame();
    const max = game.player.maxHealth;
    game.player.gold = 0;
    await game.exploration.npcActions.run(NPC_DATABASE.morgana, 'morgana_romance');
    assert.equal(game.player.maxHealth, max + 20);
    assert.equal(game.player.gold, 100);

    await game.exploration.npcActions.run(NPC_DATABASE.morgana, 'morgana_romance');
    assert.equal(game.player.maxHealth, max + 20, 'no se acumula');
    assert.equal(game.player.gold, 200);
});

// ───────── Inventario en pantalla ─────────

test('el inventario muestra cantidad y efecto, y solo los consumibles tienen botón "Usar"', () => {
    const game = newGame();
    addItem(game.player, 'health_potion');
    addItem(game.player, 'health_potion');
    addItem(game.player, 'arcane_grimoire');

    const list = dom.element('playerInventory');
    list.children = [];
    game.ui.updateStats(game.player, 1);

    const [potion, grimoire] = list.children;
    assert.equal(potion.children[0].textContent, '🧪 Poción de Salud x2');
    assert.equal(potion.children[1].textContent, 'Usar: recupera 40 HP');
    assert.equal(potion.children.length, 3, 'tiene botón Usar');
    assert.equal(grimoire.children.length, 2, 'una reliquia no tiene botón');
});

test('pulsar "Usar" en el inventario gasta el objeto', () => {
    const game = newGame();
    addItem(game.player, 'health_potion');
    game.player.health = 40;

    const list = dom.element('playerInventory');
    list.children = [];
    game.ui.updateStats(game.player, 1);
    const useButton = list.children[0].children[2];
    assert.equal(useButton.textContent, 'Usar');

    useButton.click();
    assert.equal(game.player.health, 80);
    assert.equal(findEntryQty(game, 'health_potion'), 0);
});

// ───────── Jefes ─────────

function startBossFight(game, floor = 5) {
    game.dungeonLevel = floor;
    game.combat.rng = () => 0.99; // sin gritos de carta ni botín normal
    game.combat.startBoss(getBossForFloor(floor));
}

const cardsNamed = (brain, name) =>
    [...brain.drawPile, ...brain.discard, brain.intent].filter(card => card?.name === name).length;

test('la planta 5 es del jefe: se presenta, habla y solo ofrece enfrentarse a él', async () => {
    const game = newGame('warrior', { level: 5 });
    await game.exploration.loadNext();

    assert.equal(dom.element('sceneBadgeOverlay').textContent, '⚠️ JEFE · PLANTA 5');
    assert.match(dom.element('explorationText').textContent, /Línea generada \d+ \(greeting\)/);

    const choices = dom.element('actionChoices').children;
    assert.equal(choices.length, 1, 'no hay forma de esquivarlo');
    choices[0].click();

    assert.equal(game.combat.enemy.isBoss, true);
    assert.equal(game.combat.enemy.name, 'Gorgrim, Jefe Orco');
});

test('Batu Jan se ha mudado a la planta 6 y el jefe tiene prioridad en la 5', async () => {
    const game = newGame('warrior', { level: 6 });
    await game.exploration.loadNext();
    assert.equal(dom.element('sceneBadgeOverlay').textContent, NPC_DATABASE.mongol.name.toUpperCase());
});

test('la planta anterior al jefe avisa de que algo enorme espera; las demás, no', async () => {
    const before = newGame('warrior', { level: 4 });
    await before.exploration.loadNext();
    assert.ok(before.logs.some(line => line.includes('presencia enorme')));

    const other = newGame('warrior', { level: 3 });
    await other.exploration.loadNext();
    assert.ok(!other.logs.some(line => line.includes('presencia enorme')));

    const onBossFloor = newGame('warrior', { level: 5 });
    await onBossFloor.exploration.loadNext();
    assert.ok(!onBossFloor.logs.some(line => line.includes('presencia enorme')));
});

test('el jefe empieza con su vida, su ataque y su armadura, y el título lo anuncia', () => {
    const game = newGame();
    startBossFight(game, 10);
    const boss = getBossForFloor(10);
    const expected = buildBossEnemy(boss, 10);

    assert.equal(game.combat.enemy.hp, expected.hp);
    assert.equal(game.combat.enemy.atk, expected.atk);
    assert.equal(game.combat.enemy.shield, boss.armor, 'empieza con la armadura puesta');
    assert.match(dom.element('dungeonTitle').textContent, /¡JEFE! Skrull, el Guerrero Esqueleto/);
    assert.ok(dom.element('dungeonTitle').classList.contains('boss-title'));
});

test('un enemigo normal no es jefe ni tiene armadura ni fases', () => {
    const game = newGame();
    game.combat.start({ description: 'un orco' });
    assert.equal(game.combat.enemy.isBoss, false);
    assert.equal(game.combat.enemy.armor, 0);
    assert.deepEqual(game.combat.enemy.phases, []);
});

test('la armadura del jefe se regenera en cada uno de sus turnos y absorbe tus golpes', async () => {
    const game = newGame();
    startBossFight(game, 5);
    const enemy = game.combat.enemy;
    game.combat.brain.intent = { name: 'Nada', type: 'atk', power: 0.01 };
    enemy.shield = 0;

    await game.combat.endTurn();
    assert.equal(enemy.shield, enemy.armor);

    const hp = enemy.hp;
    game.combat.playCard(card({ val: 20 }), 0);
    assert.equal(hp - enemy.hp, 20 - enemy.armor, 'la armadura se come parte del golpe');
});

test('al cruzar el umbral de vida el jefe cambia de fase, una sola vez y con todos sus efectos', () => {
    const game = newGame();
    startBossFight(game, 5);
    const enemy = game.combat.enemy;
    enemy.hp = Math.floor(enemy.maxHp * 0.5) + 10;
    enemy.shield = 0;

    game.combat.playCard(card({ val: 20 }), 0);

    assert.equal(enemy.phaseIndex, 1);
    assert.equal(enemy.atkBonus, 5);
    assert.equal(enemy.shield, 15);
    assert.equal(cardsNamed(game.combat.brain, '☠️ Frenesí Sangriento'), 2);
    assert.equal(cardsNamed(game.combat.brain, '📣 Grito de la Horda'), 1);
    assert.ok(game.logs.includes('💢 ¡Gorgrim, Jefe Orco entra en un frenesí sangriento!'));

    game.combat.playCard(card({ val: 5 }), 0);
    assert.equal(enemy.phaseIndex, 1, 'no se repite');
    assert.equal(enemy.atkBonus, 5, 'el bono no se duplica');
});

test('un golpe enorme atraviesa varias fases de una vez, en orden', () => {
    const game = newGame();
    startBossFight(game, 10); // Skrull, el Guerrero Esqueleto: fases al 60 % y al 30 %
    const enemy = game.combat.enemy;
    enemy.hp = Math.floor(enemy.maxHp * 0.65);
    enemy.shield = 0;

    game.combat.playCard(card({ val: 100 }), 0);

    assert.equal(enemy.phaseIndex, 2);
    assert.equal(enemy.atkBonus, 3 + 4);
    assert.equal(cardsNamed(game.combat.brain, '💀 Legión de Huesos'), 2);
    assert.equal(dom.element('enemySceneImage').src, 'img/skrullWarrior2.jpg', 'cambia el retrato');
    assert.ok(game.logs.findIndex(l => l.includes('se quita el yelmo')) < game.logs.findIndex(l => l.includes('invoca el portal de los caídos')));
});

test('la fase de curación del jefe le devuelve vida sin pasarse del máximo', () => {
    const game = newGame();
    startBossFight(game, 10);
    const enemy = game.combat.enemy;
    enemy.hp = Math.floor(enemy.maxHp * 0.65);
    enemy.shield = 0;

    game.combat.playCard(card({ val: 100 }), 0);

    assert.equal(enemy.hp, Math.floor(enemy.maxHp * 0.65) - 100 + 30);
    assert.ok(enemy.hp <= enemy.maxHp);
});

test('si el golpe mata al jefe no cambia de fase: se gana el combate', () => {
    const game = newGame();
    let wins = 0;
    game.combat.win = async () => { wins++; };
    startBossFight(game, 5);
    game.combat.enemy.hp = 5;
    game.combat.enemy.shield = 0;

    game.combat.playCard(card({ val: 50 }), 0);

    assert.equal(game.combat.enemy.phaseIndex, 0);
    assert.equal(wins, 1);
});

test('el veneno también puede hacer que el jefe cambie de fase', async () => {
    const game = newGame();
    startBossFight(game, 5);
    const enemy = game.combat.enemy;
    enemy.hp = Math.floor(enemy.maxHp * 0.5) + 2;
    enemy.poison = { dmg: 5, turns: 2 };

    await game.combat.endTurn();

    assert.equal(enemy.phaseIndex, 1);
});

test('al cambiar de fase el jefe dice una frase de fase y no la de "herido"', async () => {
    const game = newGame();
    await withFetch((u, o, real) => real(u, o), async (sent) => {
        startBossFight(game, 5);
        const enemy = game.combat.enemy;
        enemy.hp = Math.floor(enemy.maxHp * 0.5) + 10;
        enemy.shield = 0;

        game.combat.playCard(card({ val: 100 }), 0); // cruza la fase y baja del 40 %
        const phase = sent.find(request => request.kind === 'combat_phase');
        assert.equal(phase.outcome, 'entra en un frenesí sangriento');
        assert.ok(!kinds(sent).includes('combat_hurt'), 'esta vez solo habla la fase');

        game.combat.playCard(card({ val: 1 }), 0);
        assert.equal(kinds(sent).filter(kind => kind === 'combat_hurt').length, 1, 'la protesta llega en el golpe siguiente');
    });
});

test('el jefe habla con su voz y su estilo visual', async () => {
    const game = newGame();
    dom.element('enemySpeech').textContent = '';

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        startBossFight(game, 5);
        await until(() => dom.element('enemySpeech').textContent !== '');

        const start = sent.find(request => request.kind === 'combat_start');
        assert.equal(start.npcName, 'Gorgrim, Jefe Orco');
        assert.match(start.npcVoice, /tercera persona/);
    });
    assert.equal(dom.element('enemySpeech').className, 'enemy-speech speech-orco_jefe');
});

test('cada jefe juega 15 turnos con su mazo y acaba pasando por todas sus fases sin bloquear el combate', async () => {
    for (const [index, boss] of BOSSES.entries()) {
        const game = newGame();
        game.player.health = game.player.maxHealth = 1e6;
        startBossFight(game, 5 * (index + 1));
        const enemy = game.combat.enemy;

        for (let turn = 0; turn < 15; turn++) {
            await game.combat.endTurn();
            assert.equal(game.combat.busy, false, `${boss.id}: turno ${turn} bloqueado`);
            assert.ok(game.combat.brain.intent, `${boss.id}: sin próxima jugada`);

            enemy.hp = Math.max(1, Math.floor(enemy.hp * 0.8)); // lo vamos debilitando
            game.combat.checkPhases();
        }

        assert.equal(enemy.phaseIndex, boss.phases.length, `${boss.id}: no pasó por todas las fases`);
        for (const phase of boss.phases) {
            for (const added of phase.addCards ?? []) {
                assert.ok(cardsNamed(game.combat.brain, added.name) >= (added.copies ?? 1), `${boss.id}: faltan las cartas de la fase (${added.name})`);
            }
        }
    }
});

// ───────── Recompensas de jefe ─────────

test('derrotar a un jefe da el triple de oro y experiencia, una reliquia segura y un descanso', async () => {
    const game = newGame('warrior', { level: 5 });
    game.loadNextEvent = async () => {};
    game.player.maxHealth = 130;
    game.player.health = 50;
    game.player.maxXp = 10000; // evita la subida de nivel (que curaría del todo)
    startBossFight(game, 5);
    game.combat.rng = () => 0;
    const gold = game.player.gold;

    await winAndResolveReward(game, 'card');

    assert.equal(game.player.gold, gold + (100 + 5 * 15) * 3);
    assert.equal(game.player.xp, 60 * 3);
    assert.ok(owns(game.player, 'iron_charm'), 'una reliquia asegurada');
    assert.equal(game.player.health, 50 + Math.round(130 * 0.4), 'descansa un 40 % de su vida');
    assert.ok(game.logs.some(line => line.startsWith('🏕️ Descansas')));
    assert.ok(game.logs.some(line => line.startsWith('🎁 Encuentras')));
    assert.equal(game.dungeonLevel, 6);
});

test('el descanso del jefe no pasa de la vida máxima', async () => {
    const game = newGame('warrior', { level: 5 });
    game.loadNextEvent = async () => {};
    game.player.maxXp = 10000;
    game.player.health = game.player.maxHealth - 5;
    startBossFight(game, 5);

    await winAndResolveReward(game, 'card');

    assert.equal(game.player.health, game.player.maxHealth);
});

test('si ya tienes todas las reliquias, el jefe te compensa con 100 de oro extra', async () => {
    const game = newGame('warrior', { level: 5 });
    game.loadNextEvent = async () => {};
    ITEM_CATALOG.filter(item => item.kind === 'relic' && item.lootWeight > 0).forEach(item => addItem(game.player, item.id));
    const items = game.player.inventory.length;
    startBossFight(game, 5);
    const gold = game.player.gold;

    await winAndResolveReward(game, 'card');

    assert.equal(game.player.inventory.length, items);
    assert.ok(game.player.gold >= gold + (100 + 5 * 15) * 3 + 100);
    assert.ok(game.logs.some(line => line.includes('no tenía más reliquias')));
});

test('un enemigo normal no da recompensas de jefe', async () => {
    const game = newGame('warrior', { level: 5 });
    game.loadNextEvent = async () => {};
    game.player.maxXp = 10000;
    game.player.health = game.player.maxHealth - 30;
    game.combat.rng = () => 0.99; // sin botín
    game.combat.start({ name: 'Saco', hp: 10, atk: 1, deckId: 'corrupto' });
    const gold = game.player.gold;
    const health = game.player.health;

    await winAndResolveReward(game, 'card');

    assert.equal(game.player.gold, gold + 100 + 5 * 15);
    assert.equal(game.player.xp, 60);
    assert.equal(game.player.health, health, 'sin descanso');
    assert.equal(game.player.inventory.length, 0);
});

test('contra un jefe salen más cartas raras en la recompensa que contra un enemigo normal', async () => {
    const game = newGame('warrior', { level: 5 });

    async function offeredRares(boss) {
        let rares = 0;
        for (let i = 0; i < 120; i++) {
            dom.body.children.length = 0;
            const pending = game.combat.chooseReward({ boss });
            const [, row, skip] = dom.body.children.at(-1).children;
            row.children.forEach(el => { if (el.className.includes('rarity-rare')) rares++; });
            skip.click();
            await pending;
        }
        dom.body.children.length = 0;
        return rares;
    }

    const realRandom = Math.random;
    try {
        Math.random = seeded(12345);
        const normal = await offeredRares(false);
        Math.random = seeded(12345);
        const bossRares = await offeredRares(true);
        assert.ok(bossRares > normal * 1.3, `jefe: ${bossRares} raras · normal: ${normal}`);
    } finally {
        Math.random = realRandom;
    }
});

// ───────── Conversaciones con PNJ (estilo aventura gráfica) ─────────

const optionButtons = () => dom.element('chatOptions').children.map(item => item.children[0]);
const npcText = () => dom.element('npcChatText').textContent.replace(/[“”]/g, '');
const requestKinds = (sent) => sent.map(request => request.kind);

async function openChatWith(game, npcId = 'barnaby') {
    const npc = NPC_DATABASE[npcId];
    await game.exploration.openChat(npc);
    return npc;
}

test('todos los PNJ ofrecen conversar, siempre como última opción', () => {
    const game = newGame();
    for (const npc of Object.values(NPC_DATABASE)) {
        for (const classKey of ['warrior', 'mage', 'rogue']) {
            game.player.classKey = classKey;
            const choices = game.exploration.getNpcInteraction(npc).choices;
            assert.equal(choices.at(-1).action, 'chat', `${npc.id}/${classKey}`);
            assert.equal(choices.filter(c => c.action === 'chat').length, 1);
        }
    }
});

test('un jefe no tiene conversación: solo se puede enfrentar', async () => {
    const game = newGame('warrior', { level: 5 });
    await game.exploration.loadNext();
    assert.ok(dom.element('actionChoices').children.every(btn => !String(btn.textContent).includes('Conversar')));
});

test('elegir "Conversar" abre la vista sin avanzar la planta ni llamar a la IA para la bienvenida', async () => {
    const game = newGame('warrior', { level: 1 });
    await game.exploration.showNpc('barnaby');

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        const talkButton = dom.element('actionChoices').children.at(-1);
        talkButton.click();
        await until(() => game.chat.session && !game.chat.busy);

        assert.equal(dom.element('npcChatName').textContent, 'Barnaby el Buhonero');
        assert.ok(FALLBACK_LINES.barnaby.chat_open.includes(npcText()), 'la bienvenida sale del banco');
        assert.deepEqual(sent, [], 'ninguna llamada a la IA al abrir');
    });
    assert.equal(game.dungeonLevel, 1);
    assert.equal(game.floorsAdvanced, 0);
});

test('el menú numera los temas generales y añade el propio del personaje', async () => {
    const game = newGame();
    await openChatWith(game, 'barnaby');

    const labels = optionButtons().map(button => button.textContent);
    assert.equal(labels.length, 6);
    assert.equal(labels[0], '1. ¿Quién eres y qué haces aquí?');
    assert.equal(labels[4], '5. ¿Qué hay más adelante?');
    assert.equal(labels[5], '6. ¿Qué mercancía llevas?');
    assert.ok(optionButtons().every(button => button.disabled === false));
});

test('al elegir un tema hablas tú primero y después contesta el personaje, con la IA y sus datos', async () => {
    const game = newGame('warrior', { level: 3 });
    game.playerName = 'MORTIGAN';
    await openChatWith(game);

    const said = [];
    const realSay = game.chat.view.say.bind(game.chat.view);
    game.chat.view.say = (name, text, options) => { said.push({ name, text, hero: options.hero }); return realSay(name, text, options); };

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        await game.chat.pickTopic('boss');

        assert.deepEqual(said.map(line => [line.name, line.hero]), [['MORTIGAN', true], ['Barnaby el Buhonero', false]]);
        assert.equal(said[0].text, '¿Qué hay más adelante?');
        assert.match(said[1].text, /Línea generada \d+ \(chat_topic\)/);

        const request = sent.find(r => r.kind === 'chat_topic');
        assert.equal(request.type, 'npc_line');
        assert.equal(request.action, '¿Qué hay más adelante?');
        assert.equal(request.npcName, 'Barnaby el Buhonero');
        assert.ok(request.facts.some(fact => fact.includes('A 2 plantas de aquí espera un jefe: Gorgrim')), 'datos reales del próximo jefe');
    });
});

test('el consejo se basa en cómo va tu héroe de verdad', async () => {
    const game = newGame();
    game.player.health = 20;
    await openChatWith(game, 'valerius');

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        await game.chat.pickTopic('advice');
        const { facts } = sent.find(r => r.kind === 'chat_topic');
        assert.ok(facts.some(fact => fact.includes('malherido')));
        assert.ok(facts.some(fact => fact.includes('no lleva pociones')));
        assert.ok(facts.length <= 4);
    });
});

test('lo que vende Barnaby en la conversación coincide con su tienda real', async () => {
    const game = newGame('mage');
    await openChatWith(game, 'barnaby');

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        await game.chat.pickTopic('wares');
        const { facts } = sent.find(r => r.kind === 'chat_topic');
        assert.ok(facts.some(fact => fact.includes('Grimorio Arcano por 40 de oro')));
        assert.ok(facts.some(fact => fact.includes('Poción de Salud por 30 de oro')));
        assert.ok(!facts.some(fact => fact.includes('Antídoto')), 'la maga no ve las ofertas del pícaro');
    });
});

test('cada tema se pregunta una sola vez por personaje y queda marcado', async () => {
    const game = newGame();
    await openChatWith(game);

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        await game.chat.pickTopic('who');
        await game.chat.pickTopic('who');
        assert.equal(sent.filter(r => r.kind === 'chat_topic').length, 1);
    });

    const [first] = optionButtons();
    assert.ok(first.textContent.endsWith('✓'));
    assert.ok(first.className.includes('asked'));
    assert.equal(first.disabled, true);
});

test('un tema nuevo da experiencia una sola vez por personaje (y el de jefe, el doble)', async () => {
    const game = newGame();
    game.player.maxXp = 10000;
    await openChatWith(game);

    await game.chat.pickTopic('who');
    assert.equal(game.player.xp, 10);
    assert.ok(game.logs.some(line => line.includes('Aprendes algo nuevo de Barnaby el Buhonero (+10 XP)')));

    await game.chat.pickTopic('boss');
    assert.equal(game.player.xp, 30);

    game.chat.leave();
    await openChatWith(game, 'valerius');
    await game.chat.pickTopic('who'); // otro personaje: vuelve a dar experiencia
    assert.equal(game.player.xp, 40);

    game.chat.leave();
    await openChatWith(game, 'barnaby');
    await game.chat.pickTopic('who'); // ya lo preguntaste a Barnaby: nada
    assert.equal(game.player.xp, 40);
});

test('la experiencia de una conversación puede subirte de nivel', async () => {
    const game = newGame();
    game.player.xp = 95;
    const level = game.player.level;
    await openChatWith(game);
    await game.chat.pickTopic('who');
    assert.equal(game.player.level, level + 1);
    assert.ok(game.logs.some(line => line.includes('SUBIDA DE NIVEL')));
});

test('mientras alguien habla no se puede elegir otro tema ni escribir', async () => {
    const game = newGame();
    await openChatWith(game);

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        const first = game.chat.pickTopic('who');
        assert.equal(game.chat.busy, true);
        assert.ok(optionButtons().every(button => button.disabled), 'el menú se apaga mientras tanto');

        game.chat.pickTopic('place'); // se ignora
        dom.element('playerChatInput').value = 'hola';
        game.chat.sendFree();          // se ignora
        await first;

        assert.equal(sent.filter(r => r.kind.startsWith('chat_')).length, 1);
    });
    assert.equal(game.chat.busy, false);
});

test('entrada libre: lo que escribes se limpia, se responde y se descuenta de tus mensajes', async () => {
    const game = newGame();
    await openChatWith(game);
    dom.element('playerChatInput').value = '  Hola\n\n   viajero\u0000  ';

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        await game.chat.sendFree();
        const request = sent.find(r => r.kind === 'chat_free');
        assert.equal(request.action, 'Hola viajero');
        assert.match(npcText(), /Línea generada \d+ \(chat_free\)/);
    });

    assert.equal(dom.element('playerChatInput').value, '', 'el cuadro se vacía');
    assert.equal(dom.element('chatFreeCounter').textContent, `💬 Preguntas libres: ${CHAT.FREE_PER_NPC - 1}/${CHAT.FREE_PER_NPC}`);
});

test('entrada libre: lo que escribes se acorta al máximo y el mensaje vacío no gasta ninguno', async () => {
    const game = newGame();
    await openChatWith(game);

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        dom.element('playerChatInput').value = '   \n  ';
        await game.chat.sendFree();
        assert.equal(sent.length, 0);

        dom.element('playerChatInput').value = 'x'.repeat(500);
        await game.chat.sendFree();
        assert.equal(sent.find(r => r.kind === 'chat_free').action.length, CHAT.MAX_INPUT);
    });
    assert.equal(game.chat.freeLeft(NPC_DATABASE.barnaby), CHAT.FREE_PER_NPC - 1);
});

test('entrada libre: cada personaje admite un número limitado de mensajes y luego se bloquea la entrada', async () => {
    const game = newGame();
    await openChatWith(game);

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        for (let i = 0; i < CHAT.FREE_PER_NPC + 2; i++) {
            dom.element('playerChatInput').value = `mensaje ${i}`;
            await game.chat.sendFree();
        }
        assert.equal(sent.filter(r => r.kind === 'chat_free').length, CHAT.FREE_PER_NPC);
    });

    assert.equal(dom.element('playerChatInput').disabled, true);
    assert.equal(dom.element('btnSendChat').disabled, true);
    assert.match(dom.element('playerChatInput').placeholder, /Ya no tiene más que decirte/);

    game.chat.leave();
    await openChatWith(game, 'valerius'); // otro personaje: su propio cupo
    assert.equal(dom.element('playerChatInput').disabled, false);
});

test('la tecla Enter envía el mensaje', async () => {
    const game = newGame();
    await openChatWith(game);
    dom.element('playerChatInput').value = '¿Qué tal?';

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        let prevented = false;
        dom.element('playerChatInput').listeners.keydown({ key: 'Enter', preventDefault: () => { prevented = true; } });
        await until(() => !game.chat.busy);

        assert.ok(prevented);
        assert.equal(sent.filter(r => r.kind === 'chat_free').length, 1);

        dom.element('playerChatInput').value = 'otra';
        dom.element('playerChatInput').listeners.keydown({ key: 'a', preventDefault() {} }); // otra tecla: nada
        await settle();
        assert.equal(sent.filter(r => r.kind === 'chat_free').length, 1);
    });
});

test('sin IA el personaje sigue contestando con las frases de su banco, por tema', async () => {
    const game = newGame('rogue');
    await openChatWith(game, 'morgana');
    const realWarn = console.warn;
    console.warn = () => {};
    try {
        await withFetch(async () => ({ ok: false, status: 500 }), async () => {
            await game.chat.pickTopic('cauldron');
            assert.ok(FALLBACK_LINES.morgana.chat_cauldron.includes(npcText()), npcText());

            dom.element('playerChatInput').value = 'blablabla';
            await game.chat.sendFree();
            assert.ok(FALLBACK_LINES.morgana.chat_free.includes(npcText()), npcText());
        });
    } finally {
        console.warn = realWarn;
    }
});

test('despedirse te devuelve al menú del PNJ en la misma planta, sin repetir el saludo y con todo intacto', async () => {
    const game = newGame('warrior', { level: 1 });
    game.player.gold = 100;
    await game.exploration.showNpc('barnaby');
    dom.element('actionChoices').children.at(-1).click();
    await until(() => game.chat.session && !game.chat.busy);

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        dom.element('btnLeaveChat').click();
        assert.equal(game.chat.session, null);
        assert.deepEqual(sent, [], 'no se pide otro saludo');
    });

    assert.match(dom.element('explorationText').textContent, /Te despides de Barnaby el Buhonero/);
    assert.equal(dom.element('sceneBadgeOverlay').textContent, 'BARNABY EL BUHONERO');
    assert.equal(dom.element('actionChoices').children.length, game.exploration.getNpcInteraction(NPC_DATABASE.barnaby).choices.length);
    assert.equal(game.dungeonLevel, 1);
    assert.equal(game.floorsAdvanced, 0);

    // y todavía se puede comprar, conversar de nuevo o seguir
    await game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'buy_potion');
    assert.equal(game.player.gold, 70);
});

test('irse en mitad de una frase la corta, no da experiencia y no pierde el tema', async () => {
    const game = newGame();
    await openChatWith(game);
    game.chat.typeSpeed = 3; // escritura lenta para poder interrumpirla

    const xp = game.player.xp;
    const talking = game.chat.pickTopic('who');
    game.chat.leave();
    await talking;

    assert.equal(game.player.xp, xp);
    assert.ok(!game.chat.askedSet(NPC_DATABASE.barnaby).has('who'), 'el tema sigue disponible');
    assert.equal(game.chat.busy, false);
});

test('una respuesta que llega cuando ya te has despedido se descarta', async () => {
    const game = newGame();
    await openChatWith(game);
    let release;
    let heard = false;

    await withFetch(() => new Promise(resolve => { release = () => resolve({ ok: true, json: async () => ({ description: 'Tarde' }) }); }), async () => {
        const talking = game.chat.pickTopic('place');
        await until(() => typeof release === 'function');

        const realSay = NpcChatView.prototype.say;
        NpcChatView.prototype.say = async function (...args) { heard = true; return realSay.apply(this, args); };
        try {
            game.chat.leave();
            release();
            await talking;
            await settle();
        } finally {
            NpcChatView.prototype.say = realSay;
        }
    });
    assert.equal(heard, false);
});

test('la bienvenida no repite la misma frase dos veces seguidas', async () => {
    const game = newGame();
    const welcomes = [];
    for (let i = 0; i < 4; i++) {
        await openChatWith(game, 'barnaby');
        welcomes.push(npcText());
        game.chat.leave();
    }
    welcomes.forEach((line, i) => { if (i > 0) assert.notEqual(line, welcomes[i - 1]); });
    welcomes.forEach(line => assert.ok(FALLBACK_LINES.barnaby.chat_open.includes(line)));
});

test('con cada personaje se pueden preguntar todos sus temas sin errores', async () => {
    for (const npc of Object.values(NPC_DATABASE)) {
        const game = newGame('warrior', { level: 2 });
        game.player.maxXp = 1e6;
        await game.exploration.openChat(npc);

        for (const topic of topicsFor(npc)) await game.chat.pickTopic(topic.id);

        assert.equal(game.chat.askedSet(npc).size, topicsFor(npc).length, npc.id);
        assert.ok(optionButtons().every(button => button.disabled), `${npc.id}: todos preguntados`);
        game.chat.leave();
    }
});

test('pickTopic sin conversación abierta o con un tema desconocido no hace nada', async () => {
    const game = newGame();
    await game.chat.pickTopic('who');
    await game.chat.sendFree();
    game.chat.leave();

    await openChatWith(game);
    await game.chat.pickTopic('tema_inventado');
    assert.equal(game.chat.askedSet(NPC_DATABASE.barnaby).size, 0);
});

// ───────── La vista: escritura letra a letra, retratos y pitidos ─────────

async function renderedView() {
    const game = newGame();
    const view = new NpcChatView(dom.element('mainContent'), game);
    view.render({ npc: NPC_DATABASE.barnaby, heroName: 'MORTIGAN', heroImg: 'img/guerrero.png' });
    return view;
}

test('la frase se escribe letra a letra con un pitido cada dos letras', async () => {
    const view = await renderedView();
    const snapshots = [];
    let ticks = 0;

    await view.say('Barnaby', 'Hola amigo', { speedMs: 1, onTick: () => { ticks++; snapshots.push(dom.element('npcChatText').textContent); }, blipEvery: 2 });

    assert.equal(dom.element('npcChatText').textContent, '“Hola amigo”');
    assert.equal(ticks, Math.floor('“Hola amigo”'.length / 2));
    assert.ok(snapshots[0].length < snapshots.at(-1).length, 'el texto va creciendo');
});

test('un clic en la caja completa la frase de golpe', async () => {
    const view = await renderedView();
    const typing = view.say('Barnaby', 'Una frase bastante larga para poder interrumpirla', { speedMs: 5 });
    dom.element('chatDialogueBox').click();
    await typing;
    assert.equal(dom.element('npcChatText').textContent, '“Una frase bastante larga para poder interrumpirla”');
});

test('mientras habla, el retrato del PNJ cambia a su imagen de hablar y vuelve después', async () => {
    const view = await renderedView();
    const seen = [];

    await view.say('Barnaby', 'Hola', { speedMs: 1, onTick: () => seen.push([dom.element('npcChatImage').src, dom.element('npcChatImage').classList.contains('talking')]) });

    assert.deepEqual(seen[0], ['img/barnaby_talk.png', true]);
    assert.equal(dom.element('npcChatImage').src, 'img/barnaby_room.png');
    assert.equal(dom.element('npcChatImage').classList.contains('talking'), false);
});

test('cuando habla el héroe se ilumina su retrato y la caja cambia de color', async () => {
    const view = await renderedView();

    await view.say('MORTIGAN', 'Buenas', { hero: true });
    assert.equal(dom.element('chatHeroImage').classList.contains('speaking'), true);
    assert.equal(dom.element('chatDialogueBox').classList.contains('hero-speaking'), true);
    assert.equal(dom.element('npcChatImage').classList.contains('talking'), false);

    await view.say('Barnaby', 'Hola', {});
    assert.equal(dom.element('chatHeroImage').classList.contains('speaking'), false);
    assert.equal(dom.element('chatDialogueBox').classList.contains('hero-speaking'), false);
});

test('el texto de la IA nunca se mete como HTML', async () => {
    const view = await renderedView();
    const attack = '<img src=x onerror=alert(1)> <b>negrita</b>';

    await view.say(attack, attack, {});
    assert.equal(dom.element('npcChatText').textContent, `“${attack}”`);
    assert.equal(dom.element('npcChatName').textContent, attack);
    assert.ok(!dom.element('mainContent').innerHTML.includes('onerror'));

    view.showThinking('Barnaby');
    assert.equal(dom.element('npcChatText').textContent, '...');
});

test('el pitido de la máquina de escribir suena durante las conversaciones', async () => {
    const game = newGame();
    game.chat.typeSpeed = 1;
    const sounds = [];
    const realPlay = game.audio.play.bind(game.audio);
    game.audio.play = (type) => { sounds.push(type); return realPlay(type); };

    await game.exploration.openChat(NPC_DATABASE.barnaby);
    assert.ok(sounds.filter(type => type === 'blip').length > 5);
    game.chat.leave();
});

// ───────── Aliados: convencer, grupo y combate ─────────

const argButtons = () => dom.element('chatArgumentList').children.map(item => item.children[0]);
const goodArgs = (id) => ALLIES[id].arguments.filter(arg => arg.good).map(arg => arg.id);
const badArgs = (id) => ALLIES[id].arguments.filter(arg => !arg.good).map(arg => arg.id);

/** Abre la conversación y habla lo justo para tener confianza (los temas que pide PERSUASION). */
async function chatReady(game, npcId) {
    await openChatWith(game, npcId);
    await game.chat.pickTopic('who');
    await game.chat.pickTopic('place');
}

/** Valor de la habilidad de un aliado a ese nivel (sale del catálogo: ajustar el equilibrio no rompe los tests). */
const abilityValue = (id, level = 1) => ALLIES[id].ability.base + ALLIES[id].ability.perLevel * level;

const harmlessTurn = async (game) => {
    game.combat.brain.intent = { name: 'Nada', type: 'atk', power: 0.01 };
    await game.combat.endTurn();
};

test('solo los personajes que pueden ser aliados ofrecen el tema de sus valores, y con sus datos reales', async () => {
    const game = newGame();
    assert.ok(!topicsFor(NPC_DATABASE.barnaby).some(topic => topic.id === 'values'));
    assert.ok(topicsFor(NPC_DATABASE.mongol).some(topic => topic.id === 'values'));

    await openChatWith(game, 'mongol');
    await withFetch((u, o, real) => real(u, o), async (sent) => {
        await game.chat.pickTopic('values');
        assert.deepEqual(sent.find(r => r.kind === 'chat_topic').facts, ALLIES.mongol.values);
    });
});

test('antes de tener confianza solo avisa; tras hablar un poco aparecen los cuatro argumentos', async () => {
    const game = newGame();
    await openChatWith(game, 'mongol');

    assert.match(dom.element('chatArgumentsTitle').textContent, /Habla un poco más con Batu Jan/);
    assert.equal(argButtons().length, 0);
    await game.chat.pickTopic('who');
    assert.equal(argButtons().length, 0, 'un tema no basta');
    await game.chat.pickTopic('place');

    assert.equal(argButtons().length, 4);
    assert.match(dom.element('chatArgumentsTitle').textContent, /Convencerle de que te acompañe/);
    assert.equal(argButtons()[0].textContent, `• ${ALLIES.mongol.arguments[0].label}`);
    assert.ok(argButtons().every(button => !button.disabled));
});

test('un personaje que no puede ser aliado no muestra la zona de argumentos', async () => {
    const game = newGame();
    await openChatWith(game, 'barnaby');
    assert.equal(dom.element('chatArguments').style.display, 'none');
    await game.chat.pickArgument('gold'); // se ignora
    assert.equal(game.party.members.length, 0);
});

test('un argumento le llega a la IA con su decisión ya tomada y sus valores, y queda gastado', async () => {
    const game = newGame();
    await chatReady(game, 'mongol');

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        await game.chat.pickArgument('gold'); // malo
        const request = sent.find(r => r.kind === 'chat_persuade');
        assert.equal(request.type, 'npc_line');
        assert.equal(request.action, ALLIES.mongol.arguments[0].label);
        assert.equal(request.outcome, 'Su argumento no te convence.');
        assert.deepEqual(request.facts, ALLIES.mongol.values);

        await game.chat.pickArgument('path'); // bueno, pero aún no basta
        assert.equal(sent.at(-1).outcome, 'Su argumento te convence en parte.');
    });

    assert.ok(argButtons()[0].textContent.endsWith('(ya lo dijiste)'));
    assert.equal(argButtons()[0].disabled, true);
});

test('con los dos argumentos buenos el personaje se une: grupo, experiencia y despedida', async () => {
    const game = newGame();
    await chatReady(game, 'mongol'); // 20 XP de los dos temas

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        for (const id of goodArgs('mongol')) await game.chat.pickArgument(id);
        assert.equal(sent.at(-1).outcome, 'Su argumento te convence del todo: has decidido unirte a su grupo.');
    });

    assert.ok(game.party.has('mongol'));
    assert.equal(game.player.xp, 20 + PARTY.RECRUIT_XP);
    assert.ok(game.logs.includes('🤝 ¡Batu Jan se une a tu grupo!'));

    assert.equal(dom.element('chatOptions').children.length, 0, 'ya no hay más temas');
    assert.equal(dom.element('chatArguments').style.display, 'none');
    assert.equal(dom.element('playerChatInput').disabled, true);
    assert.equal(dom.element('btnLeaveChat').textContent, '➡️ Seguir con tu nuevo aliado');
});

test('al despedirte de un nuevo aliado ves que se une y solo queda seguir adelante', async () => {
    const game = newGame();
    await chatReady(game, 'vikinga');
    for (const id of goodArgs('vikinga')) await game.chat.pickArgument(id);

    dom.element('btnLeaveChat').click();

    assert.equal(dom.element('explorationText').textContent, `${NPC_DATABASE.vikinga.name} se une a tu grupo y te acompañará por la mazmorra.`);
    const choices = dom.element('actionChoices').children;
    assert.equal(choices.length, 1);
    assert.equal(choices[0].textContent, '➡️ Seguir adelante');

    choices[0].click();
    assert.equal(game.floorsAdvanced, 1);
});

test('dos argumentos malos antes de los buenos y el personaje deja de escucharte', async () => {
    const game = newGame();
    await chatReady(game, 'mongol');

    await withFetch((u, o, real) => real(u, o), async (sent) => {
        await game.chat.pickArgument('gold');
        await game.chat.pickArgument('threat');
        assert.equal(sent.at(-1).outcome, 'Su argumento te irrita y te cansa: no quieres seguir escuchándole.');

        const before = sent.length;
        await game.chat.pickArgument('path'); // ya no escucha
        assert.equal(sent.length, before);
    });

    assert.match(dom.element('chatArgumentsTitle').textContent, /ya no quiere escucharte/);
    assert.equal(argButtons().length, 0);
    assert.ok(!game.party.has('mongol'));
});

test('un solo argumento malo no cierra la puerta: aún se le puede convencer', async () => {
    const game = newGame();
    await chatReady(game, 'necro');

    await game.chat.pickArgument('light'); // malo
    for (const id of goodArgs('necro')) await game.chat.pickArgument(id);

    assert.ok(game.party.has('necro'));
});

test('con el grupo completo no se puede convencer a otro, hasta que despides a alguien', async () => {
    const game = newGame();
    game.recruitAlly('mongol');
    game.recruitAlly('vikinga');
    await chatReady(game, 'necro');

    assert.match(dom.element('chatArgumentsTitle').textContent, /Tu grupo está completo \(2\/2\)/);
    assert.equal(argButtons().length, 0);
    await game.chat.pickArgument('tomes'); // se ignora
    assert.equal(game.persuasion.stateFor('necro').used.size, 0);

    game.dismissAlly('vikinga');
    game.chat.refreshControls();
    assert.equal(argButtons().length, 4);
});

test('irse en mitad de un argumento no lo gasta', async () => {
    const game = newGame();
    await chatReady(game, 'mongol');
    game.chat.typeSpeed = 3;

    const talking = game.chat.pickArgument('path');
    game.chat.leave();
    await talking;

    assert.equal(game.persuasion.stateFor('mongol').used.size, 0);
    assert.ok(!game.party.has('mongol'));
});

test('recruitAlly no da ni experiencia ni sitio a un repetido o a un grupo lleno', () => {
    const game = newGame();
    assert.equal(game.recruitAlly('mongol').ok, true);
    const xp = game.player.xp;

    assert.equal(game.recruitAlly('mongol').reason, 'already');
    game.recruitAlly('vikinga');
    assert.equal(game.recruitAlly('valerius').reason, 'full');
    assert.equal(game.player.xp, xp + PARTY.RECRUIT_XP, 'solo el segundo aliado dio experiencia');
});

test('los seis aliados se consiguen con sus dos argumentos buenos, y ninguno con los dos malos', async () => {
    for (const id of Object.keys(ALLIES)) {
        const good = newGame();
        await chatReady(good, id);
        for (const arg of goodArgs(id)) await good.chat.pickArgument(arg);
        assert.ok(good.party.has(id), `${id}: con los buenos se une`);

        const bad = newGame();
        await chatReady(bad, id);
        for (const arg of badArgs(id)) await bad.chat.pickArgument(arg);
        assert.ok(!bad.party.has(id) && bad.persuasion.stateFor(id).locked, `${id}: con los malos no`);
    }
});

// ───────── El panel "Grupo" ─────────

test('el panel Grupo muestra la carta, el nombre y lo que hace cada aliado, y permite despedirle', () => {
    const game = newGame();
    game.recruitAlly('mongol');

    const panel = dom.element('allyParty');
    assert.equal(panel.children[0].textContent, 'Grupo');
    const [image, info, dismiss] = panel.children[1].children;
    assert.equal(image.src, 'img/npcs/cartaArquero.png');
    assert.equal(info.children[0].textContent, 'Batu Jan');
    assert.match(info.children[1].textContent, /Lluvia de Flechas: Dispara al enemigo cada turno/);

    dismiss.click();
    assert.equal(game.party.members.length, 0);
    assert.equal(panel.children.length, 0, 'sin aliados el panel desaparece');
    assert.ok(game.logs.includes('👋 Batu Jan deja tu grupo.'));
});

test('si la carta del aliado no carga, se usa una imagen de respaldo', () => {
    const game = newGame();
    game.recruitAlly('pirata');
    const [image] = dom.element('allyParty').children[1].children;
    image.onerror();
    assert.equal(image.src, 'img/guerrero.png');
});

test('el aliado que actúa se resalta un momento, y el resaltado sobrevive a repintar el panel', async () => {
    const game = newGame();
    game.recruitAlly('mongol');

    game.ui.flashAlly('mongol');
    assert.ok(game.ui.acting.has('mongol'));
    game.ui.updateStats(game.player, 1); // repintar
    assert.ok(dom.element('allyParty').children[1].className.includes('acting'));

    await settle();
    assert.equal(game.ui.acting.has('mongol'), false);
});

// ───────── Los aliados en combate ─────────

test('un aliado actúa gratis al empezar cada turno, sin gastar tu energía', async () => {
    const game = newGame();
    game.recruitAlly('mongol');
    const arrows = abilityValue('mongol');
    startQuiet(game, { name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });
    assert.equal(game.combat.enemy.hp, 5000 - arrows, 'ya en el primer turno');
    assert.equal(game.combat.energy, COMBAT.ENERGY_PER_TURN);

    await harmlessTurn(game);
    assert.equal(game.combat.enemy.hp, 5000 - 2 * arrows);
    assert.equal(game.combat.energy, COMBAT.ENERGY_PER_TURN);
});

test('cada aliado hace lo suyo: escudo, mordisco que cura y veneno', async () => {
    const shield = newGame();
    shield.recruitAlly('vikinga');
    startQuiet(shield);
    assert.equal(shield.combat.heroShield, abilityValue('vikinga'));

    const bite = newGame();
    bite.recruitAlly('valerius');
    bite.player.health = 50;
    startQuiet(bite);
    assert.equal(bite.combat.enemy.hp, 5000 - abilityValue('valerius'));
    assert.equal(bite.player.health, 50 + abilityValue('valerius'), 'el mordisco te cura lo que muerde');

    const curse = newGame();
    curse.recruitAlly('necro');
    startQuiet(curse);
    assert.deepEqual(curse.combat.enemy.poison, { dmg: abilityValue('necro'), turns: ALLIES.necro.ability.turns });
    await harmlessTurn(curse);
    assert.equal(curse.combat.enemy.hp, 5000 - abilityValue('necro'), 'el veneno hace daño en su turno');
});

test('el escudo de Astrid absorbe de verdad el golpe del enemigo', async () => {
    const game = newGame();
    game.recruitAlly('vikinga');
    const guard = abilityValue('vikinga');
    startQuiet(game, { name: 'Pegón', hp: 5000, atk: guard, deckId: 'corrupto' });

    game.combat.brain.intent = { name: 'Golpe', type: 'atk', power: 1 }; // justo la guardia que tienes
    const hp = game.player.health;
    await game.combat.endTurn();
    assert.equal(game.player.health, hp, 'todo el daño se queda en la guardia');
});

test('dos aliados actúan en el orden en que llegaron', () => {
    const game = newGame();
    game.recruitAlly('mongol');
    game.recruitAlly('vikinga');
    startQuiet(game);
    assert.equal(game.combat.enemy.hp, 5000 - abilityValue('mongol'));
    assert.equal(game.combat.heroShield, abilityValue('vikinga'));
});

test('la Capitana dispara un turno sí y otro no', async () => {
    const game = newGame();
    game.recruitAlly('pirata'); // cada 2 turnos
    const cannon = abilityValue('pirata');
    startQuiet(game);
    assert.equal(game.combat.enemy.hp, 5000 - cannon, 'turno 1');

    await harmlessTurn(game);
    assert.equal(game.combat.enemy.hp, 5000 - cannon, 'turno 2: descansa');
    await harmlessTurn(game);
    assert.equal(game.combat.enemy.hp, 5000 - 2 * cannon, 'turno 3');
});

test('la habilidad de un aliado crece con tu nivel', () => {
    const low = newGame();
    low.recruitAlly('mongol');
    startQuiet(low);

    const high = newGame();
    high.player.level = 5;
    high.recruitAlly('mongol');
    startQuiet(high);

    assert.equal(5000 - low.combat.enemy.hp, abilityValue('mongol', 1));
    assert.equal(5000 - high.combat.enemy.hp, abilityValue('mongol', 5));
});

test('un aliado puede rematar al enemigo y se gana el combate', () => {
    const game = newGame();
    let wins = 0;
    game.combat.win = async () => { wins++; };
    game.recruitAlly('pirata');
    startQuiet(game, { name: 'Débil', hp: abilityValue('pirata'), atk: 1, deckId: 'corrupto' });
    assert.equal(wins, 1);
});

test('los aliados también hacen cruzar las fases a un jefe', () => {
    const game = newGame();
    startBossFight(game, 5);
    game.recruitAlly('mongol'); // llega después, para controlar la vida del jefe
    const enemy = game.combat.enemy;
    enemy.hp = Math.floor(enemy.maxHp * 0.5) + 2;
    enemy.shield = 0;

    game.combat.runAllies();

    assert.equal(enemy.phaseIndex, 1, 'las flechas de Batu Jan lo llevan a su fase final');
});

test('sin aliados el combate funciona como siempre', async () => {
    const game = newGame();
    startQuiet(game);
    assert.equal(game.combat.enemy.hp, 5000);
    assert.equal(game.combat.heroShield, 0);
    await harmlessTurn(game);
    assert.equal(game.combat.enemy.hp, 5000);
});

// ───────── Personajes nuevos y jefe esqueleto ─────────

test('las plantas 7, 8 y 9 tienen a Malakar, a la Capitana Zafira y a la Dama de la Noche, y todos se pueden conversar', async () => {
    for (const [level, badge] of [[7, 'MALAKAR EL NECROMANTE'], [8, 'CAPITANA ZAFIRA'], [9, 'LA DAMA DE LA NOCHE']]) {
        const game = newGame('warrior', { level });
        await game.exploration.loadNext();
        assert.equal(dom.element('sceneBadgeOverlay').textContent, badge);
        assert.ok(dom.element('actionChoices').children.at(-1).textContent.startsWith('💬 Conversar con'), badge);
    }
});

test('la Dama de la Noche se puede cortejar y combatir como PNJ', async () => {
    const game = newGame('mage', { level: 9 });
    game.player.maxXp = 1e6;
    await game.exploration.npcActions.run(NPC_DATABASE.vampira, 'flirt_challenge');
    assert.equal(game.player.xp, 80);

    const fight = newGame('warrior', { level: 9 });
    fight.combat.startFromNpc(NPC_DATABASE.vampira);
    assert.equal(fight.combat.enemy.name, 'La Dama de la Noche');
    assert.equal(fight.combat.enemy.deckId, 'vampira');
});

test('la planta 10 la guarda Skrull, el Guerrero Esqueleto', async () => {
    const game = newGame('warrior', { level: 10 });
    await game.exploration.loadNext();
    assert.equal(dom.element('sceneBadgeOverlay').textContent, '⚠️ JEFE · PLANTA 10');

    dom.element('actionChoices').children[0].click();
    assert.equal(game.combat.enemy.name, 'Skrull, el Guerrero Esqueleto');
    assert.equal(game.combat.enemy.img, 'img/skrullWarrior.jpg');
});
