// js/Game.js
// Núcleo del juego: estado general (héroe, mazo, planta), menús y paso de una planta a otra.
// El combate vive en systems/TcgCombat.js y lo que ocurre entre combates, en systems/Exploration.js.

import { AudioManager } from './audio.js';
import { Player } from './models/Player.js';
import { UIManager } from './ui/UIManager.js';
import { NameEntry } from './ui/NameEntry.js';
import { setText, wait } from './ui/helpers.js';
import { GroqAI } from './systems/GroqAI.js';
import { PlayerDeck } from './systems/JugadorCards.js';
import { TcgCombat } from './systems/TcgCombat.js';
import { Exploration } from './systems/Exploration.js';
import { NpcDialogue } from './systems/NpcDialogue.js';
import { NpcChat } from './systems/NpcChat.js';
import { Party } from './systems/Party.js';
import { PartyView } from './views/PartyView.js';
import { Persuasion } from './systems/Persuasion.js';
import { StoryManager } from './stories/StoryManager.js';
import { canUseItem, findEntry, getItem, removeOne } from './systems/Items.js';
import { STARTER_DECKS } from './data/cardCatalog.js';
import { HERO_IMAGES, PARTY } from './data/gameConfig.js';

export class Game {
    constructor() {
        this.audio = new AudioManager();
        this.groq = new GroqAI();
        this.ui = new UIManager();

        this.player = null;
        this.playerName = 'HÉROE';
        this.deck = null;           // PlayerDeck: tu colección de cartas (crece con las recompensas)
        this.dungeonLevel = 1;

        this.nameEntry = new NameEntry(this.audio);
        this.dialogue = new NpcDialogue(this);   // todo lo que dicen los PNJ (Groq + respaldo)
        this.chat = new NpcChat(this);           // conversaciones con PNJ estilo aventura gráfica

        this.party = new Party(this);

        this.ui.getParty = () => this.party.recruited;

        this.ui.onOpenParty = () => this.showPartyView();

        // aliados que te acompañan
        this.persuasion = new Persuasion();      // lo que llevas conseguido convenciendo a cada personaje
        this.ui.onDismissAlly = (id) => this.dismissAlly(id); // botón ✕ del panel "Grupo"
        this.combat = new TcgCombat(this);
        this.exploration = new Exploration(this);
        this.ui.onUseItem = (id) => this.useItem(id); // botón "Usar" del inventario

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
                this.nameEntry.open();
            }
        });

        document.getElementById('btnConfirmName')?.addEventListener('click', () => {
            const name = this.nameEntry.value;
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

    async initGame() {
        this.ui.setLoadingProgress(30, "FORJANDO HOJAS DE PERSONAJE...");
        await wait(800);

        this.ui.setLoadingProgress(70, "CARGANDO DADOS D20 Y PNJS...");
        await wait(1000);

        this.ui.setLoadingProgress(100, "¡MAZMORRA LISTA!");
        await wait(600);

        this.ui.showScreen('titleScreen');
    }

    async selectCharacter(classKey) {
        this.audio.play('card');
        this.player = new Player(classKey);
        this.storyManager = new StoryManager(this.player);

        this.playerName = localStorage.getItem('mazo_hero_name') || this.playerName;
        this.player.name = this.playerName;
        this.player.img = HERO_IMAGES[classKey] || HERO_IMAGES.warrior;
        this.deck = new PlayerDeck(STARTER_DECKS[classKey] || STARTER_DECKS.warrior);

        setText('heroClassTag', this.playerName.toUpperCase());
        setText('introHeroTitle', `${this.playerName} - ${this.player.className.toUpperCase()}`);

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
        await this.loadNextEvent();
    }

    showPartyView() {

        const recruited =
            this.party.recruited;

        const activeIds =
            this.party.active.map(
                ally => ally.id
            );

        const activeText =
            this.party.active.length
                ? this.party.active
                    .map(a => `✅ ${a.name}`)
                    .join('\n')
                : 'Sin compañeros activos';

        const recruitText =
            recruited
                .filter(
                    ally =>
                        !activeIds.includes(
                            ally.id
                        )
                )
                .map(
                    ally => `➕ ${ally.name}`
                )
                .join('\n');

        alert(

            `═══════════════════

GRUPO

═══════════════════

ACTIVOS

${activeText}

═══════════════════

RECLUTADOS

${recruitText}

═══════════════════`

        );

    }

    showPartyCharacter(id) {

        const ally =
            this.party.recruited.find(
                a => a.id === id
            );

        if (!ally) {
            return;
        }

        ally.status =
            ally.status ?? "camp";

        const inBattle =
            ally.status === "battle";

        const inCamp =
            ally.status === "camp";

        const onMission =
            ally.status === "mission";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

        <div class="party-detail">

            <div class="party-detail-header">

                <h1>
                    ${ally.name}
                </h1>

            </div>

            <div class="party-detail-layout">

                <div class="party-detail-image">

                    <img
                        src="${ally.card}"
                        alt="${ally.name}"
                    >

                </div>

                <div class="party-detail-info">

                    <h2>
                        ${ally.role ?? "Aventurero"}
                    </h2>

                    <div class="party-detail-section party-detail-ability">

                        <h3>
                            ⚔️ Habilidad
                        </h3>

                        <p>
                            ${ally.ability.name}
                        </p>

                        <small>
                            ${ally.ability.text}
                        </small>

                    </div>

                    <div class="party-detail-section party-detail-status">

                        <h3>
                            📍 Destino actual
                        </h3>

                        <div class="party-status-selector">

                            <label class="party-status-option">

                                <input
                                    type="checkbox"
                                    id="battleCheck"
                                    ${inBattle ? "checked" : ""}
                                >

                                <span class="party-status-icon">
                                    ✓
                                </span>

                                <span class="party-status-label">

                                    <span class="party-status-title">

                                        ⚔️ Me acompaña en batalla

                                    </span>

                                    <span class="party-status-desc">

                                        Combatirá a tu lado.

                                    </span>

                                </span>

                            </label>

                            <label class="party-status-option">

                                <input
                                    type="checkbox"
                                    id="campCheck"
                                    ${inCamp ? "checked" : ""}
                                >

                                <span class="party-status-icon">
                                    ✓
                                </span>

                                <span class="party-status-label">

                                    <span class="party-status-title">

                                        🏕️ Permanece en el campamento

                                    </span>

                                    <span class="party-status-desc">

                                        Descansa y recupera fuerzas.

                                    </span>

                                </span>

                            </label>

                            <label class="party-status-option">

                                <input
                                    type="checkbox"
                                    id="missionCheck"
                                    ${onMission ? "checked" : ""}
                                >

                                <span class="party-status-icon">
                                    ✓
                                </span>

                                <span class="party-status-label">

                                    <span class="party-status-title">

                                        📜 De misión

                                    </span>

                                    <span class="party-status-desc">

                                        Atiende asuntos propios.

                                    </span>

                                </span>

                            </label>

                        </div>

                    </div>

                    <div class="party-detail-section party-detail-biography">

                        <h3>
                            📖 Biografía
                        </h3>

                        <p>

                            ${ally.bio ??
            "Todavía sabes poco sobre este personaje."
            }

                        </p>

                    </div>

                    <div class="party-detail-section party-detail-relationship">

                        <h3>
                            🤝 Relación
                        </h3>

                        <p>
                            Próximamente
                        </p>

                    </div>

                    <div class="party-detail-section party-detail-chat">

                        <h3>
                            💬 Conversar
                        </h3>

                        <p>
                            Próximamente
                        </p>

                    </div>

                </div>

            </div>

            <div class="party-detail-footer">

                <button
                    id="partyBackBtn"
                    class="party-return-btn"
                >

                    ⚔️ Regresar a la compañía

                </button>

            </div>

        </div>

    `;

        const battleCheck =
            document.getElementById(
                "battleCheck"
            );

        const campCheck =
            document.getElementById(
                "campCheck"
            );

        const missionCheck =
            document.getElementById(
                "missionCheck"
            );

        function refreshStatusVisuals() {

            document
                .querySelectorAll(
                    ".party-status-option"
                )
                .forEach(
                    el => el.classList.remove(
                        "active-status"
                    )
                );

            if (battleCheck.checked) {

                battleCheck
                    .closest(
                        ".party-status-option"
                    )
                    ?.classList.add(
                        "active-status"
                    );

            }

        }

        refreshStatusVisuals();

        battleCheck?.addEventListener(
            "change",
            () => {

                if (!battleCheck.checked) {

                    battleCheck.checked = true;

                    return;
                }

                const battleCount =
                    this.party.recruited.filter(
                        a =>
                            a.status ===
                            "battle"
                    ).length;

                if (
                    ally.status !== "battle"
                    &&
                    battleCount >= 2
                ) {

                    alert(
                        "⚔️ Solo dos compañeros pueden acompañarte en batalla."
                    );

                    battleCheck.checked = false;

                    return;
                }

                ally.status =
                    "battle";

                campCheck.checked =
                    false;

                missionCheck.checked =
                    false;

                refreshStatusVisuals();

            }
        );

        campCheck?.addEventListener(
            "change",
            () => {

                if (!campCheck.checked) {

                    campCheck.checked =
                        true;

                    return;
                }

                ally.status =
                    "camp";

                battleCheck.checked =
                    false;

                missionCheck.checked =
                    false;

                refreshStatusVisuals();

            }
        );

        missionCheck?.addEventListener(
            "change",
            () => {

                if (!missionCheck.checked) {

                    missionCheck.checked =
                        true;

                    return;
                }

                ally.status =
                    "mission";

                battleCheck.checked =
                    false;

                campCheck.checked =
                    false;

                refreshStatusVisuals();

            }
        );

        document
            .getElementById(
                "partyBackBtn"
            )
            ?.addEventListener(
                "click",
                () => this.showPartyView()
            );

    }

    // ───────────── FLUJO ENTRE PLANTAS ─────────────

    loadNextEvent() {
        return this.exploration.loadNext();
    }

    showPartyView() {

       

        const view =
            new PartyView(
                document.getElementById(
                    'mainContent'
                ),
                this
            );

        view.render();

    }

   
    


    // Pasa a la siguiente planta tras una pausa (para dar tiempo a leer)
    advanceFloor(delay = 1800) {
        this.dungeonLevel++;
        setTimeout(() => this.loadNextEvent(), delay);
    }

    /** Un personaje se une a tu grupo. Devuelve el resultado de Party.recruit. */
    recruitAlly(npcId) {

        const result = this.party.recruit(npcId);
        this.ui.logEvent(`🤝 ${result.ally.name} acepta acompañarte.`);


        if (this.player.addXp(PARTY.RECRUIT_XP)) this.ui.logEvent(`🌟 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${this.player.level}`);
        this.ui.updateStats(this.player, this.dungeonLevel);
        return result;
    }

    /** Un aliado deja tu grupo (hace sitio para otro). */
    dismissAlly(id) {
        const ally = this.party.recruited.find(member => member.id === id);
        if (!ally || !this.party.dismiss(id)) return false;

        this.ui.logEvent(`👋 ${ally.name} deja tu grupo.`);
        this.ui.updateStats(this.player, this.dungeonLevel);
        return true;
    }

    /** Usa un consumible del inventario, dentro o fuera de combate. Devuelve true si se ha gastado. */
    useItem(id) {
        const item = getItem(id);
        if (!item || item.kind !== 'consumable' || !findEntry(this.player, id)) return false;

        const inCombat = this.combat.inCombat;
        const check = canUseItem(item, { inCombat, player: this.player, poisoned: Boolean(this.combat.heroPoison) });
        if (!check.ok) {
            this.ui.logEvent(`❌ ${item.name}: ${check.reason}.`);
            return false;
        }

        if (inCombat) {
            if (!this.combat.useItem(item)) return false;
        } else {
            // Fuera de combate solo sirven las curas
            const healed = Math.min(item.card.value, this.player.maxHealth - this.player.health);
            this.player.health += healed;
            this.ui.logEvent(`🧪 Usas ${item.name}: recuperas ${healed} HP.`);
        }

        removeOne(this.player, id);
        this.ui.updateStats(this.player, this.dungeonLevel);
        return true;
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
}
