import { AudioManager } from './audio.js';
import { Player } from './models/Player.js';
import { UIManager } from './ui/UIManager.js';
import { GroqAI } from './systems/GroqAI.js';

class Game {
    constructor() {
        this.audio = new AudioManager();
        this.groq = new GroqAI();
        this.ui = new UIManager();

        this.currentEnemy = null;
        this.playerHand = [];

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

    // Método para iniciar combate TCG cuando la historia o decisión encuentra un enemigo
    startTcgCombat(enemyData) {
        this.currentEnemy = enemyData || { name: "Orco de las Sombras", hp: 60, maxHp: 60, atk: 12 };
        
        // Cambiar vista de interfaz
        document.getElementById('actionChoices').style.display = 'none';
        document.getElementById('tcgCombatView').style.display = 'flex';
        
        this.ui.logEvent(`⚔️ ¡ENTRAS EN COMBATE TCG contra ${this.currentEnemy.name}!`);
        this.updateTcgUI();
        this.drawTcgHand();
    }

    drawTcgHand() {
        // Baraja de cartas tácticas
        const availableCards = [
            { id: 'strike', name: 'Estocada', cost: 1, type: 'atk', val: 15, desc: 'Inflige 15 de daño' },
            { id: 'shield', name: 'Escudo', cost: 1, type: 'def', val: 10, desc: 'Gana 10 de guardia' },
            { id: 'fireball', name: 'Bola de Fuego', cost: 2, type: 'atk', val: 25, desc: 'Inflige 25 de daño mágico' },
            { id: 'heal', name: 'Poción', cost: 1, type: 'heal', val: 20, desc: 'Restaura 20 HP' }
        ];

        this.playerHand = [
            availableCards[0],
            availableCards[1],
            availableCards[2],
            availableCards[3]
        ];

        this.renderHand();
    }

    renderHand() {
        const handContainer = document.getElementById('playerHand');
        handContainer.innerHTML = '';

        this.playerHand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'tcg-card';
            cardEl.innerHTML = `
                <span class="cost">🔮 ${card.cost} MP</span>
                <span class="title">${card.name}</span>
                <span class="desc">${card.desc}</span>
            `;
            cardEl.addEventListener('click', () => this.playTcgCard(card, index));
            handContainer.appendChild(cardEl);
        });
    }

    playTcgCard(card, index) {
        if (this.player.mana < card.cost) {
            this.ui.logEvent(`❌ ¡Maná insuficiente!`);
            return;
        }

        this.audio.play('card');
        this.player.mana -= card.cost;

        if (card.type === 'atk') {
            this.currentEnemy.hp -= card.val;
            this.ui.logEvent(`🗡️ Usas ${card.name} e infliges ${card.val} de daño.`);
        } else if (card.type === 'heal') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + card.val);
            this.ui.logEvent(`✨ Usas ${card.name} y recuperas ${card.val} HP.`);
        }

        // Eliminar carta jugada
        this.playerHand.splice(index, 1);
        this.renderHand();
        this.updateTcgUI();

        // Comprobar victoria TCG
        if (this.currentEnemy.hp <= 0) {
            this.winTcgCombat();
        }
    }

    winTcgCombat() {
        this.audio.play('sega');
        this.ui.logEvent(`🏆 ¡Has derrotado a ${this.currentEnemy.name}!`);
        
        // Recompensas RPG
        this.player.addGold(120);
        this.player.addXp(50);
        this.ui.updateStats(this.player, this.dungeonLevel);

        // Volver al modo exploración RPG
        document.getElementById('tcgCombatView').style.display = 'none';
        document.getElementById('actionChoices').style.display = 'flex';
        
        this.loadNextExplorationEvent();
    }

    updateTcgUI() {
        document.getElementById('enemyName').textContent = this.currentEnemy.name;
        document.getElementById('enemyHp').textContent = `❤️ HP: ${Math.max(0, this.currentEnemy.hp)}/${this.currentEnemy.maxHp}`;
        this.ui.updateStats(this.player, this.dungeonLevel);
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