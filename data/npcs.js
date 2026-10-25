// js/data/npcs.js
export const NPC_DATABASE = {
    valerius: {
        id: 'valerius',
        name: 'Conde Valerius',
        img: 'img/conde_valerius.jpg', // Guarda la imagen del Conde aquí
        type: 'vampire_lord',
        description: 'Un aristócrata inmortal de la noche con siglos de poder, elegancia y magnetismo.',
        baseHp: 70,
        baseAtk: 16,
        
        // MAZO TCG PERSONALIZADO SI SE LLEGA AL COMBATE
        deck: [
            { name: '🍷 Mordisco Noblesse', type: 'atk', val: 18, desc: 'Ataque vampírico pesado' },
            { name: '🦇 Capa de Sombras', type: 'def', val: 12, desc: 'Gana 12 de escudo' },
            { name: '🔮 Seducción Oscura', type: 'atk', val: 24, desc: 'Daño mental/arcano' }
        ],

        // RAMIFICACIONES NARRATIVAS SEGÚN LA CLASE DEL JUGADOR
        interactions: {
            'mage': {
                type: 'romance',
                greeting: "Vaya... Una hechicera de sangre pura recorre mi cripta. Siento el fuego arcano latiendo en tus venas, mi dama. Sería una lástima manchar de sangre una presencia tan fascinante... Acepta mi copa o demuestra si tu magia rivaliza con la mía.",
                choices: [
                    { 
                        text: "🍷 \"Acepto tu copa, Conde. Hablemos de poder... y de sombras.\"", 
                        action: 'romance_accept' 
                    },
                    { 
                        text: "✨ \"Guarda tus halagos, vampiro. Mi magia no se vende tan fácil.\"", 
                        action: 'flirt_challenge' 
                    },
                    { 
                        text: "🗡️ \"Tu encanto no funciona conmigo. ¡Desenfunda!\"", 
                        action: 'combat' 
                    }
                ]
            },
            'warrior': {
                type: 'rivalry',
                greeting: "Un guerrero de acero y músculo profana mis aposentos. Veo la furia en tus ojos y el olor del combate en tu armadura... ¿Acompañará tu espada a la legión de caídos o tienes el valor de desafiarme?",
                choices: [
                    { 
                        text: "🗡️ [FUERZA] \"Mi acero acabará con tu reinado de terror. ¡Lucha!\"", 
                        action: 'combat' 
                    },
                    { 
                        text: "💰 \"Acepta este tributo de oro y déjame pasar sin derramar sangre.\"", 
                        action: 'buy' 
                    },
                    { 
                        text: "🏃 \"Buscaré un paso subterráneo alternativo.\"", 
                        action: 'pass' 
                    }
                ]
            },
            'rogue': {
                type: 'pact',
                greeting: "Un escurridizo pícaro entre las sombras... Veo que buscas tesoros, no la muerte. Las sombras de esta mazmorra me pertenecen, pero un mortal astuto siempre puede ser útil.",
                choices: [
                    { 
                        text: "🤝 \"Dime qué necesitas y nos repartiremos el botín de la planta.\"", 
                        action: 'pact_accept' 
                    },
                    { 
                        text: "🗡️ \"Las sombras no tienen dueño. ¡A defenderte!\"", 
                        action: 'combat' 
                    }
                ]
            }
        }
    }
};