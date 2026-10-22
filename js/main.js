import { AudioManager } from './audio.js';
import { Player } from './models/Player.js';
import { UIManager } from './ui/UIManager.js';
import { GroqAI } from './systems/GroqAI.js';

class Game {
    constructor() {
        this.audio = new AudioManager();
        this.groq = new GroqAI();
        this.ui = new UIManager();

        this.player = null;
        this.dungeonLevel = 1;

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
                this.selectCharacter(classKey).catch(err => console.error(err));
            });
        });

        document.getElementById('btnEnterDungeon').addEventListener('click', () => {
            this.audio.play('sega');
            this.ui.showScreen('gameScreen');
            this.startMainGame();
        });
    }

    async initGame() {
        this.ui.setLoadingProgress(30, "FORJANDO HOJAS DE PERSONAJE...");
        await new Promise(r => setTimeout(r, 800));

        this.ui.setLoadingProgress(70, "CARGANDO DADOS D20 Y PNJS...");
        await new Promise(r => setTimeout(r, 1000));

        this.ui.setLoadingProgress(100, "¡MAZMORRA LISTA!");
        await new Promise(r => setTimeout(r, 600));

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
        if (heroImgEl) heroImgEl.src = heroImages[classKey] || heroImages['warrior'];

        document.getElementById('introHeroTitle').textContent = `CLASE: ${this.player.className.toUpperCase()}`;
        this.ui.showScreen('introScreen');
        this.ui.typewriterIntro(`CONSULTANDO A LOS DIOSES DEL DESTINO...`);

        const story = await this.groq.generateCharacterLore(this.player.className);
        this.ui.typewriterIntro(story.toUpperCase());
    }

    async startMainGame() {
        this.dungeonLevel = 1;
        this.ui.updateStats(this.player, this.dungeonLevel);
        this.ui.logEvent(`🐉 ¡${this.player.className} entra en la Planta ${this.dungeonLevel}!`);
        await this.loadNextExplorationEvent();
    }

    async loadNextExplorationEvent() {
        document.getElementById('explorationText').textContent = "Escuchando los pasos en la penumbra...";
        document.getElementById('d20Overlay').style.display = 'none';

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
            
            // Imagen del PNJ según respuesta
            const npcImages = {
                'warrior': 'img/guerrero.png',
                'mage': 'img/maga.png',
                'rogue': 'img/picaro.png'
            };
            const sceneImg = document.getElementById('sceneImage');
            if (sceneImg) sceneImg.src = npcImages[eventData.npcType] || 'img/guerrero.png';

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
            document.getElementById('explorationText').textContent = "Avanzas por un pasillo silencioso sin amenazas a la vista.";
        }
    }

    async handleExplorationChoice(action) {
        this.audio.play('card');

        // Tirada de Dado D20
        const d20 = Math.floor(Math.random() * 20) + 1;
        const d20Box = document.getElementById('d20Overlay');
        const d20Val = document.getElementById('d20Val');
        
        if (d20Box && d20Val) {
            d20Val.textContent = d20;
            d20Box.style.display = 'flex';
        }

        if (action === 'buy') {
            if (this.player.gold >= 50) {
                this.player.gold -= 50;
                this.player.health = this.player.maxHealth;
                this.ui.logEvent(`💊 Has comprado una poción (-50 Oro). ¡Salud al máximo!`);
            } else {
                this.ui.logEvent(`❌ No tienes suficiente oro.`);
            }
        } else if (action === 'pass') {
            this.ui.logEvent(`🏃 Has decidido no arriesgarte y pasar de largo.`);
        } else {
            // Chequeo de D20
            if (d20 >= 10) {
                const xpGain = 40;
                const leveledUp = this.player.addXp(xpGain);
                this.player.addGold(100);
                this.ui.logEvent(`🎲 [Tirada D20: ${d20}] ¡ÉXITO! +100 Oro, +${xpGain} XP.`);
                if (leveledUp) this.ui.logEvent(`🌟 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);
            } else {
                this.audio.play('hit');
                this.player.health -= 25;
                this.ui.logEvent(`🎲 [Tirada D20: ${d20}] ¡FALLO CRÍTICO! Sufres 25 de daño.`);
            }
        }

        this.ui.updateStats(this.player, this.dungeonLevel);

        if (this.player.health <= 0) {
            this.ui.showGameOver();
            return;
        }

        this.dungeonLevel++;
        await new Promise(r => setTimeout(r, 1200));
        await this.loadNextExplorationEvent();
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    window.game = new Game();
    try {
        await window.game.initGame();
    } catch (err) {
        console.error(err);
    }
});