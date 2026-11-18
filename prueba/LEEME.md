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
