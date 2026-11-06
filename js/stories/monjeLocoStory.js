// js/stories/monjeLocoStory.js
import { MONJE_LOCO_NPC } from '../data/npcs.js'; // O donde tengas definido al NPC

export const MONJE_LOCO_STORY = {
    id: "monjeLoco",
    name: "El Monje Loco de las Criptas",
    chapters: [
        {
            chapterId: 1,
            minDungeonLevel: 3,
            img: "img/monjeloco_ofreceComida.jpg",
            description: "Un monje despeinado revuelve un caldero humeante en la penumbra: \"¡Ah, carne fresca! Prueba mi estofado de champiñones o lárgate...\"",
            choices: [
                {
                    text: "💬 \"Hablar e interrogar al monje loco.\"",
                    action: "chat", // 👈 Acción dedicada a abrir la aventura gráfica de chat
                },
                {
                    text: "🍲 \"Aceptar un plato de estofado (+20 HP).\"",
                    action: "resolve_chapter",
                    nextChapter: 2,
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
                    text: "🚪 \"Ignorar al chiflado y seguir caminando.\"",
                    action: "ignore_story",
                    nextChapter: -1,
                    log: "Decidiste ignorar al monje loco. Su rastro se pierde en la oscuridad."
                }
            ]
        }
    ]
};