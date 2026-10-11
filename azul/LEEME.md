# Tema azul — experimento

Variante de la página con los colores de la despensa física (azul, blanco y
amarillo) y **Bob**, un pelícano, como personaje.

Vive aparte a propósito: el proyecto principal en la raíz no se toca. Las dos
páginas se pueden abrir a la vez y comparar.

| | Dirección |
|---|---|
| Principal | https://ney-nh.github.io/p-gina-web/ |
| Tema azul | https://ney-nh.github.io/p-gina-web/azul/ |

## Qué comparte y qué cambia

Comparte toda la lógica: `../assets/app.js` y `../assets/bot.js` son los
mismos archivos. Un arreglo en la despensa, la compuerta o el bot sirve para
las dos páginas sin copiar nada.

Cambia solo la capa de identidad:

- `tema.css` — colores, tipografías y lo propio de Bob. Hereda la estructura
  del tema principal y sobrescribe lo que hace falta.
- `bob.js` — el dibujo del pelícano en SVG y su animación.
- `index.html` — la misma estructura y los mismos identificadores, con Bob
  añadido y el logotipo D1RT.

## Sobre Bob

Es un personaje original. Un pelícano porque es el ave de Santa Marta y
porque carga comida en la bolsa del pico, que para una despensa de alimentos
dice exactamente lo que hace.

Está dibujado en SVG: pesa unos pocos kilobytes, se ve nítido a cualquier
tamaño y no hace falta descargar imágenes. Parpadea, flota y **abre la bolsa
del pico mientras habla**, enganchado a los avisos que manda `bot.js` cuando
arranca y termina la voz.

Para cambiarle los colores, busca las clases `.bob-*` al final de `tema.css`.

## Tipografías

**Fredoka** para los títulos y **Nunito** para el texto, las dos de Google
Fonts. Son redondeadas y sin remates, para acompañar al personaje sin
competir con él.

Se consideró DaFont, pero sus tipografías suelen tener licencias poco claras
para uso público y hay que alojarlas uno mismo. Google Fonts es libre para
cualquier uso, carga más rápido y no deja dudas de licencia en un proyecto
que va a quedar publicado.
