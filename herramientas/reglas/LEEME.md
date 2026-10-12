# Probar las reglas de Firestore

Las reglas se prueban contra el emulador de Firestore, que es el mismo motor
que corre en producción. Así no hay que publicarlas para saber si funcionan, y
un error de sintaxis se ve aquí en vez de en la consola de Firebase.

Hace falta **Java** instalado.

```bash
cd herramientas/reglas
npm init -y
npm i firebase-tools @firebase/rules-unit-testing firebase

# en una terminal
npx firebase emulators:start --only firestore --project dirt-prueba

# en otra
node reglas.test.mjs
```

Comprueba 25 casos: que la app pueda escribir lo que escribe de verdad, que se
rechace todo lo demás (tipos inventados, campos de más, cantidades absurdas,
fechas puestas a mano), que cualquiera pueda leer, que el borrado suave
funcione y que no se pueda alterar ni borrar un registro ya guardado.

## Sobre el error "Line 1: Parse error"

Si la consola de Firebase dice eso, casi nunca el problema está en la línea 1:
es como reporta que el archivo entero no parseó. La causa más común es tener
una función declarada fuera del bloque `service`. En las reglas de Firestore
las funciones van **dentro** de `match /databases/{database}/documents`.
