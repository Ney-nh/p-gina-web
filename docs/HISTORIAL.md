# Historial de cambios

## Versión de la presentación — sin compuertas, con Bob en vivo

Lo que se probó en `prueba/` pasó a la página real, y se retiró la compuerta.

### Qué se quitó

- **Las compuertas y los servomotores**: el panel para conectar la compuerta,
  el control del ángulo, los botones de abrir y cerrar, las puertas animadas,
  la cuenta regresiva de cinco segundos y el botón «Cerrar la compuerta
  ahora». También el sketch `dirt_dos_compuertas` y el diagrama de los servos.
- **La versión verde** (`verde/`), que dependía del panel de la compuerta.
  Sigue en el historial de git.
- **Del bot**, los temas «la compuerta no abre», «cómo sabe qué lado abrir»,
  «¿y si se queda abierta?» y «cuánto tiempo queda abierta». Las respuestas que
  mencionaban la compuerta o los servos se reescribieron.

### Qué queda del Arduino

Una **prueba de conexión**: la página lo busca por Bluetooth, le manda `?` y
muestra su respuesta y cuánto tardó. El sketch nuevo es
`arduino/dirt_conexion/dirt_conexion.ino` y no necesita nada conectado.

### Qué se añadió

- **Mensaje distinto en cada registro**: diez para quien dona y diez para
  quien retira, sin repetir hasta que salen todos. La pantalla de éxito
  aparece siempre y dice en qué lado va el alimento.
- **Pestaña Nutrición**, **Bob 3D**, **boca sincronizada con la voz** y
  **modo en vivo**, que antes estaban solo en la página de prueba.
- La página de prueba ahora carga el mismo código que la real y solo cambia
  la colección de datos (`window.DIRT_CONFIG`).

### Arreglos

- El botón Guardar perdía su ancho y su tamaño después del primer registro.
- El aviso «va en el lado frío/caliente» del formulario salía sin estilo.

### Datos

Los registros nuevos traen `compuerta_abierta: false`, porque las reglas
publicadas de Firestore exigen el campo. No hace falta publicar reglas nuevas.

## Bot: entiende preguntas con errores y sabe del proyecto

Tras la presentación, Bob respondió «no estoy segura» a «¿cómo se creó el
proyecto?». Había dos causas: no existía ningún tema sobre el proyecto en sí, y
la comparación exigía las palabras exactas.

- **Normalización**: letras estiradas, abreviaturas de chat, muletillas, el
  nombre al inicio («oye Bob») y palabras repetidas.
- **Tolerancia a errores**: raíz, sonido y distancia de edición por palabra.
- **Catálogo**: de 24 a 34 temas y de unas 200 a unas 580 frases. Temas nuevos:
  creación del proyecto, equipo, objetivo, siglas, quién es Bob, ayuda, cómo
  entiende, materiales, dónde se guardan los datos y mejoras a futuro.
- **Rescate**: «¿Te refieres a…?» con botones, y un «sí» lo confirma.
- **Datos del proyecto** en el bloque `PROYECTO`: lo vacío no se dice.
- Bob habla en masculino y Dora en femenino.
- Ollama ahora solo se consulta cuando el bot no está seguro, con todas las
  respuestas como contexto. Se corrigió un error que metía «NaN» en sus
  instrucciones.
- Banco de 110 preguntas en `herramientas/probar-bot.mjs`, que corre también
  dentro de `revisar.mjs`.

## Versión actual — página web estática con Firestore y compuerta doble

### Qué se quitó

**Toda la autenticación con Google.** Ya no existen `login.tsx`, `auth.tsx`,
las colecciones `users` y `user_sessions`, los endpoints `/auth/*`, ni la
dependencia del servicio `demobackend.emergentagent.com`. Quien hace el
movimiento se identifica con el nombre y el documento que escribe.

**El backend completo: FastAPI y MongoDB.** Esta es la consecuencia menos
obvia de pasar a Firestore. Firestore se habla directamente desde el
navegador, con su propio control de acceso por reglas, así que un servidor
intermedio no aporta nada: sería un segundo sitio donde desplegar, mantener y
pagar, para reenviar datos que el navegador ya puede escribir solo.

Al desaparecer el servidor, la app se vuelve una página estática, y por eso
puede vivir en GitHub Pages sin nada que desplegar aparte. Era la única forma
de cumplir lo de "montarla a GitHub para que sea una página web".

**El proyecto Expo.** La app era React Native con expo-router, lo que obliga a
un paso de compilación y complica el despliegue como página. Se reescribió
como HTML, CSS y JavaScript sin dependencias ni build, conservando el diseño:
la misma paleta verde cerámica, la tipografía Plus Jakarta Sans, las mismas
cuatro categorías con sus colores, las pestañas Inicio · Inventario ·
Historial y el mismo flujo de registro.

Hay una pérdida real que conviene decir: el proyecto Expo podía compilarse
como APK nativo, y una página web no. A cambio, se gana que funcione en
cualquier teléfono sin instalar nada. Como el control Bluetooth solo existe en
Chrome, el APK tampoco habría servido para la compuerta sin reescribir esa
parte con otra librería.

El código retirado sigue en el historial de git y en el PR #1, por si hiciera
falta recuperarlo.

### Qué se añadió

**Compuerta de doble lado.** El sketch del Arduino pasa de uno a dos servos:
D9 para el lado frío y D10 para el lado caliente. La categoría del alimento
decide cuál se abre, sin que nadie lo elija a mano. El mapa está en un solo
lugar (`assets/app.js`, campo `lado` de cada categoría) y la pantalla de
registro muestra el lado elegido antes de guardar.

**Firestore con escucha en vivo.** Si alguien registra desde otro teléfono,
la lista se actualiza sola en todas las pantallas abiertas. Las reglas de
seguridad están en `firestore.rules`.

**Modo local de respaldo.** Mientras no haya configuración de Firebase, la app
guarda en el navegador y avisa en pantalla. Sirve para probar y para que una
demostración no se caiga si falla la red.

**Tres cierres automáticos encadenados.** La página cierra a los 5 segundos;
el Arduino cierra cualquier lado que lleve más de 15 segundos abierto; y
cierra todo al perder la conexión. Si el teléfono se bloquea o la app se
cierra de golpe, la compuerta no se queda abierta.

**Exportación a CSV** del historial, que abre en Excel con las tildes bien.

### Lo que no cambió

Los UUID del servicio Bluetooth son los mismos de la versión anterior, y el
sketch sigue aceptando `A`, `C` y un número suelto. Un Arduino con el sketch
viejo de un solo servo responde a esta página, solo que sin el lado caliente.
