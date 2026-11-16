import assert from 'node:assert/strict';
import test from 'node:test';
import { CombatUI } from './CombatUI.js';

test('hero combat vitals show current HP, guard, and a critical health bar', () => {
    const attributes = {};
    const classes = new Set();
    const nodes = {
        heroCombatHp: { textContent: '' },
        heroCombatShield: { textContent: '' },
        heroCombatHealthMeter: {
            setAttribute(name, value) {
                attributes[name] = value;
            }
        },
        heroCombatHealthFill: {
            style: {},
            classList: {
                toggle(name, enabled) {
                    if (enabled) classes.add(name);
                    else classes.delete(name);
                }
            }
        }
    };
    const previousDocument = globalThis.document;
    globalThis.document = {
        getElementById(id) {
            return nodes[id] ?? null;
        }
    };

    try {
        new CombatUI().renderHeroStats({ health: 20, maxHealth: 120 }, 8);

        assert.equal(nodes.heroCombatHp.textContent, '20/120');
        assert.equal(nodes.heroCombatShield.textContent, '🛡️ Guardia: 8');
        assert.equal(nodes.heroCombatHealthFill.style.width, `${(20 / 120) * 100}%`);
        assert.equal(attributes['aria-valuenow'], '20');
        assert.ok(classes.has('is-low'));
        assert.ok(classes.has('is-critical'));
    } finally {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
    }
});

test('enemy combat vitals show HP, attack, and defense', () => {
    const attributes = {};
    const classes = new Set();
    const nodes = {
        enemyName: { textContent: '' },
        enemyHp: { textContent: '' },
        enemyAtk: { textContent: '' },
        enemyShield: { textContent: '' },
        enemyCombatHealthMeter: {
            setAttribute(name, value) {
                attributes[name] = value;
            }
        },
        enemyCombatHealthFill: {
            style: {},
            classList: {
                toggle(name, enabled) {
                    if (enabled) classes.add(name);
                    else classes.delete(name);
                }
            }
        }
    };
    const previousDocument = globalThis.document;
    globalThis.document = {
        getElementById(id) {
            return nodes[id] ?? null;
        }
    };

    try {
        new CombatUI().renderEnemyStats(
            { name: 'Gorgrim, Jefe Orco', hp: 40, maxHp: 100, shield: 30 },
            19
        );

        assert.equal(nodes.enemyName.textContent, 'Gorgrim, Jefe Orco');
        assert.equal(nodes.enemyHp.textContent, '40/100');
        assert.equal(nodes.enemyAtk.textContent, '⚔️ ATK: 19');
        assert.equal(nodes.enemyShield.textContent, '🛡️ DEF: 30');
        assert.equal(nodes.enemyCombatHealthFill.style.width, '40%');
        assert.equal(attributes['aria-valuenow'], '40');
        assert.ok(classes.has('is-low'));
    } finally {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
    }
});
