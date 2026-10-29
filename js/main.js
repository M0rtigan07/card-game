// js/main.js
// Punto de entrada: crea el juego cuando la página está lista.

import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    /** @type {any} */ (window).game = game; // UIManager lo lee para mostrar el nombre del héroe

    try {
        await game.initGame();
    } catch (err) {
        console.error(err);
    }
});
