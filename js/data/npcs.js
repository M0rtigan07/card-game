// js/data/npcs.js
export const NPC_DATABASE = {
    valerius: {
        id: 'valerius',
        name: 'Conde Valerius',
        images: {
            room: 'img/npcs/conde_valerius.jpg',
            talk: 'img/npcs/conde_charla.jpg',
            enraged: 'img/npcs/conde_enojado.jpg',
            seductive: 'img/npcs/conde_seductor.jpg'
        },
        cards: {
            combat: 'img/npcs/cartaConde.png'
        },
        type: 'vampire_lord',
        archetype: 'el Conde Valerius, un lord vampiro milenario, aristócrata, extremadamente arrogante, cínico y elegante',
        voice: 'Desdén refinado y teatral. Llama "mortal" o "criatura" al héroe. Usa metáforas de sangre, noche y eternidad. Frases largas y elegantes.',
        dungeonLevel: 2, // O la planta en la que aparezca
        baseHp: 80,
        baseAtk: 18,
        interactions: {
            'warrior': {
                greeting: "Un patético bulto de acero profana mis aposentos...",
                choices: [
                    { text: "⚔️ \"¡Desenvaina, criatura de la noche!\"", action: "combat" },
                    { text: "💰 \"Acepta este tributo de oro y permíteme pasar.\"", action: "buy" },
                    { text: "🤝 \"Unamos fuerzas en esta mazmorra; juntos somos invencibles.\"", action: "pact_accept" }
                ]
            },
            'mage': {
                greeting: "Siento una chispa de maná interesante en tu sangre, hechicera...",
                choices: [
                    { text: "🌹 \"Una belleza tan salvaje merece algo mejor que pelear. Hablemos...\"", action: "flirt_challenge" },
                    { text: "✨ \"Sellar un pacto oscuro contigo elevará mi poder.\"", action: "pact_accept" },
                    { text: "⚔️ \"Tus días de tiranía terminan aquí.\"", action: "combat" }
                ]
            },
            'rogue': {
                greeting: "Otro ratón merodeando por mis criptas oscuras...",
                choices: [
                    { text: "💰 \"Tengo oro y secretos que te interesan, señor de la noche.\"", action: "buy" },
                    { text: "🤝 \"Ofrezco mis servicios como aliado en las sombras.\"", action: "pact_accept" },
                    { text: "⚔️ \"Prefiero tu botín a tu charla.\"", action: "combat" }
                ]
            }
        }
    },

    // --- PLANTA 4: LA VIKINGA DE LAS CRYPTAS ---
    vikinga: {
        id: 'vikinga',
        name: 'Astrid la Escudera',
        images: {
            room: 'img/npcs/vikinga.jpg',
            talk: 'img/npcs/vikinga_hablando.jpg',
            enraged: 'img/npcs/vikinga_enojada.jpg'
        },
        type: 'warrior_viking',
        archetype: 'una guerrera vikinga feroz, orgullosa, de pocas palabras y sedienta de honor y batallas en el Valhalla',
        voice: 'Frases cortas, directas y bruscas. Habla de honor, del Valhalla, de Odín, de hidromiel y de acero. Nunca divaga.',
        dungeonLevel: 4,
        baseHp: 60,
        baseAtk: 15,
        interactions: {
            // Opciones genéricas o adaptables donde la IA genera la charla
            choices: [
                { text: "⚔️ Desafiarla a un duelo de acero", action: 'combat' },
                { text: "🤝 Invitarla a beber y sellar una alianza", action: 'pact_accept' },
                { text: "🏃 Ignorarla y seguir tu camino", action: 'pass' }
            ]
        }
    },

    // --- PLANTA 5: EL MONGOL DE LAS ESTEPAS OSCURAS ---
    mongol: {
        id: 'mongol',
        name: 'Batu Jan el Nómada',
        images: {
            room: 'img/npcs/mongol.jpg',
            talk: 'img/npcs/mongol_habla.jpg',
            action: 'img/npcs/mongol_arco.jpg'
        },
        type: 'nomad_archer',
        archetype: 'un arquero nómada de las estepas, sabio, curtido en tormentas de arena y misterioso',
        voice: 'Calmado y enigmático. Usa proverbios y comparaciones con el viento, el caballo, el río y el cielo de la estepa.',
        dungeonLevel: 5,
        baseHp: 50,
        baseAtk: 14,
        interactions: {
            choices: [
                { text: "🏹 Pedirle consejo sobre los peligros de la mazmorra", action: 'witch_knowledge' },
                { text: "🏹 Comprar flechas envenenadas: Veneno de Filo (-40 Oro, +5 de daño)", action: 'buy_poison' },
                { text: "⚔️ Atacar al nómada", action: 'combat' }
            ]
        }
    },

    // --- PLANTA 1: EL MERCADER ESCAPADO ---
    barnaby: {
        id: 'barnaby',
        name: 'Barnaby el Buhonero',
        images: {
            room: 'img/barnaby_room.png',
            talk: 'img/barnaby_talk.png',
            enraged: 'img/barnaby_enfado.png'
        },
        type: 'merchant',
        archetype: 'Barnaby el Buhonero, un mercader callejero astuto, precavido, cotilla y un poco cascarrabias',
        voice: 'Habla rápido y en voz baja, soltando rumores. Regatea, se queja de los precios y llama "viajero" o "amigo" al héroe.',
        dungeonLevel: 1, // <-- Aparece en la planta 1
        baseHp: 40,
        baseAtk: 8,
        interactions: {
            'warrior': {
                greeting: "¡Psst! ¿Buscas equipamiento, viajero? Los pasillos de aquí abajo no perdonan a los imprudentes.",
                choices: [
                    { text: "🧪 Comprar Poción de Salud (-30 Oro)", action: 'buy_potion' },
                    { text: "🔥 Comprar Frasco de Fuego (-35 Oro)", action: 'buy:fire_flask' },
                    { text: "🏃 Ignorarlo y seguir avanzando", action: 'pass' }
                ]
            },
            'mage': {
                greeting: "Saludos, erudita de lo arcano. Tengo pergaminos que podrían interesarte.",
                choices: [
                    { text: "📖 Comprar Grimorio Arcano (+1 energía por turno, -40 Oro)", action: 'buy_mana' },
                    { text: "🧪 Comprar Poción de Salud (-30 Oro)", action: 'buy_potion' },
                    { text: "🏃 Seguir mi camino", action: 'pass' }
                ]
            },
            'rogue': {
                greeting: "He visto cosas en la sombra que te encantaría saber... a buen precio.",
                choices: [
                    { text: "🗡️ Robarle la mercancía con sigilo (Tirada D20)", action: 'steal' },
                    { text: "💧 Comprar Antídoto (-25 Oro)", action: 'buy:antidote' },
                    { text: "🏃 Pasar de largo", action: 'pass' }
                ]
            }
        }
    },

    // --- PLANTA 3: LA BRUJA DE LOS PANTANOS ---
    morgana: {
        id: 'morgana',
        name: 'Bruja Morgana',
        images: {
            room: 'img/morgana_room.png',
            talk: 'img/morgana_talk.png',
            romance: 'img/morgana_romance.png' // Primer plano de seducción / romance oscuro
        },
        type: 'witch',
        archetype: 'la Bruja Morgana, una hechicera oscura, misteriosa, seductora y enigmática',
        voice: 'Seductora y burlona, con confianza peligrosa. Ríe ("jejeje"), habla de calderos, hierbas, pantanos y venenos. Tutea y usa apelativos como "cariño" o "cielo".',
        dungeonLevel: 3, // <-- Aparece en la planta 3
        baseHp: 60,
        baseAtk: 14,
        interactions: {
            'mage': {
                greeting: "¡Jejeje! Veo el brillo de la verdadera magia en tus ojos. ¿Intercambiamos secretos?",
                choices: [
                    { text: "✨ Intercambiar conocimiento (+50 XP)", action: 'witch_knowledge' },
                    { text: "🔮 Atacar a la bruja", action: 'combat' }
                ]
            },
            'warrior': {
                type: 'romance',
                greeting: "Hueles a metal y sudor. Tu carne servirá para mis calderos, guerrero.",
                choices: [
                    { text: "🌹 \"Una belleza tan salvaje merece algo mejor que pelear. Hablemos...\"", action: 'morgana_romance_warrior' },
                    { text: "💬 Conversar con la Bruja", action: "custom_chat" },
                    { text: "🗡️ \"¡Prueba el filo de mi espada, bruja!\"", action: 'combat' },
                    { text: "💰 Pagar peaje para cruzar (-60 Oro)", action: 'buy' }
                ]
            },
            'rogue': {
                greeting: "Un alma corrupta... Me agradas. ¿Quieres comprar un veneno letal?",
                choices: [
                    { text: "💋 \"Contigo siempre apetece un buen trato bajo la luz de la luna...\"", action: 'morgana_romance' },
                    { text: "🗡️ Amenazarla", action: 'combat' },
                    { text: "🧪 Comprar Veneno de Filo (-40 Oro, +5 de daño)", action: 'buy_poison' },
                ]
            }
        }
    }
};