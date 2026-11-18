/* =========================================================================
   VOZ Y BOCA DE BOB — Beta, solo en la página de prueba
   -------------------------------------------------------------------------
   Convierte lo que Bob dice en un número entre 0 (boca cerrada) y 1 (boca
   abierta del todo), sesenta veces por segundo. Lo usan el Bob 3D
   (bob3d.js) y el Bob dibujado de la página.

   No toca assets/bot.js, que es compartido con la página real: se pone
   delante de speechSynthesis.speak() y lee el texto que el bot va a decir.

   CÓMO SABE CUÁNDO ABRIR LA BOCA
   La voz del navegador no deja leer su audio, así que no se puede medir el
   volumen. En su lugar, el texto se parte en sílabas: cada sílaba es una
   apertura de la boca (más grande en la "a", más pequeña en la "i" y la
   "u"), y cada coma o punto es una pausa con la boca cerrada. Si el
   navegador avisa por qué palabra va (evento "boundary"), la animación se
   resincroniza con esa palabra.

   CUANDO HAYA GRABACIONES DE LA VOZ REAL (fase 2)
   Con un archivo de audio sí se puede medir el volumen. La función
   bocaDesdeAudio() de abajo ya hace eso; falta enlazar cada respuesta del
   bot con su grabación.
   ========================================================================= */

export const VOZ_BOB = {
  tono: 0.85,        // 1 = normal; menos de 1, más grave
  velocidad: 1.0,    // 1 = normal
  silabasPorSegundo: 5.4,  // ritmo aproximado de la voz del navegador en español
};

/* El valor que leen las animaciones. */
export const boca = { valor: 0, hablando: false };

/* ------------------------------------------------------------------------
   1. Del texto a una línea de tiempo de sílabas
   ------------------------------------------------------------------------ */

const VOCAL = /[aeiouáéíóúü]/i;
const APERTURA = { a: 1, á: 1, e: 0.8, é: 0.8, o: 0.85, ó: 0.85, i: 0.55, í: 0.55, u: 0.5, ú: 0.5, ü: 0.5 };

/**
 * Parte una frase en tramos: { inicio, fin, apertura, indice }.
 * apertura 0 = pausa. `indice` es la posición en el texto, para resincronizar.
 * Los tiempos están en segundos con velocidad 1.
 */
export function lineaDeTiempo(texto, silabasPorSegundo = VOZ_BOB.silabasPorSegundo) {
  const tramos = [];
  const dur = 1 / silabasPorSegundo;
  let t = 0;
  const re = /([a-záéíóúüñ0-9]+)|([,;:])|([.!?¿¡…]+)/gi;
  let m;
  while ((m = re.exec(texto))) {
    if (m[1]) {
      // Grupos de vocales seguidas = sílabas (aproximado, basta para la boca).
      const grupos = m[1].match(/[aeiouáéíóúü]+/gi) || [];
      // Los números se dicen con varias sílabas: "25" = "veinticinco".
      const n = /^\d+$/.test(m[1]) ? Math.min(2 + m[1].length * 2, 8) : Math.max(grupos.length, 1);
      for (let i = 0; i < n; i++) {
        const v = (grupos[i] || "a").toLowerCase();
        const fuerte = [...v].find((c) => VOCAL.test(c)) || "a";
        tramos.push({ inicio: t, fin: t + dur, apertura: APERTURA[fuerte] ?? 0.7, indice: m.index });
        t += dur;
      }
      t += dur * 0.15;  // respiro mínimo entre palabras
    } else {
      const pausa = m[2] ? 0.22 : 0.38;
      tramos.push({ inicio: t, fin: t + pausa, apertura: 0, indice: m.index });
      t += pausa;
    }
  }
  return { tramos, duracion: t };
}

/** Apertura de la boca en el segundo `s` de la línea de tiempo. */
export function aperturaEn(linea, s) {
  // Búsqueda binaria: las respuestas largas tienen unos 200 tramos.
  const { tramos } = linea;
  let lo = 0, hi = tramos.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const tr = tramos[mid];
    if (s < tr.inicio) hi = mid - 1;
    else if (s >= tr.fin) lo = mid + 1;
    else {
      if (!tr.apertura) return 0;
      const x = (s - tr.inicio) / (tr.fin - tr.inicio);
      // Abre rápido y cierra un poco más lento, como al hablar.
      return tr.apertura * Math.pow(Math.sin(Math.PI * Math.min(x * 1.15, 1)), 0.7);
    }
  }
  return 0;
}

/** Segundo de la línea de tiempo en que empieza el carácter `indice`. */
function segundoDeIndice(linea, indice) {
  for (const tr of linea.tramos) if (tr.indice >= indice) return tr.inicio;
  return linea.duracion;
}

/* ------------------------------------------------------------------------
   2. Seguir a la voz del navegador
   ------------------------------------------------------------------------ */

let actual = null;  // { linea, origen, factor }
let desdeAudio = false;  // fase 2: una grabación manda sobre la boca

function empezar(texto, velocidad) {
  const linea = lineaDeTiempo(texto);
  actual = { linea, origen: performance.now(), factor: velocidad || 1 };
  boca.hablando = true;
}

function terminar() {
  actual = null;
  boca.hablando = false;
}

function cuadro(ahora) {
  if (desdeAudio) {
    document.documentElement.style.setProperty("--boca", boca.valor.toFixed(3));
    requestAnimationFrame(cuadro);
    return;
  }
  let objetivo = 0;
  if (actual) {
    let s = ((ahora - actual.origen) / 1000) * actual.factor;
    // Si la voz real va más lenta que la estimación, se sigue moviendo la
    // boca en bucle hasta que el navegador avise que terminó.
    if (s > actual.linea.duracion) s = actual.linea.duracion * 0.6 + (s % (actual.linea.duracion * 0.4 || 1));
    objetivo = aperturaEn(actual.linea, s);
  }
  // Suavizado: la boca no salta de golpe de un valor a otro.
  boca.valor += (objetivo - boca.valor) * (objetivo > boca.valor ? 0.55 : 0.35);
  if (boca.valor < 0.003) boca.valor = 0;
  document.documentElement.style.setProperty("--boca", boca.valor.toFixed(3));
  requestAnimationFrame(cuadro);
}

/**
 * Se pone delante de speechSynthesis.speak() para leer cada frase que el
 * bot va a decir, darle la voz de Bob y mover la boca al ritmo.
 */
export function iniciarVozBob() {
  requestAnimationFrame(cuadro);
  if (!("speechSynthesis" in window)) return;

  const sintesis = window.speechSynthesis;
  const hablarOriginal = sintesis.speak.bind(sintesis);
  const callarOriginal = sintesis.cancel.bind(sintesis);

  sintesis.speak = (frase) => {
    frase.pitch = VOZ_BOB.tono;
    frase.rate = (frase.rate || 1) * VOZ_BOB.velocidad;
    const texto = frase.text;
    frase.addEventListener("start", () => empezar(texto, frase.rate));
    frase.addEventListener("boundary", (ev) => {
      // Resincroniza con la palabra que el navegador está diciendo.
      if (!actual || ev.name === "sentence") return;
      const s = segundoDeIndice(actual.linea, ev.charIndex);
      actual.origen = performance.now() - (s / actual.factor) * 1000;
    });
    frase.addEventListener("end", terminar);
    frase.addEventListener("error", terminar);
    return hablarOriginal(frase);
  };
  sintesis.cancel = () => { terminar(); return callarOriginal(); };
  document.addEventListener("dora:calla", terminar);
}

/* ------------------------------------------------------------------------
   3. Fase 2: boca a partir de una grabación real
   ------------------------------------------------------------------------ */

/**
 * Reproduce un archivo de audio y mueve la boca según su volumen real.
 * Devuelve una promesa que se cumple cuando termina.
 */
export async function bocaDesdeAudio(url) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const audio = new Audio(url);
  const fuente = ctx.createMediaElementSource(audio);
  const analizador = ctx.createAnalyser();
  analizador.fftSize = 1024;
  fuente.connect(analizador);
  analizador.connect(ctx.destination);
  const datos = new Uint8Array(analizador.fftSize);

  actual = null;
  desdeAudio = true;
  boca.hablando = true;
  let activo = true;
  const medir = () => {
    if (!activo) return;
    analizador.getByteTimeDomainData(datos);
    let suma = 0;
    for (const d of datos) suma += ((d - 128) / 128) ** 2;
    const rms = Math.sqrt(suma / datos.length);
    boca.valor = Math.min(1, Math.max(0, (rms - 0.02) * 6));
    requestAnimationFrame(medir);
  };
  await audio.play();
  medir();
  await new Promise((ok) => { audio.onended = ok; audio.onerror = ok; });
  activo = false;
  desdeAudio = false;
  boca.hablando = false;
  ctx.close();
}
