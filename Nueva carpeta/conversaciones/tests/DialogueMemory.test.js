// Ejecutar con:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DialogueMemory } from '../js/systems/DialogueMemory.js';

const seeded = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

test('recuerda las últimas frases de cada personaje por separado', () => {
    const memory = new DialogueMemory({ limit: 3 });
    ['a', 'b', 'c', 'd'].forEach(line => memory.remember('valerius', line));
    memory.remember('morgana', 'x');

    assert.deepEqual(memory.recent('valerius'), ['b', 'c', 'd']);
    assert.deepEqual(memory.recent('morgana'), ['x']);
    assert.deepEqual(memory.recent('nadie'), []);
});

test('recent devuelve una copia: modificarla no altera la memoria', () => {
    const memory = new DialogueMemory();
    memory.remember('a', 'hola');
    memory.recent('a').push('intruso');
    assert.deepEqual(memory.recent('a'), ['hola']);
});

test('has ignora mayúsculas, tildes, puntuación y espacios', () => {
    const memory = new DialogueMemory();
    memory.remember('v', '¡Qué osadía, mortal!');
    assert.ok(memory.has('v', 'que osadia mortal'));
    assert.ok(memory.has('v', '  QUÉ   OSADÍA... MORTAL '));
    assert.ok(!memory.has('v', 'Otra cosa distinta'));
    assert.ok(!memory.has('otro', 'que osadía mortal'));
});

test('pick elige una frase que no se haya dicho hace poco', () => {
    const memory = new DialogueMemory({ rng: seeded(3) });
    const pool = ['uno', 'dos', 'tres'];
    memory.remember('p', 'uno');
    memory.remember('p', 'dos');

    for (let i = 0; i < 20; i++) assert.equal(memory.pick('p', pool), 'tres');
});

test('si ya dijo todas, vuelve a la que lleva más tiempo sin decir', () => {
    const memory = new DialogueMemory();
    const pool = ['uno', 'dos', 'tres'];
    ['uno', 'dos', 'tres'].forEach(line => memory.remember('p', line));
    assert.equal(memory.pick('p', pool), 'uno');
    memory.remember('p', 'uno');
    assert.equal(memory.pick('p', pool), 'dos');
});

test('pick de un banco vacío devuelve null', () => {
    assert.equal(new DialogueMemory().pick('p', []), null);
    assert.equal(new DialogueMemory().pick('p', undefined), null);
});

test('sacando frases del banco una tras otra nunca se repite la misma dos veces seguidas', () => {
    const memory = new DialogueMemory({ limit: 6, rng: seeded(11) });
    const pool = ['a', 'b', 'c', 'd'];
    let last = null;
    for (let i = 0; i < 40; i++) {
        const line = memory.pick('p', pool);
        assert.notEqual(line, last);
        memory.remember('p', line);
        last = line;
    }
});
