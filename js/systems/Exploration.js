// js/systems/Exploration.js
// Lo que pasa entre combates: escenas, PNJ fijos de planta y encuentros procedurales.

import { NPC_DATABASE } from '../data/npcs.js';
import { DEFAULT_ENCOUNTER_IMAGE, ENCOUNTER_IMAGES, FALLBACK_IMG, NPC_MOOD_BY_ACTION } from '../data/gameConfig.js';
import { ExplorationView } from '../views/ExplorationView.js';
import { NpcActions } from './NpcActions.js';
import { getBossForFloor, isBossFloor } from './jefes.js';
import { setText, wait } from '../ui/helpers.js';

export class Exploration {
    /** @param {import('../Game.js').Game} game */
    constructor(game) {
        this.game = game;
        this.npcActions = new NpcActions(game, this);
        this.sceneToken = 0; // cambia con cada escena: descarta respuestas de la IA que llegan tarde
    }

    get player() { return this.game.player; }
    log(message) { this.game.ui.logEvent(message); }

    // ───────────── ESCENA ─────────────

    /** Dibuja la vista de exploración en el panel central y la devuelve. */
    render() {
        this.sceneToken++;
        const view = new ExplorationView(document.getElementById('mainContent'), this.game);
        view.render();
        return view;
    }

    setSceneImage(src) {
        const img = /** @type {HTMLImageElement | null} */ (document.getElementById('centralSceneImage'));
        if (!img) return;
        img.onerror = () => { img.onerror = null; img.src = FALLBACK_IMG; };
        img.src = src || FALLBACK_IMG;
    }

    // Evita dobles clics: cada elección avanza la planta una sola vez
    lockChoices() {
        const buttons = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('#actionChoices button'));
        buttons.forEach(b => { b.disabled = true; });
    }

    // Cuadro de diálogo flotante tipo Monkey Island (textContent: el texto viene de la IA)
    showDialogue(speakerName, text) {
        document.getElementById('monkeyIslandDialogue')?.remove();

        const box = document.createElement('div');
        box.id = 'monkeyIslandDialogue';
        box.className = 'monkey-dialogue-box';

        const speaker = document.createElement('b');
        speaker.textContent = `${speakerName.toUpperCase()}:`;
        box.append(speaker, ` "${text}"`);

        document.getElementById('mainContent').appendChild(box);
    }

    rollD20() {
        return Math.floor(Math.random() * 20) + 1;
    }

    // ───────────── SIGUIENTE ENCUENTRO ─────────────

    async loadNext() {
        const level = this.game.dungeonLevel;

        // 0. Jefe (cada 5 plantas): tiene prioridad sobre todo lo demás
        const boss = getBossForFloor(level);
        if (boss) {
            return this.showBoss(boss);
        }
        if (isBossFloor(level + 1)) {
            this.log(`⚠️ Una presencia enorme aguarda en la planta siguiente...`);
        }

        // 1. PNJ fijo de planta (Barnaby, Valerius, Morgana, Astrid, Batu Jan)
        const npcKey = Object.keys(NPC_DATABASE).find(k => NPC_DATABASE[k].dungeonLevel === level);
        if (npcKey) {
            return this.showNpc(npcKey);
        }

        // 2. Encuentro procedural del backend (plantas sin PNJ fijo)
        const view = this.render();
        view.setNarrative("Escuchando los pasos en la penumbra...", []);

        const eventData = await this.game.groq.generateExploration(this.player.className, level);

        if (!eventData) {
            view.setNarrative(
                `Avanzas con cautela por los oscuros corredores de la Planta ${level}.`,
                [{ text: "Avanzar hacia la siguiente sala", callback: () => { this.lockChoices(); this.game.advanceFloor(0); } }]
            );
            return;
        }

        this.setSceneImage(ENCOUNTER_IMAGES[eventData.npcType] || DEFAULT_ENCOUNTER_IMAGE);
        setText('sceneBadgeOverlay', `ENCUENTRO - PLANTA ${level}`);

        view.setNarrative(
            eventData.description,
            eventData.choices.map(choice => ({
                text: choice.text,
                callback: () => {
                    this.lockChoices();
                    return this.onEventChoice(choice.action, eventData);
                }
            }))
        );
    }

    /** Elección en un encuentro procedural: combate, compra, huida o tirada de habilidad. */
    async onEventChoice(action, eventData) {
        this.game.audio.play('card');

        if (action === 'combat') {
            this.log(`⚔️ ¡La conversación ha terminado en desafío!`);
            this.game.combat.start(eventData);
            return;
        }

        const d20 = this.rollD20();
        const d20Box = document.getElementById('d20Overlay');
        const d20Val = document.getElementById('d20Val');
        if (d20Box && d20Val) {
            d20Val.textContent = String(d20);
            d20Box.style.display = 'flex';
        }

        if (action === 'buy') {
            if (this.player.gold >= 40) {
                this.player.gold -= 40;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
                this.log(`💰 Compras suministros (-40 Oro). Recuperas 35 HP.`);
            } else {
                this.log(`❌ No tienes suficiente oro para el trato.`);
            }
        } else if (action === 'pass') {
            this.log(`🏃 Te retiras con cautela sin llamar la atención.`);
        } else if (d20 >= 9) {
            const xpGain = 45;
            const leveledUp = this.player.addXp(xpGain);
            this.player.addGold(80);
            this.log(`🎲 [Tirada D20: ${d20}] ¡ÉXITO NARRATIVO! +80 Oro, +${xpGain} XP.`);
            if (leveledUp) this.log(`🌟 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);
        } else {
            this.game.audio.play('hit');
            this.player.health -= 20;
            this.log(`🎲 [Tirada D20: ${d20}] ¡FALLO DE HABILIDAD! Sufres 20 de daño.`);
        }

        this.game.ui.updateStats(this.player, this.game.dungeonLevel);

        if (this.player.health <= 0) {
            this.game.ui.showGameOver();
            return;
        }

        this.game.dungeonLevel++;
        await wait(1400);
        await this.game.loadNextEvent();
    }

    // ───────────── JEFES ─────────────

    /** Escena previa al combate de jefe: aparece, te habla y solo hay una salida. Es el momento de prepararte (objetos, etc.). */
    async showBoss(boss) {
        const level = this.game.dungeonLevel;
        const view = this.render();
        const token = this.sceneToken;

        this.setSceneImage(boss.img);
        setText('sceneBadgeOverlay', `⚠️ JEFE · PLANTA ${level}`);
        this.log(`💀 ¡${boss.name} guarda la planta ${level}!`);

        view.setNarrative(`${boss.name} bloquea el camino...`, []);
        const greeting = await this.game.dialogue.say(boss, 'greeting');
        if (token !== this.sceneToken) return; // ya estás en otra escena

        view.setNarrative(greeting, [{
            text: '⚔️ ¡Enfrentarse al jefe!',
            callback: () => {
                this.lockChoices();
                this.game.combat.startBoss(boss);
            }
        }]);
    }

    // ───────────── PNJ FIJOS ─────────────

    // Orden: opciones de tu clase → opciones generales del PNJ → opciones de guerrero → genéricas
    getNpcInteraction(npc) {
        const byClass = npc.interactions?.[this.player.classKey || 'warrior'];
        const general = npc.interactions?.choices ? npc.interactions : null;
        const warrior = npc.interactions?.warrior;

        let interaction = [byClass, general, warrior].find(i => i?.choices?.length);

        if (!interaction) {
            interaction = {
                greeting: `Te encuentras cara a cara con ${npc.name}. Su mirada atraviesa tu alma en la penumbra.`,
                choices: [
                    { text: "⚔️ \"Desenvaina tu acero, esto se va a resolver por las malas.\"", action: "combat" },
                    { text: "🤝 \"Hagamos un pacto o intercambiemos información.\"", action: "pact_accept" },
                    { text: "🚪 \"Retrocedo con sigilo y evito problemas.\"", action: "pass" }
                ]
            };
        }

        // Quita opciones repetidas (mismo texto)
        const unique = [...new Map(interaction.choices.map(c => [c.text, c])).values()];
        return { ...interaction, choices: unique };
    }

    async showNpc(npcKey) {
        const npc = NPC_DATABASE[npcKey];
        if (!npc) return;

        const view = this.render();
        const token = this.sceneToken;
        this.setSceneImage(npc.images?.room);
        setText('sceneBadgeOverlay', npc.name.toUpperCase());
        this.log(`👁️ Te encuentras cara a cara con ${npc.name}.`);

        const interaction = this.getNpcInteraction(npc);

        // Mientras la IA piensa el saludo se ve una línea de espera; si tarda o falla, sale uno del banco
        view.setNarrative(`${npc.name} te observa en silencio...`, []);
        const greeting = await this.game.dialogue.say(npc, 'greeting', {
            extraFallback: interaction.greeting ? [interaction.greeting] : []
        });
        if (token !== this.sceneToken) return; // ya estás en otra escena

        view.setNarrative(
            greeting,
            interaction.choices.map(choice => ({
                text: choice.text,
                callback: () => this.onNpcChoice(npc, choice)
            }))
        );
    }

    async onNpcChoice(npc, choice) {
        this.lockChoices();

        const mood = NPC_MOOD_BY_ACTION[choice.action] || 'talk';
        this.setSceneImage(npc.images?.[mood] || npc.images?.talk || npc.images?.room);

        // Barnaby ofendido responde con frase fija, sin gastar una llamada a la IA
        if (npc.id === 'barnaby' && choice.action === 'pass') {
            await this.npcActions.run(npc, 'pass');
            return;
        }

        this.showDialogue(npc.name, '...');
        const reply = await this.game.dialogue.say(npc, 'reaction', { action: choice.text });
        this.showDialogue(npc.name, reply);

        await wait(2200);
        await this.npcActions.run(npc, choice.action);
    }
}