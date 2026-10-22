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
        // Pantalla 1 -> Pantalla 2
        document.getElementById('btnPressStart').addEventListener('click', () => {
            this.audio.play('sega');
            this.ui.showScreen('charScreen');
        });

        // Pantalla 2 -> Pantalla 3
        document.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const classKey = e.currentTarget.dataset.class;
                this.selectCharacter(classKey).catch(err => console.error("Error al seleccionar personaje:", err));
            });
        });

        // Pantalla 3 -> Pantalla 4
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

    async initGame() {
        // Aumentamos los tiempos para que la carga sea más pausada y atmosférica
        this.ui.setLoadingProgress(20, "INICIALIZANDO SISTEMA SEGA...");
        await new Promise(r => setTimeout(r, 800));

        this.ui.setLoadingProgress(50, "CARGANDO GRÁFICOS 16-BIT...");
        await new Promise(r => setTimeout(r, 1000));

        this.ui.setLoadingProgress(80, "PREPARANDO MAZO DE CARTAS...");
        await new Promise(r => setTimeout(r, 900));

        this.ui.setLoadingProgress(100, "¡SISTEMA LISTO!");
        await new Promise(r => setTimeout(r, 700));

        // Transición suave a la pantalla de título
        this.ui.showScreen('titleScreen');
    }

    async selectCharacter(classKey) {
        this.audio.play('card');
        this.player = new Player(classKey);

        const heroImages = {
            'warrior': 'img/guerrero.png',
            'mage': 'img/maga.png',
            'rogue': 'img/picaro.png'
        };

        const heroImgEl = document.getElementById('introHeroImg');
        if (heroImgEl) {
            heroImgEl.src = heroImages[classKey] || heroImages['warrior'];
        }

        const titleHeader = document.getElementById('introHeroTitle');
        if (titleHeader) {
            titleHeader.textContent = `CLASE: ${this.player.className.toUpperCase()}`;
        }

        this.ui.showScreen('introScreen');
        this.ui.typewriterIntro(`CONSULTANDO LOS ORÁCULOS ANCESTRALES...`);

        const story = await this.groq.generateCharacterLore(this.player.className);
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


// Iniciar aplicación de forma segura
window.addEventListener('DOMContentLoaded', async () => {
    window.game = new Game();
    try {
        await window.game.initGame();
    } catch (err) {
        console.error("Error al iniciar el juego:", err);
    }
});