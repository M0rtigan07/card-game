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

//Para añadir al Guerrero Esquelético (y otros enemigos nuevos) a los encuentros
//  profundos y que salgan con su propia identidad visual y sus respectivas elecciones, solo tienes que añadirlos 
// dentro del array deepDungeonEncounters en tu archivo generate-lore.js:

const deepDungeonEncounters = [
            {
                npcType: "mage",
                description: "Un devorador de mentes te observa desde el techo: \"Siento la ambición de tu alma. Entrégame tus recuerdos de la superficie o perece.\"",
                choices: [
                    { text: "✨ [VOLUNTAD] \"Mi mente es una fortaleza inexpugnable.\"", action: "magic" },
                    { text: "⚔️ \"¡Empuño mis cartas y mi acero para destruirte!\"", action: "combat" },
                    { text: "🚪 \"Retrocedo lentamente hacia el pasillo anterior.\"", action: "pass" }
                ]
            },
            // 💀 NUEVO: Guerrero Esquelético para plantas profundas
            {
                npcType: "skrullWarrior",
                description: "Un guerrero esquelético con ojos azules llameantes custodia un altar de huesos: \"Nadie profana la cripta eterna...\"",
                choices: [
                    { text: "⚔️ \"¡Vuelve a tu tumba, maldito esqueleto!\"", action: "combat" },
                    { text: "✨ \"Intento purificar su alma con un ritual arcano.\"", action: "magic" },
                    { text: "🚪 \"Evito el altar y sigo descendiendo en silencio.\"", action: "pass" }
                ]
            }
        ];