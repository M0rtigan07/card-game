import assert from 'node:assert/strict';
import test from 'node:test';
import { TcgCombat } from './TcgCombat.js';

test('winning a parallel-world encounter returns without advancing the dungeon floor', async () => {
    let returnedToWorld = 0;
    let loadedNextEvent = 0;
    const player = {
        gold: 0,
        health: 80,
        maxHealth: 100,
        addGold(amount) { this.gold += amount; },
        addXp() { return false; }
    };
    const game = {
        dungeonLevel: 23,
        player,
        party: {
            awardCombatExperience() { return []; },
            recoverActive() {}
        },
        audio: { play() {} },
        darkWorld: { returnFromMinotaurCombat() { returnedToWorld += 1; } },
        loadNextEvent() { loadedNextEvent += 1; }
    };
    const combat = new TcgCombat(game);

    combat.enemy = {
        name: 'Minotauro del Laberinto',
        isBoss: false,
        returnToDarkWorld: true
    };
    combat.log = () => {};
    combat.modifiers = () => ({ goldPercent: 0 });
    combat.notifyAllyLevelUps = () => {};
    combat.refresh = () => {};
    combat.speak = async () => null;
    combat.chooseReward = async () => {};
    combat.view = { setVictoryText() {}, setVictory() {} };
    combat.rng = () => 1;

    await combat.win();

    assert.equal(game.dungeonLevel, 23);
    assert.equal(loadedNextEvent, 0);
    assert.equal(returnedToWorld, 1);
});
