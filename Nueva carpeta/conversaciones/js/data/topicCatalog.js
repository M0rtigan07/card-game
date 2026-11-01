// js/data/topicCatalog.js
// Temas de conversación del menú estilo aventura gráfica (data/npcs.js decide qué PNJ puede conversar: todos).
//
//   label   Lo que dice tu héroe al elegirlo
//   xp      Experiencia que da la primera vez que lo preguntas a ese personaje
//   facts   Datos reales del juego que se le pasan a la IA para que los cuente a su manera:
//             advice  estado de tu héroe y trucos del combate
//             boss    cómo es el próximo jefe y a cuántas plantas está
//             wares   lo que ese personaje vende de verdad
//
// El banco de frases de respaldo de cada tema está en data/npcLines.js con la clave "chat_<id>".
// Para añadir un tema: una entrada aquí, su id en GENERAL_TOPICS (para todos) o en NPC_TOPICS (para uno) y sus frases.

export const CHAT_TOPICS = {
    who: { id: 'who', label: '¿Quién eres y qué haces aquí?', xp: 10 },
    place: { id: 'place', label: '¿Qué sabes de esta mazmorra?', xp: 10 },
    advice: { id: 'advice', label: '¿Tienes algún consejo para sobrevivir?', xp: 10, facts: 'advice' },
    rumors: { id: 'rumors', label: '¿Corre algún rumor por aquí abajo?', xp: 10 },
    boss: { id: 'boss', label: '¿Qué hay más adelante?', xp: 20, facts: 'boss' },

    // Propios de cada personaje
    wares: { id: 'wares', label: '¿Qué mercancía llevas?', xp: 10, facts: 'wares' },
    eternity: { id: 'eternity', label: '¿Cuánto tiempo llevas encerrado aquí?', xp: 10 },
    cauldron: { id: 'cauldron', label: '¿Qué cocinas en ese caldero?', xp: 10 },
    valhalla: { id: 'valhalla', label: '¿Qué significa el Valhalla para ti?', xp: 10 },
    wind: { id: 'wind', label: '¿Qué te dice el viento de este lugar?', xp: 10 }
};

export const GENERAL_TOPICS = ['who', 'place', 'advice', 'rumors', 'boss'];

export const NPC_TOPICS = {
    barnaby: ['wares'],
    valerius: ['eternity'],
    morgana: ['cauldron'],
    vikinga: ['valhalla'],
    mongol: ['wind']
};
