// Ejecutar con:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { NpcDialogue } from '../js/systems/NpcDialogue.js';
import { DialogueMemory } from '../js/systems/DialogueMemory.js';
import { FALLBACK_LINES, fallbackPool, LAST_RESORT_LINE } from '../js/data/npcLines.js';
import { NPC_DATABASE } from '../js/data/npcs.js';
import { DIALOGUE, GENERIC_ENEMIES, DEFAULT_ENEMY } from '../js/data/gameConfig.js';

const seeded = (seed = 1) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** Partida mínima con una IA de mentira: `replies` es la lista de respuestas (null = fallo). */
function setup(replies = []) {
    const requests = [];
    const game = {
        player: { className: 'Pícaro', health: 30, maxHealth: 120, gold: 45 },
        playerName: 'ALUCARD',
        dungeonLevel: 4,
        groq: {
            generateNpcLine: async (request) => {
                requests.push(request);
                return replies.length ? replies.shift() : null;
            }
        }
    };
    const memory = new DialogueMemory({ limit: DIALOGUE.MEMORY_LINES, rng: seeded(5) });
    return { dialogue: new NpcDialogue(game, memory), requests, memory, game };
}

// ───────── Datos ─────────

test('cada PNJ tiene personalidad (archetype y voice) para que la IA lo interprete', () => {
    for (const npc of Object.values(NPC_DATABASE)) {
        assert.ok(npc.archetype?.length > 20, `${npc.id}: falta archetype`);
        assert.ok(npc.voice?.length > 20, `${npc.id}: falta voice`);
    }
});

test('cada PNJ tiene su propio banco de saludos y réplicas', () => {
    for (const npc of Object.values(NPC_DATABASE)) {
        assert.ok(FALLBACK_LINES[npc.id]?.greeting?.length >= 3, `${npc.id}: pocos saludos`);
        assert.ok(FALLBACK_LINES[npc.id]?.reaction?.length >= 3, `${npc.id}: pocas réplicas`);
    }
});

test('los bancos de frases no tienen vacías ni repetidas y son cortas', () => {
    for (const [npcId, kinds] of Object.entries(FALLBACK_LINES)) {
        for (const [key, lines] of Object.entries(kinds)) {
            assert.ok(lines.length >= 2, `${npcId}.${key}: pocas frases`);
            assert.equal(new Set(lines).size, lines.length, `${npcId}.${key}: frases repetidas`);
            for (const line of lines) assert.ok(line.trim() && line.length <= 160, `${npcId}.${key}: "${line}"`);
        }
    }
});

test('todo tipo de frase tiene banco genérico por si el PNJ no tiene el suyo', () => {
    for (const key of ['greeting', 'reaction', 'bought', 'no_gold', 'caught', 'offended']) {
        assert.ok(fallbackPool('personaje_nuevo', key).length >= 3, key);
    }
});

// ───────── Diálogo ─────────

test('pide la frase a la IA con el contexto del héroe', async () => {
    const { dialogue, requests } = setup(['Hola, Alucard.']);
    await dialogue.say(NPC_DATABASE.valerius, 'reaction', { action: 'Hablemos' });

    const [request] = requests;
    assert.equal(request.kind, 'reaction');
    assert.equal(request.npc.id, 'valerius');
    assert.equal(request.className, 'Pícaro');
    assert.equal(request.heroName, 'ALUCARD');
    assert.equal(request.dungeonLevel, 4);
    assert.equal(request.heroHpPercent, 25);
    assert.equal(request.gold, 45);
    assert.equal(request.action, 'Hablemos');
    assert.equal(request.timeoutMs, DIALOGUE.TIMEOUT_MS.reaction);
});

test('devuelve la frase de la IA y la recuerda para no repetirla', async () => {
    const { dialogue, requests, memory } = setup(['Primera.', 'Segunda.']);
    assert.equal(await dialogue.say(NPC_DATABASE.morgana, 'greeting'), 'Primera.');
    assert.equal(await dialogue.say(NPC_DATABASE.morgana, 'greeting'), 'Segunda.');

    assert.deepEqual(requests[0].avoid, []);
    assert.deepEqual(requests[1].avoid, ['Primera.']);
    assert.deepEqual(memory.recent('morgana'), ['Primera.', 'Segunda.']);
});

test('si la IA repite una frase reciente se descarta y se usa una del banco', async () => {
    const { dialogue } = setup(['¡Qué sorpresa!', '¡QUÉ SORPRESA!']);
    await dialogue.say(NPC_DATABASE.vikinga, 'reaction');
    const second = await dialogue.say(NPC_DATABASE.vikinga, 'reaction');

    assert.notEqual(second.toLowerCase(), '¡qué sorpresa!');
    assert.ok(FALLBACK_LINES.vikinga.reaction.includes(second));
});

test('sin IA el PNJ sigue hablando con frases propias, sin repetir dos seguidas', async () => {
    const { dialogue } = setup([]); // la IA siempre falla
    let last = null;
    for (let i = 0; i < 30; i++) {
        const line = await dialogue.say(NPC_DATABASE.mongol, 'reaction');
        assert.ok(FALLBACK_LINES.mongol.reaction.includes(line), line);
        assert.notEqual(line, last);
        last = line;
    }
});

test('la frase de respaldo puede incluir las propias de la situación (saludo por clase)', async () => {
    const { dialogue } = setup([]);
    const seen = new Set();
    for (let i = 0; i < 12; i++) {
        seen.add(await dialogue.say(NPC_DATABASE.valerius, 'greeting', { extraFallback: ['Un saludo de clase'] }));
    }
    assert.ok(seen.has('Un saludo de clase'));
    assert.ok(seen.size >= 3);
});

test('los desenlaces usan su banco y mandan a la IA qué ha pasado', async () => {
    const { dialogue, requests } = setup([null]);
    const line = await dialogue.say(NPC_DATABASE.barnaby, 'outcome', { outcome: 'caught', detail: 'Intentaste robarme' });

    assert.ok(FALLBACK_LINES.barnaby.caught.includes(line));
    assert.equal(requests[0].kind, 'outcome');
    assert.equal(requests[0].outcome, 'Intentaste robarme');
    assert.equal(requests[0].timeoutMs, DIALOGUE.TIMEOUT_MS.outcome);
});

test('un PNJ nuevo sin banco propio usa el genérico y, en último caso, una frase neutra', async () => {
    const stranger = { id: 'extraño', name: 'Extraño' };
    const { dialogue } = setup([]);
    assert.ok(FALLBACK_LINES.default.greeting.includes(await dialogue.say(stranger, 'greeting')));
    assert.equal(await dialogue.say(stranger, 'outcome', { outcome: 'clave_inexistente' }), LAST_RESORT_LINE);
});

// ───────── Enemigos que hablan en combate ─────────

const COMBAT_KEYS = ['combat_start', 'combat_attack', 'combat_other', 'combat_hurt', 'combat_defeat', 'combat_victory'];
const everySpeaker = () => [
    ...Object.values(NPC_DATABASE).map(npc => npc.id),
    ...GENERIC_ENEMIES.map(enemy => enemy.id),
    DEFAULT_ENEMY.id
];

test('cada enemigo (PNJ y genéricos) tiene su propio banco de frases de combate', () => {
    for (const id of everySpeaker()) {
        for (const key of COMBAT_KEYS) {
            assert.ok(FALLBACK_LINES[id]?.[key]?.length >= 2, `${id}.${key}: sin banco propio`);
        }
    }
});

test('los enemigos genéricos tienen id, archetype y voice para que la IA los interprete', () => {
    for (const enemy of [...GENERIC_ENEMIES, DEFAULT_ENEMY]) {
        assert.ok(enemy.id && enemy.id === enemy.deckId, `${enemy.name}: id`);
        assert.ok(enemy.archetype?.length > 20, `${enemy.name}: falta archetype`);
        assert.ok(enemy.voice?.length > 20, `${enemy.name}: falta voice`);
    }
});

test('cada enemigo suena distinto: ningún banco de combate comparte frases con otro', () => {
    const owner = new Map();
    for (const id of everySpeaker()) {
        for (const key of COMBAT_KEYS) {
            for (const line of FALLBACK_LINES[id][key]) {
                assert.ok(!owner.has(line), `"${line}" está en ${owner.get(line)} y en ${id}`);
                owner.set(line, id);
            }
        }
    }
});

test('las frases de combate viajan a la IA con la carta, su efecto y la vida del enemigo', async () => {
    const { dialogue, requests } = setup(['¡Arde!']);
    await dialogue.say(NPC_DATABASE.vikinga, 'combat_card', {
        cardName: 'Hacha Nórdica', cardEffect: 'Inflige 20 de daño', enemyHpPercent: 55, poolKey: 'combat_attack'
    });

    assert.equal(requests[0].kind, 'combat_card');
    assert.equal(requests[0].cardName, 'Hacha Nórdica');
    assert.equal(requests[0].cardEffect, 'Inflige 20 de daño');
    assert.equal(requests[0].enemyHpPercent, 55);
    assert.equal(requests[0].timeoutMs, DIALOGUE.TIMEOUT_MS.combat_card);
});

test('sin IA, el grito de combate sale del banco que corresponde a la carta (poolKey)', async () => {
    const { dialogue } = setup([]);
    const attack = await dialogue.say(NPC_DATABASE.vikinga, 'combat_card', { poolKey: 'combat_attack' });
    const other = await dialogue.say(NPC_DATABASE.vikinga, 'combat_card', { poolKey: 'combat_other' });

    assert.ok(FALLBACK_LINES.vikinga.combat_attack.includes(attack));
    assert.ok(FALLBACK_LINES.vikinga.combat_other.includes(other));
});

test('cada tipo de frase de combate tiene su tiempo máximo de espera', () => {
    for (const kind of ['combat_start', 'combat_card', 'combat_hurt', 'combat_phase', 'combat_defeat', 'combat_victory']) {
        assert.ok(DIALOGUE.TIMEOUT_MS[kind] >= 1000, kind);
    }
});
