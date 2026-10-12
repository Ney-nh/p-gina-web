# Versión verde — respaldo

La página que estuvo en uso hasta que el tema azul pasó a principal. Se
conserva por si hay que volver atrás.

| | Dirección |
|---|---|
| Principal, azul con Bob | https://ney-nh.github.io/p-gina-web/ |
| Respaldo, verde | https://ney-nh.github.io/p-gina-web/verde/ |

## Qué comparte

La lógica es la misma: carga `../assets/app.js` y `../assets/bot.js`, los
mismos archivos que la página principal. Un arreglo en la despensa, la
compuerta, el bot o Firestore llega a las dos sin copiar nada.

**Escribe en la misma base de datos**, porque las dos usan
`../assets/firebase-config.js`. Un registro hecho aquí aparece en la principal
y al revés.

## Qué es propio

Solo `tema.css`, con los colores verdes y las tipografías Fraunces y Archivo,
y este `index.html`, con la estructura sin Bob.

## Si hay que volver atrás

El cambio es simétrico: mover este `index.html` a la raíz, poner este
`tema.css` como `assets/app.css`, y bajar la versión azul a una carpeta. Nada
se pierde: todo está en el historial de git.

## Aviso

Esta copia queda congelada. Los arreglos que toquen únicamente el aspecto se
harán en la página principal, no aquí, así que con el tiempo las dos se irán
separando visualmente. Lo que comparten —la lógica— sigue al día siempre.
