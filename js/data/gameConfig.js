// js/data/gameConfig.js
// Constantes del juego. Para ajustar el equilibrio, casi todo se toca aquí.

export const FALLBACK_IMG = 'img/guerrero.png';
export const MAX_NAME_LENGTH = 10;

export const COMBAT = {
    HAND_SIZE: 5,          // cartas que robas cada turno
    MAX_HAND_SIZE: 8,      // tope de mano con efectos de robar
    ENERGY_PER_TURN: 3,    // energía para jugar cartas cada turno (sube con player.energyBonus)
    ENEMY_REVEAL_MS: 900,  // pausa enseñando la carta enemiga
    ENEMY_RESOLVE_MS: 900, // pausa viendo su efecto antes de tu turno
    VICTORY_MS: 3000       // duración de la animación de victoria
};

export const HERO_IMAGES = {
    warrior: 'img/guerrero.png',
    mage: 'img/maga.png',
    rogue: 'img/picaro.png'
};

// Imagen de escena según el npcType que devuelve el backend
export const ENCOUNTER_IMAGES = {
    warrior: 'img/veterano.jpg',
    mage: 'img/mage.jpg',
    rogue: 'img/gargola.png',
    automata: 'img/automata.jpg'
};
export const DEFAULT_ENCOUNTER_IMAGE = 'img/guerreroCorrupto.png';

// Enemigos genéricos: se elige el primero cuyo texto clave aparezca en la descripción del encuentro
export const GENERIC_ENEMIES = [
    { keys: ['autómata', 'automata'], name: 'Autómata de Bronce', img: 'img/automata.jpg', deckId: 'automata' },
    { keys: ['orco'], name: 'Capitán Orco', img: 'img/jefe_orco_hacha.jpg', deckId: 'orco' },
    { keys: ['gárgola', 'gargola', 'estatua'], name: 'Estatua de Gárgola', img: 'img/gargola.png', deckId: 'gargola' },
    { keys: ['hechicero', 'nigromante', 'mago', 'archimaga', 'devorador'], name: 'Hechicero Oscuro', img: 'img/hechicero.jpg', deckId: 'hechicero' },
    { keys: ['dragón', 'dragon'], name: 'Dragón Anciano', img: 'img/dragon.png', deckId: 'dragon' }
];
export const DEFAULT_ENEMY = { name: 'Guerrero Corrupto', img: 'img/guerreroCorrupto.png', deckId: 'corrupto' };

// Qué imagen del PNJ se muestra según la acción elegida
export const NPC_MOOD_BY_ACTION = {
    combat: 'enraged',
    pass: 'enraged',
    flirt_challenge: 'seductive',
    morgana_romance: 'romance',
    morgana_romance_warrior: 'romance'
};

// Economía de los PNJ
export const NPC_TOLLS = { morgana: 60 };
export const DEFAULT_TOLL = 50;
export const POISON_COST = 40;
