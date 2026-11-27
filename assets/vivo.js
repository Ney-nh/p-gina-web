/* =========================================================================
   MODO EN VIVO — Beta
   -------------------------------------------------------------------------
   Pantalla completa para conversar con Bob por voz, como en una llamada:
   tocas el micrófono, hablas, Bob piensa y te responde en voz alta, y
   vuelve a escucharte solo (conversación continua).

   Por ahora NO usa IA: responde con el mismo "cerebro" programado del chat
   (entender() de bot.js). Cuando haya IA, solo cambia la función
   obtenerRespuesta() de abajo; la pantalla, la voz y Bob 3D quedan igual.

   Estados de Bob:  reposo → escuchando → pensando → hablando → escuchando…
   Bob 3D (bob3d.js) cambia de gesto en cada uno. Si el 3D no carga, se
   muestra el Bob dibujado con gestos más simples.

   Para abrirlo directo (útil en una presentación): ?vivo al final de la dirección
   ========================================================================= */

import { entender, SUGERENCIAS } from "./bot.js";
import { plantarBob } from "./bob.js";
import { MARCA } from "../marca/config.js";
import { estadoDespensa } from "./app.js";
import { crearBob3D } from "./bob3d.js";

const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const hayVoz = "speechSynthesis" in window;

const TEXTO_ESTADO = {
  reposo: Reconocimiento ? "Toca el micrófono y háblame" : "Escríbeme o toca una pregunta",
  escuchando: "Te escucho…",
  pensando: "Pensando…",
  hablando: "Toca a Bob para interrumpirlo",
};

const SALUDO = "¡Hola! Soy Bob, el asistente de la despensa. Pregúntame cómo donar, " +
               "cómo retirar o qué hay disponible.";

/* ------------------------------------------------------------------------
   El cerebro (hoy: respuestas programadas)
   ------------------------------------------------------------------------ */

let pendiente = null;   // tema ofrecido en "¿Te refieres a…?"

async function obtenerRespuesta(pregunta) {
  const r = entender(pregunta, estadoDespensa(), { nombre: "Bob", pendiente });
  pendiente = r.pendiente || null;
  // Una pausa breve para que se vea a Bob pensar; con IA será el tiempo real.
  await new Promise((ok) => setTimeout(ok, 650 + Math.random() * 450));
  return r;
}

/* ------------------------------------------------------------------------
   La pantalla
   ------------------------------------------------------------------------ */

const ICONO_MIC = `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;
const ICONO_ALTO = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>`;

function construir() {
  const v = document.createElement("div");
  v.id = "vivo";
  v.className = "vivo";
  v.hidden = true;
  v.dataset.estado = "reposo";
  v.setAttribute("role", "dialog");
  v.setAttribute("aria-modal", "true");
  v.setAttribute("aria-label", "Conversación en vivo con Bob");
  v.innerHTML = `
    <header class="vivo-barra">
      <div class="vivo-titulo">Bob en vivo <span class="vivo-beta">Beta</span></div>
      <button class="vivo-cerrar" type="button" aria-label="Salir del modo en vivo">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>

    <div class="vivo-escena" id="vivo-escena" title="Toca a Bob">
      <div class="vivo-bob2d" id="vivo-bob2d"></div>
      <div class="vivo-ondas" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>

    <div class="vivo-estado" aria-live="polite">
      <span class="vivo-luz" aria-hidden="true"></span>
      <span id="vivo-estado-texto">${TEXTO_ESTADO.reposo}</span>
      <span class="vivo-puntos" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>

    <div class="vivo-textos">
      <p class="vivo-tu" id="vivo-tu" hidden></p>
      <p class="vivo-bob" id="vivo-bob"></p>
      <div class="vivo-opciones" id="vivo-opciones"></div>
    </div>

    <footer class="vivo-controles">
      <form class="vivo-escribir" id="vivo-form" autocomplete="off">
        <input id="vivo-campo" type="text" placeholder="O escribe aquí…" aria-label="Escribe tu pregunta" maxlength="200">
        <button type="submit" aria-label="Enviar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </form>
      <button class="vivo-mic" id="vivo-mic" type="button" aria-label="Hablar con Bob" ${Reconocimiento ? "" : "hidden"}>${ICONO_MIC}</button>
      <label class="vivo-continua" ${Reconocimiento ? "" : "hidden"}>
        <input type="checkbox" id="vivo-continua" checked> Conversación continua
      </label>
    </footer>`;
  document.body.appendChild(v);
  return v;
}

/* ------------------------------------------------------------------------
   Voz de Bob (pasa por voz-bob.js, que mueve la boca)
   ------------------------------------------------------------------------ */

function elegirVoz() {
  const voces = hayVoz ? speechSynthesis.getVoices() : [];
  return voces.find((v) => /es[-_]CO/i.test(v.lang)) ||
         voces.find((v) => /es[-_](MX|US|419)/i.test(v.lang)) ||
         voces.find((v) => /^es/i.test(v.lang)) || null;
}

function hablar(texto) {
  return new Promise((listo) => {
    if (!hayVoz) { listo(); return; }
    speechSynthesis.cancel();
    const frase = new SpeechSynthesisUtterance(texto);
    const voz = elegirVoz();
    if (voz) frase.voice = voz;
    frase.lang = voz?.lang || "es-CO";
    frase.rate = 1.02;
    let terminado = false;
    const fin = () => {
      if (terminado) return;
      terminado = true;
      document.dispatchEvent(new CustomEvent("dora:calla"));
      listo();
    };
    frase.onend = fin;
    frase.onerror = fin;
    document.dispatchEvent(new CustomEvent("dora:habla"));   // el Bob dibujado abre la bolsa
    speechSynthesis.speak(frase);
  });
}

function callar() {
  if (hayVoz) speechSynthesis.cancel();
  document.dispatchEvent(new CustomEvent("dora:calla"));
}

/* ------------------------------------------------------------------------
   Arranque
   ------------------------------------------------------------------------ */

export function iniciarVivo() {
  const v = construir();
  const $ = (s) => v.querySelector(s);
  const escena = $("#vivo-escena"), tu = $("#vivo-tu"), bobTexto = $("#vivo-bob");
  const opciones = $("#vivo-opciones"), estadoTexto = $("#vivo-estado-texto");
  const mic = $("#vivo-mic"), campo = $("#vivo-campo"), continua = $("#vivo-continua");

  plantarBob("#vivo-bob2d", MARCA.mascota);

  let bob3d = null;          // control de Bob 3D, si carga
  let intentado3d = false;
  let estado = "reposo";
  let abierto = false;
  let reconocedor = null;
  let turno = 0;             // invalida respuestas viejas si se interrumpe

  function ponerEstado(e) {
    estado = e;
    v.dataset.estado = e;
    estadoTexto.textContent = TEXTO_ESTADO[e];
    bob3d?.ponerEstado(e);
    mic.innerHTML = e === "escuchando" ? ICONO_ALTO : ICONO_MIC;
    mic.setAttribute("aria-label", e === "escuchando" ? "Dejar de escuchar" : "Hablar con Bob");
  }

  function pintarOpciones(lista) {
    opciones.innerHTML = "";
    for (const texto of lista) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "vivo-op";
      b.textContent = texto;
      b.onclick = () => preguntar(texto);
      opciones.appendChild(b);
    }
  }

  /* ---------------------------- conversación --------------------------- */

  async function preguntar(texto) {
    texto = texto.trim();
    if (!texto) return;
    const miTurno = ++turno;
    detenerEscucha();
    callar();
    tu.hidden = false;
    tu.textContent = `“${texto}”`;
    tu.classList.remove("parcial");
    bobTexto.textContent = "";
    opciones.innerHTML = "";
    ponerEstado("pensando");

    const r = await obtenerRespuesta(texto);
    if (miTurno !== turno || !abierto) return;     // lo interrumpieron

    bobTexto.textContent = r.texto;
    bobTexto.scrollTop = 0;
    pintarOpciones((r.opciones || []).map((t) => t.pregunta));
    ponerEstado("hablando");
    await hablar(r.texto);
    if (miTurno !== turno || !abierto) return;

    // Conversación continua: vuelve a escuchar solo, salvo que haya que elegir.
    if (Reconocimiento && continua.checked && !(r.opciones || []).length) {
      setTimeout(() => { if (miTurno === turno && abierto) escuchar(); }, 350);
    } else {
      ponerEstado("reposo");
    }
  }

  function escuchar() {
    if (!Reconocimiento) return;
    turno++;
    callar();
    detenerEscucha();
    const r = new Reconocimiento();
    r.lang = "es-CO";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    let oyoAlgo = false;

    r.onstart = () => ponerEstado("escuchando");
    r.onresult = (ev) => {
      let texto = "";
      for (const res of ev.results) texto += res[0].transcript;
      oyoAlgo = true;
      tu.hidden = false;
      tu.textContent = texto;
      tu.classList.add("parcial");
      if (ev.results[ev.results.length - 1].isFinal) {
        r.onend = null;
        r.stop();
        preguntar(texto);
      }
    };
    r.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        bobTexto.textContent = "No tengo permiso para usar el micrófono. Actívalo en el candado " +
                               "de la barra de direcciones, o escríbeme abajo.";
      } else if (ev.error === "no-speech") {
        bobTexto.textContent = "No alcancé a oírte. Toca el micrófono cuando quieras seguir.";
      }
    };
    r.onend = () => {
      reconocedor = null;
      if (estado === "escuchando") {
        if (!oyoAlgo) tu.hidden = true;
        ponerEstado("reposo");
      }
    };
    reconocedor = r;
    try { r.start(); } catch { ponerEstado("reposo"); }
  }

  function detenerEscucha() {
    if (!reconocedor) return;
    const r = reconocedor;
    reconocedor = null;
    r.onend = null;
    try { r.abort(); } catch { /* ya estaba detenido */ }
  }

  /* ------------------------------ abrir/cerrar ------------------------- */

  async function abrir({ saludar = true } = {}) {
    if (abierto) return;
    abierto = true;
    v.hidden = false;
    document.body.classList.add("vivo-abierto");
    ponerEstado("reposo");
    tu.hidden = true;
    bobTexto.textContent = SALUDO;
    pintarOpciones(SUGERENCIAS.slice(0, 4));

    if (!intentado3d) {
      intentado3d = true;
      bob3d = await crearBob3D(escena, { anillo: true });
      if (bob3d) { v.classList.add("con-3d"); bob3d.ponerEstado(estado); }
    }
    // El navegador solo deja hablar después de que la persona toca algo.
    if (saludar && navigator.userActivation?.hasBeenActive !== false) {
      const miTurno = ++turno;
      ponerEstado("hablando");
      await hablar(SALUDO);
      if (miTurno === turno && abierto && estado === "hablando") ponerEstado("reposo");
    }
  }

  function cerrar() {
    abierto = false;
    turno++;
    detenerEscucha();
    callar();
    ponerEstado("reposo");
    v.hidden = true;
    document.body.classList.remove("vivo-abierto");
    document.querySelector("[data-abre-vivo]")?.focus();
  }

  /* -------------------------------- eventos ---------------------------- */

  $(".vivo-cerrar").onclick = cerrar;
  mic.onclick = () => {
    if (estado === "escuchando") { detenerEscucha(); ponerEstado("reposo"); }
    else escuchar();
  };
  escena.onclick = () => {
    // Tocar a Bob mientras habla lo interrumpe y lo pone a escuchar.
    if (estado === "hablando") {
      turno++;
      callar();
      if (Reconocimiento) escuchar(); else ponerEstado("reposo");
    } else if (estado === "reposo" && Reconocimiento) {
      escuchar();
    }
  };
  $("#vivo-form").onsubmit = (ev) => {
    ev.preventDefault();
    const texto = campo.value;
    campo.value = "";
    campo.blur();
    preguntar(texto);
  };
  document.addEventListener("keydown", (ev) => {
    if (abierto && ev.key === "Escape") cerrar();
  });
  document.querySelectorAll("[data-abre-vivo]").forEach((b) => {
    b.addEventListener("click", (ev) => { ev.stopPropagation(); abrir(); });
  });

  // ?vivo en la dirección abre directo (sin saludo en voz: el navegador no lo permite
  // hasta que la persona toque algo).
  if (new URLSearchParams(location.search).has("vivo")) abrir({ saludar: false });

  return { abrir, cerrar, preguntar };
}
