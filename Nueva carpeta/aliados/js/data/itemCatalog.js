// js/data/itemCatalog.js
// Catálogo de objetos. Hay dos tipos:
//
//   relic        Reliquia: se tiene una sola vez y funciona sola mientras la lleves (modificadores en `mods`).
//   consumable   Consumible: se acumula (xN) y se gasta con el botón "Usar" del inventario.
//
// Modificadores de las reliquias (mods):
//   attackBonus   Daño extra en tus cartas de ataque
//   energyBonus   Energía extra cada turno
//   startShield   Guardia con la que empiezas cada combate
//   extraDraw     Cartas extra que robas cada turno
//   regen         HP que recuperas al empezar tu turno
//   goldPercent   % extra de oro al ganar combates
// Efecto al conseguirla (onAcquire): maxHealth (sube la vida máxima) y fullHeal (te cura del todo).
//
// Efecto de los consumibles (card): usa los mismos tipos que las cartas
//   heal · atk · def · poison · draw · energy  y  cleanse (quita tu veneno)
//
// Otros campos:
//   price        Oro que cuesta en las tiendas (acción "buy:<id>" en npcs.js)
//   lootWeight   Probabilidad relativa de encontrarlo tras un combate (0 o ausente = no sale como botín)

export const ITEM_CATALOG = [
    // ───── Consumibles ─────
    { id: 'health_potion', name: '🧪 Poción de Salud', kind: 'consumable', price: 30, lootWeight: 5, effect: 'Usar: recupera 40 HP', card: { type: 'heal', value: 40 } },
    { id: 'fire_flask', name: '🔥 Frasco de Fuego', kind: 'consumable', price: 35, lootWeight: 3, effect: 'Usar en combate: 35 de daño', card: { type: 'atk', value: 35 } },
    { id: 'antidote', name: '💧 Antídoto', kind: 'consumable', price: 25, lootWeight: 3, effect: 'Usar en combate: elimina tu veneno', card: { type: 'cleanse', value: 0 } },
    { id: 'energy_elixir', name: '⚡ Elixir de Energía', kind: 'consumable', price: 35, lootWeight: 2, effect: 'Usar en combate: +2 de energía', card: { type: 'energy', value: 2 } },

    // ───── Reliquias que se compran o se consiguen con PNJ ─────
    { id: 'arcane_grimoire', name: '📖 Grimorio Arcano', kind: 'relic', price: 40, effect: '+1 de energía cada turno', mods: { energyBonus: 1 } },
    { id: 'blade_venom', name: '🧪 Veneno de Filo', kind: 'relic', price: 40, effect: '+5 de daño en tus ataques', mods: { attackBonus: 5 } },
    { id: 'subsistence_potion', name: '🧪 Poción de Subsistencia', kind: 'relic', effect: '+20 HP máximo', onAcquire: { maxHealth: 20, fullHeal: true } },

    // ───── Reliquias que se encuentran como botín ─────
    { id: 'iron_charm', name: '🛡️ Amuleto de Hierro', kind: 'relic', lootWeight: 2, effect: 'Empiezas cada combate con 8 de guardia', mods: { startShield: 8 } },
    { id: 'sap_ring', name: '💍 Anillo de Savia', kind: 'relic', lootWeight: 2, effect: 'Recuperas 3 HP al empezar tu turno', mods: { regen: 3 } },
    { id: 'golden_purse', name: '💰 Bolsa Dorada', kind: 'relic', lootWeight: 2, effect: '+25 % de oro al ganar combates', mods: { goldPercent: 25 } },
    { id: 'strategist_scroll', name: '📜 Pergamino del Estratega', kind: 'relic', lootWeight: 1, effect: 'Robas 1 carta más cada turno', mods: { extraDraw: 1 } }
];

export const LOOT = {
    chance: 0.35,   // probabilidad de encontrar un objeto tras ganar un combate
    maxStack: 9     // máximo de unidades de un mismo consumible
};
