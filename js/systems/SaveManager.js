import { Player } from '../models/Player.js';
import { PlayerDeck } from './JugadorCards.js';
import { StoryManager } from '../stories/StoryManager.js';

const SAVE_KEY = 'mazo_game_save_v1';
export const DARK_WORLD_SCENE_KEY = 'mundo_oscuro_scene_v1';

export function hasSavedGame() {
    return Boolean(localStorage.getItem(SAVE_KEY));
}

export function clearSavedGame() {
    localStorage.removeItem(SAVE_KEY);
}

export function saveGame(game) {
    if (!game?.player || !game.deck) return false;

    let darkWorldScene = null;
    try {
        const raw = localStorage.getItem(DARK_WORLD_SCENE_KEY);
        darkWorldScene = raw ? JSON.parse(raw) : null;
    } catch (error) {
        darkWorldScene = null;
    }

    const save = {
        version: 1,
        savedAt: new Date().toISOString(),
        playerName: game.playerName,
        dungeonLevel: game.dungeonLevel,
        player: { ...game.player },
        deck: {
            cards: [...game.deck.cards],
            drawPile: [...game.deck.drawPile],
            discardPile: [...game.deck.discardPile]
        },
        party: {
            recruited: game.party.recruited.map(ally => ({ ...ally })),
            activeIds: game.party.active.map(ally => ally.id)
        },
        storyState: game.player.storyState ? JSON.parse(JSON.stringify(game.player.storyState)) : {},
        darkWorldScene
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
}

export function loadSavedGame(game) {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    let save;
    try {
        save = JSON.parse(raw);
    } catch (error) {
        localStorage.removeItem(SAVE_KEY);
        return false;
    }
    if (!save?.player || !save?.deck || !save?.party) return false;

    game.playerName = save.playerName || localStorage.getItem('mazo_hero_name') || 'HÉROE';
    localStorage.setItem('mazo_hero_name', game.playerName);
    game.dungeonLevel = Number.isInteger(save.dungeonLevel) && save.dungeonLevel > 0
        ? save.dungeonLevel
        : 1;
    game.player = Object.assign(new Player(save.player.classKey), save.player);
    game.player.name = game.playerName;
    game.storyManager = new StoryManager(game.player);
    if (!game.deck) {
        game.deck = new PlayerDeck(save.deck.cards);
    }
    game.deck.cards = Array.isArray(save.deck.cards) ? [...save.deck.cards] : [];
    game.deck.drawPile = Array.isArray(save.deck.drawPile) ? [...save.deck.drawPile] : [];
    game.deck.discardPile = Array.isArray(save.deck.discardPile) ? [...save.deck.discardPile] : [];

    game.party.recruited = [];
    game.party.active = [];
    for (const savedAlly of save.party.recruited) {
        const result = game.party.recruit(savedAlly.id);
        if (!result.ok) continue;
        Object.assign(result.ally, savedAlly, {
            ability: { ...result.ally.ability, ...savedAlly.ability }
        });
        if (save.party.activeIds.includes(savedAlly.id)) {
            game.party.activate(savedAlly.id);
        }
    }

    game.player.storyState = save.storyState || {};
    game.ui.updateStats(game.player, game.dungeonLevel);
    return true;
}
