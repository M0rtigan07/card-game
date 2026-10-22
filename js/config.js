export const BASE_DECK = [
    { id: 'gema', name: "La Gema", desc: "Un tesoro reluciente. Ganas 500 piezas de oro.", img: "img/gema.jpeg" },
    { id: 'ruina', name: "La Ruina", desc: "Un infortunio te hace perder todo tu oro.", img: "img/ruina.jpeg" },
    { id: 'espada', name: "La Espada", desc: "Consigues una espada afilada. +15 daño de ataque.", img: "img/espada.jpeg" },
    { id: 'estrella', name: "La Estrella", desc: "Recuperas 30 HP y 20 Maná.", img: "img/estrella.jpeg" },
    { id: 'vacio', name: "El Vacío", desc: "Pierdes 20 puntos de salud.", img: "img/vacio.jpeg" },
    { id: 'sabio', name: "El Sabio", desc: "Adquieres sabiduría ancestral (+100 XP).", img: "img/sabio.jpeg" },
    { id: 'caballero', name: "El Caballero", desc: "Un leal aliado se une a ti para luchar.", img: "img/caballero.jpeg" },
    { id: 'craneo', name: "El Cráneo", desc: "¡Un Esqueleto de las sombras se abalanza sobre ti!", img: "img/craneo.jpeg", enemy: { name: "Guerrero Esqueleto", hp: 50, attack: 14 } },
    { id: 'troll', name: "El Troll", desc: "¡Un Troll gigante cavernícola te ataca!", img: "img/troll.jpeg", enemy: { name: "Troll de Cueva", hp: 80, attack: 22 } }
];

export const MAX_CARDS_PER_TURN = 2;