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




    renderHand() {
        const handContainer = document.getElementById('playerHand');
        if (!handContainer) return;

        handContainer.innerHTML = '';

        this.playerHand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'tcg-card';

            // Ligera inclinación para efecto abanico
            const rotation = (index - (this.playerHand.length - 1) / 2) * 4;
            cardEl.style.transform = `rotate(${rotation}deg)`;

            cardEl.innerHTML = `
                <div class="cost-gem">${card.cost}</div>
                <img src="${card.img}" alt="${card.name}" class="tcg-card-img" onerror="this.src='img/guerrero.png'">
                <span class="title">${card.name}</span>
                <span class="desc">${card.desc}</span>
            `;

            cardEl.addEventListener('click', () => this.playTcgCard(card, index));
            handContainer.appendChild(cardEl);
        });
    }

    // INICIAR COMBATE TCG
    // INICIAR COMBATE TCG CON SPRITES DE ENEMIGOS ADAPTADOS A LA HISTORIA
    startTcgCombat(enemyData) {
        const levelMultiplier = this.dungeonLevel;

        // Base de datos de sprites de enemigos en pixel art según el tipo de encuentro
        const enemySprites = {
            'mage': 'img/maga.png',
            'rogue': 'img/picaro.png',
            'warrior': 'img/guerrero.png',
            'gargoyle': 'img/gargola.png', // O una imagen por defecto retro
            'default': 'img/guerrero.png'
        };

        // Seleccionar sprite y nombre según el contexto o datos pasados
        let enemyImg = enemyData?.img || enemySprites['default'];
        let enemyName = enemyData?.name || `Enemigo de Planta ${this.dungeonLevel}`;

        // Detectar palabras clave en la descripción para asignar el sprite visual correcto
        const descLower = (enemyData?.description || "").toLowerCase();
        if (descLower.includes('gárgola') || descLower.includes('estatua')) {
            enemyImg = 'img/gargola.png';
            enemyName = 'Estatua de Gárgola';
        } else if (descLower.includes('hechicero') || descLower.includes('nigromante') || descLower.includes('archimago')) {
            enemyImg = 'img/hechicero.png';
            enemyName = 'Hechicero Oscuro';
        } else if (descLower.includes('orco') || descLower.includes('veterano') || descLower.includes('caballero')) {
            enemyImg = 'img/guerrero.png';
            enemyName = 'Guerrero Corrupto';
        }

        // Atributos robustos del enemigo con DEF inicializada a 0
        this.currentEnemy = {
            name: enemyName,
            hp: 40 + (levelMultiplier * 18),
            maxHp: 40 + (levelMultiplier * 18),
            atk: 10 + (levelMultiplier * 2),
            shield: 0, // Soluciona el problema de "DEF: UNDEFINED"
            img: enemyImg
        };

        this.playerShield = 0;

        // Activar elementos visuales VS en la escena principal
        const enemyPortraitContainer = document.getElementById('enemyPortraitContainer');
        const vsBadge = document.getElementById('vsBadge');
        const enemyStatus = document.getElementById('enemyStatus');
        const enemySceneImg = document.getElementById('enemySceneImage');
        const enemyPortraitName = document.getElementById('enemyPortraitName');

        if (enemyPortraitContainer) enemyPortraitContainer.style.display = 'flex';
        if (vsBadge) vsBadge.style.display = 'inline';
        if (enemyStatus) enemyStatus.style.display = 'block';
        if (enemySceneImg) {
            enemySceneImg.src = this.currentEnemy.img;
            // Fallback por si la imagen específica no existe en la carpeta img/
            enemySceneImg.onerror = () => { enemySceneImg.src = 'img/guerrero.png'; };
        }
        if (enemyPortraitName) enemyPortraitName.textContent = this.currentEnemy.name;

        // Mostrar tablero TCG y ocultar opciones de rol
        const actionChoices = document.getElementById('actionChoices');
        const tcgCombatView = document.getElementById('tcgCombatView');
        if (actionChoices) actionChoices.style.display = 'none';
        if (tcgCombatView) tcgCombatView.style.display = 'flex';

        // Vincular botón de Fin de Turno
        const endTurnBtn = document.getElementById('endTurnTcgBtn');
        if (endTurnBtn) {
            endTurnBtn.onclick = () => this.executeEnemyTurn();
        }

        this.ui.logEvent(`⚔️ ¡ENTRAS EN COMBATE contra ${this.currentEnemy.name}!`);
        this.updateTcgUI();
        this.drawTcgHand();
    }

    // BASE DE DATOS DE CARTAS POR CLASE ESCALADAS POR NIVEL DEL JUGADOR
    getClassDeck() {
        const lvl = this.player.level; // Escalado por Nivel
        const cKey = this.player.classKey || 'warrior';

        const decks = {
            'warrior': [
                { id: 'strike', name: 'Golpe Demoledor', cost: 1, type: 'atk', val: 15 + (lvl * 5), img: 'img/estocada.png', desc: `Inflige ${15 + (lvl * 5)} daño físico` },
                { id: 'shield', name: 'Muro de Acero', cost: 1, type: 'def', val: 12 + (lvl * 4), img: 'img/escudo.png', desc: `Gana ${12 + (lvl * 4)} guardia` },
                { id: 'whirlwind', name: 'Torbellino', cost: 2, type: 'atk', val: 28 + (lvl * 8), img: 'img/guerrero.png', desc: `Inflige ${28 + (lvl * 8)} daño pesado` },
                { id: 'second_wind', name: 'Poción de Agallas', cost: 1, type: 'heal', val: 18 + (lvl * 3), img: 'img/pocion.png', desc: `Recupera ${18 + (lvl * 3)} HP` }
            ],
            'mage': [
                { id: 'fireball', name: 'Bola de Fuego', cost: 2, type: 'atk', val: 25 + (lvl * 7), img: 'img/bolaFuego.png', desc: `Inflige ${25 + (lvl * 7)} daño arcano` },
                { id: 'ice_barrier', name: 'Barrera de Hielo', cost: 1, type: 'def', val: 15 + (lvl * 5), img: 'img/maga.png', desc: `Gana ${15 + (lvl * 5)} guardia` },
                { id: 'arcane_missile', name: 'Proyectiles', cost: 1, type: 'atk', val: 16 + (lvl * 4), img: 'img/maga.png', desc: `Inflige ${16 + (lvl * 4)} daño rápido` },
                { id: 'mana_heal', name: 'Canalización', cost: 1, type: 'heal', val: 22 + (lvl * 4), img: 'img/maga.png', desc: `Sana ${22 + (lvl * 4)} HP` }
            ],
            'rogue': [
                { id: 'backstab', name: 'Puñalada', cost: 1, type: 'atk', val: 20 + (lvl * 6), img: 'img/picaro.png', desc: `Inflige ${20 + (lvl * 6)} daño crítico` },
                { id: 'evasion', name: 'Doble Paso', cost: 1, type: 'def', val: 14 + (lvl * 4), img: 'img/picaro.png', desc: `Gana ${14 + (lvl * 4)} esquiva/def` },
                { id: 'poison_blade', name: 'Hoja Envenenada', cost: 2, type: 'atk', val: 32 + (lvl * 8), img: 'img/picaro.png', desc: `Inflige ${32 + (lvl * 8)} daño venenoso` },
                { id: 'shadow_heal', name: 'Venda de Sombras', cost: 1, type: 'heal', val: 16 + (lvl * 3), img: 'img/picaro.png', desc: `Cura ${16 + (lvl * 3)} HP` }
            ]
        };

        return decks[cKey] || decks['warrior'];
    }

    drawTcgHand() {
        this.playerHand = [...this.getClassDeck()];
        this.renderHand();
    }

    playTcgCard(card, index) {
        if (this.player.mana < card.cost) {
            this.ui.logEvent(`❌ ¡Maná insuficiente para jugar ${card.name}!`);
            return;
        }

        this.audio.play('card');
        this.player.mana -= card.cost;

        if (card.type === 'atk') {
            // Aplicar daño primero al escudo del enemigo
            let remainingAtk = card.val;
            if (this.currentEnemy.shield > 0) {
                const absorbed = Math.min(this.currentEnemy.shield, remainingAtk);
                this.currentEnemy.shield -= absorbed;
                remainingAtk -= absorbed;
            }
            this.currentEnemy.hp -= remainingAtk;
            this.ui.logEvent(`🗡️ Usas ${card.name} e infliges ${card.val} de daño a ${this.currentEnemy.name}.`);
        } else if (card.type === 'def') {
            this.playerShield += card.val;
            this.ui.logEvent(`🛡️ Usas ${card.name} y obtienes ${card.val} de escudo.`);
        } else if (card.type === 'heal') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + card.val);
            this.ui.logEvent(`✨ Usas ${card.name} y restauras ${card.val} HP.`);
        }

        // Remover la carta jugada
        this.playerHand.splice(index, 1);
        this.renderHand();
        this.updateTcgUI();

        // Comprobar victoria TCG
        if (this.currentEnemy.hp <= 0) {
            this.winTcgCombat();
        }
    }

    // TURNO DEL ENEMIGO
    executeEnemyTurn() {
        if (!this.currentEnemy || this.currentEnemy.hp <= 0) return;

        this.ui.logEvent(`⏳ Fin de tu turno. ¡${this.currentEnemy.name} contraataca!`);
        this.audio.play('hit');

        // Cálculo de daño recibido (absorbido por el escudo del jugador)
        let incomingDmg = this.currentEnemy.atk;
        if (this.playerShield > 0) {
            const absorbed = Math.min(this.playerShield, incomingDmg);
            this.playerShield -= absorbed;
            incomingDmg -= absorbed;
            this.ui.logEvent(`🛡️ Tu guardia absorbió ${absorbed} de daño.`);
        }

        if (incomingDmg > 0) {
            this.player.health -= incomingDmg;
            this.ui.logEvent(`💥 Recibes ${incomingDmg} de daño del enemigo.`);
        }

        // Reiniciar maná para el nuevo turno del jugador
        this.player.mana = this.player.maxMana;
        this.playerShield = 0; // Se resetea la guardia por turno

        // Comprobar derrota del jugador
        if (this.player.health <= 0) {
            this.ui.showGameOver();
            return;
        }

        // Robar nueva mano
        this.drawTcgHand();
        this.updateTcgUI();
    }

    winTcgCombat() {
        this.audio.play('sega');
        this.ui.logEvent(`🏆 ¡Has derrotado a ${this.currentEnemy.name}!`);

        // Recompensas RPG
        this.player.addGold(100 + (this.dungeonLevel * 15));
        const leveledUp = this.player.addXp(60);

        if (leveledUp) {
            this.ui.logEvent(`🌟 ¡SUBIDA DE NIVEL! Tus cartas ahora hacen más daño/defensa.`);
        }

        // Ocultar visuales del combate
        document.getElementById('enemyPortraitContainer').style.display = 'none';
        document.getElementById('vsBadge').style.display = 'none';
        document.getElementById('enemyStatus').style.display = 'none';
        document.getElementById('tcgCombatView').style.display = 'none';

        // Volver al modo RPG
        document.getElementById('actionChoices').style.display = 'flex';
        this.dungeonLevel++;
        this.loadNextExplorationEvent();
    }

    updateTcgUI() {
        document.getElementById('enemyName').textContent = this.currentEnemy.name;
        document.getElementById('enemyHp').textContent = `❤️ HP: ${Math.max(0, this.currentEnemy.hp)}/${this.currentEnemy.maxHp}`;
        document.getElementById('enemyAtk').textContent = `⚔️ ATK: ${this.currentEnemy.atk}`;
        document.getElementById('enemyShield').textContent = `🛡️ DEF: ${this.currentEnemy.shield}`;
        this.ui.updateStats(this.player, this.dungeonLevel);
    }










    async handleExplorationChoice(action) {
        this.audio.play('card');

        // Si la respuesta conversacional desata un combate de cartas TCG
        if (action === 'combat') {
            this.ui.logEvent(`⚔️ ¡La conversación ha terminado en desafío!`);
            this.startTcgCombat({
                name: `Enemigo de Planta ${this.dungeonLevel}`,
                hp: 40 + (this.dungeonLevel * 15),
                maxHp: 40 + (this.dungeonLevel * 15),
                atk: 10 + (this.dungeonLevel * 2)
            });
            return;
        }

        // Lógica de Tirada D20 para acciones de habilidad
        const d20 = Math.floor(Math.random() * 20) + 1;
        const d20Box = document.getElementById('d20Overlay');
        const d20Val = document.getElementById('d20Val');

        if (d20Box && d20Val) {
            d20Val.textContent = d20;
            d20Box.style.display = 'flex';
        }

        if (action === 'buy') {
            if (this.player.gold >= 40) {
                this.player.gold -= 40;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 35);
                this.ui.logEvent(`💰 Compras suministros (-40 Oro). Recuperas 35 HP.`);
            } else {
                this.ui.logEvent(`❌ No tienes suficiente oro para el trato.`);
            }
        } else if (action === 'pass') {
            this.ui.logEvent(`🏃 Te retiras con cautela sin llamar la atención.`);
        } else {
            // Chequeo D20 (Fuerza / Magia)
            if (d20 >= 9) {
                const xpGain = 45;
                const leveledUp = this.player.addXp(xpGain);
                this.player.addGold(80);
                this.ui.logEvent(`🎲 [Tirada D20: ${d20}] ¡ÉXITO NARRATIVO! +80 Oro, +${xpGain} XP.`);
                if (leveledUp) this.ui.logEvent(`🌟 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);
            } else {
                this.audio.play('hit');
                this.player.health -= 20;
                this.ui.logEvent(`🎲 [Tirada D20: ${d20}] ¡FALLO DE HABILIDAD! Sufres 20 de daño.`);
            }
        }

        this.ui.updateStats(this.player, this.dungeonLevel);

        if (this.player.health <= 0) {
            this.ui.showGameOver();
            return;
        }

        this.dungeonLevel++;
        await new Promise(r => setTimeout(r, 1400));
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