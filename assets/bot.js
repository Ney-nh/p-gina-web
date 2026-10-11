/* =========================================================================
   DORA — la asistente de la despensa
   -------------------------------------------------------------------------
   Responde dudas sobre cómo usar la despensa, por escrito o hablando.

   Funciona en dos modos, y cambia sola:

     PROPIO   Conocimiento escrito aquí, más los datos reales de la
              despensa. No necesita internet ni clave de nada. Es el que
              usa siempre, salvo que el otro esté disponible.

     OLLAMA   Si tienes Ollama corriendo en tu computador, lo usa para
              responder con un modelo de verdad. Ver OLLAMA al final del
              archivo para encenderlo. Si falla o no responde a tiempo,
              vuelve solo al modo propio sin que se note.

   La voz sale del propio navegador (Web Speech API): no cuesta nada y no
   manda la voz a ningún servidor.
   ========================================================================= */

/* =========================================================================
   1. LO QUE DORA SABE
   -------------------------------------------------------------------------
   Cada tema tiene palabras que lo disparan y una respuesta. Para añadir un
   tema nuevo basta con copiar un bloque. Las palabras no necesitan tildes:
   la comparación las ignora.
   ========================================================================= */

const TEMAS = [
  {
    id: "donar",
    claves: ["donar", "dejar", "aportar", "entregar", "traer", "regalar", "dar comida",
             "quiero ayudar", "como dono", "contribuir"],
    respuesta:
      "Para donar: toca el botón verde Registrar entrada, escribe tu nombre y tu " +
      "número de documento, elige qué alimento traes y cuántas unidades. Al guardar, " +
      "la compuerta se abre sola del lado que corresponde y tienes cinco segundos " +
      "para dejar los alimentos dentro.",
  },
  {
    id: "retirar",
    claves: ["retirar", "sacar", "tomar", "llevar", "necesito comida", "coger",
             "como saco", "puedo llevar", "recibir", "me puedo servir"],
    respuesta:
      "Para retirar: toca el botón naranja Registrar salida, escribe tu nombre y tu " +
      "documento, y elige qué vas a llevar. La compuerta se abre y tienes cinco " +
      "segundos. No tienes que pedir permiso a nadie: la despensa está para eso.",
  },
  {
    id: "lados",
    claves: ["lado", "frio", "caliente", "dos puertas", "dos compuertas", "por que dos",
             "cual puerta", "que puerta", "compartimento", "nevera"],
    respuesta:
      "La despensa tiene dos compartimentos. El lado frío guarda lo que necesita " +
      "conservarse fresco: lácteos, frutas y bebidas. El lado caliente guarda lo seco " +
      "y lo frito. Tú no eliges: al marcar el alimento, la aplicación abre el lado " +
      "correcto por su cuenta.",
  },
  {
    id: "categorias",
    claves: ["que puedo donar", "que alimentos", "categorias", "que reciben",
             "que se puede", "tipos de comida", "que aceptan"],
    respuesta:
      "Se manejan cuatro categorías: lácteos, frutas, fritos y bebidas. Lácteos, " +
      "frutas y bebidas van al lado frío; los fritos van al lado caliente.",
  },
  {
    id: "documento",
    claves: ["documento", "cedula", "por que piden", "datos", "privacidad", "nombre",
             "para que mi nombre", "identificacion", "me registran"],
    respuesta:
      "Se pide el nombre y el documento para llevar la cuenta de lo que entra y sale, " +
      "y así saber qué hace falta reponer. No se usa para nada más, y no hay que " +
      "crear cuenta ni contraseña.",
  },
  {
    id: "compuerta_problema",
    claves: ["no abre", "no se abre", "la compuerta no", "no abrio", "no se abrio",
             "atascada", "trabada", "sigue cerrada", "no quiere abrir"],
    respuesta:
      "Si la compuerta no abre, mira arriba si dice Conectada. Si dice Sin conexión, " +
      "toca Conectar la compuerta y elige DIRT. Si ya está conectada y aun así no " +
      "abre, revisa que los servos tengan corriente: con dos servos hace falta una " +
      "fuente externa, no alcanza con el USB. Tu registro quedó guardado de todas " +
      "formas.",
  },
  {
    id: "no_conecta_bluetooth",
    claves: ["no se conecta", "no conecta", "no encuentra", "no aparece", "error de conexion",
             "connection failed", "no lo detecta", "no sale en la lista", "fallo la conexion",
             "no se enlaza", "arduino no conecta", "no me conecta"],
    respuesta:
      "Lo más común es que el Arduino esté emparejado en los ajustes del teléfono. " +
      "Entra a Ajustes, Bluetooth, busca DIRT y desvincúlalo. Esta página no necesita " +
      "emparejar nada: lo encuentra sola. Después apaga y enciende el Bluetooth, " +
      "reinicia el Arduino y vuelve a intentar.",
  },
  {
    id: "navegador",
    claves: ["que navegador", "safari", "iphone", "firefox", "edge", "chrome",
             "no me sale el boton", "no veo el boton de conectar", "desde mi iphone",
             "funciona en iphone", "ios"],
    respuesta:
      "La compuerta solo se puede accionar desde Chrome o Edge, en Android o en " +
      "computador. En iPhone y en Safari no existe la función de Bluetooth del " +
      "navegador. Desde cualquier teléfono sí se puede registrar y consultar el " +
      "inventario, que es la mayor parte.",
  },
  {
    id: "permiso_bluetooth",
    claves: ["permiso", "no me deja", "bloqueo", "me pide permiso", "dispositivos cercanos",
             "no tengo permiso", "denegado"],
    respuesta:
      "En Android 12 o más nuevo hace falta el permiso de Dispositivos cercanos. Si lo " +
      "negaste sin querer, entra a Ajustes, Aplicaciones, busca el navegador y " +
      "concédeselo. Luego recarga la página.",
  },
  {
    id: "como_funciona",
    claves: ["como funciona por dentro", "que tecnologia", "como esta hecho", "arduino",
             "como lo hicieron", "que usa", "servo", "programacion", "como esta programado",
             "que lleva por dentro", "tecnicamente"],
    respuesta:
      "La página habla por Bluetooth con un Arduino UNO R4 WiFi que mueve dos servos, " +
      "uno por cada compartimento. Los registros se guardan en Firestore, así que se " +
      "ven al instante en cualquier teléfono. La página es estática: no hay servidor " +
      "que mantener.",
  },
  {
    id: "sin_luz",
    claves: ["se va la luz", "sin luz", "sin energia", "apagon", "sin internet",
             "sin señal", "sin datos", "no hay wifi"],
    respuesta:
      "Sin internet la compuerta sigue funcionando, porque el Bluetooth no lo necesita. " +
      "Lo que no se puede es guardar en la nube hasta que vuelva la conexión. Si se va " +
      "la luz, el Arduino se apaga y la compuerta queda cerrada.",
  },
  {
    id: "comida_estado",
    claves: ["esta buena", "en buen estado", "vencida", "caducada", "fecha de vencimiento",
             "se daña", "esta fresca", "cuanto dura", "mal estado"],
    respuesta:
      "Antes de donar, revisa la fecha de vencimiento y que el empaque esté cerrado. " +
      "No se recibe comida preparada ni abierta, porque no hay forma de saber cómo se " +
      "guardó. Si algo se ve en mal estado, mejor avisarle a quien esté encargado.",
  },
  {
    id: "que_no_donar",
    claves: ["que no puedo donar", "que no reciben", "no aceptan", "prohibido",
             "puedo donar comida hecha", "comida preparada", "sobras"],
    respuesta:
      "No se reciben sobras ni comida preparada, ni paquetes abiertos, ni nada vencido. " +
      "Sí se reciben alimentos sellados y dentro de su fecha: lácteos, frutas, fritos y " +
      "bebidas.",
  },
  {
    id: "quien_mantiene",
    claves: ["quien la cuida", "quien mantiene", "quien la maneja", "de quien es",
             "quien responde", "quien la hizo", "quien administra", "encargado"],
    respuesta:
      "La despensa la sostiene la comunidad: funciona con lo que la gente deja. El " +
      "registro de cada movimiento permite saber qué se está acabando y reponerlo a " +
      "tiempo.",
  },
  {
    id: "dos_servos",
    claves: ["dos servos", "como sabe que lado", "quien elige el lado", "por que ese lado",
             "como decide", "abre sola"],
    respuesta:
      "No lo eliges tú. Al marcar la categoría del alimento, la aplicación envía al " +
      "Arduino la orden del lado que corresponde: lácteos, frutas y bebidas al frío; " +
      "fritos al caliente. Así nadie guarda algo donde no va.",
  },
  {
    id: "seguridad_cierre",
    claves: ["se queda abierta", "y si no cierra", "que pasa si", "se olvida abierta",
             "no se cierra"],
    respuesta:
      "Hay tres cierres encadenados. La página cierra a los cinco segundos. Si eso " +
      "falla, el Arduino cierra cualquier lado que lleve más de quince segundos " +
      "abierto. Y si se pierde la conexión, cierra todo de inmediato.",
  },
  {
    id: "borrar_registro",
    claves: ["me equivoque", "borrar", "eliminar registro", "corregir", "esta mal",
             "puse mal", "deshacer"],
    respuesta:
      "En la pestaña Historial cada registro tiene un botón para eliminarlo. El dato no " +
      "se pierde del todo: queda marcado como eliminado, para que el conteo no se " +
      "descuadre.",
  },
  {
    id: "tiempo",
    claves: ["cuanto tiempo", "cuantos segundos", "se cierra", "cierra sola",
             "cuanto dura", "se cierra rapido"],
    respuesta:
      "La compuerta se queda abierta cinco segundos y se cierra sola. Si necesitas " +
      "cerrarla antes, hay un botón para hacerlo. Y si algo se traba, el Arduino la " +
      "cierra solo a los quince segundos.",
  },
  {
    id: "que_es",
    claves: ["que es dirt", "que es esto", "de que se trata", "para que sirve",
             "que es la despensa", "explicame", "de que va"],
    respuesta:
      "Esto es D.I.R.T. Comunitario, una despensa de alimentos compartida. " +
      "Cualquiera puede dejar alimentos que le sobran y cualquiera puede tomar los " +
      "que necesita. La aplicación lleva el registro y abre la compuerta sola según " +
      "el tipo de alimento.",
  },
  {
    id: "costo",
    claves: ["cuanto cuesta", "cuanto vale", "es gratis", "hay que pagar", "precio"],
    respuesta:
      "No cuesta nada. Ni donar ni retirar. La despensa se sostiene con lo que la " +
      "gente deja.",
  },
  {
    id: "limite",
    claves: ["cuanto puedo llevar", "cuanto puedo sacar", "limite", "maximo",
             "puedo llevar todo", "cuantas unidades"],
    respuesta:
      "No hay un límite fijo. La idea es que tomes lo que necesitas y dejes para los " +
      "que vienen después.",
  },
  {
    id: "saludo",
    claves: ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches",
             "que tal", "saludos", "hey"],
    respuesta:
      "Hola. Soy la asistente de la despensa. Puedo explicarte cómo donar, cómo " +
      "retirar alimentos, o decirte qué hay disponible ahora mismo.",
  },
  {
    id: "gracias",
    claves: ["gracias", "muchas gracias", "te pasaste", "genial", "perfecto", "listo"],
    respuesta: "Con mucho gusto. Si te queda otra duda, aquí estoy.",
  },
  {
    id: "despedida",
    claves: ["adios", "chao", "hasta luego", "nos vemos", "bye"],
    respuesta: "Hasta luego. Que te vaya bien.",
  },
];

/* Temas que no se responden con texto fijo, sino con los datos de verdad. */
const CLAVES_INVENTARIO = [
  "que hay", "hay comida", "hay algo", "disponible", "inventario", "stock",
  "cuanto hay", "que tienen", "queda", "hay frutas", "hay lacteos", "hay bebidas",
  "hay fritos", "esta vacia", "esta llena",
];

const CLAVES_MOVIMIENTOS = [
  "cuantas personas", "cuanta gente", "hoy", "movimientos", "registros",
  "cuantos donaron", "estadisticas", "actividad",
];

const SIN_RESPUESTA =
  "No estoy segura de eso. Puedo ayudarte con cómo donar, cómo retirar alimentos, " +
  "qué hay disponible, o por qué la despensa tiene dos lados.";

const SUGERENCIAS = [
  "¿Cómo dono alimentos?",
  "¿Cómo retiro algo?",
  "¿Qué hay disponible?",
  "¿Por qué hay dos puertas?",
  "El Arduino no se conecta",
  "¿Qué no se puede donar?",
];

/* =========================================================================
   2. ENTENDER LA PREGUNTA
   ========================================================================= */

/** Quita tildes, signos y mayúsculas para comparar sin tropiezos. */
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,;:()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Puntúa cuánto encaja una frase con una lista de palabras clave.
 * Una clave de varias palabras que aparece entera vale más que una suelta.
 */
function puntuar(frase, claves) {
  let puntos = 0;
  for (const clave of claves) {
    const c = normalizar(clave);
    if (frase.includes(c)) puntos += c.includes(" ") ? 3 : 2;
    else if (c.includes(" ")) {
      const partes = c.split(" ");
      const encajan = partes.filter((p) => p.length > 3 && frase.includes(p)).length;
      if (encajan === partes.length) puntos += 2;
    }
  }
  return puntos;
}

/* =========================================================================
   3. RESPUESTAS CON DATOS REALES
   ========================================================================= */

function responderInventario(datos) {
  const conStock = datos.categorias.filter((c) => c.stock > 0);
  if (!conStock.length) {
    return "Ahora mismo la despensa está vacía. Si puedes traer algo, se agradece.";
  }
  const lista = conStock
    .map((c) => `${c.stock} de ${c.nombre.toLowerCase()}`)
    .join(", ")
    .replace(/, ([^,]*)$/, " y $1");
  return `En la despensa hay ${lista}. En total, ${datos.total} unidades.`;
}

const NOMBRE_LADO = { frio: "frío", caliente: "caliente" };

function responderCategoria(datos, catId) {
  const c = datos.categorias.find((x) => x.id === catId);
  if (!c) return SIN_RESPUESTA;
  if (c.stock > 0) {
    return `Sí, hay ${c.stock} ${c.stock === 1 ? "unidad" : "unidades"} de ` +
           `${c.nombre.toLowerCase()}, en el lado ${NOMBRE_LADO[c.lado]}.`;
  }
  return `Ahora mismo no hay ${c.nombre.toLowerCase()}.`;
}

function responderMovimientos(datos) {
  const { entradas, salidas } = datos.hoy;
  if (!entradas && !salidas) {
    return "Hoy todavía no se ha registrado ningún movimiento.";
  }
  const partes = [];
  if (entradas) partes.push(`${entradas} ${entradas === 1 ? "donación" : "donaciones"}`);
  if (salidas) partes.push(`${salidas} ${salidas === 1 ? "retiro" : "retiros"}`);
  return `Hoy van ${partes.join(" y ")}.`;
}

/* =========================================================================
   4. EL CEREBRO PROPIO
   ========================================================================= */

function pensar(pregunta, datos) {
  const frase = normalizar(pregunta);
  if (!frase) return SIN_RESPUESTA;

  // ¿Pregunta por una categoría concreta?
  for (const c of datos.categorias) {
    const nombre = normalizar(c.nombre);
    const pideExistencia = /\b(hay|queda|tienen|disponible|quedan)\b/.test(frase);
    if (frase.includes(nombre) && pideExistencia) {
      return responderCategoria(datos, c.id);
    }
  }

  const puntosInventario = puntuar(frase, CLAVES_INVENTARIO);
  const puntosMovimientos = puntuar(frase, CLAVES_MOVIMIENTOS);

  let mejor = null;
  let mejorPuntaje = 0;
  for (const tema of TEMAS) {
    const p = puntuar(frase, tema.claves);
    if (p > mejorPuntaje) { mejorPuntaje = p; mejor = tema; }
  }

  // En un empate gana el tema concreto: una pregunta como "por qué hay dos
  // puertas" contiene "que hay", pero no está pidiendo el inventario.
  if (puntosInventario > mejorPuntaje) return responderInventario(datos);
  if (puntosMovimientos > mejorPuntaje) return responderMovimientos(datos);
  if (mejor && mejorPuntaje >= 2) return mejor.respuesta;

  return SIN_RESPUESTA;
}

/* =========================================================================
   5. OLLAMA — opcional, para tu propio computador
   -------------------------------------------------------------------------
   Para encenderlo:

     1. Instala Ollama desde ollama.com y descarga un modelo:
            ollama pull llama3.2
     2. Deja que Ollama acepte peticiones desde la página. En Windows,
        PowerShell como administrador:
            setx OLLAMA_ORIGINS "https://ney-nh.github.io,http://localhost"
        Cierra Ollama desde la bandeja del sistema y vuelve a abrirlo.
     3. Cambia `activo` a true aquí abajo.

   Si Ollama no responde en 8 segundos, Dora contesta con su propio
   conocimiento y nadie nota nada.
   ========================================================================= */

const OLLAMA = {
  activo: false,
  url: "http://localhost:11434/api/chat",
  modelo: "llama3.2",
  esperaMs: 8000,
};

function instrucciones(datos) {
  const inventario = datos.categorias
    .map((c) => `${c.nombre}: ${c.stock} unidades (lado ${c.lado})`)
    .join("; ");
  return (
    `Eres ${typeof document !== "undefined" ? (document.querySelector(".bot-nombre strong")?.textContent.trim() || "Dora") : "Dora"}, la asistente de una despensa comunitaria de alimentos llamada ` + +
    "D.I.R.T. Comunitario, en Santa Marta, Colombia. Respondes en español, en dos " +
    "o tres frases como máximo, con calidez y sin tecnicismos. Nunca inventes datos.\n\n" +
    "Cómo funciona la despensa: cualquiera puede dejar alimentos o tomar los que " +
    "necesita, sin costo. Para donar se usa el botón Registrar entrada; para retirar, " +
    "Registrar salida. En ambos casos se pide nombre, documento, categoría del " +
    "alimento y cantidad. Al guardar, una compuerta automática se abre cinco segundos " +
    "y se cierra sola.\n\n" +
    "La despensa tiene dos compartimentos. Lácteos, frutas y bebidas van al lado " +
    "frío. Los fritos van al lado caliente. La aplicación elige el lado sola según " +
    "el alimento.\n\n" +
    `Inventario ahora mismo: ${inventario}. Hoy ha habido ${datos.hoy.entradas} ` +
    `donaciones y ${datos.hoy.salidas} retiros.`
  );
}

async function preguntarAOllama(pregunta, datos, historial) {
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), OLLAMA.esperaMs);
  try {
    const r = await fetch(OLLAMA.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: corte.signal,
      body: JSON.stringify({
        model: OLLAMA.modelo,
        stream: false,
        options: { temperature: 0.4 },
        messages: [
          { role: "system", content: instrucciones(datos) },
          ...historial.slice(-4),
          { role: "user", content: pregunta },
        ],
      }),
    });
    if (!r.ok) throw new Error(`Ollama respondió ${r.status}`);
    const j = await r.json();
    const texto = j?.message?.content?.trim();
    if (!texto) throw new Error("Ollama devolvió una respuesta vacía");
    return texto;
  } finally {
    clearTimeout(reloj);
  }
}

/* =========================================================================
   6. VOZ
   ========================================================================= */

const vozDisponible = typeof window !== "undefined" && "speechSynthesis" in window;
const Reconocimiento =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

let vozElegida = null;

function elegirVoz() {
  if (!vozDisponible) return null;
  const voces = speechSynthesis.getVoices();
  if (!voces.length) return null;
  // Preferir una voz colombiana, luego cualquier española.
  return (
    voces.find((v) => /es[-_]CO/i.test(v.lang)) ||
    voces.find((v) => /es[-_](MX|US|AR|CL|PE)/i.test(v.lang)) ||
    voces.find((v) => /^es/i.test(v.lang)) ||
    null
  );
}

/* Avisa cuándo empieza y termina de hablar, por si la página tiene un
   personaje que deba mover la boca. Si no lo hay, no pasa nada. */
function avisar(nombre) {
  document.dispatchEvent(new CustomEvent(nombre));
}

function hablar(texto, alTerminar = () => {}) {
  if (!vozDisponible) { alTerminar(); return; }
  speechSynthesis.cancel();
  const frase = new SpeechSynthesisUtterance(texto);
  if (!vozElegida) vozElegida = elegirVoz();
  if (vozElegida) frase.voice = vozElegida;
  frase.lang = vozElegida?.lang || "es-CO";
  frase.rate = 1.02;
  frase.pitch = 1.0;
  const fin = () => { avisar("dora:calla"); alTerminar(); };
  frase.onend = fin;
  frase.onerror = fin;
  avisar("dora:habla");
  speechSynthesis.speak(frase);
}

function callar() {
  if (vozDisponible) speechSynthesis.cancel();
  avisar("dora:calla");
}

/* =========================================================================
   7. LA INTERFAZ
   ========================================================================= */

const $ = (s, raiz = document) => raiz.querySelector(s);

export function iniciarBot({ estadoDespensa }) {
  const panel      = $("#bot-panel");
  const lanzador   = $("#bot-lanzador");
  const cerrar     = $("#bot-cerrar");
  const hilo       = $("#bot-hilo");
  const campo      = $("#bot-campo");
  const enviar     = $("#bot-enviar");
  const microfono  = $("#bot-microfono");
  const altavoz    = $("#bot-altavoz");
  const sugerencias = $("#bot-sugerencias");
  if (!panel) return;

  // El nombre sale de la propia página, así cada tema puede llamarla
  // como quiera sin tocar este archivo.
  const NOMBRE = $(".bot-nombre strong")?.textContent.trim() || "Dora";

  let hablando = true;           // responder también en voz alta
  let escuchando = false;
  let pensando = false;
  const historial = [];          // para Ollama

  // Las voces del navegador tardan un instante en estar listas.
  if (vozDisponible) {
    speechSynthesis.onvoiceschanged = () => { vozElegida = elegirVoz(); };
  }

  /* ----------------------------- mensajes ----------------------------- */

  function burbuja(texto, quien) {
    const b = document.createElement("div");
    b.className = `burbuja burbuja-${quien}`;
    b.textContent = texto;
    hilo.appendChild(b);
    hilo.scrollTop = hilo.scrollHeight;
    return b;
  }

  function pintarSugerencias() {
    sugerencias.innerHTML = "";
    for (const s of SUGERENCIAS) {
      const b = document.createElement("button");
      b.className = "bot-sug";
      b.textContent = s;
      b.onclick = () => responder(s);
      sugerencias.appendChild(b);
    }
  }

  async function responder(pregunta) {
    if (pensando) return;
    const texto = pregunta.trim();
    if (!texto) return;

    pensando = true;
    campo.value = "";
    sugerencias.hidden = true;
    burbuja(texto, "yo");

    const esperando = burbuja("…", "dora");
    esperando.classList.add("burbuja-esperando");

    const datos = estadoDespensa();
    let respuesta;

    if (OLLAMA.activo) {
      try {
        respuesta = await preguntarAOllama(texto, datos, historial);
      } catch (e) {
        console.warn("Ollama no respondió, uso el conocimiento propio:", e.message);
        respuesta = pensar(texto, datos);
      }
    } else {
      // Una pausa mínima para que no parezca que la respuesta estaba escrita.
      await new Promise((r) => setTimeout(r, 260));
      respuesta = pensar(texto, datos);
    }

    esperando.remove();
    burbuja(respuesta, "dora");
    historial.push({ role: "user", content: texto },
                   { role: "assistant", content: respuesta });

    if (hablando) hablar(respuesta);
    pensando = false;
    campo.focus();
  }

  /* ------------------------------- voz -------------------------------- */

  let reconocedor = null;

  function prepararReconocedor() {
    if (!Reconocimiento) return null;
    const r = new Reconocimiento();
    r.lang = "es-CO";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      escuchando = true;
      microfono.classList.add("escuchando");
      microfono.setAttribute("aria-label", "Dejar de escuchar");
      campo.placeholder = "Te escucho…";
    };
    r.onresult = (ev) => {
      let texto = "";
      for (const res of ev.results) texto += res[0].transcript;
      campo.value = texto;
      if (ev.results[ev.results.length - 1].isFinal) {
        r.stop();
        responder(texto);
      }
    };
    r.onerror = (ev) => {
      escuchando = false;
      microfono.classList.remove("escuchando");
      campo.placeholder = "Escribe tu pregunta";
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        burbuja("No tengo permiso para usar el micrófono. Puedes activarlo en el " +
                "candado de la barra de direcciones, o escribirme.", "dora");
      } else if (ev.error === "no-speech") {
        burbuja("No alcancé a oír nada. Inténtalo otra vez.", "dora");
      }
    };
    r.onend = () => {
      escuchando = false;
      microfono.classList.remove("escuchando");
      microfono.setAttribute("aria-label", "Hablar");
      campo.placeholder = "Escribe tu pregunta";
    };
    return r;
  }

  /* ----------------------------- controles ---------------------------- */

  function abrir() {
    panel.hidden = false;
    lanzador.setAttribute("aria-expanded", "true");
    if (!hilo.childElementCount) {
      burbuja(`Hola, soy ${NOMBRE}. Te ayudo con la despensa: cómo donar, cómo ` +
              "retirar, o qué hay disponible ahora.", "dora");
      pintarSugerencias();
      sugerencias.hidden = false;
    }
    setTimeout(() => campo.focus(), 120);
  }

  function cerrarPanel() {
    panel.hidden = true;
    lanzador.setAttribute("aria-expanded", "false");
    callar();
    if (reconocedor && escuchando) reconocedor.stop();
  }

  lanzador.onclick = () => (panel.hidden ? abrir() : cerrarPanel());
  cerrar.onclick = cerrarPanel;

  enviar.onclick = () => responder(campo.value);
  campo.onkeydown = (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); responder(campo.value); }
  };

  if (!Reconocimiento) {
    microfono.hidden = true;
  } else {
    microfono.onclick = () => {
      callar();
      if (!reconocedor) reconocedor = prepararReconocedor();
      if (escuchando) { reconocedor.stop(); return; }
      try { reconocedor.start(); }
      catch { /* ya estaba arrancando */ }
    };
  }

  if (!vozDisponible) {
    altavoz.hidden = true;
  } else {
    const pintarAltavoz = () => {
      altavoz.classList.toggle("apagado", !hablando);
      altavoz.setAttribute("aria-label", hablando ? "Silenciar a Dora" : "Que Dora hable");
      altavoz.title = hablando ? "Silenciar" : "Activar voz";
    };
    altavoz.onclick = () => { hablando = !hablando; if (!hablando) callar(); pintarAltavoz(); };
    pintarAltavoz();
  }

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !panel.hidden) cerrarPanel();
  });
}
