import assert from 'node:assert/strict';
import test from 'node:test';
import { Party } from './Party.js';
import { TcgCombat } from './TcgCombat.js';
import { ALLY_PROGRESSION } from '../data/gameConfig.js';

const catalog = {
    ally: {
        id: 'ally',
        name: 'Aliado',
        ability: { name: 'Golpe', type: 'atk', base: 5, perLevel: 1 }
    },
    reserve: {
        id: 'reserve',
        name: 'Reserva',
        ability: { name: 'Golpe', type: 'atk', base: 5, perLevel: 1 }
    }
};

function createParty() {
    return new Party({ player: { level: 1 } }, catalog);
}

test('allies start with independent health and experience progress', () => {
    const party = createParty();
    const { ally } = party.recruit('ally');

    assert.equal(ally.level, 1);
    assert.equal(ally.xp, 0);
    assert.equal(ally.xpToNextLevel, ALLY_PROGRESSION.XP_TO_LEVEL_2);
    assert.equal(ally.health, ALLY_PROGRESSION.STARTING_HEALTH);
    assert.notEqual(ally, catalog.ally);
    assert.equal(catalog.ally.health, undefined);
});

test('only active allies gain victory XP, and an active ally can level while knocked out', () => {
    const party = createParty();
    const { ally } = party.recruit('ally');
    const { ally: reserve } = party.recruit('reserve');
    party.activate(ally.id);
    ally.health = 0;
    ally.xp = 250;

    const [award] = party.awardCombatExperience();

    assert.equal(award.ally, ally);
    assert.equal(ally.level, 2);
    assert.equal(ally.xp, 200);
    assert.equal(ally.xpToNextLevel, 1300);
    assert.equal(ally.maxHealth, ALLY_PROGRESSION.STARTING_HEALTH + 100);
    assert.equal(reserve.xp, 0);

    party.recoverActive();
    assert.equal(ally.health, ally.maxHealth);
    assert.equal(ally.poison, null);
});

test('enemy attack targeting includes the player and living active allies only', () => {
    const combat = new TcgCombat({
        party: {
            active: [
                { id: 'alive', name: 'Aliado', health: 50 },
                { id: 'ko', name: 'Fuera', health: 0 }
            ]
        }
    });

    combat.rng = () => 0.99;
    assert.equal(combat.chooseEnemyTarget({ type: 'atk' }).id, 'alive');
    combat.rng = () => 0;
    assert.equal(combat.chooseEnemyTarget({ type: 'multi' }), null);
    assert.equal(combat.chooseEnemyTarget({ type: 'heal' }), null);
});

test('ally poison ticks at the start of the turn and a knocked-out ally cannot act', async () => {
    const ally = {
        id: 'ally',
        name: 'Aliado',
        health: 20,
        poison: { dmg: 25, turns: 2 }
    };
    const messages = [];
    const combat = new TcgCombat({
        party: { active: [ally] },
        player: { health: 100, maxHealth: 100 },
        audio: { play() {} }
    });

    combat.heroPoison = null;
    combat.modifiers = () => ({ regen: 0 });
    combat.maxEnergy = () => 3;
    combat.refresh = () => {};
    combat.log = message => messages.push(message);
    combat.view = { float() {}, shake() {} };
    combat.runAllies = async () => {
        assert.equal(ally.health, 0);
        return true;
    };

    await combat.startPlayerTurn();

    assert.equal(ally.poison.turns, 1);
    assert.ok(messages.some(message => message.includes('25 de daño')));
    assert.ok(messages.some(message => message.includes('fuera de combate')));
});
