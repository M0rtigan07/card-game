// js/data/allyCatalog.js
// Personajes que pueden unirse a tu grupo si los convences en una conversación (la clave es el id del PNJ en npcs.js).
//
//   card        Arte de su carta de aliado (se ve en el panel "Grupo")
//   portrait    Retrato del personaje para diálogos, separado del arte de su carta
//   ability     Lo que hace por ti al empezar cada uno de tus turnos de combate, sin gastar energía:
//                 type  atk | def | drain | poison | heal   (mismos efectos que tus cartas)
//                 base + perLevel × tu nivel = valor;  every = cada cuántos turnos actúa (1 = siempre)
//   battleLines  Frases que dice el aliado al usar su habilidad en combate.
//   values      Lo que valora y lo que desprecia: son los datos reales que cuenta si le preguntas
//               "¿Qué es lo que más valoras?". Es la pista para elegir bien los argumentos.
//   arguments   Lo que puedes decirle para convencerle. good: true = le convence; false = le ofende.
//               Hacen falta NEEDED argumentos buenos y se pierde la oportunidad con BAD_LIMIT malos
//               (ver PERSUASION en gameConfig.js).
//
// Para añadir un aliado: una entrada aquí con battleLines, su carta y sus frases sociales
// de respaldo (chat_values, chat_persuade_good, chat_persuade_bad, chat_recruited y chat_locked) en npcLines.js.

export const ALLIES = {
    mongol: {
        id: 'mongol', name: 'Batu Jan', card: 'img/npcs/cartaArquero.png',
        portrait: 'img/npcs/mongol_habla.jpg',
        ability: { name: '🏹 Lluvia de Flechas', type: 'atk', base: 6, perLevel: 2, every: 1, text: 'Dispara al enemigo cada turno' },
        battleLines: [
            '¡Que mis flechas te encuentren!',
            'La estepa me enseñó a no fallar.',
            '¡Una flecha por cada paso que das!'
        ],
        values: [
            'Valoras la palabra dada y el respeto entre compañeros de camino.',
            'Echas de menos el cielo abierto y la libertad de la estepa.',
            'Desprecias a quien intenta comprarte con oro o amenazarte.'
        ],
        arguments: [
            { id: 'gold', good: false, label: 'Te pagaré bien: una bolsa de oro por cada flecha que dispares.' },
            { id: 'path', good: true, label: 'Te propongo recorrer esta mazmorra codo con codo, como dos jinetes que comparten camino.' },
            { id: 'threat', good: false, label: 'Si no vienes conmigo, quizá te ocurra algo malo en estos pasillos.' },
            { id: 'sky', good: true, label: 'Te doy mi palabra de que te devolveré a la superficie, al cielo abierto de la estepa.' }
        ]
    },

    vikinga: {
        id: 'vikinga', name: 'Astrid', card: 'img/npcs/cartaVikinga.png',
        portrait: 'img/npcs/vikinga_hablando1.jpg',
        ability: { name: '🛡️ Muro de Escudos', type: 'def', base: 6, perLevel: 2, every: 1, text: 'Te cubre con su escudo cada turno' },
        battleLines: [
            '¡Tras mi escudo, nadie caerá!',
            '¡Que pruebe el acero antes de tocarte!',
            '¡Resiste! Aún nos queda gloria por ganar.'
        ],
        values: [
            'Valoras el honor, la fuerza y la gloria en combate.',
            'Desprecias a los cobardes y a quien te trata como a alguien débil.'
        ],
        arguments: [
            { id: 'legend', good: true, label: 'A mi lado tu nombre se cantará en el Valhalla: luchemos juntos.' },
            { id: 'rest', good: false, label: 'Estás cansada y deberías descansar: déjame a mí el combate.' },
            { id: 'proof', good: true, label: 'Muéstrame tu hacha y tu valor: busco a alguien que no retroceda ante nada.' },
            { id: 'flee', good: false, label: 'No hace falta pelear: huyamos por otro pasillo.' }
        ]
    },

    valerius: {
        id: 'valerius', name: 'Conde Valerius', card: 'img/npcs/cartaConde.png',
        portrait: 'img/npcs/conde_charla.jpg',
        ability: { name: '🦇 Mordisco Carmesí', type: 'drain', base: 4, perLevel: 2, every: 1, text: 'Muerde al enemigo y te cura cada turno' },
        battleLines: [
            'Tu sangre pagará esta insolencia.',
            'Ah... el sabor de una presa digna.',
            'La noche siempre cobra sus deudas.'
        ],
        values: [
            'Valoras el poder, el linaje y que te traten como al noble que eres.',
            'Desprecias la súplica y los sermones sobre redención.'
        ],
        arguments: [
            { id: 'plead', good: false, label: 'Por piedad, ayúdame; no puedo con esta mazmorra yo solo.' },
            { id: 'court', good: true, label: 'Un noble de tu categoría no debería pudrirse en una cripta: ven y vuelve a ser temido.' },
            { id: 'redeem', good: false, label: 'Eres una criatura maldita y deberías redimirte ayudando a los vivos.' },
            { id: 'pact', good: true, label: 'Te ofrezco un pacto entre iguales: tu poder ancestral a cambio de presas dignas de ti.' }
        ]
    },

    necro: {
        id: 'necro', name: 'Malakar', card: 'img/npcs/cartaNecro.png',
        portrait: 'img/npcs/necroretrato.png',
        ability: { name: '☠️ Maldición Necrótica', type: 'poison', base: 5, perLevel: 2, turns: 3, every: 1, text: 'Envenena al enemigo cada turno' },
        battleLines: [
            '¡Que la putrefacción te consuma!',
            'Las sombras ya reclaman tu nombre.',
            'La muerte obedece mi voluntad.'
        ],
        values: [
            'Valoras el saber prohibido sobre la muerte y que respeten tu arte.',
            'Desprecias los sermones sobre la luz y sobre el descanso de los muertos.'
        ],
        arguments: [
            { id: 'tomes', good: true, label: 'Ahí fuera hay tomos prohibidos que ningún necromante ha leído: acompáñame a buscarlos.' },
            { id: 'light', good: false, label: 'Deberías abandonar la nigromancia y volver a la luz.' },
            { id: 'craft', good: true, label: 'Tu arte merece lucirse en batalla: tendrías cadáveres nuevos en cada combate.' },
            { id: 'peace', good: false, label: 'Los muertos deben descansar en paz: estás profanando sus tumbas.' }
        ]
    },

    pirata: {
        id: 'pirata', name: 'Capitana Zafira', card: 'img/npcs/cartaPirata.png',
        portrait: 'img/npcs/mujerPirata_hablando.jpg',
        ability: { name: '💣 Cañonazo', type: 'atk', base: 15, perLevel: 4, every: 2, text: 'Dispara su cañón un turno sí y otro no' },
        battleLines: [
            '¡A babor! ¡Que hable el cañón!',
            '¡Un cañonazo y al fondo contigo!',
            '¡Esto no lo cubre ningún tesoro!'
        ],
        values: [
            'Valoras los tesoros, las aventuras y no tener amo.',
            'Desprecias las órdenes, las leyes y los sermones de honradez.'
        ],
        arguments: [
            { id: 'orders', good: false, label: 'Te acompañaré si obedeces mis órdenes sin discutir.' },
            { id: 'treasure', good: true, label: 'Más abajo hay un tesoro de dragón: lo repartimos a medias, capitana.' },
            { id: 'justice', good: false, label: 'Una pirata debería entregarse a la justicia y volverse honrada.' },
            { id: 'adventure', good: true, label: 'Te propongo una aventura sin dueño ni bandera: tú pones el cañón y yo el mapa.' }
        ]
    },

    vampira: {
        id: 'vampira', name: 'La Dama de la Noche', card: 'img/npcs/cartaVampira.png',
        portrait: 'img/npcs/vampira.jpg',
        ability: { name: '🩸 Beso Sombrío', type: 'drain', base: 10, perLevel: 3, every: 2, text: 'Drena al enemigo un turno sí y otro no' },
        battleLines: [
            'Ven, criatura; deja que te robe el aliento.',
            'Qué sangre tan intensa... casi me divierte.',
            'Un beso, y tu fuerza será mía.'
        ],
        values: [
            'Valoras la elegancia, la intriga y que alguien consiga entretenerte.',
            'Desprecias los insultos burdos y las amenazas.'
        ],
        arguments: [
            { id: 'game', good: true, label: 'Dicen que los siglos aburren: te ofrezco un juego nuevo en cada planta.' },
            { id: 'monster', good: false, label: 'Eres un monstruo y deberías ayudar a los vivos por una vez.' },
            { id: 'threat', good: false, label: 'Ven conmigo o te destruyo, criatura.' },
            { id: 'elegance', good: true, label: 'La mazmorra es mejor con una dama que sepa apreciar el peligro. Prometo entretenerte.' }
        ]
    }
};
