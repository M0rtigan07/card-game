export const BUSGOSU_RIDDLES = [
    {
        question: '¿Qué ye lo que tien dientes y nun come?',
        answer: 'El peñe',
        wrongAnswers: ['La fesoria', 'El cencerru']
    },
    {
        question: 'Tengo fueyes y nun soi árbol; guardo palabres, pero nun falo. ¿Qué soi?',
        answer: 'El llibru',
        wrongAnswers: ['Una mazana', 'Un carru']
    },
    {
        question: 'Cuanto más me quiten, más grande me vuelvo. ¿Qué soi?',
        answer: 'Un furacu',
        wrongAnswers: ['Un monte', 'Un sacu']
    },
    {
        question: 'Nun tengo pies, pero corro; nun tengo boca, pero sueno. ¿Qué soi?',
        answer: 'El ríu',
        wrongAnswers: ['Un pumar', 'Una piedra']
    },
    {
        question: 'Tengo ciudaes pero non cases, montes pero non árboles y agua pero non peces. ¿Qué soi?',
        answer: 'Un mapa',
        wrongAnswers: ['Un espeyu', 'Una ventana']
    },
    {
        question: 'Si me nomas, desaparezo. ¿Qué soi?',
        answer: 'El silenciu',
        wrongAnswers: ['Un ruíu', 'Un cantar']
    }
];

export function createBusgosuRiddleEncounter(_player, random = Math.random) {
    const riddle = BUSGOSU_RIDDLES[Math.floor(random() * BUSGOSU_RIDDLES.length)];
    const choices = [
        { text: riddle.answer, storyId: 'busgosu', nextChapter: 3 },
        ...riddle.wrongAnswers.map(text => ({
            text,
            action: 'fail_busgosu_riddle',
            storyId: 'busgosu',
            nextChapter: -1
        }))
    ];

    for (let index = choices.length - 1; index > 0; index--) {
        const otherIndex = Math.floor(random() * (index + 1));
        [choices[index], choices[otherIndex]] = [choices[otherIndex], choices[index]];
    }

    return {
        description: `El Busgosu sonríe y propón esti acertixu: «${riddle.question}»`,
        choices
    };
}

export const BUSGOSU_PORTAL = {
    id: 'busgosu',
    title: 'El portalón del Busgosu',
    chapters: [
        {
            id: 1,
            minLevel: 21,
            img: 'img/busgosu_ofrece.jpg',
            description: `Un home cabra sal de la viesca y t'ofrez un culín de sidra. «¡Bones, viaxeru! Soy el Busgosu. ¿Quies beber comigo antes de siguir camín?»`,
            choices: [
                { text: '🍎 Aceptar el culín y escuchar el acertixu', storyId: 'busgosu', nextChapter: 2 },
                {
                    text: '🚶 Refugar la sidra',
                    action: 'reject_busgosu_sidra',
                    storyId: 'busgosu',
                    nextChapter: -1
                }
            ]
        },
        {
            id: 2,
            minLevel: 21,
            img: 'img/busgosu_acertijo.jpg',
            createEncounter: createBusgosuRiddleEncounter
        },
        {
            id: 3,
            minLevel: 23,
            img: 'img/busgosu_portalon.jpg',
            description: '«¡Acertasti, viaxeru!», ríe el Busgosu. Aparta la maleza y revela un portalón de piedra cubierto de símbolos. Las hojas se abren y, al otro lado, aguarda una luz verde imposible.',
            choices: [
                {
                    text: '🌀 Cruzar el portalón y seguir las huellas',
                    action: 'enter_dark_world',
                    storyId: 'busgosu',
                    nextChapter: -1,
                    quest: {
                        id: 'hija-del-rey',
                        title: 'La hija del rey',
                        description: 'Busca a la hija del rey en el Mundo Oscuro; sigue las huellas junto al broche real.'
                    }
                },
                {
                    text: '🚶 No cruzar; seguir tu camino por la mazmorra',
                    action: 'decline_portal',
                    storyId: 'busgosu',
                    nextChapter: -1
                }
            ]
        }
    ]
};
