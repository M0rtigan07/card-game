//EN EL ARCHIVO  npcs.js, en la carpeta data, se pueden añadir nuevos PNJs siguiendo la estructura de los existentes. Por ejemplo, para crear un nuevo personaje llamado "nuevo_personaje", se puede añadir el siguiente bloque de código:

nuevo_personaje: {
        id: 'nuevo_personaje',
        name: 'Nombre del PNJ',
        images: {
            room: 'img/npcs/personaje_idle.gif',
            talk: 'img/npcs/personaje_habla.gif',
            enraged: 'img/npcs/personaje_enojado.gif'
        },
        type: 'tipo_entidad', // Ej: merchant, boss, monster, etc.
        archetype: 'una descripción breve de su personalidad para que la IA de Groq sepa cómo interpretarlo',
        voice: 'Tono de voz, forma de expresarse y vocabulario característico.',
        dungeonLevel: 5, // Planta en la que aparecerá en la mazmorra
        baseHp: 70,
        baseAtk: 12,
        interactions: {
            'warrior': {
                greeting: "Texto de saludo específico si el héroe es Guerrero...",
                choices: [
                    { text: "⚔️ Opción de combate", action: 'combat' },
                    { text: "💰 Opción de comercio", action: 'buy_potion' }
                ]
            },
            // Puedes añadir bloques para 'mage', 'rogue', o dejar un array de 'choices' genérico como en el caso de la vikinga
        }
    }

    ///////////////////////////////////////////////////////////////

// para los  enemigos geenricos ,  en  data/gameConfig.js, se puede añadir un nuevo enemigo siguiendo la estructura de los existentes. Por ejemplo, para crear un nuevo enemigo llamado "nuevo_enemigo", se puede añadir el siguiente bloque de código:

{
        keys: ['palabra_clave', 'otra_clave'], // Palabras que el sistema buscará en la descripción del encuentro para activarlo
        id: 'nuevo_enemigo',                   // ID único del enemigo
        deckId: 'nuevo_enemigo',               // Mazo de cartas asociado en el sistema de combate
        name: 'Nombre del Enemigo',            // Nombre visible en pantalla
        img: 'img/nombre_imagen.jpg',          // Ruta de su ilustración
        archetype: 'una descripción breve de su personalidad y aspecto para que la IA de Groq sepa cómo interpretarlo',
        voice: 'Tono de voz y pautas de comportamiento al hablar o gritar en combate.'
    },