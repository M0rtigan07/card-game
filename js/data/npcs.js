// js/data/npcs.js
export const NPC_DATABASE = {
    valerius: {
        id: 'valerius',
        name: 'Conde Valerius',
        // Rutas de las imágenes según el estado de la interacción
        images: {
            room: 'img/conde_pasillo.png',       // Imagen amplia de la sala (estilo Elvira)
            talk: 'img/conde_charla.png',       // Primer plano elegante de charla (estilo Monkey Island)
            enraged: 'img/conde_enojado.png'  // Primer plano furioso antes del combate TCG
        },
        type: 'vampire_lord',
        description: 'Un aristócrata inmortal de la noche, soberbio y dueño absoluto de estas criptas.',
        baseHp: 70,
        baseAtk: 16,
        
        deck: [
            { name: '🍷 Mordisco Noblesse', type: 'atk', val: 18, desc: 'Ataque vampírico pesado' },
            { name: '🦇 Capa de Sombras', type: 'def', val: 12, desc: 'Gana 12 de escudo' },
            { name: '🔮 Seducción Oscura', type: 'atk', val: 24, desc: 'Daño mental/arcano' }
        ],

        interactions: {
            'mage': {
                type: 'romance',
                greeting: "Vaya... Una hechicera de sangre pura recorre mi cripta. Siento el fuego arcano latiendo en tus venas, mi dama. Sería una lástima manchar de sangre una presencia tan fascinante... Acepta mi copa o demuestra si tu magia rivaliza con la mía.",
                choices: [
                    { text: "🍷 \"Acepto tu copa, Conde. Hablemos de poder... y de sombras.\"", action: 'romance_accept' },
                    { text: "✨ \"Guarda tus halagos, vampiro. Mi magia no se vende tan fácil.\"", action: 'flirt_challenge' },
                    { text: "🗡️ \"Tu encanto no funciona conmigo. ¡Desenfunda!\"", action: 'combat' }
                ]
            },
            'warrior': {
                type: 'rivalry',
                greeting: "Un patético bulto de acero profana mis aposentos. ¿Crees que tu espada mellada me asusta, mortal? Hincaras la rodilla ante el verdadero señor de estas tierras.",
                choices: [
                    { text: "🗡️ [FUERZA] \"Mi acero acabará con tu soberbia. ¡Lucha!\"", action: 'combat' },
                    { text: "💰 \"Acepta este tributo de oro y abre paso, chupasangre.\"", action: 'buy' },
                    { text: "🏃 \"Me largo de este apestoso salón.\"", action: 'pass' }
                ]
            },
            'rogue': {
                type: 'pact',
                greeting: "Un ratón sigiloso acecha en mis dominios... Interesante. Los ladrones astutos pueden ser útiles antes de ser devorados.",
                choices: [
                    { text: "🤝 \"Hagamos un trato: información y oro a cambio de mi silencio.\"", action: 'pact_accept' },
                    { text: "🗡️ \"No pacto con monstruos. ¡A las armas!\"", action: 'combat' }
                ]
            }
        }
    }
};