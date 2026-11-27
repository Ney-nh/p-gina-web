# Página de prueba

https://ney-nh.github.io/p-gina-web/prueba/

Sirve para probar cambios antes de llevarlos a la página real.

| | Real | Prueba |
|---|---|---|
| Dirección | `/p-gina-web/` | `/p-gina-web/prueba/` |
| Colección de Firestore | `movimientos` | `movimientos_prueba` |
| Guardado local | `dirt_movimientos` | `dirt_movimientos_prueba` |

Lo que se registre aquí **no aparece en la página real**. La configuración de
Firebase es la misma; solo cambia la colección. La cinta roja de arriba y la
etiqueta `noindex` evitan confundirla con la real.

## Cómo está hecha

`prueba/index.html` es una copia de `index.html` que carga **los mismos
archivos** de `assets/`, con tres diferencias:

- las rutas empiezan con `../`;
- antes de cargar `app.js` define `window.DIRT_CONFIG` con la colección de
  prueba;
- lleva la cinta roja y el `noindex`.

## Probar un cambio sin tocar la real

1. Copia a `prueba/assets/` el archivo que vas a cambiar.
2. En `prueba/index.html`, cambia su ruta `../assets/…` por `assets/…`.
3. Haz el cambio y pruébalo aquí.

## Pasarlo a la real

1. Copia el archivo de `prueba/assets/` encima del de `assets/`.
2. Borra la copia de `prueba/assets/` y devuelve la ruta a `../assets/…`.
3. Si cambiaste `prueba/index.html`, lleva los mismos cambios a `index.html`
   (sin la cinta, el `noindex` ni `DIRT_CONFIG`).
