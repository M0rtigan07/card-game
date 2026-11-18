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
                { text: '🚶 Refugar la sidra, pero escuchar el acertixu', storyId: 'busgosu', nextChapter: 2 }
            ]
        },
        {
            id: 2,
            minLevel: 21,
            img: 'img/busgosu_acertijo.jpg',
            description: 'El Busgosu sonríe y propón el acertixu: «¿Qué ye lo que tien dientes y nun come?»',
            choices: [
                { text: '🪮 El peñe', storyId: 'busgosu', nextChapter: 3 },
                { text: '⛏️ La fesoria', storyId: 'busgosu', nextChapter: 2 },
                { text: '🔔 El cencerru', storyId: 'busgosu', nextChapter: 2 }
            ]
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
