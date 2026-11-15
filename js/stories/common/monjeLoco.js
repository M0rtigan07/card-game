// js/stories/common/monjeLoco.js

export const MONJE_LOCO = {

    id: "monjeLoco",

    title: "El Monje Loco",

    npc: {
        id: "monjeLoco",
        name: "El Monje Loco",
        role: "Ermitaño de Kaldur-Ath"
    },

    progression: {

        2: {
            trust: 3
        },

        3: {
            trust: 6
        },

        4: {
            trust: 10
        }

    },


    chapters: [

        {
            id: 1,

            minLevel: 16,

            img: "img/monjeLoco.gif",

            description:
                'Un monje remueve un caldero humeante. "¿Tienes hambre, viajero?"',

            choices: [

                {
                    text: "💬 Hablar con el monje con respeto (+1 confianza)",
                    action: "talk",
                    storyId: "monjeLoco",
                    trust: 1
                },

                {
                    text: "🍲 Comer el estofado (recuperar hasta 20 HP, confianza +2)",
                    hp: 20,
                    trust: 2,
                    storyId: "monjeLoco"
                },
                {
                    text: "😒 Rechazar el estofado (confianza -3)",

                    trust: -3,

                    storyId: "monjeLoco"
                },

                {
                    text: "🚪 Ignorarlo y terminar la historia",
                    storyId: "monjeLoco",
                    nextChapter: -1
                }
            ]

        },

        {
            id: 2,

            minLevel: 22,

            img: "img/monjeLoco2.jpg",

            description:
                'Al ver que confías en él, el monje te habla de su orden: Los Herederos Del Silencio.',

            choices: [

                {
                    text:
                        '💬 Escuchar su historia (+50 oro, confianza +3)',

                    gold: 50,

                    trust: 3,

                    storyId: "monjeLoco",

                },

                {
                    text:
                        '🚪 Marcharte y terminar la historia',

                    storyId: "monjeLoco",

                    nextChapter: -1
                }
            ]
        },

        {
            id: 3,

            minLevel: 23,

            img: "img/monjeLoco2.jpg",

            description:
                'El monje te propone un enigma: «No soy palabra ni oración, ni conozco lengua ni canción. Estoy presente cuando nadie habla y desaparezco cuando alguien me llama. Los sabios me buscan, los necios me temen y quienes me poseen, ningún tesoro los mantiene.»',

            choices: [
                {
                    text: "🔇 El silencio (respuesta correcta, confianza +4)",
                    trust: 4,
                    trustFloor: 10,
                    storyId: "monjeLoco"
                },
                {
                    text: "🌑 La sombra (respuesta incorrecta, confianza -1)",
                    trust: -1,
                    storyId: "monjeLoco"
                },
                {
                    text: "🌌 La oscuridad (respuesta incorrecta, confianza -1)",
                    trust: -1,
                    storyId: "monjeLoco"
                }
            ]
        },

        {
            id: 4,

            minLevel: 24,

            img: "img/monjeLoco2.jpg",

            description:
                'El monje se inclina hacia ti. «Mi verdadero nombre es {monkName}. Pertenezco a Los Herederos Del Silencio.»',

            choices: [
                {
                    text: "💬 Preguntarle por su pasado y despedirte",
                    action: "talk",
                    storyId: "monjeLoco",
                    nextChapter: -1
                },
                {
                    text: "🚪 Agradecerle su confianza y continuar",
                    storyId: "monjeLoco",
                    nextChapter: -1
                }
            ]
        }

    ]
};