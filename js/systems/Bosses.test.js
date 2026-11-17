import assert from 'node:assert/strict';
import test from 'node:test';
import { getBossForFloor, buildBossEnemy } from './Bosses.js';
import { expandDeck } from './EnemyAI.js';

test('El Kurgan is added as the boss of floor 30 without shifting earlier bosses', () => {
    assert.equal(getBossForFloor(25).id, 'dragon_jefe');

    const boss = getBossForFloor(30);
    const enemy = buildBossEnemy(boss, 30);

    assert.equal(boss.id, 'kurgan');
    assert.equal(enemy.name, 'El Kurgan, Señor Oscuro');
    assert.equal(enemy.deckId, 'kurgan');
    assert.equal(enemy.isBoss, true);
    assert.equal(enemy.hp, 480);
    assert.equal(enemy.phases.length, 2);
    assert.ok(expandDeck(enemy.deckId).length > 0);
});
