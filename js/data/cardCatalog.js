// js/data/cardCatalog.js
//
// Catálogo de cartas del jugador. El valor de cada carta escala con tu nivel:
//     val = base + perLevel * nivel
//
// Campos:
//   id, name, img   Identificador, nombre y arte
//   cost            Energía que cuesta (puede ser 0)
//   type            atk | def | heal | drain | poison | draw | energy
//   base, perLevel  Valor inicial y cuánto sube por nivel
//   turns           Duración (solo poison). Por defecto 3
//   text            Descripción. {val} y {turns} se sustituyen solos
//   rarity          starter (mazo inicial) | common | uncommon | rare
//   classes         ['warrior', ...] o null si la puede usar cualquiera
//
// Efectos:
//   atk     Daño (el escudo enemigo absorbe primero)
//   drain   Daño y te curas lo que hayas hecho de daño real
//   def     Escudo hasta el final del turno enemigo
//   heal    Curación
//   poison  Daño al enemigo al empezar cada uno de sus turnos
//   draw    Robas cartas ahora mismo
//   energy  Ganas energía este turno

export const CARD_LIBRARY = [
    // ───── Mazo inicial: Guerrero ─────
    { id: 'strike', name: 'Golpe Demoledor', cost: 1, type: 'atk', base: 15, perLevel: 5, img: 'img/estocada.png', text: 'Inflige {val} daño físico', rarity: 'starter', classes: ['warrior'] },
    { id: 'shield', name: 'Muro de Acero', cost: 1, type: 'def', base: 12, perLevel: 4, img: 'img/escudo.png', text: 'Gana {val} guardia', rarity: 'starter', classes: ['warrior'] },
    { id: 'whirlwind', name: 'Torbellino', cost: 2, type: 'atk', base: 28, perLevel: 8, img: 'img/guerrero.png', text: 'Inflige {val} daño pesado', rarity: 'starter', classes: ['warrior'] },
    { id: 'second_wind', name: 'Poción de Agallas', cost: 1, type: 'heal', base: 18, perLevel: 3, img: 'img/pocion.png', text: 'Recupera {val} HP', rarity: 'starter', classes: ['warrior'] },

    // ───── Mazo inicial: Maga ─────
    { id: 'fireball', name: 'Bola de Fuego', cost: 2, type: 'atk', base: 25, perLevel: 7, img: 'img/bolaFuego.png', text: 'Inflige {val} daño arcano', rarity: 'starter', classes: ['mage'] },
    { id: 'ice_barrier', name: 'Barrera de Hielo', cost: 1, type: 'def', base: 15, perLevel: 5, img: 'img/escudo.png', text: 'Gana {val} guardia', rarity: 'starter', classes: ['mage'] },
    { id: 'arcane_missile', name: 'Proyectiles', cost: 1, type: 'atk', base: 16, perLevel: 4, img: 'img/maga.png', text: 'Inflige {val} daño rápido', rarity: 'starter', classes: ['mage'] },
    { id: 'mana_heal', name: 'Canalización', cost: 1, type: 'heal', base: 22, perLevel: 4, img: 'img/pocion.png', text: 'Sana {val} HP', rarity: 'starter', classes: ['mage'] },

    // ───── Mazo inicial: Pícaro ─────
    { id: 'backstab', name: 'Puñalada', cost: 1, type: 'atk', base: 20, perLevel: 6, img: 'img/estocada.png', text: 'Inflige {val} daño crítico', rarity: 'starter', classes: ['rogue'] },
    { id: 'evasion', name: 'Doble Paso', cost: 1, type: 'def', base: 14, perLevel: 4, img: 'img/escudo.png', text: 'Gana {val} esquiva/def', rarity: 'starter', classes: ['rogue'] },
    { id: 'poison_blade', name: 'Hoja Envenenada', cost: 2, type: 'atk', base: 32, perLevel: 8, img: 'img/picaro.png', text: 'Inflige {val} daño venenoso', rarity: 'starter', classes: ['rogue'] },
    { id: 'shadow_heal', name: 'Venda de Sombras', cost: 1, type: 'heal', base: 16, perLevel: 3, img: 'img/pocion.png', text: 'Cura {val} HP', rarity: 'starter', classes: ['rogue'] },

    // ───── Recompensas: cualquier clase ─────
    { id: 'bandage', name: 'Vendaje', cost: 0, type: 'heal', base: 6, perLevel: 2, img: 'img/pocion.png', text: 'Recupera {val} HP', rarity: 'common', classes: null },
    { id: 'guard', name: 'Guardia Alta', cost: 1, type: 'def', base: 10, perLevel: 4, img: 'img/escudo.png', text: 'Gana {val} guardia', rarity: 'common', classes: null },
    { id: 'flask', name: 'Frasco Venenoso', cost: 1, type: 'poison', base: 3, perLevel: 1, turns: 3, img: 'img/pocion.png', text: 'Envenena: {val} de daño durante {turns} turnos', rarity: 'common', classes: null },
    { id: 'adrenaline', name: 'Adrenalina', cost: 0, type: 'energy', base: 1, perLevel: 0, img: 'img/pocion.png', text: 'Ganas {val} de energía', rarity: 'uncommon', classes: null },
    { id: 'focus', name: 'Concentración', cost: 1, type: 'draw', base: 2, perLevel: 0, img: 'img/maga.png', text: 'Robas {val} cartas', rarity: 'uncommon', classes: null },

    // ───── Recompensas: Guerrero ─────
    { id: 'iron_skin', name: 'Piel de Hierro', cost: 2, type: 'def', base: 22, perLevel: 8, img: 'img/escudo.png', text: 'Gana {val} guardia', rarity: 'common', classes: ['warrior'] },
    { id: 'rage', name: 'Furia Berserker', cost: 0, type: 'atk', base: 6, perLevel: 2, img: 'img/veterano.jpg', text: 'Inflige {val} de daño sin gastar energía', rarity: 'uncommon', classes: ['warrior'] },
    { id: 'war_cry', name: 'Grito de Guerra', cost: 1, type: 'energy', base: 2, perLevel: 0, img: 'img/capitan.jpg', text: 'Ganas {val} de energía', rarity: 'rare', classes: ['warrior'] },
    { id: 'titan_blow', name: 'Golpe Titánico', cost: 3, type: 'atk', base: 44, perLevel: 14, img: 'img/guerrero.png', text: 'Inflige {val} daño devastador', rarity: 'rare', classes: ['warrior'] },

    // ───── Recompensas: Maga ─────
    { id: 'lightning', name: 'Relámpago', cost: 1, type: 'atk', base: 19, perLevel: 5, img: 'img/mage.jpg', text: 'Inflige {val} daño eléctrico', rarity: 'common', classes: ['mage'] },
    { id: 'frost_nova', name: 'Nova de Escarcha', cost: 2, type: 'def', base: 24, perLevel: 8, img: 'img/escudo.png', text: 'Gana {val} guardia', rarity: 'common', classes: ['mage'] },
    { id: 'life_drain', name: 'Drenar Vida', cost: 2, type: 'drain', base: 18, perLevel: 5, img: 'img/hechicero.jpg', text: 'Inflige {val} y te curas ese daño', rarity: 'uncommon', classes: ['mage'] },
    { id: 'meteor', name: 'Meteoro', cost: 3, type: 'atk', base: 46, perLevel: 14, img: 'img/bolaFuego.png', text: 'Inflige {val} daño ígneo', rarity: 'rare', classes: ['mage'] },

    // ───── Recompensas: Pícaro ─────
    { id: 'venom_dart', name: 'Dardo Envenenado', cost: 1, type: 'poison', base: 5, perLevel: 1, turns: 4, img: 'img/picaro.png', text: 'Envenena: {val} de daño durante {turns} turnos', rarity: 'common', classes: ['rogue'] },
    { id: 'smoke_bomb', name: 'Bomba de Humo', cost: 1, type: 'def', base: 16, perLevel: 5, img: 'img/escudo.png', text: 'Gana {val} guardia', rarity: 'common', classes: ['rogue'] },
    { id: 'blood_blade', name: 'Hoja Sangrienta', cost: 1, type: 'drain', base: 12, perLevel: 4, img: 'img/estocada.png', text: 'Inflige {val} y te curas ese daño', rarity: 'uncommon', classes: ['rogue'] },
    { id: 'assassinate', name: 'Asesinar', cost: 2, type: 'atk', base: 40, perLevel: 10, img: 'img/estocada.png', text: 'Inflige {val} daño letal', rarity: 'rare', classes: ['rogue'] }
];

export const STARTER_DECKS = {
    warrior: ['strike', 'shield', 'whirlwind', 'second_wind'],
    mage: ['fireball', 'ice_barrier', 'arcane_missile', 'mana_heal'],
    rogue: ['backstab', 'evasion', 'poison_blade', 'shadow_heal']
};

export const REWARD_CONFIG = {
    count: 3,        // cartas que se ofrecen tras cada combate
    maxCopies: 2,    // copias máximas de una misma carta en el mazo
    skipGold: 25,    // oro si no eliges ninguna
    weights: { common: 6, uncommon: 3, rare: 1 } // probabilidad relativa (las raras mejoran con la planta)
};
