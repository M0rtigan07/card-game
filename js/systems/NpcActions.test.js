import assert from 'node:assert/strict';
import test from 'node:test';
import { NPC_DATABASE } from '../data/npcs.js';
import { NPC_MOOD_BY_ACTION } from '../data/gameConfig.js';
import { STARTER_DECKS } from '../data/cardCatalog.js';
import { expandDeck } from './EnemyAI.js';
import { Exploration } from './Exploration.js';
import { NpcActions } from './NpcActions.js';
import { getCardTemplate, PlayerDeck, rollRewards } from './JugadorCards.js';

function createHarness(gold = 2500) {
    const player = { gold, inventory: [] };
    const deck = new PlayerDeck(STARTER_DECKS.warrior);
    const goldUpdates = [];
    const statUpdates = [];
    const logs = [];
    const outcomes = [];
    const menuUpdates = [];
    const finishedEncounters = [];
    const combatStarts = [];

    const game = {
        player,
        deck,
        dungeonLevel: 19,
        audio: { play() {} },
        combat: { startFromNpc(npc) { combatStarts.push(npc); } },
        ui: {
            logEvent(message) { logs.push(message); },
            updateMerchantGold(amount) { goldUpdates.push(amount); },
            updateStats(updatedPlayer, floor) {
                statUpdates.push({ gold: updatedPlayer.gold, inventoryCount: updatedPlayer.inventory.length, floor });
            }
        },
        dialogue: {
            async say(_npc, _kind, context) {
                outcomes.push(context.outcome);
                return 'Respuesta del vendedor.';
            }
        },
        finishEncounter(delay) { finishedEncounters.push(delay); }
    };
    const scene = {
        showDialogue() {},
        showNpcMenu(npc, text) { menuUpdates.push({ npc, text }); }
    };

    return {
        actions: new NpcActions(game, scene),
        player,
        deck,
        goldUpdates,
        statUpdates,
        logs,
        outcomes,
        menuUpdates,
        finishedEncounters,
        combatStarts
    };
}

test('buying legendary cards charges gold and adds each card to the deck', async () => {
    const state = createHarness(2500);
    const npc = NPC_DATABASE.vendedorCartas;

    await state.actions.run(npc, 'buy_legendary_starfall');
    await state.actions.run(npc, 'buy_legendary_aegis');

    assert.equal(state.player.gold, 500);
    assert.ok(state.deck.collection.includes('legendary_starfall'));
    assert.ok(state.deck.collection.includes('legendary_aegis'));
    assert.deepEqual(state.goldUpdates, [1500, 500]);
    assert.equal(state.menuUpdates.length, 2);
    assert.deepEqual(state.finishedEncounters, []);
});

test('cannot buy a legendary card without enough gold', async () => {
    const state = createHarness(999);

    await state.actions.run(NPC_DATABASE.vendedorCartas, 'buy_legendary_phoenix');

    assert.equal(state.player.gold, 999);
    assert.ok(!state.deck.collection.includes('legendary_phoenix'));
    assert.deepEqual(state.outcomes, ['no_gold']);
    assert.equal(state.menuUpdates.length, 1);
    assert.deepEqual(state.finishedEncounters, []);
});

test('refusing the legendary card sale leaves the deck untouched and ends the encounter', async () => {
    const state = createHarness();

    await state.actions.run(NPC_DATABASE.vendedorCartas, 'reject_legendary_cards');

    assert.deepEqual(state.outcomes, ['offended']);
    assert.equal(state.deck.counts.total, STARTER_DECKS.warrior.length);
    assert.deepEqual(state.finishedEncounters, [1800]);
});

test('legendary cards are excluded from normal combat rewards', () => {
    const rewards = rollRewards({
        classKey: 'warrior',
        level: 18,
        count: 100,
        rng: () => 0
    });

    assert.ok(rewards.length > 0);
    assert.ok(rewards.every(id => getCardTemplate(id).rarity !== 'legendary'));
});

test('the card seller hides cards already owned and offers a farewell when sold out', () => {
    const exploration = Object.create(Exploration.prototype);
    exploration.game = {
        player: { classKey: 'warrior' },
        deck: { collection: ['legendary_starfall'] }
    };

    const remaining = exploration.getNpcInteraction(NPC_DATABASE.vendedorCartas);
    assert.ok(!remaining.choices.some(choice => choice.cardId === 'legendary_starfall'));
    assert.ok(remaining.choices.some(choice => choice.cardId === 'legendary_aegis'));

    exploration.game.deck.collection = ['legendary_starfall', 'legendary_aegis', 'legendary_phoenix'];
    const soldOut = exploration.getNpcInteraction(NPC_DATABASE.vendedorCartas);

    assert.deepEqual(
        soldOut.choices.map(choice => choice.action),
        ['finish_legendary_card_trade', 'chat']
    );
});

test('buying the magic lamp charges gold and adds the collectible to inventory', async () => {
    const state = createHarness(2000);

    await state.actions.run(NPC_DATABASE.demonioHindu, 'buy_magic_lamp');

    assert.equal(state.player.gold, 200);
    assert.deepEqual(state.player.inventory.map(item => item.id), ['magic_lamp']);
    assert.deepEqual(state.statUpdates, [{ gold: 200, inventoryCount: 1, floor: 19 }]);
    assert.deepEqual(state.finishedEncounters, [2500]);
});

test('rejecting the lamp offer starts combat against the demon', async () => {
    const demon = NPC_DATABASE.demonioHindu;
    const state = createHarness();

    await state.actions.run(demon, 'combat');

    assert.deepEqual(state.combatStarts, [demon]);
    assert.deepEqual(state.finishedEncounters, []);
});

test('the demon uses its own attack deck and dances when a lamp sale is chosen', () => {
    const demon = NPC_DATABASE.demonioHindu;
    const cards = expandDeck(demon.id);

    assert.ok(cards.length > 0);
    assert.ok(cards.every(card => ['atk', 'multi', 'poison', 'drain'].includes(card.type)));
    assert.equal(NPC_MOOD_BY_ACTION.buy_magic_lamp, 'dance');
    assert.equal(demon.images.dance, 'img/demonio_hindu_baila_gif');
});
