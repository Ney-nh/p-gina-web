# Página de prueba

https://ney-nh.github.io/p-gina-web/prueba/

Aquí se prueba cualquier cambio antes de llevarlo a la página real.

| | Real | Prueba |
|---|---|---|
| Dirección | `/p-gina-web/` | `/p-gina-web/prueba/` |
| Colección de Firestore | `movimientos` | `movimientos_prueba` |
| Guardado local | `dirt_movimientos` | `dirt_movimientos_prueba` |

Lo que se registre aquí **no aparece en la página real**. La configuración de
Firebase es la misma (`../assets/firebase-config.js`); solo cambia la colección.
La cinta roja de arriba y la etiqueta `noindex` evitan confundirla con la real.

## Qué es propio y qué es compartido

Para no duplicar el proyecto, la prueba solo tiene copia propia de lo que
cambia. Lo demás lo carga de la página real:

| Archivo | Dónde vive |
|---|---|
| `index.html` | propio (`prueba/index.html`) |
| `app.js` | propio (`prueba/assets/app.js`) |
| `nutricion.js`, `nutricion.css` | propio, nuevo: pestaña **Nutrición** (aún no está en la real) |
| `voz-bob.js`, `bob3d.js`, `bob3d.css` | propio, nuevo: **Bob 3D y boca sincronizada (Beta)** |
| `vivo.js`, `vivo.css` | propio, nuevo: **modo en vivo (Beta)** |
| `app.css`, `bot.js`, `bob.js`, `firebase-config.js`, `marca/config.js` | compartido (`../assets/`, `../marca/`) |

**Para probar un cambio en un archivo compartido**, primero se copia a
`prueba/assets/` y se cambia la ruta que lo carga (en `prueba/index.html` o en
`prueba/assets/app.js`). Así la página real no se toca hasta que se apruebe.

## Pasar un cambio a la página real

Copiar el archivo de `prueba/assets/` a `assets/`, **excepto** lo que
diferencia a la prueba:

- en `app.js`: las rutas `../../assets/…`, `COLECCION`, `CLAVE_LOCAL` y el
  nombre del CSV;
- en `index.html`: la cinta roja, el `noindex` y las rutas `../`.

Si el archivo pasa a ser idéntico en las dos, se borra la copia de `prueba/`
y se vuelve a cargar el compartido.

## Bob 3D (Beta)

Al abrir el chat aparece Bob en 3D arriba de la conversación, y abre el pico
al ritmo de lo que dice. El Bob dibujado también abre la bolsa al mismo ritmo.

- `voz-bob.js` pone la voz de Bob (más grave: `VOZ_BOB.tono`) y calcula, sílaba
  por sílaba, cuánto se abre la boca. No modifica `assets/bot.js`.
- `bob3d.js` dibuja a Bob con three.js, que se descarga de jsDelivr. Si no
  carga (sin internet o sin WebGL), el escenario se esconde y queda el dibujo.
- Mientras no haya modelo de Meshy, se ve un **Bob provisional** armado con
  esferas y conos.

### Poner el modelo de Meshy

1. En Meshy: *Download → GLB*.
2. En Blender, separar el pico de abajo (con la bolsa) como pieza aparte,
   llamarla `mandibula` y poner su origen en la bisagra del pico. Exportar
   como GLB. Otra opción: una *shape key* llamada `boca` con el pico abierto.
3. Guardar el archivo como `prueba/modelos/bob.glb` (ideal: menos de 4 MB).
4. En `prueba/assets/bob3d.js`, poner `url: "modelos/bob.glb"` en `MODELO_3D`.

La consola del navegador dice qué piezas encontró: `[Bob 3D] modelo cargado…`.

## Modo en vivo (Beta)

Pantalla completa para conversar con Bob por voz. Se abre con el botón
**Hablar en vivo** (sobre Bob 3D, en el chat), con el ícono de ondas en la
cabecera del chat, o directo con `prueba/?vivo`.

- Tocas el micrófono (o a Bob), hablas, Bob **escucha** → **piensa** →
  **habla**, y con *Conversación continua* vuelve a escucharte solo.
- Tocar a Bob mientras habla lo interrumpe.
- Bob 3D cambia de gesto en cada estado: se inclina y ladea la cabeza al
  escuchar, mira hacia arriba al pensar y abre el pico al hablar. Un anillo
  en el piso cambia de color: azul (escucha), amarillo (piensa), naranja
  (habla). Si el 3D no carga, aparece el Bob dibujado con ondas.
- **No usa IA**: responde con el mismo cerebro programado del chat
  (`entender()` de `assets/bot.js`). Para conectar una IA después, solo se
  cambia `obtenerRespuesta()` en `vivo.js`.
- El micrófono funciona en Chrome (Android y computador). En iPhone y
  Firefox no hay reconocimiento de voz: se escribe o se tocan las preguntas.
