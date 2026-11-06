// js/stories/monjeLocoStory.js

export const MONJE_LOCO_STORY = {
    id: "monjeLoco",
    name: "El Monje Loco de las Criptas",
    
    chapters: [
        // -------------------------------------------------------------
        // CAPÍTULO 1: Encuentro con el monje (Planta >= 18)
        // -------------------------------------------------------------
        {
            chapterId: 1,
            minDungeonLevel: 18,
            img: "img/monjeLoco.gif",
            description: "Un monje despeinado aparece en la penumbra: \"¡Ah, al fin una visita...\"",
            choices: [
                {
                    text: "🍲 \"hablar con el .\"",
                    action: "resolve_chapter",
                    nextChapter: 2, // Avanza al capítulo 2 en el futuro
                    reward: { hp: 20 },
                    log: "Aceptaste la comida del Monje Loco. Su extraño brebaje te reconforta."
                },
                {
                    text: "✨ [ARCANO] \"Inspeccionar el brebaje por si tiene veneno.\"",
                    action: "resolve_chapter",
                    nextChapter: 2,
                    reward: { cardId: "pocionAgallas" },
                    log: "Purificas el brebaje y extraes un elixir arcano para tu mazo."
                },
                {
                    text: "🚪 \"Ignorar al chiflado y seguir caminando sin mirar atrás.\"",
                    action: "ignore_story", // Bloquea al personaje para siempre
                    nextChapter: -1,
                    log: "Decidiste ignorar al monje loco. Su rastro se pierde en la oscuridad."
                }
            ]
        },

        // -------------------------------------------------------------
        // CAPÍTULO 2: El cofre encadenado (Planta >= 7)
        // -------------------------------------------------------------
        {
            chapterId: 2,
            minDungeonLevel: 27,
            img: "img/monjeloco_baul1.jpg",
            description: "Te vuelves a cruzar con el monje, que ahora abraza un baúl con cadenas: \"¡Mi viejo amigo! El cofre guarda el saber de las eras... si respondes a mi enigma.\"",
            choices: [
                {
                    text: "🔑 [INTELIGENCIA] \"Resolver el acertijo sobre el tiempo.\"",
                    action: "resolve_chapter",
                    nextChapter: 3, // Avanza al capítulo 3
                    reward: { gold: 120 },
                    log: "¡Acertaste! El monje loco te entrega el tesoro entre carcajadas (+120 Oro)."
                },
                {
                    text: "🗡️ [FUERZA] \"Intentar forzar el cerrojo de hierro con tu arma.\"",
                    action: "resolve_chapter",
                    nextChapter: 3,
                    reward: { hp: -10, gold: 50 },
                    log: "Rompes la cerradura pero activas una trampa de aguja (-10 HP, +50 Oro)."
                },
                {
                    text: "🚪 \"No entrar en sus juegos y retirarte.\"",
                    action: "ignore_story",
                    nextChapter: -1,
                    log: "Te alejaste del monje. Decidió no volver a mostrarse ante ti."
                }
            ]
        },

        // -------------------------------------------------------------
        // CAPÍTULO 3: El clímax con los acólitos (Planta >= 12)
        // -------------------------------------------------------------
        {
            chapterId: 3,
            minDungeonLevel: 32,
            img: "img/monjesLocos.jpg",
            description: "El monje encabeza una extraña ceremonia rodeado de acólitos: \"¡Has demostrado gran valor, viajero! Elige tu última bendición antes del abismo.\"",
            choices: [
                {
                    text: "🔮 \"Pedir el artefacto sagrado de su secta.\"",
                    action: "resolve_chapter",
                    nextChapter: 4, // Fin de la cadena de misiones
                    reward: { relic: "amulet_of_madness" },
                    log: "El monje te entrega el Amuleto de la Locura entre cánticos."
                },
                {
                    text: "⚔️ \"Exorcizar la locura de la estancia y luchar.\"",
                    action: "combat",
                    npcType: "skrullWarrior", // Redirige a combate TCG si el jugador lo elige
                    nextChapter: 4,
                    log: "Desatas el combate contra las fuerzas del monje."
                }
            ]
        }
    ]
};