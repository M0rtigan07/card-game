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
        dungeonLevel: 5,
        baseHp: 50,
        baseAtk: 14,
        interactions: {
            choices: [
                { text: "🏹 Pedirle consejo sobre los peligros de la mazmorra", action: 'witch_knowledge' },
                { text: "💰 Comprar flechas envenenadas (-40 Oro)", action: 'buy_poison' },
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
        dungeonLevel: 1, // <-- Aparece en la planta 1
        baseHp: 40,
        baseAtk: 8,
        interactions: {
            'warrior': {
                greeting: "¡Psst! ¿Buscas equipamiento, viajero? Los pasillos de aquí abajo no perdonan a los imprudentes.",
                choices: [
                    { text: "💰 Comprar poción de salud (-30 Oro)", action: 'buy_potion' },
                    { text: "🏃 Ignorarlo y seguir avanzando", action: 'pass' }
                ]
            },
            'mage': {
                greeting: "Saludos, erudita de lo arcano. Tengo pergaminos que podrían interesarte.",
                choices: [
                    { text: "🔮 Comprar grimorio (+10 Maná max, -40 Oro)", action: 'buy_mana' },
                    { text: "🏃 Seguir mi camino", action: 'pass' }
                ]
            },
            'rogue': {
                greeting: "He visto cosas en la sombra que te encantaría saber... a buen precio.",
                choices: [
                    { text: "🗡️ Robarle la mercancía con sigilo (Tirada D20)", action: 'steal' },
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
                    { text: "🗡️ \"¡Prueba el filo de mi espada, bruja!\"", action: 'combat' },
                    { text: "💰 Pagar peaje para cruzar (-60 Oro)", action: 'buy' }
                ]
            },
            'rogue': {
                greeting: "Un alma corrupta... Me agradas. ¿Quieres comprar un veneno letal?",
                choices: [
                    { text: "💋 \"Contigo siempre apetece un buen trato bajo la luz de la luna...\"", action: 'morgana_romance' },
                    { text: "🗡️ Amenazarla", action: 'combat' },
                    { text: "🧪 Comprar veneno para las cartas", action: 'buy_poison' },
                ]
            }
        }
    }
};