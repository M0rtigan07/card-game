// js/systems/TcgCombat.js
// Controlador del combate de cartas: turnos, energía, mano, turno enemigo y recompensas.
// Las reglas puras viven en EnemyAI.js y JugadorCards.js; lo que se dibuja, en ui/CombatUI.js.

import { EnemyBrain, describeCard, effectiveAtk } from './EnemyAI.js';
import { instantiateCard, resolvePlayerCard, rollRewards, tickPoison } from './JugadorCards.js';
import { REWARD_CONFIG } from '../data/cardCatalog.js';
import { COMBAT, DIALOGUE, FALLBACK_IMG, GENERIC_ENEMIES, DEFAULT_ENEMY } from '../data/gameConfig.js';
import { CombatUI } from '../ui/CombatUI.js';
import { wait } from '../ui/helpers.js';

const DEFAULT_VICTORY_TEXT = '¡Has barrido al enemigo de la mazmorra!';

export class TcgCombat {
    /** @param {import('../Game.js').Game} game */
    constructor(game) {
        this.game = game;
        this.view = new CombatUI();

        this.enemy = null;       // { name, hp, maxHp, atk, shield, img, deckId, poison?, atkBonus? }
        this.hand = [];          // cartas en tu mano (ya con sus números)
        this.heroShield = 0;
        this.heroPoison = null;  // { dmg, turns } mientras estés envenenado
        this.brain = null;       // mazo e intención del enemigo actual
        this.busy = false;       // true mientras juega el enemigo o se celebra la victoria
        this.energy = 0;         // energía que te queda este turno
        this.rng = Math.random;  // se puede sustituir en los tests
        this.intentLine = null;  // grito del enemigo para su próxima carta, ya pedido a la IA
        this.hurtSpoken = false; // ya protestó al verse herido en este combate
    }

    get player() { return this.game.player; }
    get deck() { return this.game.deck; }
    get audio() { return this.game.audio; }
    log(message) { this.game.ui.logEvent(message); }

    maxEnergy() {
        return COMBAT.ENERGY_PER_TURN + (this.player.energyBonus || 0);
    }

    // ───────────── INICIO DEL COMBATE ─────────────

    /** Combate contra un PNJ de npcs.js (usa su vida, ataque, imagen y mazo). */
    startFromNpc(npc) {
        this.log(`⚔️ ¡Desafías a ${npc.name}! Desenfundan sus cartas.`);
        const hp = npc.baseHp + (this.game.dungeonLevel * 10);

        this.start({
            name: npc.name,
            hp,
            maxHp: hp,
            atk: npc.baseAtk,
            img: npc.images?.enraged || npc.images?.room,
            deckId: npc.id,
            speaker: npc
        });
    }

    /** Empieza un combate. Sin nombre y vida, se deduce un enemigo genérico por la descripción. */
    start(enemyData = {}) {
        this.enemy = this.createEnemy(enemyData);
        this.heroShield = 0;
        this.heroPoison = null;
        this.busy = false;

        this.brain = new EnemyBrain(this.enemy.deckId);
        this.brain.drawIntent(this.enemy, { poison: null });

        this.energy = this.maxEnergy();
        this.deck.startCombat();
        this.hand = [];
        this.hurtSpoken = false;
        this.intentLine = null;

        this.view.mount(this.game, this.enemy, this.player);
        this.view.bindEndTurn(() => this.endTurn());

        this.log(`⚔️ ¡ENTRAS EN COMBATE contra ${this.enemy.name}!`);
        this.renderIntent();
        this.refresh();
        this.drawHand();

        this.speak('combat_start');
        this.prepareIntentLine();
    }

    createEnemy(enemyData) {
        if (enemyData.name && enemyData.hp) {
            return {
                name: enemyData.name,
                hp: enemyData.hp,
                maxHp: enemyData.maxHp ?? enemyData.hp,
                atk: enemyData.atk,
                shield: 0,
                img: enemyData.img || FALLBACK_IMG,
                deckId: enemyData.deckId,
                speaker: enemyData.speaker // quién habla (nombre, voz...); sin él, el enemigo no dice nada
            };
        }

        // Enemigo genérico: se deduce por la descripción del encuentro y escala con la planta
        const level = this.game.dungeonLevel;
        const text = (enemyData.description || '').toLowerCase();
        const template = GENERIC_ENEMIES.find(t => t.keys.some(k => text.includes(k))) || DEFAULT_ENEMY;

        return {
            name: template.name,
            hp: 40 + (level * 18),
            maxHp: 40 + (level * 18),
            atk: 10 + (level * 2),
            shield: 0,
            img: template.img,
            deckId: template.deckId,
            speaker: { id: template.id, name: template.name, archetype: template.archetype, voice: template.voice }
        };
    }

    // ───────────── MANO ─────────────

    /** Lo que no jugaste va al descarte y se roba una mano nueva. */
    drawHand() {
        this.hand.forEach(card => this.deck.discard(card.id));
        this.hand = this.deck.draw(COMBAT.HAND_SIZE).map(id => instantiateCard(id, this.player.level));
        this.renderHand();
    }

    /** Efecto "robar": añade cartas a la mano (con un máximo) sin repartir una mano nueva. */
    drawExtra(amount) {
        const room = Math.max(0, COMBAT.MAX_HAND_SIZE - this.hand.length);
        const ids = this.deck.draw(Math.min(amount, room));
        this.hand.push(...ids.map(id => instantiateCard(id, this.player.level)));
    }

    renderHand() {
        this.view.renderHand(this.hand, this.energy, (card, index) => this.playCard(card, index));
    }

    // ───────────── TU TURNO ─────────────

    playCard(card, index) {
        const enemy = this.enemy;
        if (this.busy || !enemy || enemy.hp <= 0 || this.player.health <= 0) return;
        if (this.energy < card.cost) {
            this.log(`⚡ Energía insuficiente para jugar ${card.name}.`);
            return;
        }

        this.audio.play('card');
        this.energy -= card.cost;

        const hero = { health: this.player.health, maxHealth: this.player.maxHealth, shield: this.heroShield };
        const events = resolvePlayerCard(card, enemy, hero, { attackBonus: this.player.attackBonus || 0 });
        this.player.health = hero.health;
        this.heroShield = hero.shield;

        this.narratePlayer(card, events);

        if (enemy.hp > 0 && !this.hurtSpoken && enemy.hp <= enemy.maxHp * DIALOGUE.HURT_THRESHOLD) {
            this.hurtSpoken = true;
            this.speak('combat_hurt');
        }

        // La carta jugada va al descarte; después se aplican los efectos que tocan mano y energía
        this.hand.splice(index, 1);
        this.deck.discard(card.id);
        for (const ev of events) {
            if (ev.kind === 'energy') this.energy += ev.amount;
            if (ev.kind === 'draw') this.drawExtra(ev.amount);
        }

        this.renderHand();
        this.refresh();

        if (enemy.hp <= 0) {
            this.win();
        }
    }

    // Cuenta qué ha hecho tu carta (diario y números flotantes)
    narratePlayer(card, events) {
        const enemy = this.enemy;

        for (const ev of events) {
            switch (ev.kind) {
                case 'damage':
                    this.log(`🗡️ ${card.name}: infliges ${ev.dealt} de daño a ${enemy.name}.`);
                    if (ev.absorbed > 0) this.log(`🛡️ El escudo de ${enemy.name} absorbe ${ev.absorbed}.`);
                    this.view.float('enemyPortraitContainer', ev.dealt > 0 ? `-${ev.dealt}` : '🛡️', ev.dealt > 0 ? 'dmg' : 'shield');
                    this.view.shake('enemyPortraitContainer');
                    break;
                case 'heal':
                    this.log(`✨ ${card.name}: restauras ${ev.amount} HP.`);
                    this.view.float('heroPortraitContainer', `+${ev.amount}`, 'heal');
                    break;
                case 'shield':
                    this.log(`🛡️ ${card.name}: obtienes ${ev.amount} de escudo.`);
                    this.view.float('heroPortraitContainer', `+${ev.amount}`, 'shield');
                    break;
                case 'poison':
                    this.log(`☠️ ${card.name}: ${enemy.name} sufrirá ${ev.dmg} de daño durante ${ev.turns} turnos.`);
                    this.view.float('enemyPortraitContainer', '☠️', 'poison');
                    break;
                case 'energy':
                    this.log(`⚡ ${card.name}: ganas ${ev.amount} de energía.`);
                    this.view.float('heroPortraitContainer', `⚡ +${ev.amount}`, 'buff');
                    break;
                case 'draw':
                    this.log(`📜 ${card.name}: robas ${ev.amount} cartas.`);
                    break;
            }
        }
    }

    // ───────────── TURNO ENEMIGO ─────────────

    async endTurn() {
        const enemy = this.enemy;
        if (this.busy || !enemy || !this.brain || enemy.hp <= 0 || this.player.health <= 0) return;

        this.busy = true;
        this.view.setControls(false);

        enemy.shield = 0; // su escudo solo dura hasta que le toca jugar otra vez

        const poisonDmg = tickPoison(enemy);
        if (poisonDmg > 0) {
            this.audio.play('hit');
            this.log(`☠️ El veneno hace ${poisonDmg} de daño a ${enemy.name}.`);
            this.view.float('enemyPortraitContainer', `-${poisonDmg}`, 'poison');
            this.view.shake('enemyPortraitContainer');
            this.refresh();

            if (enemy.hp <= 0) {
                this.win();
                return;
            }
            await wait(700);
        }
        this.refresh();

        const card = this.brain.intent;
        this.log(`⏳ Fin de tu turno. ¡${enemy.name} juega ${card.name}!`);
        this.audio.play('card');
        this.renderIntent(true);
        await Promise.all([wait(COMBAT.ENEMY_REVEAL_MS), this.showCardLine()]);

        const hero = { health: this.player.health, shield: this.heroShield, poison: this.heroPoison };
        const { events } = this.brain.play(enemy, hero);
        this.player.health = hero.health;
        this.heroShield = hero.shield;
        this.heroPoison = hero.poison;

        this.narrateEnemy(events);
        this.refresh();
        await wait(COMBAT.ENEMY_RESOLVE_MS);

        if (this.player.health <= 0) {
            await this.speak('combat_victory', {}, { log: true });
            await wait(1200);
            this.game.ui.showGameOver();
            return;
        }
        this.startPlayerTurn();
    }

    // Cuenta qué ha hecho la carta enemiga (diario, sonido y números flotantes)
    narrateEnemy(events) {
        const enemy = this.enemy;

        for (const ev of events) {
            switch (ev.kind) {
                case 'damage': {
                    const hits = ev.hits > 1 ? ` en ${ev.hits} golpes` : '';
                    if (ev.absorbed > 0) this.log(`🛡️ Tu guardia absorbe ${ev.absorbed} de daño.`);
                    if (ev.dealt > 0) {
                        this.audio.play('hit');
                        this.log(`💥 Recibes ${ev.dealt} de daño${hits}.`);
                        this.view.float('heroPortraitContainer', `-${ev.dealt}`, 'dmg');
                        this.view.shake('heroPortraitContainer');
                    } else {
                        this.log(`🛡️ ¡Bloqueas todo el daño!`);
                        this.view.float('heroPortraitContainer', '🛡️', 'shield');
                    }
                    break;
                }
                case 'shield':
                    this.log(`🛡️ ${enemy.name} se protege con ${ev.amount} de escudo.`);
                    this.view.float('enemyPortraitContainer', `+${ev.amount}`, 'shield');
                    break;
                case 'heal':
                    this.log(`💚 ${enemy.name} recupera ${ev.amount} de vida.`);
                    this.view.float('enemyPortraitContainer', `+${ev.amount}`, 'heal');
                    break;
                case 'poison':
                    this.log(`☠️ ¡Te envenena! ${ev.dmg} de daño durante ${ev.turns} turnos.`);
                    this.view.float('heroPortraitContainer', '☠️', 'poison');
                    break;
                case 'buff':
                    this.log(`🔥 El ataque de ${enemy.name} sube +${ev.amount}.`);
                    this.view.float('enemyPortraitContainer', `ATK +${ev.amount}`, 'buff');
                    break;
            }
        }
    }

    startPlayerTurn() {
        this.heroShield = 0;

        if (this.heroPoison) {
            const { dmg } = this.heroPoison;
            this.player.health -= dmg;
            this.heroPoison.turns -= 1;
            if (this.heroPoison.turns <= 0) this.heroPoison = null;

            this.audio.play('hit');
            this.log(`☠️ El veneno te causa ${dmg} de daño.`);
            this.view.float('heroPortraitContainer', `-${dmg}`, 'poison');
            this.view.shake('heroPortraitContainer');

            if (this.player.health <= 0) {
                this.refresh();
                this.game.ui.showGameOver();
                return;
            }
        }

        this.energy = this.maxEnergy();
        this.brain.drawIntent(this.enemy, { poison: this.heroPoison });
        this.prepareIntentLine();
        this.renderIntent();
        this.drawHand();
        this.refresh();

        this.busy = false;
        this.view.setControls(true);
    }

    // ───────────── FINAL DEL COMBATE ─────────────

    async win() {
        this.busy = true; // bloquea clics mientras dura la animación de victoria
        this.audio.play('sega');
        this.log(`🏆 ¡Has derrotado a ${this.enemy.name}!`);

        this.player.addGold(100 + (this.game.dungeonLevel * 15));
        if (this.player.addXp(60)) {
            this.log(`🌟 ¡SUBIDA DE NIVEL! Tus cartas ahora hacen más daño/defensa.`);
        }

        // Las últimas palabras del enemigo se añaden al cartel de victoria si llegan a tiempo
        const defeated = this.enemy;
        let modalOpen = true;
        this.view.setVictoryText(DEFAULT_VICTORY_TEXT);
        this.speak('combat_defeat', {}, { log: true }).then(line => {
            if (line && modalOpen) this.view.setVictoryText(`${defeated.name}: “${line}”`);
        });

        this.view.setVictory(true);
        await wait(COMBAT.VICTORY_MS);
        modalOpen = false;
        this.view.setVictory(false);

        await this.chooseReward();

        this.game.dungeonLevel++;
        await this.game.loadNextEvent();
    }

    /** Tras ganar eliges 1 de 3 cartas para tu mazo (o las saltas por oro). */
    chooseReward() {
        return new Promise(resolve => {
            const ids = rollRewards({
                classKey: this.player.classKey,
                owned: this.deck.collection,
                level: this.game.dungeonLevel
            });
            if (ids.length === 0) {
                resolve();
                return;
            }

            const cards = ids.map(id => instantiateCard(id, this.player.level));
            this.view.showReward(cards, REWARD_CONFIG.skipGold, {
                onPick: (card) => {
                    this.audio.play('sega');
                    this.deck.addCard(card.id);
                    this.log(`🃏 Añades ${card.name} a tu mazo (${this.deck.counts.total} cartas).`);
                    resolve();
                },
                onSkip: () => {
                    this.player.addGold(REWARD_CONFIG.skipGold);
                    this.log(`💰 Renuncias a la carta y te quedas ${REWARD_CONFIG.skipGold} de oro.`);
                    this.game.ui.updateStats(this.player, this.game.dungeonLevel);
                    resolve();
                }
            });
        });
    }

    // ───────────── EL ENEMIGO HABLA ─────────────

    enemyHpPercent() {
        return Math.round((Math.max(0, this.enemy.hp) / this.enemy.maxHp) * 100);
    }

    /** El enemigo dice una frase con su estilo (Groq o, si falla, su banco). Devuelve la frase, o null si no habla. */
    async speak(kind, context = {}, { log = false } = {}) {
        const enemy = this.enemy;
        const speaker = enemy?.speaker;
        if (!speaker) return null;

        const line = await this.game.dialogue.say(speaker, kind, { ...context, enemyHpPercent: this.enemyHpPercent() });
        if (this.enemy !== enemy) return line; // el combate ya cambió: no se enseña

        this.view.showSpeech(line, speaker.id);
        if (log) this.log(`💬 ${speaker.name}: “${line}”`);
        return line;
    }

    /** Pide ya el grito de la carta que jugará el enemigo: llegará lista cuando le toque, sin retrasar su turno. */
    prepareIntentLine() {
        this.intentLine = null;
        const card = this.brain?.intent;
        if (!card || !this.enemy?.speaker || this.rng() >= DIALOGUE.CARD_LINE_CHANCE) return;

        this.intentLine = this.game.dialogue.say(this.enemy.speaker, 'combat_card', {
            cardName: card.name,
            cardEffect: describeCard(card, this.enemy),
            poolKey: ['atk', 'multi', 'drain'].includes(card.type) ? 'combat_attack' : 'combat_other',
            enemyHpPercent: this.enemyHpPercent()
        });
    }

    /** Enseña el grito preparado; si aún no ha llegado, espera un poco y, si tampoco, el enemigo no dice nada este turno. */
    async showCardLine() {
        const pending = this.intentLine;
        this.intentLine = null;
        if (!pending) return;

        const line = await Promise.race([pending, wait(DIALOGUE.CARD_LINE_WAIT_MS).then(() => null)]);
        if (line) this.view.showSpeech(line, this.enemy.speaker.id);
    }

    // ───────────── REFRESCO DE LA INTERFAZ ─────────────

    renderIntent(playing = false) {
        const card = this.brain?.intent;
        this.view.renderIntent(card
            ? { card, description: describeCard(card, this.enemy), cardsLeft: this.brain.cardsLeft, playing }
            : null);
    }

    statusParts() {
        const parts = [];
        if (this.heroShield > 0) parts.push(`🛡️ Guardia ${this.heroShield}`);
        if (this.heroPoison) parts.push(`☠️ Veneno ${this.heroPoison.dmg} x ${this.heroPoison.turns} turnos`);
        if (this.enemy?.poison) parts.push(`☠️ ${this.enemy.name} envenenado ${this.enemy.poison.dmg} x ${this.enemy.poison.turns}`);
        return parts;
    }

    refresh() {
        this.view.renderEnemyStats(this.enemy, effectiveAtk(this.enemy));
        this.view.renderEnergy(this.energy, this.maxEnergy(), this.deck.counts);
        this.view.renderStatus(this.statusParts());
        this.game.ui.updateStats(this.player, this.game.dungeonLevel);
    }
}
