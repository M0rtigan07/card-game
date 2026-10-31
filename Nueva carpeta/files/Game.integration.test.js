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
    const game = newGame('warrior', { level: 8 });
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
    const game = newGame('warrior', { level: 8 });
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
    assert.match(dom.element('dungeonTitle').textContent, /¡JEFE! La Dama de la Noche/);
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
    startBossFight(game, 10); // La Dama de la Noche: fases al 60 % y al 30 %
    const enemy = game.combat.enemy;
    enemy.hp = Math.floor(enemy.maxHp * 0.65);
    enemy.shield = 0;

    game.combat.playCard(card({ val: 100 }), 0);

    assert.equal(enemy.phaseIndex, 2);
    assert.equal(enemy.atkBonus, 3 + 4);
    assert.equal(cardsNamed(game.combat.brain, '🩸 Sed Insaciable'), 2);
    assert.equal(dom.element('enemySceneImage').src, 'img/npcs/vampira_enojada.jpg', 'cambia el retrato');
    assert.ok(game.logs.findIndex(l => l.includes('se alimenta de las sombras')) < game.logs.findIndex(l => l.includes('muestra su verdadera forma')));
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
