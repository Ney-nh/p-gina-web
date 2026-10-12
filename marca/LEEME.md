# Tus imágenes van aquí

Dos pasos: pon el archivo en esta carpeta y escribe su ruta en `config.js`.
Lo que dejes vacío usa el logotipo de texto y el pelícano dibujado.

| En `config.js` | Dónde sale | Tamaño recomendado |
|---|---|---|
| `logo` | Barra superior, en lugar del texto D1RT | alto 80 px, ancho libre, fondo transparente |
| `mascota` | En lugar del pelícano, en la despensa y en el chat | cuadrada, 400 × 400 px, fondo transparente |

Sirven `.png`, `.webp` y `.svg`.

Ejemplo, con el archivo guardado como `azul/marca/logo.png`:

```js
export const MARCA = {
  logo: "marca/logo.png",
  mascota: "",
};
```

Recarga la página y aparece.

## Si pones una mascota propia

El dibujo del pelícano abre la bolsa del pico mientras la asistente habla. Una
imagen fija no puede hacer eso, así que en su lugar se mueve entera, con un
balanceo suave, mientras dura la voz. Es el mismo aviso, solo que animado de
otra forma.

## Responsabilidad

Las imágenes que pongas aquí son tuyas y respondes por ellas. Comprueba que
tienes derecho a usarlas antes de publicar la página.
