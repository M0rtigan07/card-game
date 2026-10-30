// js/data/npcLines.js
// Frases de respaldo: se usan solo cuando Groq no responde, tarda o repite una frase.
// Hay varias por personaje y tipo para que, aun sin IA, el diálogo no sea siempre igual.
//
// Tipos (key):  greeting · reaction · bought · no_gold · caught · offended
// Se busca primero el banco del PNJ; si no tiene ese tipo, el de `default`.

export const LAST_RESORT_LINE = 'El personaje te observa en silencio.';

export const FALLBACK_LINES = {
    default: {
        greeting: [
            'Un viajero más en estas profundidades... qué inesperado.',
            'Vaya, alguien que todavía respira por aquí.',
            'No esperaba compañía en una planta tan olvidada.'
        ],
        reaction: [
            'Interesante... no es lo que esperaba oír.',
            'Así que eso es lo que piensas. Veremos cuánto dura esa valentía.',
            'Hablas con descaro para estar tan lejos de la luz.',
            'Te escucho. Pero no prometo que me importe.'
        ],
        bought: [
            'Hecho está. Que te sea útil.',
            'Un placer hacer negocios contigo.',
            'Aquí tienes. Y no se hable más.'
        ],
        no_gold: [
            'Sin oro no hay trato, forastero.',
            'Tus bolsillos dicen una cosa y tu boca otra.',
            'Vuelve cuando tengas con qué pagar.'
        ],
        caught: [
            '¡Las manos quietas, rata!',
            '¡Te he visto! Eso te costará caro.',
            '¿De verdad creíste que no me daría cuenta?'
        ],
        offended: [
            'Qué descortesía... lo recordaré.',
            'Márchate, entonces. No eras tan interesante.',
            'Qué poco te ha durado la educación.'
        ]
    },

    valerius: {
        greeting: [
            'Qué encantadora osadía, mortal: entrar en mi cripta sin ser invitado.',
            'Tres siglos sin visitas, y me traen esto. Acércate, que la noche es larga.',
            'Huelo el miedo bajo tu armadura. Aun así, adelante.'
        ],
        reaction: [
            'Divertido. Casi me hace olvidar el hambre.',
            'Qué palabras tan valientes para un corazón que late tan deprisa.',
            'Los mortales siempre creéis que la elocuencia os salvará. Qué costumbre tan entrañable.',
            'Habla, habla. Cada palabra tuya es una gota menos en tu copa.'
        ]
    },

    morgana: {
        greeting: [
            'Jejeje... el pantano me susurró que vendrías, cariño.',
            'Pasa, pasa, que el caldero aún no está lleno y siempre cabe un ingrediente más.',
            'Ay, qué ojos tienes. Seguro que saben a algo interesante.'
        ],
        reaction: [
            'Jejeje, qué ocurrente. Casi me da pena hervirte.',
            'Mmm, esa respuesta tiene su gracia. Sigue, sigue.',
            'Hablas como quien conoce el precio de todo... y el valor de nada.',
            'Cuidado, cielo: las palabras bonitas también pueden envenenarse.'
        ]
    },

    vikinga: {
        greeting: [
            'Un extraño. Habla claro o desenvaina.',
            'Los dioses me envían a otro. Veamos si vales algo.',
            'Tu paso suena a hierro. Eso me agrada.'
        ],
        reaction: [
            'Bien dicho. O bien mentido. Pronto lo sabremos.',
            'Palabras de guerrero. Ahora muéstrame el acero.',
            'Odín escucha. No lo decepciones.',
            'Poca charla. Mucho honor. Esa es mi ley.'
        ]
    },

    mongol: {
        greeting: [
            'El viento me avisó de tus pasos, viajero.',
            'Siéntate. La estepa enseña que quien corre mucho no ve el camino.',
            'Un jinete sin caballo en una tierra sin cielo. Interesante.'
        ],
        reaction: [
            'Dices bien. Un río no discute con la piedra: la rodea.',
            'Escucho. El silencio también es respuesta, pero la tuya me gusta.',
            'En la estepa decimos: la flecha que dudó no llegó a nada.',
            'Tu respuesta tiene el tamaño de tu valor. Aún falta ver cuánto mide.'
        ]
    },

    barnaby: {
        greeting: [
            '¡Psst! Aquí, amigo. Tengo género que no encontrarás en ningún otro agujero.',
            'Mira qué suerte la mía: un cliente. Acércate, que no muerdo... mucho.',
            'Cuidado con lo que pisas, viajero. Los pasillos de aquí abajo cobran peaje.'
        ],
        reaction: [
            'Hmm, interesante... y nada barato, por cierto.',
            'Eso me han dicho antes, y siempre acababan pagando de más.',
            'Ya, ya. Todo el mundo tiene prisa hasta que llega la factura.',
            'Te daré un consejo gratis: lo bueno aquí abajo nunca sale barato.'
        ],
        bought: [
            '¡Excelente elección, viajero! Vuelve cuando quieras, siempre hay más.',
            'Hecho. Y no le digas a nadie dónde lo conseguiste.',
            'Cuidado con ese género, que es mejor de lo que cobro.'
        ],
        no_gold: [
            '¿Pretendes engañarme? ¡Sin oro no hay trato!',
            'Tus bolsillos suenan a hueco, amigo. Yo no fío.',
            'Vuelve con monedas y hablamos. Con promesas no se come.'
        ],
        caught: [
            '¡LADRÓN! ¡Las manos donde yo las vea!',
            '¡Te vi, sabandija! ¡Eso te va a costar sangre!',
            '¿Mi mercancía? ¡Ni lo sueñes, rata de alcantarilla!'
        ],
        offended: [
            '¡Bah, tacaño ingrato! ¡Que la oscuridad te devore en el próximo pasillo!',
            '¡Ni un vistazo a mis cosas! Qué poca educación en estos tiempos.',
            'Muy bien, muy bien. Ya vendrás llorando cuando te hagan falta.'
        ]
    }
};

/** Banco de frases para ese PNJ y tipo (con el genérico como plan B). */
export function fallbackPool(npcId, key) {
    return FALLBACK_LINES[npcId]?.[key] ?? FALLBACK_LINES.default[key] ?? [];
}
