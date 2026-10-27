import { AudioManager } from './audio.js';
import { Player } from './models/Player.js';
import { UIManager } from './ui/UIManager.js';
import { GroqAI } from './systems/GroqAI.js';
import { NPC_DATABASE } from './data/npcs.js';
import { ExplorationView } from './views/ExplorationView.js';
import { TcgCombatView } from './views/TcgCombatView.js';

class Game {
    constructor() {
        this.audio = new AudioManager();
        this.groq = new GroqAI();
        this.ui = new UIManager();

        this.currentEnemy = null;
        this.playerHand = [];
        this.playerShield = 0;

        this.player = null;
        this.dungeonLevel = 1;

        this.initEvents();
    }

    initEvents() {
        document.getElementById('btnPressStart').addEventListener('click', () => {
            this.audio.play('sega');

            // Comprobamos si ya tenemos un nombre guardado en LocalStorage
            const savedHeroName = localStorage.getItem('mazo_hero_name');

            if (savedHeroName) {
                // Si ya existe, nos saltamos el teclado y vamos a la selección de héroe
                this.playerName = savedHeroName;
                this.ui.showScreen('charScreen');
            } else {
                // Si es la primera vez, mostramos el teclado estilo Castlevania
                this.ui.showScreen('nameEntryScreen');
                this.initNameKeyboard();
            }
        });

        // Botón de confirmar nombre en la pantalla Castlevania
        const confirmBtn = document.getElementById('btnConfirmName');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const nameDisplay = document.getElementById('typedHeroName').textContent.trim();
                if (nameDisplay.length > 0) {
                    this.playerName = nameDisplay;
                    // Guardamos en la memoria del navegador
                    localStorage.setItem('mazo_hero_name', this.playerName);
                    this.audio.play('card');
                    this.ui.showScreen('charScreen');
                }
            });
        }

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

        // Cruceta de navegación RPG
        document.getElementById('btnUp')?.addEventListener('click', () => this.navigate('forward'));
        document.getElementById('btnLeft')?.addEventListener('click', () => this.navigate('turn_left'));
        document.getElementById('btnRight')?.addEventListener('click', () => this.navigate('turn_right'));
        document.getElementById('btnDown')?.addEventListener('click', () => this.navigate('back'));

    }

    initNameKeyboard() {
        const display = document.getElementById('typedHeroName');
        let currentName = "HERO";
        display.textContent = currentName;

        // Le damos funcionalidad a cada letra del teclado gótico
        document.querySelectorAll('.cv-key').forEach(key => {
            key.onclick = (e) => {
                this.audio.play('card');
                const val = e.target.textContent;

                if (val === '⌫') {
                    currentName = currentName.slice(0, -1);
                } else {
                    if (currentName.length < 10) {
                        currentName += val;
                    }
                }
                display.textContent = currentName || "_";
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

        // Recuperar el nombre personalizado de la memoria del navegador
        this.playerName = localStorage.getItem('mazo_hero_name') || "HÉROE";

        // Asignar el nombre personalizado a la instancia del jugador si tu modelo lo soporta
        this.player.name = this.playerName;

        // Actualizar la tarjeta con el nombre en el pie
        const heroTag = document.getElementById('heroClassTag');
        if (heroTag) {
            heroTag.textContent = this.playerName.toUpperCase();
        }

        const heroImages = {
            'warrior': 'img/guerrero.png',
            'mage': 'img/maga.png',
            'rogue': 'img/picaro.png'
        };

        this.player.img = heroImages[classKey] || heroImages['warrior'];

        const heroImgEl = document.getElementById('introHeroImg');
        const sceneImg = document.getElementById('sceneImage');
        if (heroImgEl) heroImgEl.src = this.player.img;
        if (sceneImg) sceneImg.src = this.player.img;

        // Mostrar la clase y el nombre personalizado en la pantalla de historia
        document.getElementById('introHeroTitle').textContent = `${this.playerName} - ${this.player.className.toUpperCase()}`;
        this.ui.showScreen('introScreen');
        this.ui.typewriterIntro(`LOS DESTINOS SE ALINEAN PARA ${this.playerName}...`);

        // Llamada a la IA pasando también el nombre personalizado para el lore
        const story = await this.groq.generateCharacterLore(this.player.className, this.playerName);
        this.ui.typewriterIntro(story.toUpperCase());
    }

    async startMainGame() {
        this.dungeonLevel = 1;

        // Garantizar que el visor muestra la imagen del héroe seleccionado
        const sceneImg = document.getElementById('sceneImage');
        if (sceneImg && this.player?.img) {
            sceneImg.src = this.player.img;
        } const mainContent = document.getElementById('mainContent');
        const explorationView = new ExplorationView(mainContent, this);

        // Renderizamos la vista modular en el centro
        explorationView.render();

        // Establecemos el primer evento de la mazmorra
        explorationView.setNarrative(
            "Te adentras en la fría oscuridad de la primera planta. Una estatua de gárgola parece observar cada uno de tus movimientos.",
            [
                {
                    text: "Examinar la estatua con cautela",
                    callback: () => console.log("Inspeccionando estatua...")
                },
                {
                    text: "Avanzar por el pasillo de la izquierda",
                    callback: () => console.log("Avanzando por el pasillo...")
                }
            ]
        );



        this.ui.updateStats(this.player, this.dungeonLevel);
        this.ui.logEvent(`🐉 ¡${this.player.className} entra en la Planta ${this.dungeonLevel}!`);
        await this.loadNextExplorationEvent();
    }

    async loadNextExplorationEvent() {
        document.getElementById('explorationText').textContent = "Escuchando los pasos en la penumbra...";

        // 1. Comprobar si hay un PNJ fijo de planta (Valerius, Barnaby, Morgana)
        const npcKey = Object.keys(NPC_DATABASE).find(key => NPC_DATABASE[key].dungeonLevel === this.dungeonLevel);
        if (npcKey) {
            this.triggerNpcEvent(npcKey);
            return;
        }

        // 2. Si no es un jefe de planta, pedimos el encuentro procedural al backend
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

            const mainContent = document.getElementById('mainContent');
            const explorationView = new ExplorationView(mainContent, this);
            explorationView.render();

            // --- AQUÍ ESTÁ EL TRUCO PARA LOS ENEMIGOS BÁSICOS ---
            const centralSceneImg = document.getElementById('centralSceneImage');
            if (centralSceneImg) {
                // Mapeamos el npcType que viene del dndEncounterDatabase a su imagen correspondiente
                const basicImages = {
                    'warrior': 'img/veterano.jpg',
                    'mage': 'img/mage.jpg',
                    'rogue': 'img/gargola.png'
                };
                centralSceneImg.src = basicImages[eventData.npcType] || 'img/guerreroCorrupto.png';
                centralSceneImg.onerror = () => { centralSceneImg.src = 'img/guerrero.png'; };
            }

            const sceneBadge = document.getElementById('sceneBadgeOverlay');
            if (sceneBadge) {
                sceneBadge.textContent = `ENCUENTRO - PLANTA ${this.dungeonLevel}`;
            }
            // -----------------------------------------------------

            explorationView.setNarrative(
                eventData.description,
                eventData.choices.map(c => ({
                    text: c.text,
                    callback: () => this.handleExplorationChoice(c.action, eventData)
                }))
            );
        } catch (err) {
            const mainContent = document.getElementById('mainContent');
            const explorationView = new ExplorationView(mainContent, this);
            explorationView.render();

            explorationView.setNarrative(
                `Avanzas con cautela por los oscuros corredores de la Planta ${this.dungeonLevel}.`,
                [
                    {
                        text: "Avanzar hacia la siguiente sala",
                        callback: () => {
                            this.dungeonLevel++;
                            this.loadNextExplorationEvent();
                        }
                    }
                ]
            );
        }
    }

    async triggerNpcEvent(npcKey) {
        const npc = NPC_DATABASE[npcKey];
        if (!npc) return;

        const mainContent = document.getElementById('mainContent');
        const explorationView = new ExplorationView(mainContent, this);
        explorationView.render();

        const sceneImg = document.getElementById('centralSceneImage');
        if (sceneImg) {
            sceneImg.src = npc.images?.room || npc.img;
            sceneImg.onerror = () => { sceneImg.src = 'img/guerrero.png'; };
        }

        const sceneBadge = document.getElementById('sceneBadgeOverlay');
        if (sceneBadge) {
            sceneBadge.textContent = npc.name.toUpperCase();
        }

        const playerClassKey = this.player.classKey || 'warrior';

        // --- BLINDAJE DE OPCIONES: Si no tiene interacciones específicas, usamos unas universales ---
        let interaction = npc.interactions?.[playerClassKey] || npc.interactions?.['warrior'];

        if (!interaction || !interaction.choices) {
            interaction = {
                greeting: `Te encuentras cara a cara con ${npc.name}. Su mirada atraviesa tu alma en la penumbra.`,
                choices: [
                    { text: "⚔️ \"Desenvaina tu acero, esto se va a resolver por las malas.\"", action: "combat" },
                    { text: "🤝 \"Hagamos un pacto o intercambiemos información.\"", action: "pact_accept" },
                    { text: "🚪 \"Retrocedo con sigilo y evito problemas.\"", action: "pass" }
                ]
            };
        }
        // ------------------------------------------------------------------------------------------

        const greetingText = interaction.greeting || `Te encuentras con ${npc.name}.`;

        explorationView.setNarrative(
            greetingText,
            interaction.choices.map(choice => ({
                text: choice.text,
                callback: async () => {
                    if (sceneImg && npc.images?.talk) {
                        sceneImg.src = npc.images.talk;
                    }

                    // Llamada segura a Groq para que responda a la opción elegida
                    const response = await fetch("/api/generate-lore", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: 'npc_interaction',
                            npc: npc.id,
                            npcName: npc.name,
                            npcArchetype: npc.archetype || "un misterioso habitante de las mazmorras",
                            className: this.player.className,
                            action: choice.text
                        })
                    });
                    const replyData = await response.json();

                    this.showDialogueOverlay(npc.name, replyData.description);

                    setTimeout(() => {
                        this.handleNpcChoice(npc, choice.action, interaction);
                    }, 2200);
                }
            }))
        );

        this.ui.logEvent(`👁️ Te encuentras cara a cara con ${npc.name}.`);
    }

    // Método auxiliar para pintar el cuadro de diálogo flotante tipo Monkey Island
    showDialogueOverlay(speakerName, text) {
        let existingBox = document.getElementById('monkeyIslandDialogue');
        if (existingBox) existingBox.remove();

        const box = document.createElement('div');
        box.id = 'monkeyIslandDialogue';
        box.className = 'monkey-dialogue-box';
        box.innerHTML = `<b>${speakerName.toUpperCase()}:</b> "${text}"`;

        document.getElementById('mainContent').appendChild(box);
    }

    handleNpcChoice(npc, action, interaction) {
        this.audio.play('card');

        // 1. ACEPTPAR EL ROMANCE / COQUETEO (MAGA ARCANA)
        if (action === 'romance_accept') {
            this.ui.logEvent(`🌹 ${this.playerName} acepta la copa del Conde Valerius. Se sella un pacto de sangre y fascinación.`);
            this.player.addGold(150);
            this.player.health = this.player.maxHealth; // Recuperación total por el elixir vampírico

            // Añadir objeto especial al inventario
            this.player.inventory.push({ name: '🍷 Elixir del Conde', effect: '+15 MP Permanente' });
            this.player.maxMana += 15;
            this.player.mana = this.player.maxMana;

            this.ui.updateStats(this.player, this.dungeonLevel);

            // Continuar exploración tras el encuentro romántico
            this.dungeonLevel++;
            setTimeout(() => this.loadNextExplorationEvent(), 1800);
            return;
        }

        // 2. RETAR CON COQUETEO (MAGA ARCANA)
        if (action === 'flirt_challenge') {
            this.ui.logEvent(`✨ ${this.playerName} deslumbra al Conde con un despliegue de magia arcana. Valerius sonríe fascinado.`);
            const xpGain = 80;
            const leveledUp = this.player.addXp(xpGain);
            if (leveledUp) this.ui.logEvent(`🌟 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);

            this.ui.updateStats(this.player, this.dungeonLevel);
            this.dungeonLevel++;
            setTimeout(() => this.loadNextExplorationEvent(), 1800);
            return;
        }

        // 3. ACEPTAR PACTO SOMBRÍO (PÍCARO)
        if (action === 'pact_accept') {
            this.ui.logEvent(`🤝 Sellas un acuerdo de sombras con ${npc.name}. Obtienes información y riquezas.`);
            this.player.addGold(200);
            this.ui.updateStats(this.player, this.dungeonLevel);
            this.dungeonLevel++;
            setTimeout(() => this.loadNextExplorationEvent(), 1800);
            return;
        }

        // 8. ACCIONES DE BARNABY EL BUHONERO (PLANTA 1)
        if (action === 'buy_potion') {
            if (this.player.gold >= 30) {
                this.player.gold -= 30;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
                this.ui.logEvent(`🧪 Compras una poción a Barnaby (-30 Oro). Recuperas 40 HP.`);
            } else {
                this.ui.logEvent(`❌ No tienes suficiente oro para comprar la poción.`);
            }
            this.ui.updateStats(this.player, this.dungeonLevel);
            this.dungeonLevel++;
            setTimeout(() => this.loadNextExplorationEvent(), 1400);
            return;
        }

        if (action === 'buy_mana') {
            if (this.player.gold >= 40) {
                this.player.gold -= 40;
                this.player.maxMana += 10;
                this.player.mana = this.player.maxMana;
                this.ui.logEvent(`🔮 Compras un grimorio a Barnaby (-40 Oro). ¡Maná máximo aumentado!`);
            } else {
                this.ui.logEvent(`❌ No tienes suficiente oro.`);
            }
            this.ui.updateStats(this.player, this.dungeonLevel);
            this.dungeonLevel++;
            setTimeout(() => this.loadNextExplorationEvent(), 1400);
            return;
        }

        if (action === 'pass') {
            // SI ES BARNABY Y PASAS DE LARGO, SE ENFADA
            if (npc.id === 'barnaby') {
                const sceneImg = document.getElementById('centralSceneImage');
                if (sceneImg) {
                    sceneImg.src = 'img/barnaby_enfado.png'; // O la ruta de tu imagen de enfado
                }
                this.showDialogueOverlay(npc.name, "¡Bah, tacaño ingrato! ¡Que la oscuridad te devore en el próximo pasillo!");
                this.ui.logEvent(`💢 Barnaby se enfada al ver que ignoras su mercancía.`);
            } else {
                this.ui.logEvent(`🏃 Te retiras con cautela sin llamar la atención.`);
            }

            this.dungeonLevel++;
            setTimeout(() => this.loadNextExplorationEvent(), 2200);
            return;
        }

        // 7. ROMANCE / PACTO CON LA BRUJA MORGANA
        if (action === 'morgana_romance' || action === 'morgana_romance_warrior') {
            this.ui.logEvent(`🖤 Sellar un vínculo oscuro con la Bruja Morgana llena tu espíritu de un poder prohibido.`);
            this.player.addGold(100);
            this.player.health = this.player.maxHealth;

            // Recompensa única de la bruja
            this.player.inventory.push({ name: '🧪 Poción de Subsistencia', effect: '+20 HP Máximo' });
            this.player.maxHealth += 20;
            this.player.health = this.player.maxHealth;

            this.ui.updateStats(this.player, this.dungeonLevel);

            this.dungeonLevel++;
            setTimeout(() => this.loadNextExplorationEvent(), 1800);
            return;
        }

        // 4. COMBATE TCG CONTRA EL CONDE
        if (action === 'combat') {
            this.ui.logEvent(`⚔️ ¡Desafías al ${npc.name}! Desenfundan sus cartas.`);

            // Iniciar combate cargando las estadísticas y mazo de Valerius
            this.startTcgCombat({
                name: npc.name,
                hp: npc.baseHp + (this.dungeonLevel * 10),
                maxHp: npc.baseHp + (this.dungeonLevel * 10),
                atk: npc.baseAtk,
                shield: 0,
                img: npc.img,
                deck: npc.deck
            });
            return;
        }

        // 5. COMPRA / SOBORNO (GUERRERO)
        if (action === 'buy') {
            if (this.player.gold >= 50) {
                this.player.gold -= 50;
                this.ui.logEvent(`💰 Entregas 50 GP al Conde Valerius. Te permite el paso sin sangre.`);
                this.ui.updateStats(this.player, this.dungeonLevel);
                this.dungeonLevel++;
                setTimeout(() => this.loadNextExplorationEvent(), 1400);
            } else {
                this.ui.logEvent(`❌ No tienes suficiente oro. ¡El Conde se impacienta!`);
                this.startTcgCombat({
                    name: npc.name,
                    hp: npc.baseHp,
                    maxHp: npc.baseHp,
                    atk: npc.baseAtk,
                    shield: 0,
                    img: npc.img
                });
            }
            return;
        }

        // 6. HUIR / PASAR
        if (action === 'pass') {
            this.ui.logEvent(`🏃 Te retiras con cautela antes de que el Conde decida atacarte.`);
            this.dungeonLevel++;
            setTimeout(() => this.loadNextExplorationEvent(), 1200);
        }
    }

    // INICIAR COMBATE TCG
    // INICIAR COMBATE TCG
    startTcgCombat(enemyData) {
        const levelMultiplier = this.dungeonLevel;

        let enemyImg = 'img/gargola.png';
        let enemyName = enemyData?.name || `Enemigo de Planta ${this.dungeonLevel}`;

        const descLower = (enemyData?.description || document.getElementById('explorationText').textContent || "").toLowerCase();
        if (descLower.includes('gárgola') || descLower.includes('estatua')) {
            enemyImg = 'img/gargola.png';
            enemyName = 'Estatua de Gárgola';
        } else if (descLower.includes('hechicero') || descLower.includes('nigromante') || descLower.includes('mago')) {
            enemyImg = 'img/hechicero.png';
            enemyName = 'Hechicero Oscuro';
        } else if (descLower.includes('dragón') || descLower.includes('dragon')) {
            enemyImg = 'img/dragon.png';
            enemyName = 'Dragón Anciano';
        } else {
            enemyImg = 'img/guerreroCorrupto.png';
            enemyName = 'Guerrero Corrupto';
        }

        this.currentEnemy = {
            name: enemyName,
            hp: 40 + (levelMultiplier * 18),
            maxHp: 40 + (levelMultiplier * 18),
            atk: 10 + (levelMultiplier * 2),
            shield: 0,
            img: enemyImg
        };

        this.playerShield = 0;

        // Elementos visuales del visor VS y estados
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
            enemySceneImg.onerror = () => { enemySceneImg.src = 'img/guerrero.png'; };
        }
        if (enemyPortraitName) enemyPortraitName.textContent = this.currentEnemy.name;

        // --- CAMBIO CLAVE: OCULTAR OPCIONES DE EXPLORACIÓN Y MOSTRAR TCG ---
        const mainContent = document.getElementById('mainContent');
        const tcgView = new TcgCombatView(mainContent, this);
        tcgView.render(this.currentEnemy, this.player);
        // -----------------------------------------------------------------

        const endTurnBtn = document.getElementById('endTurnTcgBtn');
        if (endTurnBtn) {
            endTurnBtn.onclick = () => this.executeEnemyTurn();
        }

        this.ui.logEvent(`⚔️ ¡ENTRAS EN COMBATE contra ${this.currentEnemy.name}!`);
        this.updateTcgUI();
        this.drawTcgHand();
    }

    getClassDeck() {
        const lvl = this.player.level;
        const cKey = this.player.classKey || 'warrior';

        const decks = {
            'warrior': [
                { id: 'strike', name: 'Golpe Demoledor', cost: 1, type: 'atk', val: 15 + (lvl * 5), img: 'img/estocada.png', desc: `Inflige ${15 + (lvl * 5)} daño físico` },
                { id: 'shield', name: 'Muro de Acero', cost: 1, type: 'def', val: 12 + (lvl * 4), img: 'img/escudo.png', desc: `Gana ${12 + (lvl * 4)} guardia` },
                { id: 'whirlwind', name: 'Torbellino', cost: 2, type: 'atk', val: 28 + (lvl * 8), img: 'img/guerrero.png', desc: `Inflige ${28 + (lvl * 8)} daño pesado` },
                { id: 'second_wind', name: 'Poción de Agallas', cost: 1, type: 'heal', val: 18 + (lvl * 3), img: 'img/pocion.png', desc: `Recupera ${18 + (lvl * 3)} HP` }
            ],
            'mage': [
                { id: 'fireball', name: 'Bola de Fuego', cost: 2, type: 'atk', val: 25 + (lvl * 7), img: 'img/bolafuego.png', desc: `Inflige ${25 + (lvl * 7)} daño arcano` },
                { id: 'ice_barrier', name: 'Barrera de Hielo', cost: 1, type: 'def', val: 15 + (lvl * 5), img: 'img/escudo.png', desc: `Gana ${15 + (lvl * 5)} guardia` },
                { id: 'arcane_missile', name: 'Proyectiles', cost: 1, type: 'atk', val: 16 + (lvl * 4), img: 'img/maga.png', desc: `Inflige ${16 + (lvl * 4)} daño rápido` },
                { id: 'mana_heal', name: 'Canalización', cost: 1, type: 'heal', val: 22 + (lvl * 4), img: 'img/pocion.png', desc: `Sana ${22 + (lvl * 4)} HP` }
            ],
            'rogue': [
                { id: 'backstab', name: 'Puñalada', cost: 1, type: 'atk', val: 20 + (lvl * 6), img: 'img/estocada.png', desc: `Inflige ${20 + (lvl * 6)} daño crítico` },
                { id: 'evasion', name: 'Doble Paso', cost: 1, type: 'def', val: 14 + (lvl * 4), img: 'img/escudo.png', desc: `Gana ${14 + (lvl * 4)} esquiva/def` },
                { id: 'poison_blade', name: 'Hoja Envenenada', cost: 2, type: 'atk', val: 32 + (lvl * 8), img: 'img/picaro.png', desc: `Inflige ${32 + (lvl * 8)} daño venenoso` },
                { id: 'shadow_heal', name: 'Venda de Sombras', cost: 1, type: 'heal', val: 16 + (lvl * 3), img: 'img/pocion.png', desc: `Cura ${16 + (lvl * 3)} HP` }
            ]
        };

        return decks[cKey] || decks['warrior'];
    }

    drawTcgHand() {
        this.playerHand = [...this.getClassDeck()];
        this.renderHand();
    }

    renderHand() {
        const handContainer = document.getElementById('playerHand');
        if (!handContainer) return;

        handContainer.innerHTML = '';

        this.playerHand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'tcg-card';

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

    playTcgCard(card, index) {
        if (this.player.mana < card.cost) {
            this.ui.logEvent(`❌ ¡Maná insuficiente para jugar ${card.name}!`);
            return;
        }

        this.audio.play('card');
        this.player.mana -= card.cost;

        if (card.type === 'atk') {
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

        this.playerHand.splice(index, 1);
        this.renderHand();
        this.updateTcgUI();

        if (this.currentEnemy.hp <= 0) {
            this.winTcgCombat();
        }
    }

    executeEnemyTurn() {
        if (!this.currentEnemy || this.currentEnemy.hp <= 0) return;

        this.audio.play('hit');

        // Definir baraja de cartas del enemigo según el tipo
        const enemyCards = [
            { name: '🔪 Zarpazo Furtivo', type: 'atk', val: this.currentEnemy.atk + 4, desc: 'Ataque rápido' },
            { name: '🛡️ Bloqueo Sombrío', type: 'def', val: 8, desc: 'Gana 8 de escudo' },
            { name: '🔥 Fulgor Oscuro', type: 'atk', val: this.currentEnemy.atk + 8, desc: 'Ataque pesado' }
        ];




        // La IA elige una carta aleatoria de su baraja
        const chosenCard = enemyCards[Math.floor(Math.random() * enemyCards.length)];

        let announcementEl = document.getElementById('enemyActionAnnouncement');
        if (announcementEl) {
            announcementEl.innerHTML = `⚡ <b>${this.currentEnemy.name}</b> despliega su carta: <span style="color:#ffd700;">[${chosenCard.name}]</span> - <i>${chosenCard.desc}</i>`;
        }

        this.ui.logEvent(`⏳ Fin de tu turno. ¡${this.currentEnemy.name} usa ${chosenCard.name}!`);

        let incomingDmg = 0;
        if (chosenCard.type === 'atk') {
            incomingDmg = chosenCard.val;
        } else if (chosenCard.type === 'def') {
            this.currentEnemy.shield += chosenCard.val;
            this.ui.logEvent(`🛡️ ${this.currentEnemy.name} se protege con ${chosenCard.val} de escudo.`);
        }

        // Aplicar escudo del jugador
        if (this.playerShield > 0 && incomingDmg > 0) {
            const absorbed = Math.min(this.playerShield, incomingDmg);
            this.playerShield -= absorbed;
            incomingDmg -= absorbed;
            this.ui.logEvent(`🛡️ Tu guardia absorbió ${absorbed} de daño.`);
        }

        if (incomingDmg > 0) {
            this.player.health -= incomingDmg;
            this.ui.logEvent(`💥 Recibes ${incomingDmg} de daño.`);
        }

        // Reiniciar maná y escudo del jugador para el nuevo turno
        this.player.mana = this.player.maxMana;
        this.playerShield = 0;

        if (this.player.health <= 0) {
            this.ui.showGameOver();
            return;
        }

        this.drawTcgHand();
        this.updateTcgUI();
    }

    async winTcgCombat() {
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
        document.getElementById('enemyAtk').textContent = `⚔️ ATK: ${this.currentEnemy.atk}`;
        document.getElementById('enemyShield').textContent = `🛡️ DEF: ${this.currentEnemy.shield}`;
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