import assert from 'node:assert/strict';
import test from 'node:test';
import { clearSavedGame, hasSavedGame, loadSavedGame, saveGame } from './SaveManager.js';

function createStorage() {
    const values = new Map();
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

test('saved games keep player, floor, deck, party, and dark-world state', () => {
    const originalStorage = globalThis.localStorage;
    globalThis.localStorage = createStorage();

    try {
        const game = {
            playerName: 'Morgana',
            dungeonLevel: 23,
            player: {
                classKey: 'mage',
                className: 'Maga Arcana',
                name: 'Morgana',
                health: 71,
                maxHealth: 90,
                mana: 64,
                maxMana: 80,
                gold: 340,
                level: 5,
                xp: 20,
                maxXp: 300,
                inventory: [{ id: 'potion', qty: 2 }],
                storyState: {
                    darkWorld: {
                        active: true,
                        location: 5,
                        steps: 4,
                        mission: { portalCrossed: true, royalClueFound: true }
                    }
                }
            },
            deck: {
                cards: ['mage_bolt', 'mage_guard'],
                drawPile: ['mage_bolt'],
                discardPile: []
            },
            party: {
                recruited: [{ id: 'ally-a', name: 'Astrid', health: 80, maxHealth: 90 }],
                active: [{ id: 'ally-a', name: 'Astrid', health: 80, maxHealth: 90 }],
                recruit() { return { ok: false }; },
                activate() { return { ok: true }; }
            },
            ui: { updateStats() {} }
        };

        assert.equal(saveGame(game), true);
        assert.equal(hasSavedGame(), true);

        const restored = {
            dungeonLevel: 1,
            playerName: 'HÉROE',
            deck: { cards: [], drawPile: [], discardPile: [] },
            party: {
                recruited: [],
                active: [],
                recruit(id) {
                    const ally = { id, name: 'Astrid', ability: {}, health: 80, maxHealth: 90 };
                    this.recruited.push(ally);
                    return { ok: true, ally };
                },
                activate(id) {
                    const ally = this.recruited.find(member => member.id === id);
                    if (ally) this.active.push(ally);
                    return { ok: true };
                }
            },
            ui: { updateStats() {} }
        };

        assert.equal(loadSavedGame(restored), true);
        assert.equal(restored.playerName, 'Morgana');
        assert.equal(restored.dungeonLevel, 23);
        assert.equal(restored.player.health, 71);
        assert.equal(restored.player.storyState.darkWorld.location, 5);
        assert.equal(restored.deck.cards[0], 'mage_bolt');
        assert.equal(restored.party.active.length, 1);

        clearSavedGame();
        assert.equal(hasSavedGame(), false);
    } finally {
        globalThis.localStorage = originalStorage;
    }
});
