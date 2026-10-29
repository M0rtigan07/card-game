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

async function until(condition, tries = 50) {
    for (let i = 0; i < tries && !condition(); i++) await new Promise(resolve => setImmediate(resolve));
    assert.ok(condition(), 'la condición no llegó a cumplirse');
}

const card = (over) => ({ id: 'strike', name: 'Carta de prueba', cost: 1, type: 'atk', val: 10, rarity: 'starter', ...over });

// ───────── PNJ ─────────

test('cada acción de cada PNJ funciona con las 3 clases y ninguna queda sin manejar', () => {
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
                    assert.doesNotThrow(
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

test('una acción desconocida avisa y avanza de planta en vez de bloquear el juego', () => {
    const game = newGame();
    const realWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => warnings.push(args.join(' '));
    try {
        game.exploration.npcActions.run(NPC_DATABASE.valerius, 'accion_inventada');
    } finally {
        console.warn = realWarn;
    }
    assert.equal(game.floorsAdvanced, 1);
    assert.equal(warnings.length, 1);
});

test('combatir con un PNJ usa su nombre, su vida y su mazo', () => {
    const game = newGame('warrior', { level: 2 });
    const npc = NPC_DATABASE.valerius;
    game.exploration.npcActions.run(npc, 'combat');

    assert.equal(game.combat.enemy.name, npc.name);
    assert.equal(game.combat.enemy.hp, npc.baseHp + 2 * 10);
    assert.equal(game.combat.enemy.deckId, 'valerius');
    assert.ok(game.combat.brain.intent, 'el enemigo anuncia su primera jugada');
});

test('pagar el peaje cobra lo de cada PNJ, y sin oro se acaba en combate', () => {
    const game = newGame();
    game.player.gold = 100;
    game.exploration.npcActions.run(NPC_DATABASE.morgana, 'buy');
    assert.equal(game.player.gold, 40); // Morgana cobra 60

    const poor = newGame();
    poor.player.gold = 0;
    poor.exploration.npcActions.run(NPC_DATABASE.morgana, 'buy');
    assert.equal(poor.combat.enemy?.name, NPC_DATABASE.morgana.name);
});

test('robar a Barnaby: con buena tirada ganas oro y con mala pierdes vida', () => {
    const rich = newGame();
    rich.exploration.rollD20 = () => 15;
    rich.exploration.npcActions.run(NPC_DATABASE.barnaby, 'steal');
    assert.equal(rich.player.gold, 50 + 60);

    const caught = newGame();
    caught.exploration.rollD20 = () => 3;
    const hp = caught.player.health;
    caught.exploration.npcActions.run(NPC_DATABASE.barnaby, 'steal');
    assert.equal(caught.player.health, hp - 15);
});

test('comprar veneno da +5 de daño; sin oro no pasa nada', () => {
    const game = newGame();
    game.player.gold = 100;
    game.exploration.npcActions.run(NPC_DATABASE.mongol, 'buy_poison');
    assert.equal(game.player.attackBonus, 5);
    assert.equal(game.player.gold, 60);

    const poor = newGame();
    poor.player.gold = 5;
    poor.exploration.npcActions.run(NPC_DATABASE.mongol, 'buy_poison');
    assert.equal(poor.player.attackBonus, 0);
});

test('morir por una acción de PNJ muestra el game over y no avanza', () => {
    const game = newGame();
    let gameOver = false;
    game.ui.showGameOver = () => { gameOver = true; };
    game.player.health = 5;
    game.exploration.rollD20 = () => 1;
    game.exploration.npcActions.run(NPC_DATABASE.barnaby, 'steal');
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

test('el veneno de objeto suma al daño de tus ataques', () => {
    const game = newGame();
    game.player.attackBonus = 5;
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

test('energyBonus suma energía por turno', () => {
    const game = newGame();
    game.player.energyBonus = 1;
    game.combat.start({ name: 'Saco', hp: 5000, atk: 1, deckId: 'corrupto' });
    assert.equal(game.combat.energy, COMBAT.ENERGY_PER_TURN + 1);
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
