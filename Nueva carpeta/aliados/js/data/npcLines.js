// js/data/npcLines.js
// Frases de respaldo: se usan solo cuando Groq no responde, tarda o repite una frase.
// Hay varias por personaje y tipo para que, aun sin IA, el diálogo no sea siempre igual.
//
// Tipos (key):  greeting · reaction · bought · no_gold · already_owned · caught · offended
//               chat_open · chat_free · chat_<tema> (who, place, advice, rumors, boss y los propios de cada personaje)
//               Aliados: chat_values · chat_persuade_good · chat_persuade_bad · chat_recruited · chat_locked
//               combat_start · combat_attack · combat_other · combat_hurt · combat_phase · combat_defeat · combat_victory
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
        ],
        already_owned: [
            'Eso ya lo llevas encima.',
            'No te venderé dos veces lo mismo.',
            'Mira bien tu inventario, viajero.'
        ],
        combat_phase: [
            '¡Esto no ha terminado!',
            'Ahora te enseñaré mi verdadero poder.'
        ],
        chat_open: [
            'Te escucho.',
            'Habla, viajero.',
            'Adelante, di lo que quieras.'
        ],
        chat_who: [
            'Un habitante más de estas profundidades. Nada que contar.',
            'Alguien que ha sobrevivido hasta aquí. Eso basta.'
        ],
        chat_place: [
            'Un lugar peligroso. Ten cuidado.',
            'Hay mucho que temer aquí abajo.'
        ],
        chat_advice: [
            'Mira lo que va a hacer tu enemigo antes de actuar.',
            'Cuida tu energía y tus pociones.'
        ],
        chat_rumors: [
            'Dicen que cada cinco plantas hay un guardián.',
            'Se murmura que los jefes cambian al estar heridos.'
        ],
        chat_boss: [
            'Más adelante hay un jefe. Prepárate.',
            'Un guardián espera. No vayas con la vida baja.'
        ],
        chat_free: [
            'No sé qué decirte a eso.',
            'Pregúntame otra cosa.',
            'Eso se me escapa.'
        ],
        chat_values: [
            'Valoro lo mismo que cualquiera: que me traten con respeto.',
            'Pregúntame otra cosa; eso no lo tengo claro.'
        ],
        chat_persuade_good: [
            'Hmm... eso suena razonable.',
            'Sigue, me estás convenciendo.'
        ],
        chat_persuade_bad: [
            'Eso no me convence.',
            'Prueba con otra cosa.'
        ],
        chat_recruited: [
            'De acuerdo, me uno a ti.',
            'Está bien, iré contigo.'
        ],
        chat_locked: [
            'Se acabó la conversación.',
            'No quiero oír más.'
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
        ],
        chat_open: [
            'Habla, mortal. Mi paciencia es larga, pero mi sed no.',
            'Te concedo unas palabras. Elígelas con elegancia.'
        ],
        chat_who: [
            'Soy el Conde Valerius, señor de estas criptas desde antes de que tu reino tuviera nombre.',
            'Un caballero de la noche, mortal. Algunos dicen vampiro; qué vulgar.'
        ],
        chat_place: [
            'Esta mazmorra es un cuerpo vivo, mortal: cada planta, una cámara de su corazón podrido.',
            'Aquí abajo todo tiene dueño. Y casi todo tiene hambre.'
        ],
        chat_advice: [
            'Mira siempre la jugada de tu enemigo antes de actuar: la ignorancia es el lujo de los muertos.',
            'Guarda tus pociones para cuando de verdad sangres, mortal. Y no malgastes la energía.'
        ],
        chat_rumors: [
            'Dicen que un orco con delirios de grandeza manda en las plantas profundas. Qué pintoresco.',
            'Se murmura que la Dama de la Noche no recibe visitas... salvo las que pueden alimentarla.'
        ],
        chat_boss: [
            'Más abajo aguarda algo que ni yo desafiaría sin cena previa. Ve preparado.',
            'Un guardián te espera, mortal. Trae paciencia para romper su armadura y para sus cambios.'
        ],
        chat_free: [
            'Hmm. Qué ocurrencia. Pregúntame algo más digno de mi eternidad.',
            'Divertido, mortal. Pero no tengo respuesta para eso.',
            'Tus palabras me aburren y me entretienen a partes iguales. Prueba otra.'
        ],
        chat_eternity: [
            'Tres siglos mirando la misma piedra. Por eso agradezco cualquier visita, aunque sea comida.',
            'La eternidad es un banquete sin hambre, mortal. Lo difícil es no aburrirse.'
        ],
        chat_values: [
            'El poder, el linaje y el trato debido a un noble, mortal. La súplica y los sermones los dejo a los débiles.',
            'Quiero que me traten como a un conde, no como a un monstruo ni como a un mendigo.'
        ],
        chat_persuade_good: [
            'Hmm... hablas como alguien que entiende de rangos, mortal.',
            'Un argumento digno de un noble. Continúa.'
        ],
        chat_persuade_bad: [
            'Qué vulgar, mortal. Un conde no se rebaja a escuchar eso.',
            'Redención, súplicas... qué aburrimiento.'
        ],
        chat_recruited: [
            'Acepto tu pacto, mortal: el Conde Valerius te acompañará. Un honor que pocos reciben.',
            'Que así sea. Será entretenido caminar entre los vivos.'
        ],
        chat_locked: [
            'Se acabó, mortal. Mi paciencia es eterna, pero no para ti.',
            'No volveré a escucharte. Retírate.'
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
        ],
        bought: [
            'Jejeje, buena elección, cariño. Úsalo con cuidado.',
            'Un regalito de la casa... bueno, no tan regalito.',
            'Ay, qué bien te sienta. Cuídalo.'
        ],
        no_gold: [
            'Sin oro no hay magia, cielo.',
            'Jejeje, tus bolsillos están más vacíos que mi caldero en invierno.',
            'Vuelve cuando pese tu bolsa, cariño.'
        ],
        already_owned: [
            'Jejeje, ya lo llevas, cariño. No seas goloso.',
            'Dos veces no funciona, cielo. La magia no se duplica.',
            'Mira en tu bolsa, tontorrón.'
        ],
        chat_open: [
            'Dime, cielo, ¿qué se te ha perdido en mi pantano?',
            'Jejeje, habla, habla... que el caldero escucha.'
        ],
        chat_who: [
            'Soy Morgana, la bruja del pantano. Remedios, venenos y algún que otro secretillo, cariño.',
            'Digamos que cocino lo que otros temen, cielo.'
        ],
        chat_place: [
            'La mazmorra respira, cariño. Y a veces suspira por las plantas de abajo.',
            'Cada piso guarda un hambre distinta. Yo me quedo con los hongos.'
        ],
        chat_advice: [
            'Un veneno a tiempo vale más que diez espadas, cielo. Y un antídoto, más que veinte.',
            'No gastes toda tu energía de golpe, cariño: la paciencia es la mejor receta.'
        ],
        chat_rumors: [
            'Dicen que unos escorpiones con malas pulgas hacen contratos muy... definitivos.',
            'Jejeje, se cuenta que un dragón duerme sobre un tesoro. Despertarlo es cosa tuya, cielo.'
        ],
        chat_boss: [
            'Huelo algo grande más abajo, cariño: carne dura, armadura gorda y mal humor.',
            'El guardián de la próxima planta no perdona, cielo. Llévate remedios.'
        ],
        chat_free: [
            'Jejeje, qué cosas dices, cariño. Pregunta otra, anda.',
            'Eso ni mi caldero lo sabe, cielo.',
            'Ay, qué curioso... pero de eso no sé nada. Prueba con otra pregunta.'
        ],
        chat_cauldron: [
            'Un poco de hongo, un poco de rencor y una pizca de olvido, cielo. No preguntes más.',
            'Una sopa para quien llega sin invitación, cariño. Jejeje.'
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
        ],
        chat_open: [
            'Habla. Sin rodeos.',
            'Tienes un momento. Úsalo bien.'
        ],
        chat_who: [
            'Astrid la Escudera. Guerrera. El resto no importa.',
            'Escudo en una mano y hacha en la otra. Eso soy.'
        ],
        chat_place: [
            'Un nido de cobardes y de bestias. Me gusta.',
            'Fría, oscura y llena de enemigos. Perfecta para morir con honor.'
        ],
        chat_advice: [
            'Escudo antes de golpe, si el enemigo golpea fuerte. Honor no es morir por tonto.',
            'Mira lo que va a jugar el enemigo. Un buen guerrero lee a su rival.'
        ],
        chat_rumors: [
            'Dicen que una dama de la noche baila con quien llega solo. No acabes en su baile.',
            'Se habla de un jefe orco que grita mucho. Los que gritan, caen.'
        ],
        chat_boss: [
            'Delante hay un jefe. Rómpele la armadura y no corras.',
            'Un gran enemigo te espera. Llévalo al límite y él mismo cambiará.'
        ],
        chat_free: [
            'No te entiendo, o no quiero. Pregunta claro.',
            'Poca charla. Otra pregunta.',
            'Eso no me importa. Prueba con algo útil.'
        ],
        chat_valhalla: [
            'El Valhalla es la sala de los valientes. Allí no entra quien huye.',
            'Un banquete eterno para quien muere con el arma en la mano. Eso espero.'
        ],
        chat_values: [
            'Honor, fuerza y gloria: eso valoro. Y desprecio al que me trata como a alguien débil.',
            'Luchar al lado de quien no retrocede. Lo demás, charla.'
        ],
        chat_persuade_good: [
            'Ahora sí hablas como guerrero.',
            'Eso me gusta. Sigue.'
        ],
        chat_persuade_bad: [
            '¿Débil, yo? Cuida tus palabras.',
            'Eso suena a cobardía. Elige otra.'
        ],
        chat_recruited: [
            'Tu valor y el mío, juntos. Odín nos mira. Iré contigo.',
            'Hecho. Mi escudo es tuyo, guerrero.'
        ],
        chat_locked: [
            'Basta. No luchamos del mismo lado.',
            'Se acabó la charla. Lárgate.'
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
        ],
        bought: [
            'Bien elegido. Úsalo con paciencia, viajero.',
            'La flecha ahora es tuya. Que el viento te guíe.',
            'Un buen trato, como entre jinetes.'
        ],
        no_gold: [
            'Sin plata no hay flechas, viajero.',
            'La estepa no regala nada. Vuelve con monedas.',
            'Tu bolsa está ligera como el viento.'
        ],
        already_owned: [
            'Ya portas ese veneno, viajero. Una flecha no se afila dos veces.',
            'Mira en tu aljaba: ya lo tienes.',
            'El halcón no pide lo que ya tiene.'
        ],
        chat_open: [
            'Habla, viajero. El viento no tiene prisa.',
            'Siéntate un momento. La estepa enseña a escuchar.'
        ],
        chat_who: [
            'Batu Jan, arquero de las estepas. Hoy, nómada en una tierra sin cielo.',
            'Un jinete sin caballo, viajero. Pero con buena puntería.'
        ],
        chat_place: [
            'Un lugar sin viento y sin cielo. Por eso me inquieta.',
            'Las paredes recuerdan a los que cayeron. Escúchalas con respeto.'
        ],
        chat_advice: [
            'El que apunta con calma acierta. No gastes toda tu energía en un solo turno.',
            'Mira la flecha del enemigo antes de que salga. El halcón lee el viento.'
        ],
        chat_rumors: [
            'Dicen que un dragón vigila un tesoro mucho más abajo. Quizá sea solo viento.',
            'Se cuenta que los escorpiones cobran por cada cabeza. Ve con cuidado, viajero.'
        ],
        chat_boss: [
            'Más adelante camina algo grande. Rómpele la guardia con paciencia, como se doma un caballo salvaje.',
            'El guardián de abajo cambia cuando sangra. Que no te sorprenda.'
        ],
        chat_free: [
            'El viento no me trae esa respuesta, viajero.',
            'No sé qué decirte. Pregunta otra cosa.',
            'Hay preguntas que solo el cielo contesta. Esa es una.'
        ],
        chat_wind: [
            'Dice que algo antiguo se despierta abajo, viajero. Y que no le gustan las visitas.',
            'Aquí no hay viento, y eso es lo que más me asusta.'
        ],
        chat_values: [
            'Valoro la palabra dada y el respeto entre quienes comparten camino, viajero. Al oro y a las amenazas les doy la espalda.',
            'Echo de menos el cielo abierto. Y no hay trato que sustituya a un compañero leal.'
        ],
        chat_persuade_good: [
            'Hmm... hablas como un jinete, viajero. Continúa.',
            'Eso suena a camino compartido. Me gusta.'
        ],
        chat_persuade_bad: [
            'El viento no se vende ni se asusta, viajero. Prueba otra cosa.',
            'Eso me ofende, jinete. Elige mejor tus palabras.'
        ],
        chat_recruited: [
            'Tu palabra tiene peso, viajero. Mi arco cabalgará contigo.',
            'Está decidido: dos jinetes, un camino. Vamos.'
        ],
        chat_locked: [
            'El viento no soporta a quien miente o amenaza. Aquí acaba la charla, viajero.',
            'No hay más que hablar. Sigue tu camino sin mí.'
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
        ],
        already_owned: [
            '¡Pero si ya tienes uno, amigo! Yo no vendo dos veces lo mismo.',
            'Ja, ¿te falla la memoria? Eso ya lo llevas encima.',
            'Guarda tu oro, que ese género ya es tuyo.'
        ],
        chat_open: [
            '¿Conversación, amigo? Gratis; lo que hay detrás, no.',
            'Venga, suelta: ¿qué quieres saber?'
        ],
        chat_who: [
            'Barnaby el Buhonero, para servirle. Compro, vendo y cotilleo, por ese orden.',
            'Un humilde comerciante, viajero. Con más deudas que escrúpulos.'
        ],
        chat_place: [
            'Un mal sitio con buenos clientes, amigo. Todo el que baja necesita algo.',
            'Peligroso, oscuro y bastante húmedo. Ni cobran alquiler, qué locura.'
        ],
        chat_advice: [
            'Compra una poción antes de necesitarla, amigo: luego sube de precio, ja.',
            'Los objetos se usan desde el inventario, viajero. No los dejes criando polvo.'
        ],
        chat_rumors: [
            'Oí que un orco jefe tiene la mala costumbre de comerse a sus visitantes. Qué poco comercial.',
            'Dicen que una vampira muy elegante invita a cenar... y el menú eres tú.'
        ],
        chat_boss: [
            'Un pez gordo guarda la próxima planta, amigo. Lleva pociones. Yo vendo, por cierto.',
            'Algo enorme te espera, viajero. Mi consejo: antídotos y buena guardia.'
        ],
        chat_free: [
            'Ni idea, amigo, y no cobro por no saber. Pregunta otra.',
            'Eso no lo vendo, viajero. Prueba con otra.',
            'Mmm. Se me escapa. ¿Algo más?'
        ],
        chat_wares: [
            'Pociones, frascos, antídotos... lo mío es lo útil, amigo. Mira qué te ofrezco.',
            'Lo mejor del género, y casi todo legal. Echa un vistazo a mis precios.'
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
    },

    orco_jefe: {
        greeting: [
            '¡Gorgrim ver pequeño humano! ¡Gorgrim hacer collar con tus dientes!',
            '¡Horda, mirad! ¡Comida venir sola!',
            '¡Aquí mandar Gorgrim! ¡Humano pagar peaje con huesos!'
        ],
        combat_start: [
            '¡WAAAGH! ¡Horda, a por él!',
            '¡Gorgrim romper humano en dos!',
            '¡Hoy Gorgrim cenar héroe!'
        ],
        combat_attack: [
            '¡Gorgrim aplastar!',
            '¡Toma hacha de jefe!',
            '¡Horda, mirad cómo se hace!'
        ],
        combat_other: [
            '¡Gorgrim no caer! ¡Gorgrim ser jefe!',
            '¡Horda, cubrid a Gorgrim!',
            '¡Gorgrim comer, Gorgrim más fuerte!'
        ],
        combat_hurt: [
            '¡Ay! ¡Humano pegar duro! ¡Gorgrim enfadar!',
            '¡Sangre de Gorgrim! ¡Humano morir lento!'
        ],
        combat_phase: [
            '¡AAARGH! ¡Ahora Gorgrim ir en serio!',
            '¡Frenesí! ¡Gorgrim no sentir dolor!'
        ],
        combat_defeat: [
            '¡Gorgrim... jefe caer... horda sin jefe...',
            'Humano fuerte... Gorgrim respetar... un poco...'
        ],
        combat_victory: [
            '¡Gorgrim ganar! ¡Horda, a comer!',
            '¡Gorgrim jefe de jefes!'
        ]
    },

    escorpiones_jefe: {
        greeting: [
            'Pocos llegan hasta aquí. Menos aún regresan.',
            'Los Escorpiones Negros te vieron entrar hace rato. Ya eres nuestro.',
            'Un mercenario más. Veamos de qué color es tu sangre.'
        ],
        combat_start: [
            'El contrato dice que no salgas vivo.',
            'Sin testigos. Sin ruido. Sin piedad.',
            'Que sea rápido. Tengo otro encargo.'
        ],
        combat_attack: [
            'Un corte limpio.',
            'Ni lo verás venir.',
            'El aguijón siempre encuentra su sitio.'
        ],
        combat_other: [
            'Las sombras me protegen.',
            'Aún no me has visto.',
            'Paciencia. Todo escorpión espera.'
        ],
        combat_hurt: [
            'Interesante. Nadie me había tocado en años.',
            'Buen golpe. Tendrás que pagarlo.'
        ],
        combat_phase: [
            'Se acabó el juego. Ahora van las dagas.',
            'Los Escorpiones no se rinden: se enfurecen.'
        ],
        combat_defeat: [
            'El contrato queda sin cumplir...',
            'Los Escorpiones te encontrarán igualmente...'
        ],
        combat_victory: [
            'Contrato cumplido. Sin testigos.',
            'Otro nombre menos en el mundo.'
        ]
    },

    dragon_jefe: {
        greeting: [
            'Eras enteras dormí sobre mi tesoro. ¿Quién osa interrumpir mi sueño?',
            'Hormiga... incluso el aire de esta cueva tiembla ante mí.',
            'Ignis, el Guardián, te saluda. Y también te despide.'
        ],
        combat_start: [
            'Mi llama ha derretido reinos enteros, hormiga.',
            'Arrodíllate o arde. Me es indiferente.',
            'Que el infierno recuerde tu nombre... un instante.'
        ],
        combat_attack: [
            '¡Arde!',
            '¡Siente el aliento de las eras!',
            '¡Que el infierno te reclame, hormiga!'
        ],
        combat_other: [
            'Mis escamas son más viejas que tu reino.',
            'Ningún acero rasguña a Ignis.',
            'Hasta el fuego me obedece.'
        ],
        combat_hurt: [
            '¡Insolente! Has herido a un dragón.',
            'Esa herida la pagarán tus descendientes.'
        ],
        combat_phase: [
            '¡Despierta, llama ancestral!',
            '¡Ahora conocerás el verdadero fuego!'
        ],
        combat_defeat: [
            'Un dragón derrotado por una hormiga...',
            'Mi tesoro era tuyo desde el principio...'
        ],
        combat_victory: [
            'Ceniza y silencio. Otra vez.',
            'Otro héroe para mi colección de huesos.'
        ]
    },

    vampira: {
        greeting: [
            'Qué visita tan inesperada, querido. Pocas veces la noche me trae algo tan... vivo.',
            'Bienvenido a mi salón. Pasa, que la sangre joven siempre es bien recibida.',
            'Llevo siglos aburrida. Dime que vas a entretenerme.'
        ],
        reaction: [
            'Mmm, qué atrevido, querido. Casi me divierte.',
            'Habla con elegancia o no hables. Los modales importan hasta en la tumba.',
            'Qué ocurrente. Hace décadas que nadie me sorprendía.',
            'Tus palabras saben a miedo disfrazado de valentía. Delicioso.'
        ],
        chat_open: [
            'Acércate, querido. Te concedo una conversación.',
            'Siéntate. La noche es larga y yo, generosa.'
        ],
        chat_who: [
            'Me llaman la Dama de la Noche, querido. Mi nombre verdadero se perdió con mi último latido.',
            'Una anfitriona de sombras, cielo. Y tú, mi invitado de honor... por ahora.'
        ],
        chat_place: [
            'La mazmorra es mi salón de baile, querido: cada planta, un vals distinto.',
            'Un lugar encantador, si te gusta la oscuridad y el eco de los gritos.'
        ],
        chat_advice: [
            'Observa lo que prepara tu enemigo, querido. Los descuidados mueren feos.',
            'Gasta tu energía con elegancia: ni un gesto de más ni uno de menos.'
        ],
        chat_rumors: [
            'Dicen que un esqueleto con ojos de fuego guarda la planta diez. Qué falta de modales.',
            'Se cuenta que unos escorpiones cobran bien por cada cabeza. Qué vulgares.'
        ],
        chat_boss: [
            'Hay un guardián más abajo que no sabe retirarse. Ten cuidado, querido.',
            'El próximo centinela cambia cuando sangra. Pocas cosas me divierten tanto.'
        ],
        chat_free: [
            'Qué pregunta tan curiosa, querido. Prueba con otra.',
            'No sé qué decirte a eso, cielo. Inténtalo de nuevo.',
            'Me aburres y me intrigas a partes iguales. Otra pregunta.'
        ],
        chat_dance: [
            'Las sombras, querido. Y a veces algún imprudente que no sale del baile.',
            'Quien llega a mi salón siempre acaba bailando. Algunos, hasta un amanecer que nunca llega.'
        ],
        combat_start: [
            'Baila conmigo, querido. Será la última vez.',
            'No temas: dolerá solo un instante... eterno.',
            'Que comience el baile de la noche.'
        ],
        combat_attack: [
            'Un besito, querido.',
            'Siente cómo se detiene el tiempo.',
            'Qué delicia de pulso tienes.'
        ],
        combat_other: [
            'La noche es mi manto, querido.',
            'Nada que me hagas me alcanza.',
            'Ay, qué torpe. Observa cómo se hace.'
        ],
        combat_hurt: [
            'Qué descaro... me has hecho sangrar.',
            'Eso ha sido de muy mal gusto, querido.'
        ],
        combat_defeat: [
            'Qué pena... tan joven y ya me ganas...',
            'La noche no olvida, querido...'
        ],
        combat_victory: [
            'Duerme, querido. La noche te acuna.',
            'Tan dulce... y tan breve.'
        ],
        chat_values: [
            'Me encanta la elegancia, querido, y quien logra entretenerme. Los insultos y las amenazas me aburren.',
            'Un buen juego, una conversación ingeniosa... y modales. Nada de gritos.'
        ],
        chat_persuade_good: [
            'Hmm... eso suena prometedor, querido. Me estás tentando.',
            'Vaya, qué argumento tan encantador. Sigue, sigue.'
        ],
        chat_persuade_bad: [
            'Qué grosería, querido. Intenta algo con más gracia.',
            'Eso es tan burdo que casi me ofende. Casi.'
        ],
        chat_recruited: [
            'Está bien, querido: tu juego me entretiene. Iré contigo... por ahora.',
            'Acepto. Será divertido ver cómo te las arreglas, querido.'
        ],
        chat_locked: [
            'Se acabó la conversación, querido. Me has aburrido.',
            'No volveré a escucharte. Qué decepción.'
        ]
    },

    necro: {
        greeting: [
            'Un visitante vivo. Qué rareza; casi olvidé cómo se saluda.',
            'Pasa, pasa, pero no toques los huesos: están catalogados.',
            'Interrumpes un rito, viajero. Por suerte para ti, estaba terminando.'
        ],
        reaction: [
            'Interesante. Los muertos hablan menos, pero con más sentido.',
            'Una respuesta... pasable. Sigue, a ver si mejoras.',
            'Tus palabras tienen vida. Qué curioso.',
            'Hmm. Anoto eso en mis tomos, por si acaso.'
        ],
        chat_open: [
            'Habla, viajero. Los muertos no tienen prisa y yo tampoco.',
            'Te escucho. Sin ruido, por favor: duermen mis ayudantes.'
        ],
        chat_who: [
            'Malakar, necromante. Estudio lo que otros temen: el final de todas las cosas.',
            'Un erudito de la muerte, viajero. Mis colegas dicen "loco"; yo prefiero "especialista".'
        ],
        chat_place: [
            'Esta mazmorra es una biblioteca de huesos, viajero. Cada planta, un volumen.',
            'Aquí abajo la muerte se acumula como el polvo. Es un lugar excelente para trabajar.'
        ],
        chat_advice: [
            'Observa la jugada del enemigo antes de decidir. La prisa es el primer síntoma de la tumba.',
            'Los consumibles se usan desde el inventario, sin coste de energía. Aprovéchalos.'
        ],
        chat_rumors: [
            'Dicen que un guerrero esquelético guarda la planta diez con juramentos más viejos que su armadura.',
            'Se murmura que una capitana pirata busca un tesoro de dragón. Qué optimismo.'
        ],
        chat_boss: [
            'Más abajo camina un guerrero de huesos que no descansa. Rómpele la armadura y no confíes en su calma.',
            'El guardián que viene cambia de forma al herirlo. Un espectáculo, a su manera.'
        ],
        chat_free: [
            'Ese tema se me escapa, viajero. Prueba con otra pregunta.',
            'Hmm. No hay tomo que lo explique. Otra, por favor.',
            'Una cuestión fascinante, pero ignoro la respuesta.'
        ],
        chat_tomes: [
            'Busco el Tomo de los Nombres Olvidados, viajero. Dicen que escribe quién morirá antes de que ocurra.',
            'Manuscritos prohibidos y huesos que susurran. Con eso me conformo, por ahora.'
        ],
        combat_start: [
            'Excelente. Un cuerpo fresco para mis experimentos.',
            'Los muertos te saludan, viajero. Yo, no tanto.',
            'Que comience el rito.'
        ],
        combat_attack: [
            'El polvo reclama lo suyo.',
            'Un toque, y los huesos recuerdan.',
            'Siente cómo se enfría la sangre.'
        ],
        combat_other: [
            'Los huesos me protegen.',
            'Esto es solo el principio del rito.',
            'La muerte espera. Yo también.'
        ],
        combat_hurt: [
            'Interesante... dolor. Casi lo había olvidado.',
            'Qué falta de respeto hacia mi trabajo.'
        ],
        combat_defeat: [
            'Vuelvo al polvo con todos mis tomos.',
            'Qué rápido pasa el rito... anota mi nombre.'
        ],
        combat_victory: [
            'Una pieza más para la colección.',
            'Qué silencio tan agradable.'
        ],
        chat_values: [
            'Valoro el saber que otros temen y el respeto a mi arte, viajero. Los sermones sobre la luz me fatigan.',
            'Los tomos prohibidos y la compañía culta me complacen. Predicar sobre el descanso de los muertos, no.'
        ],
        chat_persuade_good: [
            'Hmm... eso despierta mi curiosidad, viajero.',
            'Un argumento sensato. Continúa.'
        ],
        chat_persuade_bad: [
            'Qué argumento tan simple. Intenta algo con más sustancia.',
            'Eso es un sermón, no un argumento. Me aburre.'
        ],
        chat_recruited: [
            'Muy bien, viajero: tu propuesta merece mi talento. Te acompañaré.',
            'Acepto. Alguien tiene que anotar lo que ocurra. Vamos.'
        ],
        chat_locked: [
            'Se acabó, viajero. No pienso escuchar más sermones.',
            'Mi paciencia, como mis huesos, se ha agotado.'
        ]
    },

    pirata: {
        greeting: [
            '¡Ahoy, grumete! ¿Vienes a por mi tesoro o a pedirme indicaciones?',
            'Mira lo que arrastró la marea: un aventurero. Acércate, que no muerdo... mucho.',
            '¡Alto ahí! Esta planta está bajo bandera de Zafira. ¿Qué buscas, forastero?'
        ],
        reaction: [
            'Ja, ja, me caes bien, grumete. O estás loco o eres valiente.',
            'Habla claro o echo el ancla en tu cabeza. ¡Sigue, sigue!',
            'Eso sí que no me lo esperaba. ¡Bien tirado!',
            'Hmm, suena a trato o a trampa. Veamos cuál es.'
        ],
        chat_open: [
            '¡Suelta la lengua, grumete! Hoy tengo humor de charla.',
            'Venga, pregunta lo que quieras. ¡Gratis, si me caes bien!'
        ],
        chat_who: [
            'Zafira, capitana del Cuervo Escarlata. Terror de siete mares y de esta mazmorra, aunque menos.',
            'Una pirata sin barco, grumete. Pero con cañón, que es lo importante.'
        ],
        chat_place: [
            'Un laberinto sin mar, sin brisa y con demasiados huesos. Cero estrellas, grumete.',
            'Aquí abajo hay más tesoros que en tres galeones. Lástima que todo muerda.'
        ],
        chat_advice: [
            'Un buen pirata mira la jugada del enemigo antes de disparar. Un mal pirata, ya está nadando.',
            'Gasta la energía con cabeza, grumete: no se pueden jugar todas las cartas de golpe.'
        ],
        chat_rumors: [
            'Cuentan que hay un dragón sentado sobre más oro del que cabe en mi bodega. Mmm, qué ganas.',
            'Dicen que una dama muy elegante baila con los que llegan solos. Yo prefiero el ron.'
        ],
        chat_boss: [
            'Un tipo de huesos, grumete: esqueleto con armadura y muy mal humor. Y cambia de forma al herirlo.',
            'Más adelante hay un guardián que no se rinde. Lleva pólvora, o pociones.'
        ],
        chat_free: [
            'Ni idea, grumete. Pregunta otra cosa antes de que me aburra.',
            '¡Por mil sirenas! No tengo respuesta para eso.',
            'Eso es más difícil que cruzar el cabo. Otra, anda.'
        ],
        chat_treasure: [
            'El tesoro del dragón, grumete. Más oro que mi ambición, y eso ya es decir.',
            'Un mapa viejo, una cruz y mucha mala idea. Eso persigo.'
        ],
        combat_start: [
            '¡Al abordaje, grumete! Te voy a convertir en comida de tiburones.',
            '¡Prepárate! Zafira no pierde jamás... casi nunca.',
            '¡Fuego a discreción!'
        ],
        combat_attack: [
            '¡Toma cañonazo!',
            '¡A babor!',
            '¡Prueba mi sable, grumete!'
        ],
        combat_other: [
            '¡Todos a cubierta!',
            'Un traguito de ron y sigo.',
            'Así no hundes a la capitana.'
        ],
        combat_hurt: [
            '¡Ay! Esa me ha dolido hasta el cabo.',
            '¡Mil rayos! Me has dado en la bodega.'
        ],
        combat_defeat: [
            'Hundida por un grumete... qué vergüenza...',
            'Que alguien guarde mi ron... y mi mapa...'
        ],
        combat_victory: [
            '¡Otro al fondo del mar!',
            '¡Ja! Pregúntale al tiburón cómo sabe.'
        ],
        chat_values: [
            'Los tesoros, las aventuras y que nadie me dé órdenes, grumete. Las leyes y los sermones de honradez me dan alergia.',
            'Libertad y oro: ¡lo demás es lastre! Y odio que me manden.'
        ],
        chat_persuade_good: [
            '¡Ja! Ahora sí hablas mi idioma, grumete.',
            'Hmm... eso suena a negocio. Sigue.'
        ],
        chat_persuade_bad: [
            '¿Órdenes? ¿A mí? Intenta otra cosa, grumete.',
            'Eso me sabe a sermón. ¡Cambia de rumbo!'
        ],
        chat_recruited: [
            '¡Trato hecho, grumete! Zafira se une a tu tripulación. ¡Que se preparen!',
            'Está bien: el Cuervo Escarlata navega contigo. ¡Pero el tesoro, a medias!'
        ],
        chat_locked: [
            '¡Basta! Me has agotado la paciencia, grumete.',
            'No quiero oír más. ¡Al agua con tus palabras!'
        ]
    },

    skull_jefe: {
        greeting: [
            'Hace siglos que nadie cruza esta puerta. Mueres hoy, como todos.',
            'Mis huesos recuerdan cada batalla. Tú serás la próxima.',
            'Un juramento me ata a esta planta. Pasarás sobre mi cadáver... que ya no tengo.'
        ],
        combat_start: [
            'Desenvaina. Que el acero hable.',
            'El frío de la tumba te espera, vivo.',
            'Un duelo más. Será el último tuyo.'
        ],
        combat_attack: [
            'El acero no olvida.',
            'Siente el peso de mi juramento.',
            'Cae como cayeron mis hermanos.'
        ],
        combat_other: [
            'Mis huesos han resistido siglos.',
            'Nada atraviesa lo que ya está muerto.',
            'Continúo. Siempre continúo.'
        ],
        combat_hurt: [
            'Una grieta... conozco peores.',
            'Buen golpe, vivo. Insuficiente.'
        ],
        combat_phase: [
            'Contempla mi verdadero rostro, vivo.',
            'Los caídos responden a mi llamada.'
        ],
        combat_defeat: [
            'Al fin... el descanso...',
            'Mi juramento... queda cumplido...'
        ],
        combat_victory: [
            'Otro más para la tumba.',
            'Silencio. Como debe ser.'
        ]
    }
};

/** Banco de frases para ese PNJ y tipo (con el genérico como plan B). */
export function fallbackPool(npcId, key) {
    return FALLBACK_LINES[npcId]?.[key] ?? FALLBACK_LINES.default[key] ?? [];
}
