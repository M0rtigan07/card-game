// js/systems/NpcChat.js
// Controlador de las conversaciones con PNJ (estilo aventura gráfica): menú de temas, entrada libre y recompensas.
// Lo que se dibuja vive en views/NpcChatView.js; los temas y las pistas, en systems/ChatTopics.js.
//
// Límites para no abusar de la IA: cada tema se pregunta una sola vez por personaje y cada personaje
// admite CHAT.FREE_PER_NPC mensajes libres.

import { NpcChatView } from '../views/NpcChatView.js';
import { buildFacts, cleanChatInput, topicsFor } from './ChatTopics.js';
import { ALLIES } from '../data/allyCatalog.js';
import { CHAT, PARTY } from '../data/gameConfig.js';

export class NpcChat {
    /** @param {import('../Game.js').Game} game */
    constructor(game) {
        this.game = game;
        this.view = null;
        this.session = null;                 // { npc, onClose, closed } mientras hay una conversación abierta
        this.busy = false;                   // alguien está hablando o la IA está pensando
        this.typeSpeed = CHAT.TYPE_SPEED_MS; // 0 = las frases salen de golpe (tests)

        this.asked = new Map();              // npc.id -> Set de temas ya preguntados
        this.freeUsed = new Map();           // npc.id -> mensajes libres gastados
    }

    get player() { return this.game.player; }
    log(message) { this.game.ui.logEvent(message); }

    askedSet(npc) {
        if (!this.asked.has(npc.id)) this.asked.set(npc.id, new Set());
        return this.asked.get(npc.id);
    }

    freeLeft(npc) {
        return CHAT.FREE_PER_NPC - (this.freeUsed.get(npc.id) ?? 0);
    }

    sayOptions(hero) {
        return { hero, speedMs: this.typeSpeed, blipEvery: CHAT.BLIP_EVERY, onTick: () => this.game.audio.play('blip') };
    }

    /** El héroe con el tamaño de su mazo, para que los consejos puedan hablar de él. */
    playerView() {
        return { ...this.player, deckSize: this.game.deck?.counts.total ?? 0 };
    }

    // ───────────── Abrir y cerrar ─────────────

    /**
     * Abre la conversación con un PNJ. Se resuelve al terminar su frase de bienvenida.
     * @param {object} npc
     * @param {{ onClose?: () => void }} [options]  `onClose` se llama al despedirse
     */
    async open(npc, options = {}) {
        const { onClose } = options;
        const session = { npc, onClose, closed: false };
        this.session = session;
        this.busy = true;

        this.view = new NpcChatView(document.getElementById('mainContent'), this.game);
        this.view.render({ npc, heroName: this.game.playerName, heroImg: this.player.img });
        this.view.bind({ onSend: () => this.sendFree(), onLeave: () => this.leave() });
        this.refreshControls();
        this.log(`💬 Empiezas a conversar con ${npc.name}.`);

        // La bienvenida sale del banco (sin gastar una llamada a la IA)
        await this.view.say(npc.name, this.game.dialogue.fallbackLine(npc, 'chat_open'), this.sayOptions(false));
        if (session.closed) return;

        this.busy = false;
        this.refreshControls();
    }

    leave() {
        const session = this.session;
        if (!session) return;

        session.closed = true; // las respuestas que aún estén en camino se descartan
        this.view?.destroy();
        this.view = null;
        this.session = null;
        this.busy = false;

        this.log(`👋 Te despides de ${session.npc.name}.`);
        session.onClose?.();
    }

    // ───────────── Convencer para que se una al grupo ─────────────

    /** Qué se ve en la zona de argumentos: título y argumentos, o null si ese personaje no puede ser tu aliado. */
    persuasionSection(npc) {
        if (!ALLIES[npc.id] || this.game.party.has(npc.id)) return null;

        const asked = this.askedSet(npc).size;
        const check = this.game.persuasion.canTry(npc.id, { asked, partyFull: this.game.party.isFull() });

        if (check.ok) return { title: '🗣️ Convencerle de que te acompañe', args: this.game.persuasion.argumentsFor(npc.id) };
        if (check.reason === 'rapport') return { title: `🗣️ Habla un poco más con ${npc.name} antes de pedirle nada.`, args: [] };
        if (check.reason === 'locked') return { title: `🗣️ ${npc.name} ya no quiere escucharte.`, args: [] };
        if (check.reason === 'full') {
            return { title: `🗣️ Tu grupo está completo (${this.game.party.members.length}/${PARTY.MAX}). Despide a alguien desde el panel «Grupo».`, args: [] };
        }
        return null;
    }

    /** Pruebas un argumento. Si es el que le termina de convencer, se une a tu grupo. */
    async pickArgument(argId) {
        const session = this.session;
        if (!session || this.busy) return;

        const { npc } = session;
        const asked = this.askedSet(npc).size;
        const check = this.game.persuasion.canTry(npc.id, { asked, partyFull: this.game.party.isFull() });
        const result = check.ok ? this.game.persuasion.evaluate(npc.id, argId) : null;
        if (!result) return;

        const ally = ALLIES[npc.id];
        const argument = ally.arguments.find(a => a.id === argId);

        // La IA recibe el resultado ya decidido: solo tiene que interpretarlo a su manera
        const outcome = result.willRecruit ? 'Su argumento te convence del todo: has decidido unirte a su grupo.'
            : result.willLock ? 'Su argumento te irrita y te cansa: no quieres seguir escuchándole.'
                : result.good ? 'Su argumento te convence en parte.'
                    : 'Su argumento no te convence.';
        const poolKey = result.willRecruit ? 'chat_recruited'
            : result.willLock ? 'chat_locked'
                : result.good ? 'chat_persuade_good' : 'chat_persuade_bad';

        const line = await this.converse(session, argument.label, 'chat_persuade', { action: argument.label, outcome, facts: ally.values, poolKey });
        if (line === null) return; // te fuiste antes de oír la respuesta: el argumento no se gasta

        this.game.persuasion.commit(npc.id, argId);
        if (result.willRecruit) this.game.recruitAlly(npc.id);
        this.refreshControls();
    }

    // ───────────── Hablar ─────────────

    /** Eliges un tema del menú. */
    async pickTopic(topicId) {
        const session = this.session;
        if (!session || this.busy) return;

        const topic = topicsFor(session.npc).find(t => t.id === topicId);
        const asked = this.askedSet(session.npc);
        if (!topic || asked.has(topic.id)) return;

        asked.add(topic.id); // un tema solo se pregunta una vez por personaje

        const facts = buildFacts(topic, { npc: session.npc, player: this.playerView(), floor: this.game.dungeonLevel });
        const line = await this.converse(session, topic.label, 'chat_topic', { action: topic.label, facts, poolKey: topic.pool });

        if (line === null) asked.delete(topic.id); // te fuiste antes de oír la respuesta: no se pierde el tema
        else this.reward(session.npc, topic);
    }

    /** Escribes tú lo que quieres decirle. */
    async sendFree() {
        const session = this.session;
        if (!session || this.busy) return;

        const text = cleanChatInput(this.view.readInput());
        if (!text || this.freeLeft(session.npc) <= 0) return;

        this.freeUsed.set(session.npc.id, (this.freeUsed.get(session.npc.id) ?? 0) + 1);
        this.view.clearInput();
        await this.converse(session, text, 'chat_free', { action: text, poolKey: 'chat_free' });
    }

    /** Tu frase, luego la respuesta del personaje. Devuelve la respuesta, o null si cerraste la conversación antes. */
    async converse(session, heroText, kind, context) {
        this.busy = true;
        this.refreshControls();

        await this.view.say(this.game.playerName, heroText, this.sayOptions(true));
        if (session.closed) return null;

        this.view.showThinking(session.npc.name);
        const line = await this.game.dialogue.say(session.npc, kind, context);
        if (session.closed) return null;

        await this.view.say(session.npc.name, line, this.sayOptions(false));
        if (session.closed) return null;

        this.busy = false;
        this.refreshControls();
        return line;
    }

    /** Un tema nuevo da experiencia, una sola vez por personaje. */
    reward(npc, topic) {
        if (!topic.xp) return;

        this.log(`📖 Aprendes algo nuevo de ${npc.name} (+${topic.xp} XP).`);
        if (this.player.addXp(topic.xp)) {
            this.log(`🌟 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);
        }
        this.game.ui.updateStats(this.player, this.game.dungeonLevel);
    }

    refreshControls() {
        if (!this.session || !this.view) return;
        const { npc } = this.session;

        // Ya se ha unido a tu grupo: solo queda despedirse
        if (this.game.party.has(npc.id)) {
            this.view.renderOptions([], () => {});
            this.view.renderArguments(null, () => {});
            this.view.setFreeInput({ left: 0, max: CHAT.FREE_PER_NPC, maxLength: CHAT.MAX_INPUT, disabled: true });
            this.view.setLeaveLabel('➡️ Seguir con tu nuevo aliado');
            return;
        }

        const asked = this.askedSet(npc);
        this.view.renderArguments(this.persuasionSection(npc), (id) => this.pickArgument(id), { disabled: this.busy });

        this.view.renderOptions(
            topicsFor(npc).map(topic => ({ id: topic.id, label: topic.label, asked: asked.has(topic.id) })),
            (id) => this.pickTopic(id),
            { disabled: this.busy }
        );
        this.view.setFreeInput({ left: this.freeLeft(npc), max: CHAT.FREE_PER_NPC, maxLength: CHAT.MAX_INPUT, disabled: this.busy });
    }
}
