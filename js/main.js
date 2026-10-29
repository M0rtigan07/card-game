import { AudioManager } from './audio.js';
import { Player } from './models/Player.js';
import { UIManager } from './ui/UIManager.js';
import { GroqAI } from './systems/GroqAI.js';
import { NPC_DATABASE } from './data/npcs.js';
import { ExplorationView } from './views/ExplorationView.js';
import { TcgCombatView } from './views/TcgCombatView.js';
import { EnemyBrain, describeCard, effectiveAtk } from './systems/EnemyAI.js';
import { PlayerDeck, instantiateCard, resolvePlayerCard, rollRewards, tickPoison } from './systems/JugadorCards.js';
import { STARTER_DECKS, REWARD_CONFIG } from './data/cardCatalog.js';

const FALLBACK_IMG = 'img/guerrero.png';
const MAX_NAME_LENGTH = 10;
const HAND_SIZE = 5;           // cartas que robas cada turno
const MAX_HAND_SIZE = 8;       // tope de mano con efectos de robar
const ENERGY_PER_TURN = 3;     // energía para jugar cartas cada turno (sube con player.energyBonus)
const ENEMY_REVEAL_MS = 900;   // pausa enseñando la carta enemiga
const ENEMY_RESOLVE_MS = 900;  // pausa viendo su efecto antes de tu turno

const HERO_IMAGES = {
    warrior: 'img/guerrero.png',
    mage: 'img/maga.png',
    rogue: 'img/picaro.png'
};

// Imagen de escena según el npcType que devuelve el backend
const ENCOUNTER_IMAGES = {
    warrior: 'img/veterano.jpg',
    mage: 'img/mage.jpg',
    rogue: 'img/gargola.png',
    automata: 'img/automata.jpg'
};
const DEFAULT_ENCOUNTER_IMAGE = 'img/guerreroCorrupto.png';

// Enemigos genéricos: se elige el primero cuyo texto clave aparezca en la descripción
const GENERIC_ENEMIES = [
    { keys: ['autómata', 'automata'], name: 'Autómata de Bronce', img: 'img/automata.jpg', deckId: 'automata' },
    { keys: ['orco'], name: 'Capitán Orco', img: 'img/jefe_orco_hacha.jpg', deckId: 'orco' },
    { keys: ['gárgola', 'gargola', 'estatua'], name: 'Estatua de Gárgola', img: 'img/gargola.png', deckId: 'gargola' },
    { keys: ['hechicero', 'nigromante', 'mago', 'archimaga', 'devorador'], name: 'Hechicero Oscuro', img: 'img/hechicero.jpg', deckId: 'hechicero' },
    { keys: ['dragón', 'dragon'], name: 'Dragón Anciano', img: 'img/dragon.png', deckId: 'dragon' }
];
const DEFAULT_ENEMY = { name: 'Guerrero Corrupto', img: 'img/guerreroCorrupto.png', deckId: 'corrupto' };

// Qué imagen del NPC se muestra según la acción elegida
const NPC_MOOD_BY_ACTION = {
    combat: 'enraged',
    pass: 'enraged',
    flirt_challenge: 'seductive',
    morgana_romance: 'romance',
    morgana_romance_warrior: 'romance'
};

const NPC_TOLLS = { morgana: 60 };
const DEFAULT_TOLL = 50;
const POISON_COST = 40;

class Game {
    constructor() {
        this.audio = new AudioManager();
        this.groq = new GroqAI();
        this.ui = new UIManager();

        this.currentEnemy = null;
        this.playerHand = [];
        this.deck = null;           // PlayerDeck: tu colección de cartas (crece con las recompensas)
        this.playerShield = 0;
        this.playerPoison = null;   // { dmg, turns } mientras estés envenenado
        this.brain = null;          // mazo e intención del enemigo actual
        this.turnBusy = false;      // true mientras juega el enemigo
        this.energy = 0;            // energía que te queda este turno

        this.player = null;
        this.playerName = 'HÉROE';
        this.nameDraft = '';
        this.dungeonLevel = 1;

        this.initEvents();
    }

    // ───────────── ARRANQUE Y MENÚS ─────────────

    initEvents() {
        document.getElementById('btnPressStart').addEventListener('click', () => {
            this.audio.play('sega');

            const savedHeroName = localStorage.getItem('mazo_hero_name');
            if (savedHeroName) {
                this.playerName = savedHeroName;
                this.ui.showScreen('charScreen');
            } else {
                this.ui.showScreen('nameEntryScreen');
                this.initNameKeyboard();
            }
        });

        document.getElementById('btnConfirmName')?.addEventListener('click', () => {
            const name = this.nameDraft.trim();
            if (!name) return; // evita guardar un nombre vacío
            this.playerName = name;
            localStorage.setItem('mazo_hero_name', name);
            this.audio.play('card');
            this.ui.showScreen('charScreen');
        });

        document.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', () => {
                const classKey = /** @type {HTMLElement} */ (card).dataset.class;
                this.selectCharacter(classKey).catch(err => console.error(err));
            });
        });

        document.getElementById('btnEnterDungeon').addEventListener('click', () => {
            this.audio.play('sega');
            this.ui.showScreen('gameScreen');
            this.startMainGame();
        });
    }

    initNameKeyboard() {
        const display = document.getElementById('typedHeroName');
        this.nameDraft = 'HERO';
        display.textContent = this.nameDraft;

        const keys = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.cv-key'));
        keys.forEach(key => {
            key.onclick = () => {
                this.audio.play('card');
                const val = key.textContent;

                if (val === '⌫') {
                    this.nameDraft = this.nameDraft.slice(0, -1);
                } else if (this.nameDraft.length < MAX_NAME_LENGTH) {
                    this.nameDraft += val;
                }
                display.textContent = this.nameDraft || '_';
            };
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

        this.playerName = localStorage.getItem('mazo_hero_name') || this.playerName;
        this.player.name = this.playerName;
        this.player.img = HERO_IMAGES[classKey] || HERO_IMAGES.warrior;
        this.deck = new PlayerDeck(STARTER_DECKS[classKey] || STARTER_DECKS.warrior);

        this.setText('heroClassTag', this.playerName.toUpperCase());
        this.setText('introHeroTitle', `${this.playerName} - ${this.player.className.toUpperCase()}`);

        // 'introHeroImg' = pantalla de historia, 'sidebarHeroImg' = hoja de héroe
        ['introHeroImg', 'sidebarHeroImg'].forEach(id => {
            const img = /** @type {HTMLImageElement | null} */ (document.getElementById(id));
            if (img) img.src = this.player.img;
        });

        this.ui.showScreen('introScreen');
        this.ui.typewriterIntro(`LOS DESTINOS SE ALINEAN PARA ${this.playerName}...`);

        const story = await this.groq.generateCharacterLore(this.player.className);
        this.ui.typewriterIntro(story.toUpperCase());
    }

    async startMainGame() {
        this.dungeonLevel = 1;
        this.ui.updateStats(this.player, this.dungeonLevel);
        this.ui.logEvent(`🐉 ¡${this.player.className} entra en la Planta ${this.dungeonLevel}!`);
        await this.loadNextExplorationEvent();
    }

    // ───────────── HELPERS DE ESCENA ─────────────

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    renderExploration() {
        const view = new ExplorationView(document.getElementById('mainContent'), this);
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

    // Pasa a la siguiente planta tras una pausa (para dar tiempo a leer)
    advanceFloor(delay = 1800) {
        this.dungeonLevel++;
        setTimeout(() => this.loadNextExplorationEvent(), delay);
    }

    // Cierre común de un encuentro: refresca stats, comprueba muerte y avanza
    finishEncounter(delay) {
        this.ui.updateStats(this.player, this.dungeonLevel);
        if (this.player.health <= 0) {
            this.ui.showGameOver();
            return;
        }
        this.advanceFloor(delay);
    }

    rollD20() {
        return Math.floor(Math.random() * 20) + 1;
    }

    // Cuadro de diálogo flotante tipo Monkey Island (textContent: el texto viene de la IA)
    showDialogueOverlay(speakerName, text) {
        document.getElementById('monkeyIslandDialogue')?.remove();

        const box = document.createElement('div');
        box.id = 'monkeyIslandDialogue';
        box.className = 'monkey-dialogue-box';

        const speaker = document.createElement('b');
        speaker.textContent = `${speakerName.toUpperCase()}:`;
        box.append(speaker, ` "${text}"`);

        document.getElementById('mainContent').appendChild(box);
    }

    // ───────────── EXPLORACIÓN PROCEDURAL ─────────────

    async loadNextExplorationEvent() {
        // 1. PNJ fijo de planta (Barnaby, Valerius, Morgana, Astrid, Batu Jan)
        const npcKey = Object.keys(NPC_DATABASE).find(k => NPC_DATABASE[k].dungeonLevel === this.dungeonLevel);
        if (npcKey) {
            return this.triggerNpcEvent(npcKey);
        }

        // 2. Encuentro procedural del backend (plantas sin PNJ fijo)
        const view = this.renderExploration();
        view.setNarrative("Escuchando los pasos en la penumbra...", []);

        const eventData = await this.groq.generateExploration(this.player.className, this.dungeonLevel);

        if (!eventData) {
            view.setNarrative(
                `Avanzas con cautela por los oscuros corredores de la Planta ${this.dungeonLevel}.`,
                [{ text: "Avanzar hacia la siguiente sala", callback: () => { this.lockChoices(); this.advanceFloor(0); } }]
            );
            return;
        }

        this.setSceneImage(ENCOUNTER_IMAGES[eventData.npcType] || DEFAULT_ENCOUNTER_IMAGE);
        this.setText('sceneBadgeOverlay', `ENCUENTRO - PLANTA ${this.dungeonLevel}`);

        view.setNarrative(
            eventData.description,
            eventData.choices.map(choice => ({
                text: choice.text,
                callback: () => {
                    this.lockChoices();
                    return this.handleExplorationChoice(choice.action, eventData);
                }
            }))
        );
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

    triggerNpcEvent(npcKey) {
        const npc = NPC_DATABASE[npcKey];
        if (!npc) return;

        const view = this.renderExploration();
        this.setSceneImage(npc.images?.room);
        this.setText('sceneBadgeOverlay', npc.name.toUpperCase());

        const interaction = this.getNpcInteraction(npc);

        view.setNarrative(
            interaction.greeting || `Te encuentras con ${npc.name}.`,
            interaction.choices.map(choice => ({
                text: choice.text,
                callback: () => this.onNpcChoice(npc, choice)
            }))
        );

        this.ui.logEvent(`👁️ Te encuentras cara a cara con ${npc.name}.`);
    }

    async onNpcChoice(npc, choice) {
        this.lockChoices();

        const mood = NPC_MOOD_BY_ACTION[choice.action] || 'talk';
        this.setSceneImage(npc.images?.[mood] || npc.images?.talk || npc.images?.room);

        // Barnaby ofendido responde con frase fija, sin gastar una llamada a la IA
        if (npc.id === 'barnaby' && choice.action === 'pass') {
            this.handleNpcChoice(npc, 'pass');
            return;
        }

        const reply = await this.groq.generateNpcDialogue(npc, choice.text, this.player.className);
        this.showDialogueOverlay(npc.name, reply);

        setTimeout(() => this.handleNpcChoice(npc, choice.action), 2200);
    }

    handleNpcChoice(npc, action) {
        this.audio.play('card');

        const actions = {
            combat: () => this.startNpcCombat(npc),
            buy: () => this.payToll(npc),
            pass: () => this.leaveNpc(npc),

            pact_accept: () => {
                this.ui.logEvent(`🤝 Sellas un pacto con ${npc.name}. Obtienes información y riquezas (+200 oro).`);
                this.player.addGold(200);
                this.finishEncounter(1800);
            },

            flirt_challenge: () => {
                this.ui.logEvent(`✨ ${this.playerName} deslumbra a ${npc.name} con un despliegue de magia arcana.`);
                this.grantXp(80);
                this.finishEncounter(1800);
            },

            morgana_romance: () => this.morganaRomance(),
            morgana_romance_warrior: () => this.morganaRomance(),

            witch_knowledge: () => {
                this.ui.logEvent(`📖 ${npc.name} comparte un conocimiento prohibido contigo (+50 XP).`);
                this.grantXp(50);
                this.finishEncounter(1800);
            },

            buy_poison: () => {
                if (this.player.gold >= POISON_COST) {
                    this.player.gold -= POISON_COST;
                    this.player.attackBonus = (this.player.attackBonus || 0) + 5;
                    this.player.inventory.push({ name: '🧪 Veneno de Filo', effect: '+5 daño en ataques' });
                    this.ui.logEvent(`🧪 Compras veneno (-${POISON_COST} Oro). Tus ataques hacen +5 de daño.`);
                } else {
                    this.ui.logEvent(`❌ No tienes suficiente oro para el veneno.`);
                }
                this.finishEncounter(2000);
            },

            buy_potion: () => {
                if (this.player.gold >= 30) {
                    this.player.gold -= 30;
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
                    this.showDialogueOverlay(npc.name, "¡Excelente elección, viajero! Volverás a visitarme.");
                    this.ui.logEvent(`🧪 Compras una poción a ${npc.name} (-30 Oro). Recuperas 40 HP.`);
                } else {
                    this.showDialogueOverlay(npc.name, "¿Pretendes engañarme? ¡No tienes suficiente oro!");
                    this.ui.logEvent(`❌ No tienes suficiente oro para comprar la poción.`);
                }
                this.finishEncounter(3500);
            },

            buy_mana: () => {
                if (this.player.gold >= 40) {
                    this.player.gold -= 40;
                    this.player.maxMana += 10;
                    this.player.mana = this.player.maxMana;
                    this.showDialogueOverlay(npc.name, "Un grimorio de poder... Que la magia te proteja.");
                    this.ui.logEvent(`🔮 Compras un grimorio a ${npc.name} (-40 Oro). ¡Maná máximo aumentado!`);
                } else {
                    this.showDialogueOverlay(npc.name, "Tus bolsillos están tan vacíos como tus conjuros.");
                    this.ui.logEvent(`❌ No tienes suficiente oro.`);
                }
                this.finishEncounter(3500);
            },

            steal: () => {
                const d20 = this.rollD20();
                if (d20 >= 10) {
                    this.player.addGold(60);
                    this.ui.logEvent(`🎲 [D20: ${d20}] ¡Robo perfecto! Te llevas 60 de oro sin que ${npc.name} se entere.`);
                } else {
                    this.audio.play('hit');
                    this.player.health -= 15;
                    this.setSceneImage(npc.images?.enraged || npc.images?.talk);
                    this.showDialogueOverlay(npc.name, "¡LADRÓN! ¡Toma esto por tu osadía!");
                    this.ui.logEvent(`🎲 [D20: ${d20}] ¡Te descubren! Recibes 15 de daño.`);
                }
                this.finishEncounter(3000);
            }
        };

        const run = actions[action];
        if (!run) {
            // Acción desconocida: se avisa y se avanza para no bloquear el juego
            console.warn(`[Game] Acción de PNJ sin manejar: "${action}" (${npc.id})`);
            this.finishEncounter(1200);
            return;
        }
        run();
    }

    grantXp(amount) {
        if (this.player.addXp(amount)) {
            this.ui.logEvent(`🌟 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);
        }
    }

    morganaRomance() {
        this.ui.logEvent(`🖤 Sellar un vínculo oscuro con la Bruja Morgana llena tu espíritu de un poder prohibido.`);
        this.player.addGold(100);
        this.player.inventory.push({ name: '🧪 Poción de Subsistencia', effect: '+20 HP Máximo' });
        this.player.maxHealth += 20;
        this.player.health = this.player.maxHealth;
        this.finishEncounter(1800);
    }

    payToll(npc) {
        const toll = NPC_TOLLS[npc.id] ?? DEFAULT_TOLL;

        if (this.player.gold >= toll) {
            this.player.gold -= toll;
            this.ui.logEvent(`💰 Entregas ${toll} GP a ${npc.name}. Te permite el paso sin sangre.`);
            this.finishEncounter(1400);
        } else {
            this.ui.logEvent(`❌ No tienes suficiente oro. ¡${npc.name} se impacienta!`);
            this.startNpcCombat(npc);
        }
    }

    leaveNpc(npc) {
        if (npc.id === 'barnaby') {
            this.showDialogueOverlay(npc.name, "¡Bah, tacaño ingrato! ¡Que la oscuridad te devore en el próximo pasillo!");
            this.ui.logEvent(`💢 Barnaby se enfada al ver que ignoras su mercancía.`);
            this.finishEncounter(3500);
        } else {
            this.ui.logEvent(`🏃 Te retiras con cautela sin llamar la atención.`);
            this.finishEncounter(1200);
        }
    }

    startNpcCombat(npc) {
        this.ui.logEvent(`⚔️ ¡Desafías a ${npc.name}! Desenfundan sus cartas.`);
        const hp = npc.baseHp + (this.dungeonLevel * 10);

        this.startTcgCombat({
            name: npc.name,
            hp,
            maxHp: hp,
            atk: npc.baseAtk,
            img: npc.images?.enraged || npc.images?.room,
            deckId: npc.id
        });
    }

    // ───────────── COMBATE TCG ─────────────

    startTcgCombat(enemyData = {}) {
        const lvl = this.dungeonLevel;

        if (enemyData.name && enemyData.hp) {
            // PNJ con stats propios: se respetan nombre, vida, ataque, imagen y mazo
            this.currentEnemy = {
                name: enemyData.name,
                hp: enemyData.hp,
                maxHp: enemyData.maxHp ?? enemyData.hp,
                atk: enemyData.atk,
                shield: 0,
                img: enemyData.img || FALLBACK_IMG,
                deckId: enemyData.deckId
            };
        } else {
            // Enemigo genérico: se deduce por la descripción del encuentro
            const text = (enemyData.description || document.getElementById('explorationText')?.textContent || '').toLowerCase();
            const template = GENERIC_ENEMIES.find(t => t.keys.some(k => text.includes(k))) || DEFAULT_ENEMY;

            this.currentEnemy = {
                name: template.name,
                hp: 40 + (lvl * 18),
                maxHp: 40 + (lvl * 18),
                atk: 10 + (lvl * 2),
                shield: 0,
                img: template.img,
                deckId: template.deckId
            };
        }

        this.playerShield = 0;
        this.playerPoison = null;
        this.turnBusy = false;
        this.brain = new EnemyBrain(this.currentEnemy.deckId);
        this.brain.drawIntent(this.currentEnemy, { poison: null });
        this.energy = this.getMaxEnergy();
        this.deck.startCombat();
        this.playerHand = [];

        const tcgView = new TcgCombatView(document.getElementById('mainContent'), this);
        tcgView.render(this.currentEnemy, this.player);

        const endTurnBtn = document.getElementById('endTurnTcgBtn');
        if (endTurnBtn) endTurnBtn.onclick = () => this.executeEnemyTurn();

        this.ui.logEvent(`⚔️ ¡ENTRAS EN COMBATE contra ${this.currentEnemy.name}!`);
        this.renderEnemyIntent();
        this.updateTcgUI();
        this.drawTcgHand();
    }

    // ───────────── MAZO Y MANO DEL JUGADOR ─────────────

    // Lo que no jugaste va al descarte y se roba una mano nueva
    drawTcgHand() {
        this.playerHand.forEach(card => this.deck.discard(card.id));
        this.playerHand = this.deck.draw(HAND_SIZE).map(id => instantiateCard(id, this.player.level));
        this.renderHand();
    }

    // Efecto "robar": añade cartas a la mano (con un máximo) sin repartir una mano nueva
    drawExtraCards(amount) {
        const room = Math.max(0, MAX_HAND_SIZE - this.playerHand.length);
        const ids = this.deck.draw(Math.min(amount, room));
        this.playerHand.push(...ids.map(id => instantiateCard(id, this.player.level)));
    }

    buildCardElement(card) {
        const el = document.createElement('div');
        el.className = `tcg-card rarity-${card.rarity}`;
        el.innerHTML = `
            <div class="cost-gem">${card.cost}</div>
            <img src="${card.img}" alt="${card.name}" class="tcg-card-img" onerror="this.src='img/guerrero.png'">
            <span class="title">${card.name}</span>
            <span class="desc">${card.desc}</span>
        `;
        return el;
    }

    renderHand() {
        const handContainer = document.getElementById('playerHand');
        if (!handContainer) return;

        handContainer.innerHTML = '';

        this.playerHand.forEach((card, index) => {
            const cardEl = this.buildCardElement(card);
            if (card.cost > this.energy) cardEl.classList.add('unplayable');

            const rotation = (index - (this.playerHand.length - 1) / 2) * 4;
            cardEl.style.transform = `rotate(${rotation}deg)`;

            cardEl.addEventListener('click', () => this.playTcgCard(card, index));
            handContainer.appendChild(cardEl);
        });
    }

    playTcgCard(card, index) {
        if (this.turnBusy || !this.currentEnemy || this.currentEnemy.hp <= 0 || this.player.health <= 0) return;
        if (this.energy < card.cost) {
            this.ui.logEvent(`⚡ Energía insuficiente para jugar ${card.name}.`);
            return;
        }

        this.audio.play('card');
        this.energy -= card.cost;
        const enemy = this.currentEnemy;

        const hero = { health: this.player.health, maxHealth: this.player.maxHealth, shield: this.playerShield };
        const events = resolvePlayerCard(card, enemy, hero, { attackBonus: this.player.attackBonus || 0 });
        this.player.health = hero.health;
        this.playerShield = hero.shield;

        this.narratePlayerEvents(card, events);

        // La carta jugada va al descarte; después se aplican los efectos que tocan mano y energía
        this.playerHand.splice(index, 1);
        this.deck.discard(card.id);
        for (const ev of events) {
            if (ev.kind === 'energy') this.energy += ev.amount;
            if (ev.kind === 'draw') this.drawExtraCards(ev.amount);
        }

        this.renderHand();
        this.updateTcgUI();

        if (enemy.hp <= 0) {
            this.winTcgCombat();
        }
    }

    // Cuenta qué ha hecho tu carta (diario, números flotantes)
    narratePlayerEvents(card, events) {
        const enemy = this.currentEnemy;

        for (const ev of events) {
            switch (ev.kind) {
                case 'damage':
                    this.ui.logEvent(`🗡️ ${card.name}: infliges ${ev.dealt} de daño a ${enemy.name}.`);
                    if (ev.absorbed > 0) this.ui.logEvent(`🛡️ El escudo de ${enemy.name} absorbe ${ev.absorbed}.`);
                    this.floatText('enemyPortraitContainer', ev.dealt > 0 ? `-${ev.dealt}` : '🛡️', ev.dealt > 0 ? 'dmg' : 'shield');
                    this.shake('enemyPortraitContainer');
                    break;
                case 'heal':
                    this.ui.logEvent(`✨ ${card.name}: restauras ${ev.amount} HP.`);
                    this.floatText('heroPortraitContainer', `+${ev.amount}`, 'heal');
                    break;
                case 'shield':
                    this.ui.logEvent(`🛡️ ${card.name}: obtienes ${ev.amount} de escudo.`);
                    this.floatText('heroPortraitContainer', `+${ev.amount}`, 'shield');
                    break;
                case 'poison':
                    this.ui.logEvent(`☠️ ${card.name}: ${enemy.name} sufrirá ${ev.dmg} de daño durante ${ev.turns} turnos.`);
                    this.floatText('enemyPortraitContainer', '☠️', 'poison');
                    break;
                case 'energy':
                    this.ui.logEvent(`⚡ ${card.name}: ganas ${ev.amount} de energía.`);
                    this.floatText('heroPortraitContainer', `⚡ +${ev.amount}`, 'buff');
                    break;
                case 'draw':
                    this.ui.logEvent(`📜 ${card.name}: robas ${ev.amount} cartas.`);
                    break;
            }
        }
    }

    // Tras ganar un combate eliges 1 de 3 cartas para tu mazo (o las saltas por oro)
    showCardReward() {
        return new Promise(resolve => {
            const ids = rollRewards({
                classKey: this.player.classKey,
                owned: this.deck.collection,
                level: this.dungeonLevel
            });
            if (ids.length === 0) {
                resolve();
                return;
            }

            const overlay = document.createElement('div');
            overlay.className = 'reward-overlay';

            const title = document.createElement('div');
            title.className = 'reward-title';
            title.textContent = 'ELIGE UNA CARTA PARA TU MAZO';

            const row = document.createElement('div');
            row.className = 'reward-row';

            const close = () => {
                overlay.remove();
                resolve();
            };

            const RARITY_LABEL = { common: 'COMÚN', uncommon: 'POCO COMÚN', rare: 'RARA' };

            ids.forEach(id => {
                const card = instantiateCard(id, this.player.level);
                const el = this.buildCardElement(card);
                el.classList.add('reward-card');

                const tag = document.createElement('span');
                tag.className = 'rarity-tag';
                tag.textContent = RARITY_LABEL[card.rarity] || '';
                el.appendChild(tag);

                el.addEventListener('click', () => {
                    this.audio.play('sega');
                    this.deck.addCard(id);
                    this.ui.logEvent(`🃏 Añades ${card.name} a tu mazo (${this.deck.counts.total} cartas).`);
                    close();
                }, { once: true });

                row.appendChild(el);
            });

            const skip = document.createElement('button');
            skip.className = 'fantasy-btn reward-skip';
            skip.textContent = `Saltar (+${REWARD_CONFIG.skipGold} oro)`;
            skip.addEventListener('click', () => {
                this.player.addGold(REWARD_CONFIG.skipGold);
                this.ui.logEvent(`💰 Renuncias a la carta y te quedas ${REWARD_CONFIG.skipGold} de oro.`);
                this.ui.updateStats(this.player, this.dungeonLevel);
                close();
            }, { once: true });

            overlay.append(title, row, skip);
            document.body.appendChild(overlay);
        });
    }

    // ───────────── TURNO ENEMIGO ─────────────

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Bloquea o desbloquea el botón de fin de turno y la mano mientras juega el enemigo
    setCombatControls(enabled) {
        const btn = /** @type {HTMLButtonElement | null} */ (document.getElementById('endTurnTcgBtn'));
        if (btn) btn.disabled = !enabled;
        document.getElementById('playerHand')?.classList.toggle('locked', !enabled);
    }

    // Números flotantes sobre un retrato (-12, +8, 🛡️...)
    floatText(containerId, text, kind) {
        const host = document.getElementById(containerId);
        if (!host) return;
        const el = document.createElement('span');
        el.className = `float-text float-${kind}`;
        el.textContent = text;
        host.appendChild(el);
        setTimeout(() => el.remove(), 1100);
    }

    shake(containerId) {
        const host = document.getElementById(containerId);
        if (!host) return;
        host.classList.remove('hit-shake');
        void host.offsetWidth; // reinicia la animación si se repite
        host.classList.add('hit-shake');
        setTimeout(() => host.classList.remove('hit-shake'), 450);
    }

    // Muestra la carta que el enemigo jugará (o está jugando) con sus números reales
    renderEnemyIntent(playing = false) {
        const host = document.getElementById('enemyIntent');
        if (!host) return;
        host.replaceChildren();

        const card = this.brain?.intent;
        if (!card) return;

        const box = document.createElement('div');
        box.className = `enemy-intent-card intent-${card.type}${playing ? ' playing' : ''}`;

        const head = document.createElement('div');
        head.className = 'intent-head';
        const label = document.createElement('span');
        label.textContent = playing ? '¡JUEGA!' : 'PRÓXIMA JUGADA';
        const deckLeft = document.createElement('span');
        deckLeft.textContent = `🃏 ${this.brain.cardsLeft}`;
        head.append(label, deckLeft);

        const name = document.createElement('b');
        name.className = 'intent-name';
        name.textContent = card.name;

        const desc = document.createElement('span');
        desc.className = 'intent-desc';
        desc.textContent = describeCard(card, this.currentEnemy);

        box.append(head, name, desc);
        host.appendChild(box);
    }

    getMaxEnergy() {
        return ENERGY_PER_TURN + (this.player.energyBonus || 0);
    }

    // Barra de energía: un rayo por punto, apagado si ya lo has gastado
    renderEnergy() {
        const host = document.getElementById('energyBar');
        if (!host) return;
        host.replaceChildren();

        const label = document.createElement('span');
        label.className = 'energy-label';
        label.textContent = 'ENERGÍA';
        host.appendChild(label);

        const max = this.getMaxEnergy();
        for (let i = 0; i < max; i++) {
            const pip = document.createElement('span');
            pip.className = `energy-pip${i < this.energy ? ' full' : ''}`;
            pip.textContent = '⚡';
            host.appendChild(pip);
        }

        const { drawPile, discardPile } = this.deck.counts;
        const info = document.createElement('span');
        info.className = 'energy-deck';
        info.textContent = `🃏 Mazo ${drawPile}  ·  ♻️ Descarte ${discardPile}`;
        host.appendChild(info);
    }

    // Estados del jugador en combate: guardia y veneno
    renderCombatStatus() {
        const host = document.getElementById('combatStatusLine');
        if (!host) return;

        const parts = [];
        if (this.playerShield > 0) parts.push(`🛡️ Guardia ${this.playerShield}`);
        if (this.playerPoison) parts.push(`☠️ Veneno ${this.playerPoison.dmg} x ${this.playerPoison.turns} turnos`);
        if (this.currentEnemy?.poison) parts.push(`☠️ ${this.currentEnemy.name} envenenado ${this.currentEnemy.poison.dmg} x ${this.currentEnemy.poison.turns}`);
        host.textContent = parts.join('   ·   ');
    }

    // Cuenta al jugador qué ha hecho la carta enemiga (diario, sonido y números flotantes)
    narrateEnemyEvents(events) {
        const enemy = this.currentEnemy;

        for (const ev of events) {
            switch (ev.kind) {
                case 'damage': {
                    const hits = ev.hits > 1 ? ` en ${ev.hits} golpes` : '';
                    if (ev.absorbed > 0) this.ui.logEvent(`🛡️ Tu guardia absorbe ${ev.absorbed} de daño.`);
                    if (ev.dealt > 0) {
                        this.audio.play('hit');
                        this.ui.logEvent(`💥 Recibes ${ev.dealt} de daño${hits}.`);
                        this.floatText('heroPortraitContainer', `-${ev.dealt}`, 'dmg');
                        this.shake('heroPortraitContainer');
                    } else {
                        this.ui.logEvent(`🛡️ ¡Bloqueas todo el daño!`);
                        this.floatText('heroPortraitContainer', '🛡️', 'shield');
                    }
                    break;
                }
                case 'shield':
                    this.ui.logEvent(`🛡️ ${enemy.name} se protege con ${ev.amount} de escudo.`);
                    this.floatText('enemyPortraitContainer', `+${ev.amount}`, 'shield');
                    break;
                case 'heal':
                    this.ui.logEvent(`💚 ${enemy.name} recupera ${ev.amount} de vida.`);
                    this.floatText('enemyPortraitContainer', `+${ev.amount}`, 'heal');
                    break;
                case 'poison':
                    this.ui.logEvent(`☠️ ¡Te envenena! ${ev.dmg} de daño durante ${ev.turns} turnos.`);
                    this.floatText('heroPortraitContainer', '☠️', 'poison');
                    break;
                case 'buff':
                    this.ui.logEvent(`🔥 El ataque de ${enemy.name} sube +${ev.amount}.`);
                    this.floatText('enemyPortraitContainer', `ATK +${ev.amount}`, 'buff');
                    break;
            }
        }
    }

    async executeEnemyTurn() {
        const enemy = this.currentEnemy;
        if (this.turnBusy || !enemy || !this.brain || enemy.hp <= 0 || this.player.health <= 0) return;

        this.turnBusy = true;
        this.setCombatControls(false);

        enemy.shield = 0; // su escudo solo dura hasta que le toca jugar otra vez

        const poisonDmg = tickPoison(enemy);
        if (poisonDmg > 0) {
            this.audio.play('hit');
            this.ui.logEvent(`☠️ El veneno hace ${poisonDmg} de daño a ${enemy.name}.`);
            this.floatText('enemyPortraitContainer', `-${poisonDmg}`, 'poison');
            this.shake('enemyPortraitContainer');
            this.updateTcgUI();

            if (enemy.hp <= 0) {
                this.winTcgCombat();
                return;
            }
            await this.wait(700);
        }
        this.updateTcgUI();

        const card = this.brain.intent;
        this.ui.logEvent(`⏳ Fin de tu turno. ¡${enemy.name} juega ${card.name}!`);
        this.audio.play('card');
        this.renderEnemyIntent(true);
        await this.wait(ENEMY_REVEAL_MS);

        const hero = { health: this.player.health, shield: this.playerShield, poison: this.playerPoison };
        const { events } = this.brain.play(enemy, hero);
        this.player.health = hero.health;
        this.playerShield = hero.shield;
        this.playerPoison = hero.poison;

        this.narrateEnemyEvents(events);
        this.updateTcgUI();
        await this.wait(ENEMY_RESOLVE_MS);

        if (this.player.health <= 0) {
            this.ui.showGameOver();
            return;
        }
        this.startPlayerTurn();
    }

    startPlayerTurn() {
        this.playerShield = 0;

        if (this.playerPoison) {
            const { dmg } = this.playerPoison;
            this.player.health -= dmg;
            this.playerPoison.turns -= 1;
            if (this.playerPoison.turns <= 0) this.playerPoison = null;

            this.audio.play('hit');
            this.ui.logEvent(`☠️ El veneno te causa ${dmg} de daño.`);
            this.floatText('heroPortraitContainer', `-${dmg}`, 'poison');
            this.shake('heroPortraitContainer');

            if (this.player.health <= 0) {
                this.updateTcgUI();
                this.ui.showGameOver();
                return;
            }
        }

        this.energy = this.getMaxEnergy();
        this.brain.drawIntent(this.currentEnemy, { poison: this.playerPoison });
        this.renderEnemyIntent();
        this.drawTcgHand();
        this.updateTcgUI();

        this.turnBusy = false;
        this.setCombatControls(true);
    }

    async winTcgCombat() {
        this.turnBusy = true; // bloquea clics mientras dura la animación de victoria
        this.audio.play('sega');
        this.ui.logEvent(`🏆 ¡Has derrotado a ${this.currentEnemy.name}!`);

        this.player.addGold(100 + (this.dungeonLevel * 15));
        const leveledUp = this.player.addXp(60);

        if (leveledUp) {
            this.ui.logEvent(`🌟 ¡SUBIDA DE NIVEL! Tus cartas ahora hacen más daño/defensa.`);
        }

        const victoryModal = document.getElementById('victoryAnimationModal');
        if (victoryModal) {
            victoryModal.style.display = 'flex';
        }

        await new Promise(r => setTimeout(r, 3000));

        if (victoryModal) {
            victoryModal.style.display = 'none';
        }

        await this.showCardReward();

        this.dungeonLevel++;

        // Volvemos a inicializar la vista de exploración estándar en el contenedor central
        const mainContent = document.getElementById('mainContent');
        const explorationView = new ExplorationView(mainContent, this);
        explorationView.render();

        await this.loadNextExplorationEvent();
    }

    updateTcgUI() {
        document.getElementById('enemyName').textContent = this.currentEnemy.name;
        document.getElementById('enemyHp').textContent = `❤️ HP: ${Math.max(0, this.currentEnemy.hp)}/${this.currentEnemy.maxHp}`;
        const bonus = this.currentEnemy.atkBonus ? ` (+${this.currentEnemy.atkBonus})` : '';
        document.getElementById('enemyAtk').textContent = `⚔️ ATK: ${effectiveAtk(this.currentEnemy)}${bonus}`;
        document.getElementById('enemyShield').textContent = `🛡️ DEF: ${this.currentEnemy.shield}`;
        this.renderEnergy();
        this.renderCombatStatus();
        this.ui.updateStats(this.player, this.dungeonLevel);
    }

    async handleExplorationChoice(action, eventData) {
        this.audio.play('card');

        if (action === 'combat') {
            this.ui.logEvent(`⚔️ ¡La conversación ha terminado en desafío!`);
            this.startTcgCombat(eventData);
            return;
        }

        const d20 = Math.floor(Math.random() * 20) + 1;
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
                this.ui.logEvent(`💰 Compras suministros (-40 Oro). Recuperas 35 HP.`);
            } else {
                this.ui.logEvent(`❌ No tienes suficiente oro para el trato.`);
            }
        } else if (action === 'pass') {
            this.ui.logEvent(`🏃 Te retiras con cautela sin llamar la atención.`);
        } else {
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
    const game = new Game();
    /** @type {any} */ (window).game = game; // UIManager lo lee para mostrar el nombre del héroe
    try {
        await game.initGame();
    } catch (err) {
        console.error(err);
    }
});