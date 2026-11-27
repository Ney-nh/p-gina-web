/* =========================================================================
   D.I.R.T. Comunitario — lógica de la aplicación
   -------------------------------------------------------------------------
   Tres partes:
     1. CATEGORÍAS  — qué alimentos hay y en qué lado de la despensa van.
     2. ALMACÉN     — Firestore, con respaldo local si no hay configuración.
     3. ARDUINO     — prueba de conexión por Bluetooth LE con el UNO R4 WiFi.
   Al final, el cableado de la interfaz.

   La página de prueba (prueba/) usa este mismo archivo: antes de cargarlo
   define window.DIRT_CONFIG con otra colección, para no mezclar datos.
   ========================================================================= */

import { firebaseConfig, sinConfigurar } from "./firebase-config.js";
import { iniciarBot } from "./bot.js";

/* =========================================================================
   1. CATEGORÍAS Y LADOS DE LA DESPENSA
   ========================================================================= */

/**
 * Cada alimento va en uno de los dos lados de la despensa:
 *   frio     → productos que necesitan refrigeración
 *   caliente → productos que se conservan calientes o secos
 * Para cambiar el destino de una categoría basta con editar su campo `lado`.
 */
export const CATEGORIAS = [
  { id: "lacteos", nombre: "Lácteos", emoji: "🥛", color: "var(--cat-lacteos)", lado: "frio" },
  { id: "frutas",  nombre: "Frutas",  emoji: "🍎", color: "var(--cat-frutas)",  lado: "frio" },
  { id: "fritos",  nombre: "Fritos",  emoji: "🍟", color: "var(--cat-fritos)",  lado: "caliente" },
  { id: "bebidas", nombre: "Bebidas", emoji: "🧃", color: "var(--cat-bebidas)", lado: "frio" },
];

const CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

const LADOS = {
  frio:     { nombre: "Lado frío",     emoji: "❄️", clase: "frio" },
  caliente: { nombre: "Lado caliente", emoji: "🔥", clase: "caliente" },
};

/* =========================================================================
   2. ALMACÉN DE DATOS
   -------------------------------------------------------------------------
   Interfaz única para la interfaz gráfica. Por dentro usa Firestore cuando
   hay configuración, y localStorage cuando no la hay, para que la app sea
   demostrable aunque Firebase todavía no esté conectado.
   ========================================================================= */

const CONFIG = (typeof window !== "undefined" && window.DIRT_CONFIG) || {};
const COLECCION = CONFIG.coleccion || "movimientos";
const CLAVE_LOCAL = CONFIG.claveLocal || "dirt_movimientos";

const almacen = {
  modo: "local",     // "firestore" | "local"
  _fs: null,         // referencias del SDK de Firebase
  _suscriptores: [],
  _cache: [],
};

/** Avisa a la interfaz de que la lista de movimientos cambió. */
function emitir() {
  for (const fn of almacen._suscriptores) fn(almacen._cache);
}

almacen.alCambiar = (fn) => {
  almacen._suscriptores.push(fn);
  fn(almacen._cache);
};

/** Arranca Firestore; si falla o no hay config, deja el modo local. */
almacen.iniciar = async function () {
  if (sinConfigurar) {
    this._cargarLocal();
    return { ok: false, motivo: "sin-config" };
  }
  try {
    const [{ initializeApp }, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
    ]);
    const app = initializeApp(firebaseConfig);

    // Caché local persistente: la app sigue funcionando sin internet y los
    // registros se sincronizan solos cuando vuelve. Sin esto, una caída de
    // red en mitad de una demostración deja la página inservible.
    let db;
    try {
      db = fs.initializeFirestore(app, {
        localCache: fs.persistentLocalCache({
          tabManager: fs.persistentMultipleTabManager(),
        }),
      });
    } catch (e) {
      // Puede fallar en navegación privada o si otra pestaña ya la abrió.
      console.warn("Sin caché persistente, se sigue en memoria:", e.message);
      db = fs.getFirestore(app);
    }

    this._fs = { ...fs, db };
    this.modo = "firestore";

    // Escucha en vivo: si alguien registra desde otro teléfono, aparece aquí.
    const consulta = fs.query(
      fs.collection(db, COLECCION),
      fs.orderBy("created_at", "desc"),
      fs.limit(500),
    );
    fs.onSnapshot(
      consulta,
      { includeMetadataChanges: true },
      (snap) => {
        this._cache = snap.docs
          .map((d) => this._normalizar(d.id, d.data()))
          .filter((m) => !m.deleted_at);
        // hasPendingWrites marca lo que todavía no llegó al servidor.
        this.pendientes = snap.docs.filter((d) => d.metadata.hasPendingWrites).length;
        if (this.fallo) {
          ui.estadoNube("error", "No se guardó");
        } else {
          ui.estadoNube(
            this.pendientes ? "pendiente" : "ok",
            this.pendientes ? `${this.pendientes} sin subir` : "Firebase",
          );
        }
        emitir();
      },
      (err) => {
        console.error("Firestore:", err);
        ui.estadoNube("error", "Error de Firestore");
      },
    );
    return { ok: true };
  } catch (e) {
    console.error("No se pudo iniciar Firebase:", e);
    this._cargarLocal();
    return { ok: false, motivo: "error", error: e };
  }
};

almacen._normalizar = function (id, d) {
  let fecha = d.created_at;
  if (fecha && typeof fecha.toDate === "function") fecha = fecha.toDate();
  else if (typeof fecha === "string") fecha = new Date(fecha);
  else if (!(fecha instanceof Date)) fecha = new Date();
  return { ...d, id, created_at: fecha };
};

almacen._cargarLocal = function () {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE_LOCAL) || "[]");
    this._cache = crudo
      .map((m) => ({ ...m, created_at: new Date(m.created_at) }))
      .filter((m) => !m.deleted_at)
      .sort((a, b) => b.created_at - a.created_at);
  } catch {
    this._cache = [];
  }
  emitir();
};

almacen._guardarLocal = function () {
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(this._cache));
  } catch (e) {
    console.warn("No se pudo escribir en el almacenamiento local:", e);
  }
};

/** Crea un movimiento. Devuelve el objeto guardado. */
almacen.crear = async function (datos) {
  const registro = {
    tipo: datos.tipo,
    nombre: datos.nombre,
    documento: datos.documento,          // solo los últimos dígitos
    documento_largo: datos.documento_largo,
    categoria: datos.categoria,
    cantidad: datos.cantidad,
    nota: datos.nota || null,
    lado: CAT[datos.categoria].lado,
    // La compuerta automática se retiró, pero las reglas publicadas de
    // Firestore todavía exigen este campo: se manda siempre en falso.
    compuerta_abierta: false,
    deleted_at: null,
  };

  if (this.modo === "firestore") {
    const { db, collection, addDoc, serverTimestamp } = this._fs;

    // No se espera la confirmación del servidor. Firestore aplica la
    // escritura en local de inmediato, la escucha la refleja en pantalla al
    // instante, y la sube sola cuando haya red. Si se esperara, una caída
    // de internet dejaría el botón colgado en "Guardando" para siempre.
    const envio = addDoc(collection(db, COLECCION), {
      ...registro,
      created_at: serverTimestamp(),
    });
    envio.then(() => { this.fallo = null; });
    envio.catch((e) => {
      console.error("No se pudo guardar en Firestore:", e);
      // Un guardado rechazado no puede parecerse a uno correcto: queda
      // anotado para que la escucha no lo borre al siguiente refresco, y se
      // avisa en pantalla con qué hacer.
      this.fallo = /permission|insufficient/i.test(String(e))
        ? "Firestore rechazó el registro. Publica las reglas de firestore.rules."
        : "No se pudo guardar en la nube.";
      ui.estadoNube("error", "No se guardó");
      toast(this.fallo);
    });

    return { ...registro, id: null, created_at: new Date() };
  }

  const guardado = { ...registro, id: `local_${Date.now()}`, created_at: new Date() };
  this._cache.unshift(guardado);
  this._guardarLocal();
  emitir();
  return guardado;
};

/** Borrado suave: el registro deja de listarse pero no se pierde. */
almacen.eliminar = async function (id) {
  if (this.modo === "firestore") {
    const { db, doc, updateDoc } = this._fs;
    await updateDoc(doc(db, COLECCION, id), { deleted_at: new Date() });
    return;
  }
  this._cache = this._cache.filter((m) => m.id !== id);
  this._guardarLocal();
  emitir();
};

/* =========================================================================
   3. ARDUINO — prueba de conexión por Bluetooth LE
   -------------------------------------------------------------------------
   La despensa ya no mueve compuertas: el Arduino solo responde para
   comprobar que el enlace funciona. Los UUID y el comando coinciden con el
   sketch arduino/dirt_conexion/dirt_conexion.ino
   ========================================================================= */

const BLE = {
  NOMBRE: "DIRT",
  SERVICIO: "19b10000-e8f2-537e-4f6c-d104768a1214",
  COMANDO:  "19b10001-e8f2-537e-4f6c-d104768a1214",
  ESTADO:   "19b10002-e8f2-537e-4f6c-d104768a1214",
};

/** Cuánto se espera la respuesta del Arduino antes de darla por perdida. */
const ESPERA_RESPUESTA_MS = 3000;

const arduino = {
  soportado: typeof navigator !== "undefined" && !!navigator.bluetooth,
  conectado: false,
  _dispositivo: null,
  _comando: null,
  _conRespuesta: false,   // el sketch expone la característica de estado
  _esperando: null,       // función que recibe la próxima respuesta
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Traduce los errores de Web Bluetooth a algo accionable.
 * "Connection attempt failed" es el más habitual: el Arduino aparece en la
 * lista pero el enlace GATT no llega a abrirse.
 */
function explicarError(e) {
  const m = String(e?.message || e);
  if (e?.name === "NotFoundError") return "No se seleccionó ningún dispositivo.";
  if (/Connection attempt failed|GATT Error|connect/i.test(m)) {
    return "No se pudo abrir la conexión. Cierra nRF Connect y otras pestañas, "
         + "quita el DIRT de los dispositivos emparejados del teléfono y "
         + "reinicia el Arduino.";
  }
  if (/No Services matching|Service .* not found/i.test(m)) {
    return "El dispositivo respondió pero no expone el servicio esperado. "
         + "¿Está cargado el sketch dirt_conexion?";
  }
  if (/user gesture|permission/i.test(m)) {
    return "El navegador bloqueó la petición. Vuelve a pulsar el botón.";
  }
  if (/globally disabled|turned off|adapter/i.test(m)) {
    return "El Bluetooth del teléfono está apagado.";
  }
  return m;
}

arduino.conectar = async function (alProgresar = () => {}) {
  if (!this.soportado) throw new Error("Este navegador no puede usar Bluetooth.");

  const dispositivo = await navigator.bluetooth.requestDevice({
    filters: [{ name: BLE.NOMBRE }],
    optionalServices: [BLE.SERVICIO],
  });
  dispositivo.addEventListener("gattserverdisconnected", () => {
    this.conectado = false;
    this._comando = null;
    ui.pintarArduino("El Arduino se desconectó.");
  });

  /* En Android el primer intento de conexión GATT falla a menudo, sobre todo
     justo después del escaneo. Reintentar unas pocas veces resuelve la mayor
     parte de los "Connection attempt failed". */
  const INTENTOS = 4;
  let servidor = null;
  let ultimo = null;

  for (let i = 1; i <= INTENTOS; i++) {
    try {
      alProgresar(i === 1 ? "Abriendo la conexión…" : `Reintentando (${i} de ${INTENTOS})…`);
      servidor = await dispositivo.gatt.connect();
      if (servidor.connected) break;
    } catch (e) {
      ultimo = e;
      try { dispositivo.gatt.disconnect(); } catch { /* ya estaba suelto */ }
      if (i < INTENTOS) await esperar(400 * i);
    }
  }

  if (!servidor?.connected) throw ultimo || new Error("No se pudo abrir la conexión.");

  alProgresar("Leyendo el servicio…");
  const servicio = await servidor.getPrimaryService(BLE.SERVICIO);
  this._comando = await servicio.getCharacteristic(BLE.COMANDO);

  // Por la característica de estado llega la respuesta del Arduino. Sin ella
  // la prueba solo puede confirmar que el envío llegó.
  try {
    const estado = await servicio.getCharacteristic(BLE.ESTADO);
    await estado.startNotifications();
    estado.addEventListener("characteristicvaluechanged", (ev) => {
      const texto = new TextDecoder().decode(ev.target.value).trim();
      // "LISTO" y "CONECTADO" son avisos de arranque, no la respuesta a la
      // prueba. Cualquier otra cosa sí cuenta: también lo que responda el
      // sketch anterior de las compuertas, si la placa todavía lo tiene.
      if (/^(LISTO|CONECTADO)$/i.test(texto)) return;
      if (this._esperando) this._esperando(texto);
    });
    this._conRespuesta = true;
  } catch {
    this._conRespuesta = false;
  }

  this._dispositivo = dispositivo;
  this.conectado = true;
};

arduino.desconectar = function () {
  if (this._dispositivo?.gatt?.connected) this._dispositivo.gatt.disconnect();
  this._dispositivo = null;
  this._comando = null;
  this.conectado = false;
};

/**
 * Manda "?" y espera la respuesta. Devuelve { texto, ms }; texto es null si
 * el Arduino no respondió a tiempo (o si su sketch no tiene respuesta).
 */
arduino.probar = async function () {
  if (!this._comando) throw new Error("El Arduino no está conectado.");
  const inicio = performance.now();
  const respuesta = this._conRespuesta
    ? new Promise((ok) => {
        const reloj = setTimeout(() => { this._esperando = null; ok(null); }, ESPERA_RESPUESTA_MS);
        this._esperando = (texto) => { clearTimeout(reloj); this._esperando = null; ok(texto); };
      })
    : Promise.resolve(null);

  const datos = new TextEncoder().encode("?");
  if (typeof this._comando.writeValueWithResponse === "function") {
    await this._comando.writeValueWithResponse(datos);
  } else {
    await this._comando.writeValue(datos);
  }
  const texto = await respuesta;
  return { texto, ms: Math.round(performance.now() - inicio) };
};


/* =========================================================================
   5. DATOS PARA LA ASISTENTE
   -------------------------------------------------------------------------
   Bob responde con los números reales de la despensa, no con un guion.
   ========================================================================= */

export function estadoDespensa() {
  const movimientos = almacen._cache;
  let entradasHoy = 0, salidasHoy = 0, total = 0;

  const porCategoria = CATEGORIAS.map((cat) => {
    const propios = movimientos.filter((m) => m.categoria === cat.id);
    const ent = propios.filter((m) => m.tipo === "entrada").reduce((a, m) => a + m.cantidad, 0);
    const sal = propios.filter((m) => m.tipo === "salida").reduce((a, m) => a + m.cantidad, 0);
    total += ent - sal;
    return { id: cat.id, nombre: cat.nombre, lado: cat.lado, stock: ent - sal, entradas: ent, salidas: sal };
  });

  for (const m of movimientos) {
    if (!esDeHoy(m.created_at)) continue;
    if (m.tipo === "entrada") entradasHoy += 1; else salidasHoy += 1;
  }

  return {
    categorias: porCategoria,
    total,
    hoy: { entradas: entradasHoy, salidas: salidasHoy },
    movimientos: movimientos.length,
  };
}

/* =========================================================================
   6. INTERFAZ
   ========================================================================= */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const estado = {
  tab: "inicio",
  tipo: "entrada",
  categoria: null,
  cantidad: 1,
  filtroTipo: "",
  filtroCategoria: "",
  busqueda: "",
};

const ui = {};

/* ------------------------------ utilidades ------------------------------ */

const dosDigitos = (n) => String(n).padStart(2, "0");

/** Cuántos dígitos finales del documento se conservan y se muestran. */
export const DIGITOS_VISIBLES = 4;
const ASTERISCO = "*";

/**
 * Pinta un documento como asteriscos más los últimos dígitos.
 *
 * Solo la cola se guarda en la base de datos; `largo` dice cuántos dígitos
 * tenía el número original, y sirve nada más para dibujar la cantidad
 * correcta de asteriscos. Los registros viejos traen el número entero, así
 * que también se recortan aquí.
 */
function enmascararDocumento(cola, largo) {
  const visible = String(cola ?? "").slice(-DIGITOS_VISIBLES);
  const total = Number(largo) || String(cola ?? "").length;
  const ocultos = Math.max(0, total - visible.length);
  return ASTERISCO.repeat(ocultos) + visible;
}

function fechaCorta(d) {
  const hoy = new Date();
  const mismoDia =
    d.getDate() === hoy.getDate() &&
    d.getMonth() === hoy.getMonth() &&
    d.getFullYear() === hoy.getFullYear();
  const hora = `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
  return mismoDia
    ? `Hoy ${hora}`
    : `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()} ${hora}`;
}

function esDeHoy(d) {
  const h = new Date();
  return (
    d.getDate() === h.getDate() &&
    d.getMonth() === h.getMonth() &&
    d.getFullYear() === h.getFullYear()
  );
}

let toastTimer = null;
function toast(texto) {
  const el = $("#toast");
  el.textContent = texto;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ------------------------------- cabecera ------------------------------- */

ui.estadoNube = function (tipo, texto) {
  const clases = { ok: "pill-ok", error: "pill-warn", pendiente: "pill-warn" };
  const pill = $("#estado-nube");
  pill.className = "pill " + (clases[tipo] || "pill-muted");
  pill.title =
    tipo === "pendiente"
      ? "Hay registros guardados en el teléfono que subirán cuando vuelva la conexión"
      : tipo === "error"
        ? (almacen.fallo || "Hubo un problema con la nube")
        : "";
  $("#estado-nube-texto").textContent = texto;
};

/* -------------------------------- arduino ------------------------------- */

ui.pintarArduino = function (mensaje) {
  const pill = $("#bt-estado");
  const conectado = arduino.conectado;

  pill.className = "pill " + (conectado ? "pill-ok" : "pill-muted");
  pill.innerHTML = `<span class="dot"></span>${conectado ? "Arduino conectado" : "Sin conexión"}`;

  $("#btn-probar-arduino").hidden = !arduino.soportado;
  $("#btn-probar-arduino").textContent = conectado ? "Probar de nuevo" : "Probar conexión con el Arduino";
  $("#btn-desconectar").hidden = !conectado;
  $("#bt-no-soportado").hidden = arduino.soportado;

  if (mensaje !== undefined) $("#bt-mensaje").textContent = mensaje;
};

/* -------------------------------- vistas -------------------------------- */

function irA(tab) {
  estado.tab = tab;
  $$(".vista").forEach((v) => { v.hidden = v.dataset.vista !== tab; });
  $$(".tab").forEach((t) => {
    const on = t.dataset.tab === tab;
    t.classList.toggle("tab-on", on);
    t.setAttribute("aria-selected", String(on));
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------------------------ movimientos ----------------------------- */

function tarjetaMovimiento(m, conBorrar) {
  const cat = CAT[m.categoria] || { nombre: m.categoria, emoji: "📦", color: "var(--tinta-3)" };
  const signo = m.tipo === "entrada" ? "+" : "−";
  const lado = LADOS[m.lado];

  const item = document.createElement("div");
  item.className = "fila-mov";
  item.style.setProperty("--c", cat.color);
  item.innerHTML = `
    <span class="mov-emoji">${cat.emoji}</span>
    <span class="mov-cuerpo">
      <span class="mov-nombre">${escapar(m.nombre)}</span>
      <span class="mov-meta">
        ${cat.nombre}, documento ${escapar(enmascararDocumento(m.documento, m.documento_largo))}${lado ? `, ${lado.emoji} ${lado.nombre.toLowerCase()}` : ""}
        <br>${fechaCorta(m.created_at)}
      </span>
    </span>
    <span class="mov-cant ${m.tipo}">${signo}${m.cantidad}</span>
  `;

  if (conBorrar) {
    const boton = document.createElement("button");
    boton.className = "mov-borrar";
    boton.setAttribute("aria-label", "Eliminar registro");
    boton.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>`;
    boton.onclick = async () => {
      if (!confirm(`¿Eliminar el registro de ${m.nombre}?`)) return;
      try {
        await almacen.eliminar(m.id);
        toast("Registro eliminado");
      } catch (e) {
        toast("No se pudo eliminar");
        console.error(e);
      }
    };
    item.appendChild(boton);
  }
  return item;
}

function escapar(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function pintarTodo(movimientos) {
  /* --- Inicio: indicadores del día --- */
  let entradasHoy = 0, salidasHoy = 0, stock = 0;
  for (const m of movimientos) {
    if (esDeHoy(m.created_at)) {
      if (m.tipo === "entrada") entradasHoy += 1;
      else salidasHoy += 1;
    }
    stock += m.tipo === "entrada" ? m.cantidad : -m.cantidad;
  }
  $("#stat-entradas").textContent = entradasHoy;
  $("#stat-salidas").textContent = salidasHoy;
  $("#stat-stock").textContent = stock;

  /* --- Inicio: movimientos recientes --- */
  const recientes = $("#lista-recientes");
  recientes.innerHTML = "";
  if (!movimientos.length) {
    recientes.innerHTML = `<p class="vacio">Todavía no hay movimientos registrados.</p>`;
  } else {
    movimientos.slice(0, 5).forEach((m) => recientes.appendChild(tarjetaMovimiento(m, false)));
  }

  /* --- Inventario --- */
  const grid = $("#grid-inventario");
  grid.innerHTML = "";
  for (const cat of CATEGORIAS) {
    const propios = movimientos.filter((m) => m.categoria === cat.id);
    const entradas = propios.filter((m) => m.tipo === "entrada").reduce((a, m) => a + m.cantidad, 0);
    const salidas  = propios.filter((m) => m.tipo === "salida").reduce((a, m) => a + m.cantidad, 0);
    const lado = LADOS[cat.lado];

    const card = document.createElement("article");
    card.className = "inv-card";
    card.style.setProperty("--c", cat.color);
    card.innerHTML = `
      <div class="inv-top"><span>${cat.emoji}</span><span class="inv-nombre">${cat.nombre}</span></div>
      <span class="inv-stock">${entradas - salidas}</span>
      <span class="inv-detalle">${entradas} entraron, ${salidas} salieron</span>
      <span class="inv-lado ${cat.lado}">${lado.emoji} ${lado.nombre}</span>
    `;
    grid.appendChild(card);
  }

  /* --- Historial --- */
  const texto = estado.busqueda.trim().toLowerCase();
  const filtrados = movimientos.filter((m) => {
    if (estado.filtroTipo && m.tipo !== estado.filtroTipo) return false;
    if (estado.filtroCategoria && m.categoria !== estado.filtroCategoria) return false;
    if (texto) {
      // Al guardarse solo la cola del documento, buscar por el número
      // completo también debe funcionar: se compara por su final.
      const soloDigitos = texto.replace(/\D/g, "");
      const cola = soloDigitos.length > DIGITOS_VISIBLES
        ? soloDigitos.slice(-DIGITOS_VISIBLES)
        : soloDigitos;
      const porNombre = m.nombre.toLowerCase().includes(texto);
      const porDocumento = cola.length > 0 && String(m.documento).includes(cola);
      if (!porNombre && !porDocumento) return false;
    }
    return true;
  });

  const lista = $("#lista-historial");
  lista.innerHTML = "";
  if (!filtrados.length) {
    lista.innerHTML = `<p class="vacio">${
      movimientos.length ? "Ningún registro coincide con el filtro." : "Todavía no hay movimientos registrados."
    }</p>`;
  } else {
    filtrados.forEach((m) => lista.appendChild(tarjetaMovimiento(m, true)));
  }
}

/* --------------------------------- modal -------------------------------- */

function abrirModal(tipo) {
  estado.tipo = tipo;
  estado.categoria = null;
  estado.cantidad = 1;

  $("#in-nombre").value = "";
  $("#in-documento").value = "";
  $("#in-nota").value = "";
  $("#valor-cantidad").textContent = "1";
  $("#modal-error").hidden = true;
  $("#aviso-lado").hidden = true;

  $$("#segmento-tipo .seg").forEach((s) =>
    s.classList.toggle("seg-on", s.dataset.tipo === tipo),
  );
  $$("#grid-categorias .cat").forEach((c) => c.classList.remove("on"));
  $$("#chips-cantidad .chip").forEach((c) =>
    c.classList.toggle("chip-on", Number(c.dataset.cantidad) === 1),
  );
  actualizarBotonGuardar();

  $("#modal").hidden = false;
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  $("#modal").hidden = true;
  document.body.style.overflow = "";
}

function actualizarBotonGuardar() {
  const boton = $("#btn-guardar");
  const esEntrada = estado.tipo === "entrada";
  boton.className = `btn btn-ancho btn-grande ${esEntrada ? "btn-entrada" : "btn-salida"}`;
  boton.textContent = esEntrada ? "Guardar entrada" : "Guardar salida";
}

function mostrarLadoElegido() {
  const aviso = $("#aviso-lado");
  if (!estado.categoria) { aviso.hidden = true; return; }
  const cat = CAT[estado.categoria];
  const lado = LADOS[cat.lado];
  aviso.hidden = false;
  aviso.className = `aviso-lado ${lado.clase}`;
  aviso.innerHTML = `<span>${lado.emoji}</span><span>${cat.nombre} va en el <b>${lado.nombre.toLowerCase()}</b> de la despensa.</span>`;
}

/* ------------------------------ guardar ---------------------------------- */

async function guardar() {
  const nombre = $("#in-nombre").value.trim();
  const documento = $("#in-documento").value.replace(/\D/g, "").trim();
  const error = $("#modal-error");

  const fallar = (texto) => {
    error.textContent = texto;
    error.hidden = false;
  };

  if (nombre.length < 2)     return fallar("Escribe el nombre completo.");
  if (documento.length < DIGITOS_VISIBLES)
    return fallar(`Escribe el número de documento (mínimo ${DIGITOS_VISIBLES} dígitos).`);
  if (!estado.categoria)     return fallar("Elige la categoría del alimento.");
  error.hidden = true;

  const boton = $("#btn-guardar");
  boton.disabled = true;
  boton.textContent = "Guardando…";

  try {
    const movimiento = await almacen.crear({
      tipo: estado.tipo,
      nombre,
      // Solo los últimos dígitos salen del dispositivo. El número completo
      // nunca llega a la base de datos; se guarda su longitud únicamente
      // para pintar la cantidad correcta de asteriscos.
      documento: documento.slice(-DIGITOS_VISIBLES),
      documento_largo: documento.length,
      categoria: estado.categoria,
      cantidad: estado.cantidad,
      nota: $("#in-nota").value.trim() || null,
    });

    cerrarModal();
    mostrarExito(movimiento);
  } catch (e) {
    console.error(e);
    fallar("No se pudo guardar. Revisa la conexión e intenta de nuevo.");
  } finally {
    boton.disabled = false;
    actualizarBotonGuardar();
  }
}

/* Un mensaje distinto en cada registro. Quien dona merece reconocimiento y
   quien retira merece que nadie le haga sentir que está pidiendo favores:
   la despensa es de todos, y los dos gestos la sostienen por igual.
   Para cambiar o añadir mensajes, edita estas listas: cada uno tiene un
   título y una frase. */
const MENSAJES = {
  entrada: [
    ["¡Gracias por donar!", "Lo que dejas hoy le sirve a alguien mañana."],
    ["La despensa crece contigo", "Cada aporte cuenta, por pequeño que parezca."],
    ["Gracias por compartir", "Compartir también es una forma de cuidar."],
    ["Un aporte más para todos", "Con gestos como este, la despensa no se queda vacía."],
    ["¡Eso es comunidad!", "Gracias por pensar en los demás."],
    ["Gracias, de verdad", "Alguien va a tener una tarde mejor gracias a ti."],
    ["Donación registrada", "Bob ya la anotó en el inventario."],
    ["¡Mil gracias!", "Hoy la despensa está un poco más llena."],
    ["Gracias por tu generosidad", "Lo que sobra en una casa puede faltar en otra."],
    ["¡Qué buen gesto!", "Ayudar no debería costarle la dignidad a nadie, y tú lo haces fácil."],
  ],
  salida: [
    ["Buen provecho", "La despensa es de todos, también tuya."],
    ["Que te aproveche", "Toma lo que necesitas: para eso está."],
    ["Listo, ya quedó", "No tienes que explicarle nada a nadie."],
    ["Para eso está la despensa", "Vuelve cuando lo necesites."],
    ["¡Que te rinda!", "Ojalá te dé energía para lo que queda del día."],
    ["Retiro registrado", "Bob ya actualizó el inventario."],
    ["Aquí estamos", "Mañana puede que seas tú quien comparta."],
    ["Disfrútalo", "Una tarde con energía rinde mucho más."],
    ["Todo en orden", "Recibir también es parte de cómo funciona esto."],
    ["Con mucho gusto", "La despensa funciona porque la usamos entre todos."],
  ],
};

/* Se sacan como de una bolsa: no se repite ninguno hasta que salen todos, y
   al rellenarla el primero nunca es igual al último que se mostró. */
const bolsaMensajes = { entrada: [], salida: [] };
let ultimoMensaje = { entrada: -1, salida: -1 };

function siguienteMensaje(tipo) {
  const lista = MENSAJES[tipo];
  let bolsa = bolsaMensajes[tipo];
  if (!bolsa.length) {
    bolsa = lista.map((_, i) => i);
    for (let i = bolsa.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      [bolsa[i], bolsa[k]] = [bolsa[k], bolsa[i]];
    }
    if (bolsa.length > 1 && bolsa[bolsa.length - 1] === ultimoMensaje[tipo]) {
      [bolsa[0], bolsa[bolsa.length - 1]] = [bolsa[bolsa.length - 1], bolsa[0]];
    }
    bolsaMensajes[tipo] = bolsa;
  }
  const i = bolsa.pop();
  ultimoMensaje[tipo] = i;
  return lista[i];
}

function mostrarExito(m) {
  const cat = CAT[m.categoria];
  const lado = LADOS[cat.lado];
  const [titulo, frase] = siguienteMensaje(m.tipo);

  $("#exito-icono").className = "exito-sello" + (m.tipo === "salida" ? " salida" : "");
  $("#exito-titulo").textContent = titulo;
  $("#exito-detalle").textContent =
    `${m.nombre}, ${m.cantidad} de ${cat.nombre.toLowerCase()}. ${frase}`;

  const avisoLado = $("#exito-lado");
  avisoLado.className = `aviso-lado ${lado.clase}`;
  avisoLado.innerHTML = m.tipo === "entrada"
    ? `<span>${lado.emoji}</span><span>Déjalo en el <b>${lado.nombre.toLowerCase()}</b></span>`
    : `<span>${lado.emoji}</span><span>Lo encuentras en el <b>${lado.nombre.toLowerCase()}</b></span>`;

  $("#exito").hidden = false;
  document.body.style.overflow = "hidden";
  $("#btn-listo").focus();
}

function cerrarExito() {
  $("#exito").hidden = true;
  document.body.style.overflow = "";
}

/* -------------------------------- CSV ------------------------------------ */

function exportarCSV() {
  const filas = [["Tipo", "Nombre", "Documento", "Categoria", "Lado", "Cantidad", "Nota", "Fecha"]];
  for (const m of almacen._cache) {
    filas.push([
      m.tipo,
      m.nombre,
      enmascararDocumento(m.documento, m.documento_largo),
      CAT[m.categoria]?.nombre ?? m.categoria,
      LADOS[m.lado]?.nombre ?? "",
      m.cantidad,
      m.nota ?? "",
      m.created_at.toLocaleString("es-CO"),
    ]);
  }
  const csv = filas
    .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  // El BOM hace que Excel abra las tildes correctamente.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${CONFIG.prefijoCSV || "dirt"}-historial-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================== ARRANQUE ================================= */

function construirCategorias() {
  const grid = $("#grid-categorias");
  const filtros = $("#filtro-categoria");

  const todas = document.createElement("button");
  todas.className = "chip chip-on";
  todas.dataset.categoria = "";
  todas.textContent = "Todas";
  filtros.appendChild(todas);

  for (const cat of CATEGORIAS) {
    const boton = document.createElement("button");
    boton.className = "cat";
    boton.style.setProperty("--c", cat.color);
    boton.dataset.categoria = cat.id;
    boton.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><span>${cat.nombre}</span>`;
    boton.onclick = () => {
      estado.categoria = cat.id;
      $$("#grid-categorias .cat").forEach((c) => c.classList.toggle("on", c === boton));
      $("#modal-error").hidden = true;
      mostrarLadoElegido();
    };
    grid.appendChild(boton);

    const chip = document.createElement("button");
    chip.className = "chip";
    chip.dataset.categoria = cat.id;
    chip.textContent = `${cat.emoji} ${cat.nombre}`;
    filtros.appendChild(chip);
  }

  filtros.onclick = (ev) => {
    const chip = ev.target.closest(".chip");
    if (!chip) return;
    estado.filtroCategoria = chip.dataset.categoria;
    $$("#filtro-categoria .chip").forEach((c) => c.classList.toggle("chip-on", c === chip));
    pintarTodo(almacen._cache);
  };
}

function conectarEventos() {
  /* pestañas */
  $$(".tab").forEach((t) => { t.onclick = () => irA(t.dataset.tab); });

  /* abrir el modal */
  $$("[data-abrir-registro]").forEach((b) => {
    b.onclick = () => abrirModal(b.dataset.abrirRegistro);
  });
  $("#btn-cerrar-modal").onclick = cerrarModal;
  $("#modal").onclick = (ev) => { if (ev.target.id === "modal") cerrarModal(); };

  /* entrada / salida */
  $("#segmento-tipo").onclick = (ev) => {
    const seg = ev.target.closest(".seg");
    if (!seg) return;
    estado.tipo = seg.dataset.tipo;
    $$("#segmento-tipo .seg").forEach((s) => s.classList.toggle("seg-on", s === seg));
    actualizarBotonGuardar();
  };

  /* documento: solo dígitos */
  $("#in-documento").oninput = (ev) => {
    ev.target.value = ev.target.value.replace(/\D/g, "").slice(0, 12);
  };

  /* cantidad */
  const fijarCantidad = (n) => {
    estado.cantidad = Math.min(999, Math.max(1, n));
    $("#valor-cantidad").textContent = estado.cantidad;
    $$("#chips-cantidad .chip").forEach((c) =>
      c.classList.toggle("chip-on", Number(c.dataset.cantidad) === estado.cantidad),
    );
  };
  $("#btn-menos").onclick = () => fijarCantidad(estado.cantidad - 1);
  $("#btn-mas").onclick   = () => fijarCantidad(estado.cantidad + 1);
  $("#chips-cantidad").onclick = (ev) => {
    const chip = ev.target.closest(".chip");
    if (chip) fijarCantidad(Number(chip.dataset.cantidad));
  };

  $("#btn-guardar").onclick = guardar;

  /* pantalla de éxito */
  $("#btn-listo").onclick = cerrarExito;

  /* prueba de conexión con el Arduino */
  $("#btn-probar-arduino").onclick = async () => {
    const boton = $("#btn-probar-arduino");
    boton.disabled = true;
    try {
      if (!arduino.conectado) {
        ui.pintarArduino("Buscando el Arduino…");
        await arduino.conectar((paso) => ui.pintarArduino(paso));
      }
      ui.pintarArduino("Enviando la prueba…");
      const { texto, ms } = await arduino.probar();
      ui.pintarArduino(texto
        ? `El Arduino respondió en ${ms} ms: ${texto}`
        : arduino._conRespuesta
          ? "Conectado, pero el Arduino no respondió a la prueba. ¿Está cargado el sketch dirt_conexion?"
          : `Conectado. La prueba llegó al Arduino en ${ms} ms.`);
      if (texto) toast("Conexión con el Arduino correcta");
    } catch (e) {
      console.error("Conexión Bluetooth:", e);
      ui.pintarArduino(explicarError(e));
    } finally {
      boton.disabled = false;
    }
  };

  $("#btn-desconectar").onclick = () => {
    arduino.desconectar();
    ui.pintarArduino("Desconectado.");
  };

  /* historial */
  $("#buscador").oninput = (ev) => {
    estado.busqueda = ev.target.value;
    pintarTodo(almacen._cache);
  };
  $("#filtro-tipo").onclick = (ev) => {
    const chip = ev.target.closest(".chip");
    if (!chip) return;
    estado.filtroTipo = chip.dataset.tipo;
    $$("#filtro-tipo .chip").forEach((c) => c.classList.toggle("chip-on", c === chip));
    pintarTodo(almacen._cache);
  };
  $("#btn-exportar").onclick = exportarCSV;

  /* Escape cierra lo que esté abierto */
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (!$("#exito").hidden) cerrarExito();
    else if (!$("#modal").hidden) cerrarModal();
  });
}

async function iniciar() {
  construirCategorias();
  conectarEventos();
  ui.pintarArduino("");
  almacen.alCambiar(pintarTodo);
  iniciarBot({ estadoDespensa });

  const r = await almacen.iniciar();
  if (r.ok) {
    ui.estadoNube("ok", "Firebase");
  } else if (r.motivo === "sin-config") {
    ui.estadoNube("muted", "Modo local");
    $("#aviso-config").hidden = false;
  } else {
    ui.estadoNube("error", "Sin conexión");
    $("#aviso-config").hidden = false;
  }
}

iniciar();
