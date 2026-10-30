// js/data/gameConfig.js
// Constantes del juego. Para ajustar el equilibrio, casi todo se toca aquí.

export const FALLBACK_IMG = 'img/guerrero.png';
export const MAX_NAME_LENGTH = 10;

export const COMBAT = {
    HAND_SIZE: 5,          // cartas que robas cada turno
    MAX_HAND_SIZE: 8,      // tope de mano con efectos de robar
    ENERGY_PER_TURN: 3,    // energía base para jugar cartas cada turno (las reliquias pueden sumar más)
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
    {
        keys: ['autómata', 'automata'], id: 'automata', deckId: 'automata', name: 'Autómata de Bronce', img: 'img/automata.jpg',
        archetype: 'un autómata de bronce guardián de la mazmorra, frío y sin emociones',
        voice: 'Habla como una máquina: frases cortas y técnicas, sin emoción, con palabras como "protocolo", "objetivo", "unidad" y "probabilidad".'
    },
    {
        keys: ['orco'], id: 'orco', deckId: 'orco', name: 'Capitán Orco', img: 'img/jefe_orco_hacha.jpg',
        archetype: 'el Capitán Orco, un bruto de guerra salvaje, glotón y de poca inteligencia',
        voice: 'Habla en tercera persona ("Orco aplasta") con gramática muy simple y primitiva. Grita mucho y mezcla amenazas con hambre.'
    },
    {
        keys: ['gárgola', 'gargola', 'estatua'], id: 'gargola', deckId: 'gargola', name: 'Estatua de Gárgola', img: 'img/gargola.png',
        archetype: 'una gárgola de piedra milenaria, paciente, antigua y solemne',
        voice: 'Voz lenta y solemne. Habla de siglos, de piedra, de polvo y de ruinas. Frases pausadas y con peso.'
    },
    {
        keys: ['hechicero', 'nigromante', 'mago', 'archimaga', 'devorador'], id: 'hechicero', deckId: 'hechicero', name: 'Hechicero Oscuro', img: 'img/hechicero.jpg',
        archetype: 'un hechicero oscuro erudito, arrogante y obsesionado con el conocimiento arcano',
        voice: 'Condescendiente y pedante, con jerga académica ("hipótesis", "ecuación", "experimento"). Trata al héroe como a un ignorante.'
    },
    {
        keys: ['dragón', 'dragon'], id: 'dragon', deckId: 'dragon', name: 'Dragón Anciano', img: 'img/dragon.png',
        archetype: 'un dragón anciano y majestuoso, orgulloso y dueño de un tesoro inmenso',
        voice: 'Grandilocuente y solemne. Llama "hormiga" o "pequeña criatura" al héroe. Habla de fuego, de eras, de imperios caídos y de su tesoro.'
    }
];
export const DEFAULT_ENEMY = {
    id: 'corrupto', deckId: 'corrupto', name: 'Guerrero Corrupto', img: 'img/guerreroCorrupto.png',
    archetype: 'un caballero caído y corrompido por la mazmorra, amargado y sin esperanza',
    voice: 'Voz grave y cansada de soldado. Habla de juramentos rotos, del reino perdido y del acero. Amargo, con frases secas.'
};

// Qué imagen del PNJ se muestra según la acción elegida
export const NPC_MOOD_BY_ACTION = {
    combat: 'enraged',
    pass: 'enraged',
    flirt_challenge: 'seductive',
    morgana_romance: 'romance',
    morgana_romance_warrior: 'romance'
};

// Frases de los PNJ y de los enemigos generadas por Groq
export const DIALOGUE = {
    MEMORY_LINES: 6,           // últimas frases de cada personaje que se recuerdan (y se piden no repetir)
    CARD_LINE_CHANCE: 0.75,    // probabilidad de que el enemigo grite al jugar una carta
    HURT_THRESHOLD: 0.4,       // por debajo de esta proporción de vida protesta al verse herido (una vez por combate)
    CARD_LINE_WAIT_MS: 1200,   // máximo que se espera a un grito que aún no ha llegado
    SPEECH_VISIBLE_MS: 5000,   // cuánto se ve la frase del enemigo en pantalla
    TIMEOUT_MS: {              // tiempo máximo esperando a Groq antes de usar una frase de respaldo
        greeting: 4000,
        reaction: 6000,
        outcome: 3500,
        combat_start: 2500,
        combat_card: 4000,
        combat_hurt: 2500,
        combat_defeat: 3000,
        combat_victory: 2500
    }
};

// Economía de los PNJ
export const NPC_TOLLS = { morgana: 60 };
export const DEFAULT_TOLL = 50;
