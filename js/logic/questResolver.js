// js/logic/questResolver.js

/**
 * Procesa la elección del jugador en un encuentro de historia.
 * @param {Object} choice - La opción seleccionada por el jugador.
 * @param {String} storyId - ID de la historia (ej. "monjeLoco").
 * @param {Object} player - El objeto global del jugador / gameState.
 */
export function resolveStoryChoice(choice, storyId, player) {
    if (!player.storyProgress) {
        player.storyProgress = {};
    }

    // 1. Si elige ignorar la historia (-1) o avanzar de capítulo
    if (choice.nextChapter !== undefined) {
        player.storyProgress[storyId] = choice.nextChapter;
    }

    // 2. Aplicar Recompensas o Penalizaciones al jugador
    if (choice.reward) {
        // Modificación de Vida (HP)
        if (choice.reward.hp) {
            player.hp = Math.min(player.maxHp, player.hp + choice.reward.hp);
        }

        // Modificación de Oro
        if (choice.reward.gold) {
            player.gold = Math.max(0, player.gold + choice.reward.gold);
        }

        // Añadir Carta a la Baraja
        if (choice.reward.cardId) {
            if (!player.deck) player.deck = [];
            player.deck.push(choice.reward.cardId);
        }

        // Añadir Reliquia al Inventario
        if (choice.reward.relic) {
            if (!player.relics) player.relics = [];
            player.relics.push(choice.reward.relic);
        }
    }

    // 3. Registrar el mensaje en el Diario de Aventura de la UI
    if (choice.log && typeof addAdventureLog === 'function') {
        addAdventureLog(choice.log);
    }
}