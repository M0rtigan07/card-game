// js/systems/NpcDialogue.js
// Todo lo que dicen los PNJ pasa por aquí: Groq primero y, si falla, tarda o repite, una frase de respaldo variada.

import { DialogueMemory } from './DialogueMemory.js';
import { fallbackPool, LAST_RESORT_LINE } from '../data/npcLines.js';
import { DIALOGUE } from '../data/gameConfig.js';

export class NpcDialogue {
    /**
     * @param {import('../Game.js').Game} game
     * @param {DialogueMemory} [memory]
     */
    constructor(game, memory = new DialogueMemory({ limit: DIALOGUE.MEMORY_LINES })) {
        this.game = game;
        this.memory = memory;
    }

    /**
     * Devuelve lo que dice el PNJ. Nunca falla y nunca repite una de sus últimas frases.
     *
     * @param {object} npc                  Entrada de NPC_DATABASE
     * @param {'greeting' | 'reaction' | 'outcome'} kind
     * @param {object} [context]
     * @param {string} [context.action]     (reaction) Lo que ha elegido el jugador
     * @param {string} [context.outcome]    (outcome) Clave del desenlace: bought | no_gold | caught | offended
     * @param {string} [context.detail]     (outcome) Qué ha pasado, escrito para que lo lea la IA
     * @param {string[]} [context.extraFallback]  Frases de respaldo propias de la situación
     */
    async say(npc, kind, context = {}) {
        const { player, playerName, dungeonLevel } = this.game;

        const generated = await this.game.groq.generateNpcLine({
            kind,
            npc,
            className: player.className,
            heroName: playerName,
            dungeonLevel,
            heroHpPercent: Math.round((player.health / player.maxHealth) * 100),
            gold: player.gold,
            action: context.action,
            outcome: context.detail ?? context.outcome,
            avoid: this.memory.recent(npc.id),
            timeoutMs: DIALOGUE.TIMEOUT_MS[kind]
        });

        // Si el modelo repite una frase reciente, se descarta y se usa una del banco
        let line = generated && !this.memory.has(npc.id, generated) ? generated : null;

        if (!line) {
            const key = kind === 'outcome' ? context.outcome : kind;
            const pool = [...(context.extraFallback ?? []), ...fallbackPool(npc.id, key)];
            line = this.memory.pick(npc.id, pool) ?? LAST_RESORT_LINE;
        }

        this.memory.remember(npc.id, line);
        return line;
    }
}
