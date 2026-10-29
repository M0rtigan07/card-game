// js/ui/NameEntry.js
// Teclado de la pantalla "Name Entry" estilo Castlevania.

import { MAX_NAME_LENGTH } from '../data/gameConfig.js';

const DEFAULT_NAME = 'HERO';

export class NameEntry {
    /** @param {{ play: (sound: string) => void }} audio */
    constructor(audio) {
        this.audio = audio;
        this.draft = DEFAULT_NAME;
    }

    /** Prepara el teclado. Llamar al abrir la pantalla. */
    open() {
        const display = document.getElementById('typedHeroName');
        this.draft = DEFAULT_NAME;
        if (display) display.textContent = this.draft;

        const keys = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.cv-key'));
        keys.forEach(key => {
            key.onclick = () => {
                this.audio.play('card');
                const val = key.textContent;

                if (val === '⌫') {
                    this.draft = this.draft.slice(0, -1);
                } else if (this.draft.length < MAX_NAME_LENGTH) {
                    this.draft += val;
                }
                if (display) display.textContent = this.draft || '_';
            };
        });
    }

    /** Nombre listo para guardar ('' si está vacío). */
    get value() {
        return this.draft.trim();
    }
}
