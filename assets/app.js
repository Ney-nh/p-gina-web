/* =========================================================================
   D.I.R.T. Comunitario — lógica de la aplicación
   -------------------------------------------------------------------------
   Tres partes:
     1. CATEGORÍAS  — qué alimentos hay y a qué lado de la compuerta van.
     2. ALMACÉN     — Firestore, con respaldo local si no hay configuración.
     3. COMPUERTA   — Bluetooth LE contra el Arduino UNO R4 WiFi (dos servos).
   Al final, el cableado de la interfaz.
   ========================================================================= */

import { firebaseConfig, sinConfigurar } from "./firebase-config.js";

/* =========================================================================
   1. CATEGORÍAS Y LADOS DE LA COMPUERTA
   ========================================================================= */

/**
 * Cada alimento se dirige a un lado de la compuerta:
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

/** Segundos que la compuerta permanece abierta antes de cerrarse sola. */
const SEGUNDOS_CIERRE = 5;

/* =========================================================================
   2. ALMACÉN DE DATOS
   -------------------------------------------------------------------------
   Interfaz única para la interfaz gráfica. Por dentro usa Firestore cuando
   hay configuración, y localStorage cuando no la hay, para que la app sea
   demostrable aunque Firebase todavía no esté conectado.
   ========================================================================= */

const COLECCION = "movimientos";
const CLAVE_LOCAL = "dirt_movimientos";

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
    const db = fs.getFirestore(app);
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
      (snap) => {
        this._cache = snap.docs
          .map((d) => this._normalizar(d.id, d.data()))
          .filter((m) => !m.deleted_at);
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
    documento: datos.documento,
    categoria: datos.categoria,
    cantidad: datos.cantidad,
    nota: datos.nota || null,
    lado: CAT[datos.categoria].lado,
    compuerta_abierta: !!datos.compuerta_abierta,
    deleted_at: null,
  };

  if (this.modo === "firestore") {
    const { db, collection, addDoc, serverTimestamp } = this._fs;
    const ref = await addDoc(collection(db, COLECCION), {
      ...registro,
      created_at: serverTimestamp(),
    });
    // onSnapshot refrescará la lista; devolvemos una copia para la pantalla.
    return { ...registro, id: ref.id, created_at: new Date() };
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
   3. COMPUERTA — Bluetooth LE contra el Arduino
   -------------------------------------------------------------------------
   Los UUID y los comandos coinciden con el sketch
   arduino/dirt_dos_compuertas/dirt_dos_compuertas.ino
   ========================================================================= */

const BLE = {
  NOMBRE: "DIRT",
  SERVICIO: "19b10000-e8f2-537e-4f6c-d104768a1214",
  COMANDO:  "19b10001-e8f2-537e-4f6c-d104768a1214",
  ESTADO:   "19b10002-e8f2-537e-4f6c-d104768a1214",
};

const compuerta = {
  soportado: typeof navigator !== "undefined" && !!navigator.bluetooth,
  conectado: false,
  angulo: 90,
  abiertos: { frio: false, caliente: false },
  _dispositivo: null,
  _comando: null,
  _temporizador: null,
  _cuenta: null,
};

compuerta.conectar = async function () {
  if (!this.soportado) throw new Error("Este navegador no puede usar Bluetooth.");

  const dispositivo = await navigator.bluetooth.requestDevice({
    filters: [{ name: BLE.NOMBRE }],
    optionalServices: [BLE.SERVICIO],
  });
  dispositivo.addEventListener("gattserverdisconnected", () => {
    this.conectado = false;
    this.abiertos = { frio: false, caliente: false };
    this._comando = null;
    this._pararCuenta();
    ui.pintarCompuerta("El Arduino se desconectó.");
  });

  const servidor = await dispositivo.gatt.connect();
  const servicio = await servidor.getPrimaryService(BLE.SERVICIO);
  this._comando = await servicio.getCharacteristic(BLE.COMANDO);

  // La característica de estado es opcional: sin ella se pierde el aviso
  // de vuelta del Arduino, pero la compuerta funciona igual.
  try {
    const estado = await servicio.getCharacteristic(BLE.ESTADO);
    await estado.startNotifications();
    estado.addEventListener("characteristicvaluechanged", (ev) => {
      const texto = new TextDecoder().decode(ev.target.value).trim();
      if (texto) ui.pintarCompuerta(`Arduino: ${texto}`);
    });
  } catch { /* el sketch no expone notificaciones */ }

  this._dispositivo = dispositivo;
  this.conectado = true;
};

compuerta.desconectar = function () {
  this._pararCuenta();
  if (this._dispositivo?.gatt?.connected) this._dispositivo.gatt.disconnect();
  this._dispositivo = null;
  this._comando = null;
  this.conectado = false;
  this.abiertos = { frio: false, caliente: false };
};

compuerta._enviar = async function (texto) {
  if (!this._comando) throw new Error("La compuerta no está conectada.");
  const datos = new TextEncoder().encode(texto);
  if (typeof this._comando.writeValueWithResponse === "function") {
    await this._comando.writeValueWithResponse(datos);
  } else {
    await this._comando.writeValue(datos);
  }
};

/** Abre uno de los dos lados en el ángulo configurado. */
compuerta.abrir = async function (lado) {
  await this._enviar(`${lado.toUpperCase()}:${Math.round(this.angulo)}`);
  this.abiertos[lado] = true;
};

compuerta.cerrarLado = async function (lado) {
  await this._enviar(`${lado.toUpperCase()}:0`);
  this.abiertos[lado] = false;
};

compuerta.cerrarTodo = async function () {
  this._pararCuenta();
  await this._enviar("CERRAR");
  this.abiertos = { frio: false, caliente: false };
};

compuerta._pararCuenta = function () {
  if (this._temporizador) clearInterval(this._temporizador);
  this._temporizador = null;
  this._cuenta = null;
};

/**
 * Abre un lado y programa el cierre automático.
 * `alContar` recibe los segundos restantes, y null al terminar.
 */
compuerta.abrirConCierre = async function (lado, alContar) {
  await this.abrir(lado);
  this._pararCuenta();
  this._cuenta = SEGUNDOS_CIERRE;
  alContar(this._cuenta);

  this._temporizador = setInterval(async () => {
    this._cuenta -= 1;
    if (this._cuenta > 0) {
      alContar(this._cuenta);
      return;
    }
    this._pararCuenta();
    alContar(null);
    try { await this.cerrarLado(lado); } catch { /* ya desconectado */ }
    ui.pintarCompuerta("Compuerta cerrada automáticamente.");
  }, 1000);
};

/* =========================================================================
   4. INTERFAZ
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
  const pill = $("#estado-nube");
  pill.className = "pill " + (tipo === "ok" ? "pill-ok" : tipo === "error" ? "pill-warn" : "pill-muted");
  $("#estado-nube-texto").textContent = texto;
};

/* ------------------------------- compuerta ------------------------------ */

ui.pintarCompuerta = function (mensaje) {
  const pill = $("#bt-estado");
  const conectado = compuerta.conectado;

  pill.className = "pill " + (conectado ? "pill-ok" : "pill-muted");
  pill.innerHTML = `<span class="dot"></span>${conectado ? "Conectada" : "Sin conexión"}`;

  $("#btn-conectar").hidden = conectado || !compuerta.soportado;
  $("#bt-controles").hidden = !conectado;
  $("#bt-no-soportado").hidden = compuerta.soportado;

  for (const lado of ["frio", "caliente"]) {
    const caja = document.querySelector(`.lado[data-lado="${lado}"]`);
    const abierto = compuerta.abiertos[lado];
    caja.classList.toggle("abierto", abierto);
    caja.querySelector(`[data-estado="${lado}"]`).textContent =
      abierto ? `Abierto · ${Math.round(compuerta.angulo)}°` : "Cerrado";
  }

  if (mensaje !== undefined) $("#bt-mensaje").textContent = mensaje;
};

function fijarAngulo(valor) {
  compuerta.angulo = Number(valor);
  $("#rango-angulo").value = compuerta.angulo;
  $("#valor-angulo").textContent = `${compuerta.angulo}°`;
  $$("#chips-angulo .chip").forEach((c) =>
    c.classList.toggle("chip-on", Number(c.dataset.angulo) === compuerta.angulo),
  );
}

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
  const cat = CAT[m.categoria] || { nombre: m.categoria, emoji: "📦", color: "var(--texto-3)" };
  const signo = m.tipo === "entrada" ? "+" : "−";
  const lado = LADOS[m.lado];

  const item = document.createElement("div");
  item.className = "item";
  item.innerHTML = `
    <div class="item-icono" style="background: color-mix(in srgb, ${cat.color} 15%, transparent)">
      ${cat.emoji}
    </div>
    <div class="item-cuerpo">
      <span class="item-titulo">${escapar(m.nombre)}</span>
      <span class="item-sub">
        ${cat.nombre} · T.I. ${escapar(m.documento)} · ${fechaCorta(m.created_at)}
        ${m.compuerta_abierta && lado ? ` · ${lado.emoji} ${lado.nombre.toLowerCase()}` : ""}
      </span>
    </div>
    <span class="item-cant ${m.tipo}">${signo}${m.cantidad}</span>
  `;

  if (conBorrar) {
    const boton = document.createElement("button");
    boton.className = "item-borrar";
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
      <span class="inv-detalle">${entradas} entradas · ${salidas} salidas</span>
      <span class="inv-lado" style="color:${cat.lado === "frio" ? "var(--frio)" : "var(--caliente)"}">
        ${lado.emoji} ${lado.nombre}
      </span>
    `;
    grid.appendChild(card);
  }

  /* --- Historial --- */
  const texto = estado.busqueda.trim().toLowerCase();
  const filtrados = movimientos.filter((m) => {
    if (estado.filtroTipo && m.tipo !== estado.filtroTipo) return false;
    if (estado.filtroCategoria && m.categoria !== estado.filtroCategoria) return false;
    if (texto && !(`${m.nombre} ${m.documento}`.toLowerCase().includes(texto))) return false;
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
  boton.className = `btn btn-lg ${esEntrada ? "btn-entrada" : "btn-salida"}`;
  const accion = esEntrada ? "Guardar entrada" : "Guardar salida";
  boton.textContent = compuerta.conectado ? `${accion} y abrir compuerta` : accion;
}

function mostrarLadoElegido() {
  const aviso = $("#aviso-lado");
  if (!estado.categoria) { aviso.hidden = true; return; }
  const cat = CAT[estado.categoria];
  const lado = LADOS[cat.lado];
  aviso.hidden = false;
  aviso.className = `lado-aviso ${lado.clase}`;
  aviso.innerHTML = `<span>${lado.emoji}</span><span>${cat.nombre} va al <b>${lado.nombre.toLowerCase()}</b> de la compuerta.</span>`;
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
  if (documento.length < 3)  return fallar("Escribe el número de documento (mínimo 3 dígitos).");
  if (!estado.categoria)     return fallar("Elige la categoría del alimento.");
  error.hidden = true;

  const boton = $("#btn-guardar");
  boton.disabled = true;
  boton.textContent = "Guardando…";

  try {
    const movimiento = await almacen.crear({
      tipo: estado.tipo,
      nombre,
      documento,
      categoria: estado.categoria,
      cantidad: estado.cantidad,
      nota: $("#in-nota").value.trim() || null,
      compuerta_abierta: compuerta.conectado,
    });

    cerrarModal();

    if (compuerta.conectado) {
      mostrarExito(movimiento);
      const lado = CAT[movimiento.categoria].lado;
      try {
        await compuerta.abrirConCierre(lado, (segundos) => {
          $("#exito-cuenta").textContent =
            segundos === null ? "Compuerta cerrada." : `Se cierra sola en ${segundos} s`;
          ui.pintarCompuerta();
        });
        ui.pintarCompuerta(`Compuerta abierta · ${LADOS[lado].nombre}`);
      } catch (e) {
        $("#exito-cuenta").textContent = "El registro quedó guardado, pero la compuerta no respondió.";
        console.error(e);
      }
    } else {
      toast(estado.tipo === "entrada" ? "Entrada registrada" : "Salida registrada");
    }
  } catch (e) {
    console.error(e);
    fallar("No se pudo guardar. Revisa la conexión e intenta de nuevo.");
  } finally {
    boton.disabled = false;
    actualizarBotonGuardar();
  }
}

function mostrarExito(m) {
  const cat = CAT[m.categoria];
  const lado = LADOS[cat.lado];

  $("#exito-icono").className = "exito-icono" + (m.tipo === "salida" ? " salida" : "");
  $("#exito-titulo").textContent = m.tipo === "entrada" ? "Entrada registrada" : "Salida registrada";
  $("#exito-detalle").textContent = `${m.nombre} · T.I. ${m.documento} · ${m.cantidad} ${cat.nombre.toLowerCase()}`;

  const avisoLado = $("#exito-lado");
  avisoLado.className = `lado-aviso ${lado.clase}`;
  avisoLado.innerHTML = `<span>${lado.emoji}</span><span>Abriendo el <b>${lado.nombre.toLowerCase()}</b></span>`;

  $("#exito-cuenta").textContent = "";
  $("#exito").hidden = false;
  document.body.style.overflow = "hidden";
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
      m.documento,
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
  a.download = `dirt-historial-${new Date().toISOString().slice(0, 10)}.csv`;
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
  $("#btn-cerrar-ahora").onclick = async () => {
    compuerta._pararCuenta();
    try {
      await compuerta.cerrarTodo();
      $("#exito-cuenta").textContent = "Compuerta cerrada.";
      ui.pintarCompuerta("Compuerta cerrada manualmente.");
    } catch (e) {
      console.error(e);
    }
  };

  /* compuerta */
  $("#btn-conectar").onclick = async () => {
    const boton = $("#btn-conectar");
    boton.disabled = true;
    ui.pintarCompuerta("Buscando el Arduino…");
    try {
      await compuerta.conectar();
      ui.pintarCompuerta("Conectado con el Arduino.");
      actualizarBotonGuardar();
      toast("Compuerta conectada");
    } catch (e) {
      const cancelado = e?.name === "NotFoundError";
      ui.pintarCompuerta(cancelado ? "No se seleccionó ningún dispositivo." : (e.message || "No se pudo conectar."));
    } finally {
      boton.disabled = false;
    }
  };

  $("#btn-desconectar").onclick = () => {
    compuerta.desconectar();
    ui.pintarCompuerta("Desconectado.");
    actualizarBotonGuardar();
  };

  $("#btn-cerrar-todo").onclick = async () => {
    try {
      await compuerta.cerrarTodo();
      ui.pintarCompuerta("Ambos lados cerrados.");
    } catch (e) { ui.pintarCompuerta(e.message); }
  };

  const probar = (lado) => async () => {
    try {
      await compuerta.abrirConCierre(lado, (s) =>
        ui.pintarCompuerta(s === null ? "Cerrando…" : `Prueba de ${LADOS[lado].nombre.toLowerCase()}: ${s} s`),
      );
    } catch (e) { ui.pintarCompuerta(e.message); }
  };
  $("#btn-probar-frio").onclick     = probar("frio");
  $("#btn-probar-caliente").onclick = probar("caliente");

  $("#rango-angulo").oninput = (ev) => fijarAngulo(ev.target.value);
  $("#chips-angulo").onclick = (ev) => {
    const chip = ev.target.closest(".chip");
    if (chip) fijarAngulo(chip.dataset.angulo);
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
  fijarAngulo(90);
  ui.pintarCompuerta("");
  almacen.alCambiar(pintarTodo);

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
