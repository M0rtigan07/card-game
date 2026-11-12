Sistema Narrativo de Personajes
La Fuga de la Mazmorra
Objetivo

Introducir personajes memorables de forma gradual para que el jugador cree una relación con ellos a lo largo de la aventura.

Nunca presentar toda la información de golpe.

El jugador debe descubrir quién es el personaje poco a poco.

Fase 1: Presencia
Objetivo

Que el jugador vea al personaje sin interactuar con él.

El personaje genera curiosidad.

Ejemplos
Plain Text
El monje aparece observando un pasillo.
Plain Text
El monje aparece viendo combatir a un no muerto.
Plain Text
El monje se encuentra al final de una galería.
Reglas

✅ No conversación.

✅ No recompensas.

✅ No misiones.

✅ No nombre.

✅ No confianza.

Solo misterio.

Fase 2: Avistamientos Recurrentes
Objetivo

Que el jugador empiece a reconocer al personaje.

Ejemplos
Plain Text
El jugador vuelve a encontrar al monje.
Plain Text
El monje aparece en zonas peligrosas.
Plain Text
El monje desaparece antes del combate.
Efecto buscado

El jugador debe pensar:

Plain Text
¿Quién es?
Plain Text
¿Por qué siempre aparece aquí?
Plain Text
¿Cómo sobrevive?
Fase 3: Primer Contacto
Objetivo

Permitir hablar con el personaje.

Ejemplo
Plain Text
Capítulo: El Libro

 

Imagen:

Plain Text
monjeLocoLibro.jpg

Narrativa:

Plain Text
El anciano estudia un viejo libro.

Opciones:

Plain Text
Hablar
Plain Text
Escuchar
Plain Text
Ignorar
Regla Importante

Todavía NO revelar:

❌ nombre

❌ pasado

❌ misión

❌ secretos importantes

Fase 4: Sistema de Confianza

Cada personaje tiene:

JavaScript
storyState: {

 
monjeTrust: 0

 
}
Confianza positiva
JavaScript
trust: +1
JavaScript
trust: +2

Ejemplos:

Plain Text
Escucharle
Plain Text
Ayudarle

 
Plain Text
Resolver acertijos
Confianza negativa
JavaScript
trust: -1
JavaScript
trust: -3

Ejemplos:

Plain Text
Insultarlo
Plain Text
Burlarse
Plain Text
Amenazarlo
Fase 5: Estados del Personaje

Según confianza.

Hostil
Plain Text
trust <= -5

Imagen:

Plain Text
angry

Diálogos agresivos.

Neutral
Plain Text
trust = 0

Imagen:

Plain Text
talk
Amistoso
Plain Text
trust >= 10

Imagen:

Plain Text
happy

Más información.

Más recompensas.

Fase 6: Revelación

Cuando se alcanza suficiente confianza:

JavaScript
monjeTrust >= 10

se activa:

JavaScript
monjeNameRevealPending = true;
Escena especial

Ejemplo:

Plain Text
"He ocultado mi nombre durante años."

 
"Pero te has ganado mi confianza."

 
"Me llamo Fray Aldren."

 
Resultado

Antes:

Plain Text
EL MONJE LOCO

Después:

Plain Text
FRAY ALDREN

en todo el juego.

Fase 7: Historia Personal

Una vez revelado:

✅ nuevas conversaciones

✅ nuevas escenas

✅ nuevas misiones

✅ recompensas especiales

✅ secretos de la mazmorra

Flujo recomendado para cualquier NPC
Plain Text

1. Aparición
   ↓
2. Apariciones recurrentes
   ↓
3. Primer diálogo
   ↓
4. Sistema de confianza
   ↓
5. Cambio de actitud
   ↓
6. Revelación personal
   ↓
7. Misión personal
   ↓
8. Conclusión de la historia
   Aplicable a futuros personajes

Este esquema servirá para:


El Monje Loco
Plain Text
La Princesa
Plain Text
El Bibliotecario Maldito

 

El Capitán Orco
Plain Text
El Mercader Fantasma
Plain Text
Cualquier NPC futuro

*****************************************************************************

Flujo Completo de un NPC Narrativo
Plain Text
Archivo Historia
↓
StoryDatabase
↓
StoryManager
↓
Exploration
↓
StoryView
↓
StoryResolver
↓
Player.storyState
Archivos implicados
1. Crear la historia

Archivo:

Plain Text
js/stories/common/monjeLoco.js

o

Plain Text
js/stories/warrior/capitanOrco.js

o

Plain Text
js/stories/mage/archimaga.js

Contiene:

JavaScript
id
title
npc
chapters
choices

Ejemplo:

JavaScript
export const MONJE_LOCO = {
 
id: "monjeLoco",
 
title: "El Monje Loco",
 
npc: {...},
 
chapters: [...]
};
2. Registrar la historia

Archivo:

Plain Text
js/stories/StoryDatabase.js

Añadir:

JavaScript
import { MONJE_LOCO }
from './common/monjeLoco.js';

Y después:

JavaScript
global: [
 
MONJE_LOCO
 
]

o

JavaScript
Guerrero: [
 
CAPITAN_ORCO
 
]
3. Gestión automática

Archivo:

Plain Text
js/stories/StoryManager.js

Normalmente NO hay que tocarlo.

Sólo si:

añades nuevas reglas
cambias el sistema de confianza
cambias condiciones de aparición
4. Aplicar consecuencias

Archivo:

Plain Text
js/stories/StoryResolver.js

Aquí se añaden nuevas mecánicas.

Por ejemplo:

JavaScript
hp
gold
trust
relic
cardId

Ejemplo:

JavaScript
{
trust: 2
}

genera:

JavaScript
player.storyState.monjeTrust += 2;
Sistema de Imágenes
Archivo NPC
Plain Text
js/stories/npcs/monjeLocoNpc.js

Ejemplo:

JavaScript
images: {
 
room:
 
"img/monjeLoco.jpg",
 
talk:
 
"img/monjeLocoHabla.jpg",
 
angry:
 
"img/monjeLocoEnfadado.jpg",
 
happy:
 
"img/monjeLocoAmistad.jpg"
}
Dónde se abre el diálogo

Archivo:

Plain Text
js/systems/Exploration.js

Función:

JavaScript
showStory()

Aquí existe el bloque:

JavaScript
if (
choice.action === "talk"
)

Aquí es donde conectamos:

JavaScript
return this.openChat(
MONJE_LOCO_NPC
);
Sistema de confianza

Datos guardados en:

JavaScript
player.storyState

Ejemplo:

JavaScript
player.storyState = {
 
monjeTrust: 4,
 
monjeNameKnown: false,
 
monjeNameRevealPending: false
 
};
Cuándo modificar confianza

Archivo:

Plain Text
monjeLoco.js

Opciones:

JavaScript
{
text: "Escuchar",
 
trust: 1
}

o

JavaScript
{
text: "Burlarse",
 
trust: -3
}
 
Revelación de nombre

Variables:

JavaScript
monjeTrust
JavaScript
monjeNameKnown
JavaScript
monjeNameRevealPending

Cuando:

JavaScript
monjeTrust >= 10

entonces:

JavaScript
monjeNameKnown = true;

y

JavaScript
monjeNameRevealPending = true;
Añadir un NPC nuevo

Checklist rápida:

1

Crear:

Plain Text
stories/common/nuevoNpc.js
2

Crear:

Plain Text
stories/npcs/nuevoNpcNpc.js

(imágenes y datos del personaje)

3

Registrar en:

Plain Text
StoryDatabase.js
4

Añadir capítulos:

JavaScript
id: 1
id: 2
id: 3
...
5

Añadir imágenes:

Plain Text
npc_depie.jpg
 
npc_leyendo.jpg
 
npc_enfadado.jpg
 
npc_feliz.jpg
6

Configurar:

JavaScript
trust
7

Configurar:

JavaScript
trueName

(si existe)

8

Añadir recompensas:

JavaScript
hp
gold
relic
cardId
 
Regla de diseño más importante

Antes de permitir diálogo:

Plain Text
1. Aparición
2. Avistamiento
3. Avistamiento
4. Primer contacto
5. Confianza
6. Nombre
7. Misión personal
8. Final de historia

