/* =========================================================================
   BOB — el pelícano de la despensa
   -------------------------------------------------------------------------
   Personaje original. Un pelícano porque es el ave de Santa Marta y porque
   carga comida en la bolsa del pico: para una despensa que recibe y entrega
   alimentos, la metáfora se cuenta sola.

   Lo que vuelve reconocible a un pelícano es el pico largo con la bolsa
   colgando, así que el dibujo le da a eso casi la mitad del ancho. Está en
   SVG, pesa unos pocos kilobytes, se ve nítido a cualquier tamaño y se
   anima con CSS: parpadea, flota y abre la bolsa cuando Bob habla.
   ========================================================================= */

export const BOB_SVG = `
<svg class="bob" viewBox="-8 -6 216 202" role="img" aria-label="Bob, el pelícano de la despensa">
  <title>Bob</title>

  <ellipse class="bob-sombra" cx="86" cy="178" rx="44" ry="7"/>

  <g class="bob-flota">
    <!-- cola -->
    <path class="bob-ala" d="M38 126c-14-6-26-4-30 2 6 6 10 14 10 22 8-4 18-12 20-24z"/>

    <!-- cuerpo -->
    <ellipse class="bob-cuerpo" cx="84" cy="124" rx="48" ry="46"/>
    <ellipse class="bob-pecho" cx="92" cy="134" rx="32" ry="32"/>

    <!-- ala -->
    <path class="bob-ala" d="M62 112c-12 4-19 18-16 32 2 11 12 17 21 13 7-3 10-12 10-21 0-10-4-20-15-24z"/>

    <!-- patas -->
    <path class="bob-pata" d="M72 166v8m0 0-8 6m8-6 8 6"/>
    <path class="bob-pata" d="M100 166v8m0 0-8 6m8-6 8 6"/>

    <!-- cabeza -->
    <circle class="bob-cuerpo" cx="92" cy="66" r="34"/>

    <!-- gorra de marinero -->
    <path class="bob-gorra" d="M66 44A34 34 0 0 1 118 44Z"/>
    <rect class="bob-gorra-visera" x="57" y="41" width="70" height="8" rx="4"/>
    <circle class="bob-gorra-boton" cx="92" cy="36" r="4.5"/>

    <!-- EL PICO: lo que hace que se lea como pelícano -->
    <g class="bob-pico">
      <!-- la bolsa cuelga y se infla al hablar -->
      <g class="bob-bolsa-g">
        <path class="bob-bolsa" d="M116 80c22 0 46 4 62 10-4 22-24 36-44 34-16-2-26-14-28-30-1-6 2-12 10-14z"/>
        <path class="bob-bolsa-luz" d="M124 88c16 0 34 3 46 7-3 6-8 11-14 14-14 2-28-4-34-14-2-4-1-7 2-7z"/>
      </g>
      <!-- mandíbula de arriba, larga y afilada -->
      <path class="bob-pico-sup" d="M114 70c24-1 50 4 68 15 2 1 2 4-1 4-20 2-46 1-67-5-7-2-7-13 0-14z"/>
    </g>

    <!-- ojos, sobre el nacimiento del pico -->
    <g class="bob-ojos">
      <circle class="bob-ojo" cx="88" cy="62" r="10"/>
      <circle class="bob-ojo" cx="112" cy="63" r="8"/>
      <circle class="bob-pupila" cx="91" cy="63" r="4.8"/>
      <circle class="bob-pupila" cx="114" cy="64" r="3.9"/>
      <circle class="bob-brillo" cx="93" cy="60.5" r="1.8"/>
      <circle class="bob-brillo" cx="116" cy="62" r="1.5"/>
      <rect class="bob-parpado" x="78" y="43" width="20" height="20" rx="10"/>
      <rect class="bob-parpado" x="104" y="45" width="16" height="19" rx="8"/>
    </g>
  </g>
</svg>`;

/** Carga una imagen y dice si existe, sin dejar error en la consola. */
function existeImagen(ruta) {
  return new Promise((listo) => {
    if (!ruta) { listo(false); return; }
    const img = new Image();
    img.onload = () => listo(true);
    img.onerror = () => listo(false);
    img.src = ruta;
  });
}

/**
 * Deja la mascota dentro de un contenedor y la pone a moverse mientras la
 * asistente habla.
 *
 * Si hay una imagen propia en azul/marca/, la usa; si no, dibuja al
 * pelícano. El dibujo abre la bolsa del pico; una imagen fija no puede,
 * así que se balancea entera mientras dura la voz.
 */
export async function plantarBob(selector, rutaImagen) {
  const casa = document.querySelector(selector);
  if (!casa) return;

  if (await existeImagen(rutaImagen)) {
    casa.innerHTML = `<img class="bob bob-propio" src="${rutaImagen}" alt="Mascota de la despensa">`;
  } else {
    casa.innerHTML = BOB_SVG;
  }

  const bob = casa.querySelector(".bob");
  document.addEventListener("dora:habla", () => bob.classList.add("hablando"));
  document.addEventListener("dora:calla", () => bob.classList.remove("hablando"));
}

/** Cambia el logotipo de texto por una imagen propia, si la hay. */
export async function plantarLogo(rutaImagen) {
  if (!(await existeImagen(rutaImagen))) return;
  const img = document.querySelector("#marca-logo");
  const texto = document.querySelector("#marca-texto");
  if (!img) return;
  img.src = rutaImagen;
  img.alt = "D1RT";
  img.hidden = false;
  if (texto) texto.hidden = true;
}
