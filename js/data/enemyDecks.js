// js/data/enemyDecks.js
//
// Un mazo por enemigo. La clave es el id del PNJ (npcs.js) o el deckId de los
// enemigos genéricos (GENERIC_ENEMIES en main.js).
//
// Campos de cada carta:
//   name    Nombre con emoji (se muestra al jugador)
//   type    atk | multi | drain | def | heal | poison | buff
//   power   Multiplicador del ATK del enemigo (atk, multi, drain). 1.5 = 150 % de su ATK
//   val     Cantidad fija (def, heal, poison, buff)
//   hits    Nº de golpes (multi). Por defecto 2
//   leech   Fracción del daño que se cura (drain). Por defecto 1
//   turns   Duración del veneno (poison). Por defecto 3
//   copies  Copias en el mazo. Por defecto 1
//
// Como el daño depende del ATK del enemigo, los enemigos genéricos
// escalan solos con la planta (ATK = 10 + planta * 2).

export const DEFAULT_DECK_ID = 'corrupto';

export const ENEMY_DECKS = {
    // ───── PNJ con nombre ─────
    valerius: [ // Vampiro: roba vida, maldice y se esconde en la niebla
        { name: '🦇 Colmillo de Sombra', type: 'drain', power: 1.1, leech: 0.5, copies: 2 },
        { name: '🩸 Beso Carmesí', type: 'drain', power: 1.4, leech: 1 },
        { name: '🌫️ Niebla Espectral', type: 'def', val: 14, copies: 2 },
        { name: '🦇 Enjambre de Murciélagos', type: 'multi', power: 0.5, hits: 3 },
        { name: '🩸 Maldición de Sangre', type: 'poison', val: 5, turns: 3 }
    ],
    morgana: [ // Bruja: venenos y pociones
        { name: '🧪 Pócima Cáustica', type: 'atk', power: 1.4, copies: 2 },
        { name: '☠️ Veneno de Pantano', type: 'poison', val: 4, turns: 4, copies: 2 },
        { name: '🕸️ Velo de Brujería', type: 'def', val: 12 },
        { name: '🔮 Sorbo de Vida', type: 'drain', power: 0.9, leech: 1 }
    ],
    vikinga: [ // Guerrera: golpes pesados, escudo y furia que se acumula
        { name: '🪓 Hacha Nórdica', type: 'atk', power: 1.35, copies: 2 },
        { name: '🛡️ Muro de Escudos', type: 'def', val: 14, copies: 2 },
        { name: '🔥 Furia Berserker', type: 'buff', val: 4 },
        { name: '⚔️ Tormenta de Acero', type: 'multi', power: 0.85, hits: 2 }
    ],
    mongol: [ // Arquero: muchas flechas, veneno y puntería
        { name: '🏹 Flecha de la Estepa', type: 'atk', power: 1.3, copies: 2 },
        { name: '🏹 Lluvia de Flechas', type: 'multi', power: 0.5, hits: 4 },
        { name: '🐎 Manto de Arena', type: 'def', val: 10 },
        { name: '☠️ Flecha Envenenada', type: 'poison', val: 3, turns: 4 },
        { name: '🦅 Ojo del Halcón', type: 'buff', val: 3 }
    ],
    barnaby: [ // Buhonero: se defiende con lo que tiene a mano
        { name: '🧴 Frasco Arrojadizo', type: 'atk', power: 1.5 },
        { name: '🗡️ Navaja Oxidada', type: 'atk', power: 1.0, copies: 2 },
        { name: '📦 Parapeto de Cajas', type: 'def', val: 8 },
        { name: '🧪 Poción Barata', type: 'heal', val: 10 }
    ],

    // ───── Jefes (más cartas y más duras que las de un enemigo normal) ─────
    orco_jefe: [ // Brutal: golpes enormes y se cura con banquetes
        { name: '💥 Embestida Brutal', type: 'atk', power: 1.8, copies: 2 },
        { name: '🔥 Furia Orca', type: 'atk', power: 1.4, copies: 2 },
        { name: '🪓 Hachazo Doble', type: 'multi', power: 1.0, hits: 2 },
        { name: '😡 Rugido de Guerra', type: 'buff', val: 3 },
        { name: '🥩 Banquete de Horda', type: 'heal', val: 25 },
        { name: '🛡️ Escudo de Cráneos', type: 'def', val: 16 }
    ],
    vampira_jefa: [ // Roba vida, maldice y se esconde en las sombras
        { name: '🦇 Beso Sangriento', type: 'drain', power: 1.3, leech: 1, copies: 2 },
        { name: '🩸 Danza Carmesí', type: 'multi', power: 0.55, hits: 3 },
        { name: '🦇 Nube de Murciélagos', type: 'multi', power: 0.45, hits: 4 },
        { name: '🌫️ Velo de Sombras', type: 'def', val: 18 },
        { name: '🩸 Maldición Eterna', type: 'poison', val: 6, turns: 3 },
        { name: '💋 Hechizo de Seducción', type: 'buff', val: 3 }
    ],
    escorpiones_jefe: [ // Veneno y golpes rápidos
        { name: '🦂 Aguijón', type: 'atk', power: 1.6, copies: 2 },
        { name: '🗡️ Puñalada Doble', type: 'multi', power: 1.0, hits: 2, copies: 2 },
        { name: '🌑 Emboscada', type: 'atk', power: 2.2 },
        { name: '☠️ Veneno de Escorpión', type: 'poison', val: 7, turns: 3 },
        { name: '🛡️ Capa de Sombras', type: 'def', val: 15 }
    ],
    dragon_jefe: [ // Fuego devastador y escamas casi impenetrables
        { name: '🔥 Aliento Infernal', type: 'atk', power: 2.2, copies: 2 },
        { name: '🐲 Zarpazo Ancestral', type: 'multi', power: 1.1, hits: 2 },
        { name: '🌋 Lluvia de Fuego', type: 'multi', power: 0.8, hits: 3 },
        { name: '🛡️ Escamas de Obsidiana', type: 'def', val: 22 },
        { name: '🔥 Furia Ancestral', type: 'buff', val: 4 },
        { name: '💢 Rugido Aterrador', type: 'atk', power: 1.5 }
    ],

    // ───── Enemigos genéricos ─────
    corrupto: [
        { name: '🔪 Zarpazo Furtivo', type: 'atk', power: 1.3, copies: 2 },
        { name: '🔥 Fulgor Oscuro', type: 'atk', power: 1.7 },
        { name: '🛡️ Bloqueo Sombrío', type: 'def', val: 8 },
        { name: '😠 Grito de Guerra', type: 'buff', val: 2 }
    ],
    automata: [
        { name: '⚙️ Golpe de Pistón', type: 'atk', power: 1.5, copies: 2 },
        { name: '🔩 Placas de Bronce', type: 'def', val: 12, copies: 2 },
        { name: '⚡ Sobrecarga', type: 'buff', val: 3 },
        { name: '🔧 Autorreparación', type: 'heal', val: 14 }
    ],
    orco: [
        { name: '🪓 Hachazo', type: 'atk', power: 1.5, copies: 2 },
        { name: '💥 Embestida', type: 'atk', power: 2.0 },
        { name: '😡 Rugido', type: 'buff', val: 3 },
        { name: '🪵 Escudo de Tronco', type: 'def', val: 10 },
        { name: '🥩 Festín Orco', type: 'heal', val: 12 }
    ],
    gargola: [
        { name: '🗿 Garra de Piedra', type: 'atk', power: 1.3, copies: 2 },
        { name: '🪨 Piel de Roca', type: 'def', val: 14, copies: 2 },
        { name: '🦅 Picado', type: 'multi', power: 0.8, hits: 2 }
    ],
    hechicero: [
        { name: '🔥 Rayo Oscuro', type: 'atk', power: 1.6, copies: 2 },
        { name: '☠️ Maldición Lenta', type: 'poison', val: 4, turns: 3 },
        { name: '🔮 Barrera Arcana', type: 'def', val: 12 },
        { name: '🩸 Drenar Vida', type: 'drain', power: 1.0, leech: 1 }
    ],
    dragon: [
        { name: '🐲 Aliento de Fuego', type: 'atk', power: 2.0, copies: 2 },
        { name: '🦴 Cola Aplastante', type: 'multi', power: 1.0, hits: 2 },
        { name: '🛡️ Escamas Ancestrales', type: 'def', val: 18 },
        { name: '🔥 Furia Dracónica', type: 'buff', val: 4 }
    ]
};
