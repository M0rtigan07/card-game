import { AudioManager } from './audio.js';
import { Player } from './models/Player.js';
import { Deck } from './models/Deck.js';
import { BattleSystem } from './systems/BattleSystem.js';
import { UIManager } from './ui/UIManager.js';
import { MAX_CARDS_PER_TURN } from './config.js';

import { GroqAI } from './systems/GroqAI.js';

class Game {
    constructor() {
        this.audio = new AudioManager();
        this.groq = new GroqAI();
        this.ui = new UIManager();
        this.deck = new Deck();
        this.battle = new BattleSystem(this.audio, this.ui);

        this.player = null;
        this.dungeonLevel = 1;
        this.turnCounter = 1;
        this.drawnThisTurn = 0;

        this.initEvents();
    }

    initEvents() {
        document.getElementById('btnPressStart').addEventListener('click', () => {
            this.audio.play('sega');
            this.ui.showScreen('charScreen');
        });

        document.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const classKey = e.currentTarget.dataset.class;
                this.selectCharacter(classKey);
            });
        });

        document.getElementById('btnEnterDungeon').addEventListener('click', () => {
            this.audio.play('sega');
            this.ui.showScreen('gameScreen');
            this.startMainGame();
        });

        document.getElementById('drawCardBtn').addEventListener('click', () => this.drawCard());
        document.getElementById('nextTurnBtn').addEventListener('click', () => this.nextTurn());

        document.getElementById('btnAttack').addEventListener('click', () => this.battle.executeTurn('attack', this.player));
        document.getElementById('btnDefend').addEventListener('click', () => this.battle.executeTurn('defend', this.player));
        document.getElementById('btnSpell').addEventListener('click', () => this.battle.executeTurn('spell', this.player));
    }

    async selectCharacter(classKey) {
        this.audio.play('card');
        this.player = new Player(classKey);
        this.ui.showScreen('introScreen');

        // 1. Mensaje de espera
        this.ui.typewriterIntro(`CONSULTANDO LOS ORÁCULOS DEL DESTINO...`);

        // 2. Obtener el texto dinámico (Groq o Fallback local)
        const story = await this.groq.generateCharacterLore(this.player.className);

        // 3. Escribir la historia final limpia
        this.ui.typewriterIntro(story.toUpperCase());
    }

    startMainGame() {
        this.deck.reset();
        this.dungeonLevel = 1;
        this.turnCounter = 1;
        this.drawnThisTurn = 0;

        this.ui.updateStats(this.player, this.dungeonLevel);
        this.ui.logEvent(`¡${this.player.className} ha entrado en la Planta ${this.dungeonLevel}!`);
    }

    drawCard() {
        this.audio.play('card');
        const { card, isReshuffled } = this.deck.drawCard();

        if (isReshuffled) {
            this.dungeonLevel++;
            this.ui.logEvent(`🔄 ¡Mazo rebarajado! Has descendido a la Planta ${this.dungeonLevel} de la mazmorra.`);
        }

        this.ui.displayCard(card);
        this.processCardEffect(card);
        this.drawnThisTurn++;

        if (this.player.health <= 0) {
            this.ui.showGameOver();
            return;
        }

        if (this.drawnThisTurn >= MAX_CARDS_PER_TURN) {
            document.getElementById('drawCardBtn').style.display = 'none';
            document.getElementById('nextTurnBtn').style.display = 'inline-block';
            this.ui.setMessage("Límite de cartas alcanzado. Pasa al siguiente turno.");
        }
    }

    processCardEffect(card) {
        this.ui.logEvent(`Carta: [${card.name}] - ${card.desc}`);
        this.ui.setMessage(card.desc);

        if (card.id === 'gema') this.player.addGold(500);
        if (card.id === 'ruina') this.player.gold = 0;
        if (card.id === 'espada') {
            this.player.bonusDamage += 15;
            this.player.addItem("Espada Afilada", "+15 Dmg");
        }
        if (card.id === 'estrella') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
            this.player.mana = Math.min(this.player.maxMana, this.player.mana + 20);
        }
        if (card.id === 'vacio') {
            this.audio.play('hit');
            this.player.health -= 20;
        }
        if (card.id === 'sabio') {
            const leveledUp = this.player.addXp(100);
            if (leveledUp) this.ui.logEvent(`¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);
        }
        if (card.id === 'caballero') {
            this.player.bonusDamage += 10;
            this.player.addItem("Caballero Aliado", "+10 Dmg");
        }

        if (card.enemy) {
            this.battle.startBattle(card.enemy);
        }

        this.ui.updateStats(this.player, this.dungeonLevel);
    }

    nextTurn() {
        this.turnCounter++;
        this.drawnThisTurn = 0;
        document.getElementById('drawCardBtn').style.display = 'inline-block';
        document.getElementById('nextTurnBtn').style.display = 'none';
        document.getElementById('cardDisplay').innerHTML = '';
        this.ui.setMessage(`Turno ${this.turnCounter}: Saca tu carta.`);
        this.ui.logEvent(`--- Turno ${this.turnCounter} ---`);
    }
}

// Iniciar aplicación
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});