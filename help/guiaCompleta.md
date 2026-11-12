LA FUGA DE KALDUR-ATH
Documento Maestro de Diseño
Versión 1.0
VISIÓN DEL PROYECTO

La Fuga de Kaldur-Ath es un RPG narrativo basado en:

Exploración de mazmorra.
Combates por cartas.
Encuentros dinámicos.
Personajes persistentes.
Historias ramificadas.
Decisiones con consecuencias.
Compañeros.
Misiones.
Exploración especial en 3D.

La intención es que el jugador cree relaciones con personajes recurrentes y que sus decisiones tengan impacto en la aventura.

ARQUITECTURA NARRATIVA

Todos los personajes importantes seguirán esta estructura:

Aparición
↓
Avistamientos
↓
Primer contacto
↓
Conversaciones
↓
Sistema de confianza
↓
Historia personal
↓
Misión personal
↓
Recompensa narrativa
↓
Final de historia

EJEMPLO COMPLETO
El Monje Loco
Fase 1

El jugador lo ve.

No hay interacción.

No hay diálogo.

No hay recompensa.

Solo misterio.

Fase 2

El jugador vuelve a verlo.

Aparece observando acontecimientos.

Por ejemplo:

observando un no muerto
al fondo de una galería
junto a una puerta sellada

No se puede hablar con él.

Fase 3

Primer diálogo.

Imagen:


monjeLocoLibro.jpg

El jugador puede hablar con él.

Aún no conoce:

nombre
pasado
motivaciones
Fase 4

Empieza la confianza.

JavaScript
monjeTrust
Fase 5

Cuando la confianza aumenta:

cambia la actitud
cambian los diálogos
cambia la imagen
Fase 6

Revela su nombre.


El Monje Loco
↓
Fray Aldren
Fase 7

Misión personal.

Fase 8

Conclusión.

SISTEMA DE CONFIANZA

Cada NPC importante tiene:

JavaScript
player.storyState

Ejemplo:

JavaScript
{
 
monjeTrust: 0,
 
monjeNameKnown: false,
 
monjeNameRevealPending: false
 
}
CONFIANZA POSITIVA

Ejemplos:

JavaScript
trust: 1
JavaScript
trust: 2

Acciones:

escuchar
ayudar
mostrar empatía
resolver acertijos
CONFIANZA NEGATIVA

Ejemplos:

JavaScript
trust: -1
JavaScript
trust: -3

Acciones:

insultar
burlarse
amenazar
traicionar
ESTADOS DE UN PERSONAJE
Hostil

trust <= -5

Imagen:


angry
Neutral

-4 a 9
Amistoso

trust >= 10

Imagen:


happy
SISTEMA DE MISIONES
FUTURO

No implementar todavía.

Objetivo

Crear:


QuestManager
Estado de las misiones
JavaScript
questState

Posibles valores:


NO_INICIADA
 
ACTIVA
 
COMPLETADA
 
FALLIDA
Ejemplo
El Hombre de las Llaves

Encuentro
↓
Confianza
↓
Misión

Misión:


Encontrar la Llave de Plata
SISTEMA DE PERSONAJES CONECTADOS

Un personaje puede presentar a otro.

Ejemplo:


Hombre de las Llaves
↓
Presenta a su hermana
SISTEMA DE RELACIONES

Variables:

JavaScript
llaveroTrust
 
hermanaTrust

Independientes.

Ejemplo

Hermano confía en ti

pero


Hermana no confía en ti
SISTEMA DE ROMANCE
FUTURO

El romance NO será automático.

Requisitos:


Confianza suficiente
+
Historia completada
+
Decisiones correctas
 

Variables:

JavaScript
romanceActivo
JavaScript
romanceBloqueado
SISTEMA DE COMPAÑEROS
FUTURO

Uno de los sistemas principales del juego.

Ejemplo:


Hermana Misteriosa

puede unirse al grupo.

Datos:

JavaScript
player.companions

Ejemplo:

JavaScript
[
"hermanaMisteriosa"
]
VENTAJAS DE UN COMPAÑERO
Exploración

Detectar:

puertas
trampas
secretos
Eventos

Nuevas opciones.

Ejemplo:


Ella reconoce al NPC.
Combates

Apoyo simple:


Curación
 

o


Daño adicional
EXPLORACIÓN 3D
FUTURO

Tecnología:


BabylonJS
Filosofía

NO convertir todo el juego en 3D.

Solo momentos especiales.

Casos de uso
Misión

Encontrar una llave.

Zona secreta

Abrir una puerta.

Cripta especial

Resolver un puzle.

Evento narrativo

Explorar una sala importante.

EJEMPLO

Misión
↓
Conseguir llave
↓
Abrir puerta
↓
Mapa BabylonJS
↓
Volver a la aventura principal
ESTRUCTURA TÉCNICA
Historias

stories/common
Historias por clase

stories/warrior
 
stories/mage
 
stories/rogue
NPCs narrativos

stories/npcs
Gestión

StoryManager.js
Resolución

StoryResolver.js
Registro

StoryDatabase.js
ORDEN RECOMENDADO DE DESARROLLO
Hecho

✅ StoryManager

✅ StoryResolver

✅ Monje Loco

✅ Conversaciones

✅ Capítulos

Próximo

✅ Sistema de confianza

Después

✅ Revelación de nombre

Después

✅ QuestManager

Después

✅ Hombre de las Llaves

✅ Hermana Misteriosa

Después

✅ Sistema de compañeros

Finalmente

✅ BabylonJS

✅ Exploración especial

✅ Puertas y llaves

✅ Puzles

✅ Zonas secretas