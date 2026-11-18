// js/systems/Exploration.js
// Lo que pasa entre combates: escenas, PNJ fijos de planta y encuentros procedurales.

import { NPC_DATABASE } from '../data/npcs.js';
import { DEFAULT_ENCOUNTER_IMAGE, ENCOUNTER_IMAGES, FALLBACK_IMG, NPC_MOOD_BY_ACTION } from '../data/gameConfig.js';
import { ExplorationView } from '../views/ExplorationView.js';
import { NpcActions } from './NpcActions.js';
import { getBossForFloor, isBossFloor } from './Bosses.js';
import { StoryResolver } from '../stories/StoryResolver.js';
import { StoryView } from '../views/StoryView.js';
import { setText, wait } from '../ui/helpers.js';

function isVendorEncounter(type, choices = []) {
    if (type === 'merchant' || type === 'blacksmith') return true;

    return choices.some(({ action }) =>
        typeof action === 'string' &&
        (action.startsWith('buy:') || action.startsWith('buy_') || action.startsWith('forge_'))
    );
}

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

        const story = this.game.storyManager?.getStoryEncounter(level);

        if (story) {
            console.log(
                "[Historia encontrada]",
                story.storyId,
                story.chapterId
            );

            return this.showStory(story);
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
        this.game.ui.setMerchantGold(
            isVendorEncounter(eventData.npcType, eventData.choices),
            this.player.gold
        );

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

    showStory(story) {
        new StoryView(this).show(story);
        setText('sceneBadgeOverlay', `HISTORIA · ${(story.storyTitle || story.storyId).toUpperCase()}`);
    }

    async onStoryChoice(choice, storyId) {
        this.lockChoices();

        const npc = choice.action === 'talk' ? NPC_DATABASE[storyId] : null;
        if (choice.action === 'talk' && !npc) {
            console.warn(`[Exploration] No hay un PNJ asociado a la historia "${storyId}".`);
            this.game.finishEncounter(1200);
            return;
        }

        StoryResolver.applyChoice(this.player, { ...choice, storyId: choice.storyId ?? storyId }, this.game);
        if (choice.quest) {
            this.log(`🧭 Nueva misión: ${choice.quest.title}. ${choice.quest.description}`);
        }
        if (choice.action === 'reject_busgosu_sidra') {
            await this.showBusgosuFarewell(
                NPC_DATABASE.busgosu.images.enraged,
                'EL BUSGOSU SE ENFADA',
                '«¡Nun te daré sidra nin te cuntaré nada! ¡Sigue’l to camín!», protesta el Busgosu, enfadáu.',
                '😠 Refugas la sidra. El Busgosu se enfada y no comparte su historia.'
            );
            return;
        }
        if (choice.action === 'fail_busgosu_riddle') {
            await this.showBusgosuFarewell(
                NPC_DATABASE.busgosu.images.talk,
                'EL BUSGOSU SE DESPIDE',
                '«¡Fallasti, viaxeru! Nun hai más intentos. Hasta otra; sigue’l to camín.» El Busgosu s’allonga ente los árboles.',
                '❌ Fallas el acertijo. El Busgosu se despide y sigues tu camino.'
            );
            return;
        }
        if (choice.action === 'enter_dark_world') {
            await this.game.darkWorld.enterThroughPortal();
            return;
        }
        if (choice.action === 'decline_portal') {
            this.log('🚶 Dejas el portalón atrás y continúas por la mazmorra.');
        }
        if (choice.nextChapter === undefined) {
            this.game.storyManager?.checkStoryProgress(storyId);
        }

        if (choice.action === 'talk') {
            await this.openChat(npc, () => this.game.finishEncounter(1400));
            return;
        }

        this.game.finishEncounter(1400);
    }

    async showBusgosuFarewell(image, badge, description, logMessage) {
        const view = this.render();
        this.setSceneImage(image);
        setText('sceneBadgeOverlay', badge);
        view.setNarrative(description, []);
        this.log(logMessage);
        await wait(1600);
        this.game.finishEncounter(0);
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

        // Quita opciones repetidas (mismo texto) y añade la de conversar, que tienen todos los PNJ
        const unique = [...new Map(interaction.choices.map(c => [c.text, c])).values()];
        let choices = unique;
        if (npc.id === 'vendedorCartas') {
            const ownedCards = new Set(this.game.deck?.collection ?? []);
            choices = unique.filter(choice => !choice.cardId || !ownedCards.has(choice.cardId));
            if (!choices.some(choice => choice.cardId)) {
                choices = [{ text: '✨ Gracias por las cartas. Seguiré mi camino.', action: 'finish_legendary_card_trade' }];
            }
        }
        const talk = { text: `💬 Conversar con ${npc.name}`, action: 'chat' };
        return { ...interaction, choices: [...choices, talk] };
    }

    async showNpc(npcKey) {

        const npc = NPC_DATABASE[npcKey];

        if (!npc) return;

        // NUEVO:
        // Si es un personaje narrativo,
        // delegamos en StoryManager

        if (npc.storyId) {

            const story =
                this.game.storyManager
                    ?.getStoryById?.(npc.storyId, this.game.dungeonLevel);

            if (story) {

                return this.showStory(story);

            }

        }

        // --- Comportamiento normal ---
        const view = this.render();

        const token = this.sceneToken;

        this.setSceneImage(npc.images?.offer || npc.images?.room);

        setText(
            'sceneBadgeOverlay',
            npc.name.toUpperCase()
        );

        this.log(
            `👁️ Te encuentras cara a cara con ${npc.name}.`
        );

        const interaction =
            this.getNpcInteraction(npc);

        this.game.ui.setMerchantGold(
            isVendorEncounter(npc.type, interaction.choices),
            this.player.gold
        );

        view.setNarrative(
            `${npc.name} te observa en silencio...`,
            []
        );

        const greeting =
            await this.game.dialogue.say(
                npc,
                'greeting',
                {
                    extraFallback: interaction.greeting
                        ? [interaction.greeting]
                        : []
                }
            );

        if (token !== this.sceneToken) {
            return;
        }

        this.setNpcChoices(
            view,
            npc,
            interaction,
            greeting
        );

    }

    /** Menú de acciones con el PNJ: lo que ves tras su saludo y al volver de una conversación. */
    showNpcMenu(npc, text) {
        const view = this.render();
        this.setSceneImage(npc.images?.offer || npc.images?.room);
        setText('sceneBadgeOverlay', npc.name.toUpperCase());
        const interaction = this.getNpcInteraction(npc);
        this.game.ui.setMerchantGold(
            isVendorEncounter(npc.type, interaction.choices),
            this.player.gold
        );
        this.setNpcChoices(view, npc, interaction, text);
    }

    setNpcChoices(view, npc, interaction, text) {
        view.setNarrative(
            text,
            interaction.choices.map(choice => ({
                text: choice.text,
                callback: () => this.onNpcChoice(npc, choice)
            }))
        );
    }

    /** Abre la conversación; al despedirte vuelves al menú del PNJ sin repetir su saludo ni gastar la planta. */
    openChat(npc, onClose = null) {
        this.sceneToken++; // invalida cualquier respuesta que estuviera en camino para la escena anterior
        return this.game.chat.open(npc, {
            onClose: onClose ?? (() => this.game.party.has(npc.id)
                ? this.showAllyJoined(npc)
                : this.showNpcMenu(npc, `Te despides de ${npc.name}, que sigue esperando tu decisión.`))
        });
    }

    /** Tras convencer a un personaje: ya forma parte de tu grupo y solo queda seguir adelante. */
    showAllyJoined(npc) {
        const view = this.render();
        this.setSceneImage(npc.images?.talk ?? npc.images?.room);
        setText('sceneBadgeOverlay', npc.name.toUpperCase());

        view.setNarrative(
            `${npc.name} se une a tu grupo y te acompañará por la mazmorra.`,
            [{ text: '➡️ Seguir adelante', callback: () => { this.lockChoices(); this.game.finishEncounter(600); } }]
        );
    }

    async onNpcChoice(npc, choice) {
        if (choice.action === 'chat') {
            await this.openChat(npc);
            return;
        }

        this.lockChoices();

        const cannotAffordLegendaryCard = npc.id === 'vendedorCartas'
            && choice.cardId
            && this.player.gold < npc.cardPrice;
        const cannotAffordMagicLamp = npc.id === 'demonio_hindu'
            && choice.action === 'buy_magic_lamp'
            && this.player.gold < npc.lampPrice;
        const mood = cannotAffordLegendaryCard || cannotAffordMagicLamp
            ? 'offer'
            : NPC_MOOD_BY_ACTION[choice.action] || 'talk';
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
