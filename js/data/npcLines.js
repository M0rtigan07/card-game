// js/data/npcLines.js
// Frases de respaldo: se usan solo cuando Groq no responde, tarda o repite una frase.
// Hay varias por personaje y tipo para que, aun sin IA, el diálogo no sea siempre igual.
//
// Tipos (key):  greeting · reaction · bought · no_gold · caught · offended
//               combat_start · combat_attack · combat_other · combat_hurt · combat_defeat · combat_victory
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
        ],
        combat_start: [
            'Prepárate, no pienso ponértelo fácil.',
            'Aquí termina tu camino.',
            'Veremos cuánto aguantas.'
        ],
        combat_attack: [
            '¡Toma esto!',
            '¡No escaparás!',
            '¡Cae de una vez!'
        ],
        combat_other: [
            'Aún no has ganado.',
            'Eso no me detendrá.',
            'Sigo en pie.'
        ],
        combat_hurt: [
            '¡Eso ha dolido!',
            'Me las pagarás.'
        ],
        combat_defeat: [
            'No... no puede ser...',
            'Has ganado... esta vez.'
        ],
        combat_victory: [
            'Tan débil...',
            'Se acabó.'
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
        ],
        combat_start: [
            'Tres siglos sin un buen banquete. Gracias por venir, mortal.',
            'Desenvaina, si quieres. Hará el festín más entretenido.',
            'Qué valiente... y qué sabroso aroma a miedo.'
        ],
        combat_attack: [
            '¡Siente el abrazo de la noche eterna!',
            'Un mordisco, mortal. Solo uno... por ahora.',
            'Qué dulce suena tu sangre al derramarse.'
        ],
        combat_other: [
            'La noche me protege, ¿no lo notas?',
            'Pobre criatura, no puedes tocar lo que ya está muerto.',
            'Observa y aprende, mortal.'
        ],
        combat_hurt: [
            '¡Insolente! Esa herida la pagarás con siglos de agonía.',
            'Mi sangre... has osado derramar mi sangre.'
        ],
        combat_defeat: [
            'Imposible... una eternidad desperdiciada ante un simple mortal.',
            'Recuerda mi nombre, mortal. La noche volverá.'
        ],
        combat_victory: [
            'Tan frágil... igual que todos. Descansa, mortal.',
            'Otro más para mi colección de olvidados.'
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
        ],
        combat_start: [
            'Jejeje, qué guapo llegas, cariño. Qué bien lucirás en mi caldero.',
            'Ven, ven... que el pantano tiene hambre.',
            'Cuidado con tropezar, cielo: todo aquí abajo muerde.'
        ],
        combat_attack: [
            '¡Toma mi pócima, cariño, está recién hervida!',
            'Jejeje, ¡esto pica un poquito!',
            'Un traguito de ácido nunca hizo mal a nadie... ¡jejeje!'
        ],
        combat_other: [
            'Un hechizo por aquí, un velo por allá...',
            'Jejeje, ¿creías que sería tan fácil, cielo?',
            'Ay, qué torpe eres; los venenos requieren paciencia.'
        ],
        combat_hurt: [
            '¡Ay! ¡Mi hermoso rostro, desgraciado!',
            'Eso ha dolido... y ahora me has enfadado de verdad.'
        ],
        combat_defeat: [
            'Jejeje... el pantano... recordará esto...',
            'Qué pena, cariño... tenía recetas tan buenas para ti.'
        ],
        combat_victory: [
            'Jejeje, qué buen ingrediente acabas de convertirte.',
            'Dulces sueños, cielo. El caldero te espera.'
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
        ],
        combat_start: [
            'Pronto cantarán tu muerte en el Valhalla. Desenvaina.',
            'Odín mira. Muéstrame tu valor.',
            'Habla con tu acero. Es el único idioma que respeto.'
        ],
        combat_attack: [
            '¡Por Odín!',
            '¡Prueba el hacha de Astrid!',
            '¡Sangre y honor!'
        ],
        combat_other: [
            'Escudos arriba. Aquí nadie pasa.',
            'Aguanto lo que haga falta.',
            'Un guerrero resiste. Siempre.'
        ],
        combat_hurt: [
            '¡Ja! Por fin una herida digna.',
            'Sangro, sí. Y me gusta.'
        ],
        combat_defeat: [
            'Bien peleado. El Valhalla me espera.',
            'Cuéntalo en mi nombre. Con honor.'
        ],
        combat_victory: [
            'Cae con honor. Odín te recibirá.',
            'Buena pelea. Ahora descansa.'
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
        ],
        combat_start: [
            'El viento trae tu nombre, viajero. Veremos si lo lleva lejos.',
            'La flecha no discute con su blanco. Prepárate.',
            'Tranquilo. El cielo ya decidió; solo falta que yo dispare.'
        ],
        combat_attack: [
            'La estepa no perdona.',
            'Una flecha, un destino.',
            'El viento guía mi mano.'
        ],
        combat_other: [
            'El jinete sabio sabe cuándo retirarse.',
            'Quien tiene paciencia gana la estepa.',
            'Respira. La tormenta pasa.'
        ],
        combat_hurt: [
            'Buen disparo, viajero. Pero el halcón no cae tan fácil.',
            'Hasta el roble más viejo sangra.'
        ],
        combat_defeat: [
            'La estepa te recordará, viajero.',
            'Mi último viento sopla a tu favor.'
        ],
        combat_victory: [
            'El cielo lo quiso así. Descansa, viajero.',
            'Tu viaje termina aquí. Que el viento te lleve.'
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
        ],
        combat_start: [
            '¡Eh, eh, tranquilo! ¿No podemos hablar de precios, amigo?',
            '¡Mi mercancía! Sobre mi cadáver... aunque preferiría que no.',
            'Ya me lo temía: otro cliente descontento.'
        ],
        combat_attack: [
            '¡Toma este frasco, ladrón!',
            '¡Para que aprendas a regatear, malandrín!',
            '¡Y esto de parte de mi bolsillo!'
        ],
        combat_other: [
            '¡Un momento, un momento, déjame cubrirme!',
            '¡Aparta, que me manchas el género!',
            'Barato no es, pero funciona.'
        ],
        combat_hurt: [
            '¡Ay, ay! Eso no entraba en el trato.',
            '¡Me has roto la chaqueta! Esto te saldrá caro.'
        ],
        combat_defeat: [
            'Está bien, está bien, ¡me rindo! Llévate lo que quieras.',
            'Mi pobre negocio... arruinado...'
        ],
        combat_victory: [
            'Uf... ¿ves lo que pasa por no pagar?',
            'Qué desperdicio de cliente...'
        ]
    },

    corrupto: {
        combat_start: [
            'Juré proteger este reino y míralo ahora. Defiéndete.',
            'No hay honor aquí abajo, solo acero.',
            'Otro necio con espada. Que empiece.'
        ],
        combat_attack: [
            'Un golpe por cada juramento roto.',
            'Cae de una vez.',
            'El acero no miente.'
        ],
        combat_other: [
            'Mi armadura ha visto cosas peores.',
            'No cederé. No me queda nada más.',
            'Esperaré. Todo cae al final.'
        ],
        combat_hurt: [
            'He sentido cosas peores... pero no muchas.',
            'Buen golpe. Hacía siglos que no sangraba.'
        ],
        combat_defeat: [
            'Al fin... descanso. Gracias.',
            'Dile al reino que lo intenté.'
        ],
        combat_victory: [
            'Otro más que no pudo.',
            'Así termina todo. Sin gloria.'
        ]
    },

    automata: {
        combat_start: [
            'Objetivo detectado. Iniciando protocolo de eliminación.',
            'Unidad activa. Tu presencia es una anomalía.',
            'Análisis completo. Probabilidad de supervivencia: baja.'
        ],
        combat_attack: [
            'Ejecutando secuencia de impacto.',
            'Golpe calculado. Daño estimado: suficiente.',
            'Aplicando fuerza máxima.'
        ],
        combat_other: [
            'Activando sistemas de reparación.',
            'Recalculando táctica.',
            'Blindaje reforzado. Continuando protocolo.'
        ],
        combat_hurt: [
            'Daño estructural detectado. Continuando operación.',
            'Error. Integridad al límite. Ajustando.'
        ],
        combat_defeat: [
            'Sistemas fallando. Registro final guardado.',
            'Unidad inoperativa. Apagando.'
        ],
        combat_victory: [
            'Objetivo eliminado. Volviendo a modo de espera.',
            'Amenaza neutralizada. Protocolo completado.'
        ]
    },

    orco: {
        combat_start: [
            '¡Orco aplasta humano! ¡Orco tiene hambre!',
            '¡WAAAGH! ¡Tú ser cena!',
            '¡Capitán Orco romper huesos hoy!'
        ],
        combat_attack: [
            '¡Orco golpear fuerte!',
            '¡AAARGH! ¡Toma esto!',
            '¡Aplastar, aplastar, aplastar!'
        ],
        combat_other: [
            '¡Orco no rendirse!',
            '¡Orco más duro que tú!',
            '¡Orco comer, orco curar!'
        ],
        combat_hurt: [
            '¡Ay! ¡Eso doler! ¡Orco enfadar mucho!',
            '¡Pequeño humano pegar fuerte! ¡Orco gustar!'
        ],
        combat_defeat: [
            '¡Orco caer... mal capitán...',
            '¡Humano fuerte... orco respetar...'
        ],
        combat_victory: [
            '¡Orco ganar! ¡Orco comer!',
            '¡Débil humano! ¡Fácil!'
        ]
    },

    gargola: {
        combat_start: [
            'Hace mil años que espero. Tu polvo será bienvenido.',
            'Piedra fui, piedra soy. Tú serás ceniza.',
            'Los siglos me enseñaron paciencia. A ti te enseñaré dolor.'
        ],
        combat_attack: [
            'La piedra no olvida.',
            'Siente el peso de los siglos.',
            'Cae, como caen las ruinas.'
        ],
        combat_other: [
            'Soy muro. Soy eterno.',
            'Nada araña mi piedra.',
            'Los siglos me endurecen.'
        ],
        combat_hurt: [
            'Una grieta... en mil años, la primera.',
            'Mi piedra se quiebra. Interesante.'
        ],
        combat_defeat: [
            'Vuelvo al polvo del que nací.',
            'Mil años de espera... y qué breve ha sido.'
        ],
        combat_victory: [
            'Otro nombre más grabado en mi memoria fría.',
            'Polvo eres, y al polvo vuelves.'
        ]
    },

    hechicero: {
        combat_start: [
            'Fascinante. Un sujeto de pruebas que viene por voluntad propia.',
            'Observa, ignorante: esto es el verdadero poder arcano.',
            'No me interrumpas; calculo cuánto durarás.'
        ],
        combat_attack: [
            'Una ecuación sencilla: tú menos tu vida.',
            'Magia refinada. Algo que no entenderías.',
            'Los fundamentos del dolor, aplicados.'
        ],
        combat_other: [
            'Un hechizo básico. Para ti, imposible.',
            'Como era de esperar, ya lo tenía previsto.',
            'Elemental, querido ignorante.'
        ],
        combat_hurt: [
            '¡Imposible! Mi hipótesis no contemplaba esto.',
            'Impertinente. Eso no estaba en mis cálculos.'
        ],
        combat_defeat: [
            'Un error de cálculo... inaceptable.',
            'Mis tomos... mis hermosos tomos...'
        ],
        combat_victory: [
            'Previsible. Concluyo mi experimento.',
            'Resultado: el esperado. Otro fracaso humano.'
        ]
    },

    dragon: {
        combat_start: [
            'Hormiga... ¿te atreves a entrar en mi cubil?',
            'Hace eras que nadie osa despertarme. Que sea tu última osadía.',
            'Mi fuego ha derretido reinos. Tú serás un suspiro.'
        ],
        combat_attack: [
            '¡Arde ante mi llama ancestral!',
            '¡Siente el rugido de las eras!',
            '¡Ceniza serás, pequeña criatura!'
        ],
        combat_other: [
            'Mis escamas han visto morir imperios.',
            'Ni mil espadas rasguñarán mi legado.',
            'Arde en mí la furia de los siglos.'
        ],
        combat_hurt: [
            '¡Insolente hormiga! Has hecho sangrar a un dragón.',
            'Rugiré tan fuerte que temblarán las montañas.'
        ],
        combat_defeat: [
            'Un dragón caído... las eras lo recordarán.',
            'Digno oponente. Mi tesoro es tuyo.'
        ],
        combat_victory: [
            'Ceniza y silencio. Como debía ser.',
            'Otro valiente más para mi tesoro de huesos.'
        ]
    }
};

/** Banco de frases para ese PNJ y tipo (con el genérico como plan B). */
export function fallbackPool(npcId, key) {
    return FALLBACK_LINES[npcId]?.[key] ?? FALLBACK_LINES.default[key] ?? [];
}
