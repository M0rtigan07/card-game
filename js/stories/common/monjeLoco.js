// js/stories/common/monjeLoco.js

export const MONJE_LOCO = {

    id: "monjeLoco",

    title: "El Monje Loco",

    npc: {
        id: "monjeLoco",
        name: "El Monje Loco",
        role: "Ermitaño de Kaldur-Ath"
    },


    chapters: [

        {
            id: 1,

            minLevel: 15,

            img: "img/monjeLoco.gif",

            description:
                'Un monje remueve un caldero humeante. "¿Tienes hambre, viajero?"',

            choices: [

                {
                    text: "💬 Hablar con el monje",
                    action: "talk"
                },

                {
                    text: "🍲 Comer el estofado",
                    hp: 20,
                    trust: 2,
                    storyId: "monjeLoco",
                    nextChapter: 2
                },
                {
                    text: "😒 Tu comida parece veneno",

                    trust: -3,

                    storyId: "monjeLoco",

                    nextChapter: 2
                },

                {
                    text: "🚪 Ignorarlo",
                    storyId: "monjeLoco",
                    nextChapter: -1
                }
            ]

        },

        {
            id: 2,

            minLevel: 6,

            img: "img/monjeLoco2.jpg",

            description:
                'El monje vuelve a aparecer. Parece esperarte.',

            choices: [

                {
                    text:
                        '💬 Escuchar su historia',

                    gold: 50,

                    storyId: "monjeLoco",

                    nextChapter: 3
                },

                {
                    text:
                        '🚪 Marcharte',

                    storyId: "monjeLoco",

                    nextChapter: -1
                }
            ]
        }

    ]
};