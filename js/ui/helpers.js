// js/ui/helpers.js
// Utilidades pequeñas compartidas por varios módulos.

/** Cambia el texto de un elemento por su id (no hace nada si no existe). */
export function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/** Pausa asíncrona: `await wait(900)`. */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
