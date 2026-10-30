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
import { STARTER_DECKS } from './data/cardCatalog.js';
import { HERO_IMAGES } from './data/gameConfig.js';

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
        this.combat = new TcgCombat(this);
        this.exploration = new Exploration(this);

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

    // ───────────── FLUJO ENTRE PLANTAS ─────────────

    loadNextEvent() {
        return this.exploration.loadNext();
    }

    // Pasa a la siguiente planta tras una pausa (para dar tiempo a leer)
    advanceFloor(delay = 1800) {
        this.dungeonLevel++;
        setTimeout(() => this.loadNextEvent(), delay);
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
