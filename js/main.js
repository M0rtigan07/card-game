import { AudioManager } from './audio.js';
import { Player } from './models/Player.js';
import { Deck } from './models/Deck.js';
import { BattleSystem } from './systems/BattleSystem.js';
import { UIManager } from './ui/UIManager.js';
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

        this.initEvents();
    }

    initEvents() {
        // PANTALLA 1 -> PANTALLA 2
        document.getElementById('btnPressStart').addEventListener('click', () => {
            this.audio.play('sega');
            this.ui.showScreen('charScreen');
        });

        // PANTALLA 2 -> PANTALLA 3
        document.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const classKey = e.currentTarget.dataset.class;
                this.selectCharacter(classKey).catch(err => console.error("Error al seleccionar héroe:", err));
            });
        });

        // PANTALLA 3 -> PANTALLA 4
        document.getElementById('btnEnterDungeon').addEventListener('click', () => {
            this.audio.play('sega');
            this.ui.showScreen('gameScreen');
            this.startMainGame();
        });

        // EVENTOS DE BATALLA MODAL
        document.getElementById('btnAttack').addEventListener('click', () => this.battle.executeTurn('attack', this.player));
        document.getElementById('btnDefend').addEventListener('click', () => this.battle.executeTurn('defend', this.player));
        document.getElementById('btnSpell').addEventListener('click', () => this.battle.executeTurn('spell', this.player));
    }

    async initGame() {
        // Carga pausada y estilizada
        this.ui.setLoadingProgress(20, "INICIALIZANDO SISTEMA SEGA...");
        await new Promise(r => setTimeout(r, 800));

        this.ui.setLoadingProgress(50, "CARGANDO GRÁFICOS 16-BIT...");
        await new Promise(r => setTimeout(r, 1000));

        this.ui.setLoadingProgress(80, "SINTONIZANDO ORÁCULOS DE GROQ...");
        await new Promise(r => setTimeout(r, 900));

        this.ui.setLoadingProgress(100, "¡SISTEMA LISTO!");
        await new Promise(r => setTimeout(r, 700));

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

    async startMainGame() {
        this.dungeonLevel = 1;
        this.turnCounter = 1;
        this.ui.updateStats(this.player, this.dungeonLevel);
        this.ui.logEvent(`¡${this.player.className} ha entrado en la Planta ${this.dungeonLevel}!`);
        await this.loadNextExplorationEvent();
    }

    async loadNextExplorationEvent() {
        document.getElementById('explorationText').textContent = "Consultando los misterios de la mazmorra...";
        
        try {
            const response = await fetch("/api/generate-lore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: 'exploration',
                    className: this.player.className,
                    dungeonLevel: this.dungeonLevel
                })
            });
            const eventData = await response.json();
            
            document.getElementById('explorationText').textContent = eventData.description;
            
            const choicesContainer = document.getElementById('actionChoices');
            choicesContainer.innerHTML = '';
            
            eventData.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = choice.text;
                btn.addEventListener('click', () => this.handleExplorationChoice(choice.action));
                choicesContainer.appendChild(btn);
            });
        } catch (err) {
            document.getElementById('explorationText').textContent = "El camino está despejado. ¿Qué deseas hacer?";
        }
    }

    async handleExplorationChoice(action) {
        this.audio.play('card');
        
        if (action === 'investigate') {
            const roll = Math.random();
            if (roll > 0.4) {
                this.player.addGold(150 * this.dungeonLevel);
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
                this.ui.logEvent(`✨ ¡Encuentro afortunado! Recuperas +20 HP y +${150 * this.dungeonLevel} Oro.`);
            } else {
                this.audio.play('hit');
                this.player.health -= 20;
                this.ui.logEvent(`⚠️ ¡Trampa antigua o emboscada! Pierdes 20 HP.`);
            }
        } else if (action === 'rest') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
            this.player.mana = Math.min(this.player.maxMana, this.player.mana + 25);
            this.ui.logEvent(`⛺ Has descansado plenamente. +35 HP | +25 MP.`);
        } else {
            this.player.addGold(80 * this.dungeonLevel);
            this.ui.logEvent(`🛡️ Avanzas con cautela asegurando el perímetro (+${80 * this.dungeonLevel} Oro).`);
        }

        this.ui.updateStats(this.player, this.dungeonLevel);

        if (this.player.health <= 0) {
            this.ui.showGameOver();
            return;
        }

        // Subir de planta
        this.dungeonLevel++;
        this.ui.logEvent(`🏰 Has descendido a la Planta ${this.dungeonLevel}.`);
        await this.loadNextExplorationEvent();
    }
}

// INICIADOR SEGURO DE LA APLICACIÓN
window.addEventListener('DOMContentLoaded', async () => {
    window.game = new Game();
    try {
        await window.game.initGame();
    } catch (err) {
        console.error("Error al iniciar el juego:", err);
    }
});