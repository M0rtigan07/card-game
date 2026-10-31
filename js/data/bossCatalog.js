// js/data/bossCatalog.js
// Jefes del juego: uno cada BOSS.EVERY plantas (5, 10, 15...), en este orden y repitiéndose al acabar la lista.
//
// Un jefe es un enemigo más duro que los demás:
//   - Más vida y ataque, que crecen con la planta: vida = baseHp + hpPerFloor × planta; ataque = baseAtk + atkPerFloor × planta
//   - Armadura (armor): empieza cada uno de sus turnos con esa guardia, así que hay que romperla cada vez
//   - Fases (phases): al bajar de cierta vida cambian: más ataque, escudo, curación, retrato nuevo y cartas nuevas en su mazo
//   - Mazo propio (deckId → data/enemyDecks.js) y personalidad (archetype/voice) para sus frases
//
// Campos de una fase (phases):
//   at         Se activa cuando su vida baja de esta proporción (0.5 = la mitad)
//   announce   Qué le ocurre ("entra en frenesí"): sale en el diario y se lo cuenta a la IA
//   atkBonus   Ataque extra permanente
//   shield     Escudo inmediato
//   heal       Vida que recupera
//   armor      Armadura extra permanente
//   img        Retrato nuevo
//   addCards   Cartas nuevas para su mazo (mismo formato que enemyDecks.js)
// Las fases van de mayor a menor `at`.
//
// Para añadir un jefe: una entrada aquí, su mazo en enemyDecks.js y sus frases en npcLines.js.

export const BOSSES = [
    {
        id: 'orco_jefe',
        name: 'Gorgrim, Jefe Orco',
        img: 'img/jefe_orco_hacha.jpg',
        deckId: 'orco_jefe',
        baseHp: 165, hpPerFloor: 10, baseAtk: 16, atkPerFloor: 0.6, armor: 6,
        archetype: 'Gorgrim, el jefe de una horda orca: brutal, orgulloso y fanfarrón, con ansias de aplastar cráneos',
        voice: 'Habla en tercera persona ("Gorgrim aplasta") con gramática simple, pero con orgullo de líder: da órdenes y presume de su horda. Grita mucho.',
        phases: [
            {
                at: 0.5, announce: 'entra en un frenesí sangriento', atkBonus: 5, shield: 15,
                addCards: [
                    { name: '☠️ Frenesí Sangriento', type: 'multi', power: 0.8, hits: 3, copies: 2 },
                    { name: '📣 Grito de la Horda', type: 'buff', val: 4 }
                ]
            }
        ]
    },
    {
        id: 'vampira_jefa',
        name: 'La Dama de la Noche',
        img: 'img/npcs/vampira.jpg',
        deckId: 'vampira_jefa',
        baseHp: 160, hpPerFloor: 10, baseAtk: 16, atkPerFloor: 0.6, armor: 8,
        archetype: 'la Dama de la Noche, una vampira ancestral, seductora, elegante y cruel, que juega con sus presas',
        voice: 'Seductora y aristocrática. Llama "querido" al héroe con un cariño letal. Habla de la noche, la sangre y el aburrimiento de los siglos.',
        phases: [
            { at: 0.6, announce: 'se alimenta de las sombras', atkBonus: 3, shield: 20 },
            {
                at: 0.3, announce: 'muestra su verdadera forma', atkBonus: 4, heal: 30, img: 'img/npcs/vampira_enojada.jpg',
                addCards: [{ name: '🩸 Sed Insaciable', type: 'drain', power: 1.8, leech: 1, copies: 2 }]
            }
        ]
    },
    {
        id: 'escorpiones_jefe',
        name: 'El Líder de los Escorpiones Negros',
        img: 'img/npcs/escorpionesNegros_lider.jpg',
        deckId: 'escorpiones_jefe',
        baseHp: 150, hpPerFloor: 10, baseAtk: 17, atkPerFloor: 0.6, armor: 10,
        archetype: 'el líder de los Escorpiones Negros, un asesino a sueldo frío, profesional y sin piedad',
        voice: 'Frío y profesional. Habla de contratos, de sombras y de testigos. Frases cortas, secas y sin emoción.',
        phases: [
            {
                at: 0.5, announce: 'desenvaina sus dagas gemelas', atkBonus: 4, img: 'img/npcs/escorpionesNegros_lider_daga.jpg',
                addCards: [{ name: '🗡️ Lluvia de Dagas', type: 'multi', power: 0.5, hits: 5, copies: 2 }]
            }
        ]
    },
    {
        id: 'dragon_jefe',
        name: 'Ignis, el Dragón Guardián',
        img: 'img/dragon.png',
        deckId: 'dragon_jefe',
        baseHp: 190, hpPerFloor: 9, baseAtk: 17, atkPerFloor: 0.5, armor: 12,
        archetype: 'Ignis, un dragón guardián milenario, majestuoso y orgulloso, dueño de un tesoro inmenso',
        voice: 'Grandilocuente y solemne. Llama "hormiga" al héroe. Habla de eras, de imperios caídos, de su tesoro y de su fuego.',
        phases: [
            { at: 0.66, announce: 'bate las alas y ruge', atkBonus: 4, shield: 20 },
            {
                at: 0.33, announce: 'arde en llamas ancestrales', atkBonus: 6,
                addCards: [
                    { name: '🌋 Aliento Final', type: 'atk', power: 3, copies: 1 },
                    { name: '🔥 Infierno', type: 'multi', power: 1.0, hits: 3, copies: 1 }
                ]
            }
        ]
    }
];
