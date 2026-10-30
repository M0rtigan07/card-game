// js/systems/NpcActions.js
// Qué ocurre cuando eliges una acción con un PNJ (las acciones se declaran en data/npcs.js).
// Para añadir una acción nueva: una entrada más en el mapa `actions` de run().
// Lo que dice el PNJ tras cada desenlace lo genera la IA (NpcDialogue) con una frase de respaldo.

import { DEFAULT_TOLL, NPC_TOLLS, POISON_COST } from '../data/gameConfig.js';

export class NpcActions {
    /**
     * @param {import('../Game.js').Game} game
     * @param {import('./Exploration.js').Exploration} scene  Para cambiar la imagen y mostrar diálogos
     */
    constructor(game, scene) {
        this.game = game;
        this.scene = scene;
    }

    get player() { return this.game.player; }
    log(message) { this.game.ui.logEvent(message); }

    /** El PNJ comenta lo que acaba de pasar. `outcome` = bought | no_gold | caught | offended; `detail` lo lee la IA. */
    async speak(npc, outcome, detail) {
        this.scene.showDialogue(npc.name, '...');
        const line = await this.game.dialogue.say(npc, 'outcome', { outcome, detail });
        this.scene.showDialogue(npc.name, line);
    }

    /** Ejecuta la acción elegida con `npc`. Una acción desconocida avisa y avanza, nunca bloquea el juego. */
    async run(npc, action) {
        this.game.audio.play('card');

        const actions = {
            combat: () => this.game.combat.startFromNpc(npc),
            buy: () => this.payToll(npc),
            pass: () => this.leave(npc),

            pact_accept: () => {
                this.log(`🤝 Sellas un pacto con ${npc.name}. Obtienes información y riquezas (+200 oro).`);
                this.player.addGold(200);
                this.game.finishEncounter(1800);
            },

            flirt_challenge: () => {
                this.log(`✨ ${this.game.playerName} deslumbra a ${npc.name} con un despliegue de magia arcana.`);
                this.grantXp(80);
                this.game.finishEncounter(1800);
            },

            morgana_romance: () => this.morganaRomance(),
            morgana_romance_warrior: () => this.morganaRomance(),

            witch_knowledge: () => {
                this.log(`📖 ${npc.name} comparte un conocimiento prohibido contigo (+50 XP).`);
                this.grantXp(50);
                this.game.finishEncounter(1800);
            },

            buy_poison: () => {
                if (this.player.gold >= POISON_COST) {
                    this.player.gold -= POISON_COST;
                    this.player.attackBonus = (this.player.attackBonus || 0) + 5;
                    this.player.inventory.push({ name: '🧪 Veneno de Filo', effect: '+5 daño en ataques' });
                    this.log(`🧪 Compras veneno (-${POISON_COST} Oro). Tus ataques hacen +5 de daño.`);
                } else {
                    this.log(`❌ No tienes suficiente oro para el veneno.`);
                }
                this.game.finishEncounter(2000);
            },

            buy_potion: async () => {
                if (this.player.gold >= 30) {
                    this.player.gold -= 30;
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
                    this.log(`🧪 Compras una poción a ${npc.name} (-30 Oro). Recuperas 40 HP.`);
                    await this.speak(npc, 'bought', 'El héroe te ha comprado una poción curativa por 30 de oro.');
                } else {
                    this.log(`❌ No tienes suficiente oro para comprar la poción.`);
                    await this.speak(npc, 'no_gold', 'El héroe quería comprar una poción curativa (30 de oro) pero no tiene suficiente dinero.');
                }
                this.game.finishEncounter(2500);
            },

            buy_mana: async () => {
                if (this.player.gold >= 40) {
                    this.player.gold -= 40;
                    this.player.maxMana += 10;
                    this.player.mana = this.player.maxMana;
                    this.log(`🔮 Compras un grimorio a ${npc.name} (-40 Oro). ¡Maná máximo aumentado!`);
                    await this.speak(npc, 'bought', 'La hechicera te ha comprado un grimorio mágico por 40 de oro.');
                } else {
                    this.log(`❌ No tienes suficiente oro.`);
                    await this.speak(npc, 'no_gold', 'La hechicera quería comprar un grimorio mágico (40 de oro) pero no tiene suficiente dinero.');
                }
                this.game.finishEncounter(2500);
            },

            steal: async () => {
                const d20 = this.scene.rollD20();
                if (d20 >= 10) {
                    this.player.addGold(60);
                    this.log(`🎲 [D20: ${d20}] ¡Robo perfecto! Te llevas 60 de oro sin que ${npc.name} se entere.`);
                } else {
                    this.game.audio.play('hit');
                    this.player.health -= 15;
                    this.scene.setSceneImage(npc.images?.enraged || npc.images?.talk);
                    this.log(`🎲 [D20: ${d20}] ¡Te descubren! Recibes 15 de daño.`);
                    await this.speak(npc, 'caught', 'Acabas de sorprender al héroe intentando robarte la mercancía, y le has dado un golpe.');
                }
                this.game.finishEncounter(2500);
            }
        };

        const handler = actions[action];
        if (!handler) {
            console.warn(`[NpcActions] Acción de PNJ sin manejar: "${action}" (${npc.id})`);
            this.game.finishEncounter(1200);
            return;
        }

        try {
            await handler();
        } catch (error) {
            console.error(`[NpcActions] Falló la acción "${action}" (${npc.id}):`, error);
            this.game.finishEncounter(1200);
        }
    }

    grantXp(amount) {
        if (this.player.addXp(amount)) {
            this.log(`🌟 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);
        }
    }

    morganaRomance() {
        this.log(`🖤 Sellar un vínculo oscuro con la Bruja Morgana llena tu espíritu de un poder prohibido.`);
        this.player.addGold(100);
        this.player.inventory.push({ name: '🧪 Poción de Subsistencia', effect: '+20 HP Máximo' });
        this.player.maxHealth += 20;
        this.player.health = this.player.maxHealth;
        this.game.finishEncounter(1800);
    }

    payToll(npc) {
        const toll = NPC_TOLLS[npc.id] ?? DEFAULT_TOLL;

        if (this.player.gold >= toll) {
            this.player.gold -= toll;
            this.log(`💰 Entregas ${toll} GP a ${npc.name}. Te permite el paso sin sangre.`);
            this.game.finishEncounter(1400);
        } else {
            this.log(`❌ No tienes suficiente oro. ¡${npc.name} se impacienta!`);
            this.game.combat.startFromNpc(npc);
        }
    }

    async leave(npc) {
        if (npc.id === 'barnaby') {
            this.log(`💢 Barnaby se enfada al ver que ignoras su mercancía.`);
            await this.speak(npc, 'offended', 'El héroe ha ignorado por completo tu mercancía y se marcha sin comprar nada.');
            this.game.finishEncounter(2500);
        } else {
            this.log(`🏃 Te retiras con cautela sin llamar la atención.`);
            this.game.finishEncounter(1200);
        }
    }
}
