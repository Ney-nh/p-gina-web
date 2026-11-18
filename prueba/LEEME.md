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
