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
                    text: "💬 Hablar con el monje",
                    action: "talk"
                },

                {
                    text: "🍲 Comer el estofado (recuperar hasta 20 HP, confianza +2)",
                    hp: 20,
                    trust: 2,
                    storyId: "monjeLoco",
                    nextChapter: 2
                },
                {
                    text: "😒 Rechazar el estofado (confianza -3)",

                    trust: -3,

                    storyId: "monjeLoco",

                    nextChapter: 2
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
                'El monje vuelve a aparecer. Parece esperarte.',

            choices: [

                {
                    text:
                        '💬 Escuchar su historia (+50 oro)',

                    gold: 50,

                    storyId: "monjeLoco",

                    nextChapter: 3
                },

                {
                    text:
                        '🚪 Marcharte y terminar la historia',

                    storyId: "monjeLoco",

                    nextChapter: -1
                }
            ]
        }

    ]
};