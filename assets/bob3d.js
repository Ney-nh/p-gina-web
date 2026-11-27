/* =========================================================================
   BOB 3D — Beta
   -------------------------------------------------------------------------
   Dibuja a Bob en 3D y lo anima según lo que esté haciendo:

     reposo      flota y parpadea
     escuchando  se inclina hacia ti, ladea la cabeza, ojos más abiertos,
                 anillo azul que late en el piso
     pensando    mira hacia arriba, los ojos se van a un lado, se balancea,
                 anillo amarillo
     hablando    abre el pico al ritmo de la voz (boca.valor de voz-bob.js),
                 asiente y mueve las alas

   Se usa en dos lugares: el escenario pequeño del chat (iniciarBob3D) y
   la pantalla del modo en vivo (vivo.js, con crearBob3D).

   three.js se descarga de jsDelivr (importmap en index.html). Si no
   carga —sin internet, sin WebGL—, crearBob3D devuelve null y quien lo usa
   muestra el Bob dibujado.

   MODELO DE MESHY
   Pon el GLB en la carpeta modelos/ y su ruta en MODELO_3D.url. Para que mueva
   la boca necesita el pico de abajo como pieza aparte (nombre con
   "mandibula", "jaw" o "pico_inf", origen en la bisagra) o una forma de
   boca llamada "boca", "mouth", "open" o "jaw_open". Los gestos de los
   estados se aplican al modelo entero.
   ========================================================================= */

import { boca } from "./voz-bob.js";

export const MODELO_3D = {
  url: "",                       // ruta desde assets/, ej. "../modelos/bob.glb"
  nombreMandibula: /mandibula|mand[ií]bula|jaw|pico_?inf|lower/i,
  nombreForma: /^(boca|mouth|open|jaw_?open|abrir)/i,
  ejeMandibula: "x",             // eje de giro de la pieza del pico
  anguloMaximo: 0.5,             // radianes que se abre (≈ 29°)
  giroInicial: 0.55,             // de tres cuartos, con el pico a la derecha
};

export const ESTADOS = ["reposo", "escuchando", "pensando", "hablando"];

/* ------------------------------------------------------------------------
   three.js: se carga una sola vez para todos los escenarios
   ------------------------------------------------------------------------ */

let promesaThree = null;
function cargarThree() {
  promesaThree ??= import("three");
  return promesaThree;
}

/** Acerca `actual` a `meta` un poco en cada cuadro (movimiento suave). */
const suave = (actual, meta, k = 0.1) => actual + (meta - actual) * k;

/* ------------------------------------------------------------------------
   Bob provisional, hecho de piezas
   ------------------------------------------------------------------------ */

function armarBobProvisional(THREE) {
  const mat = (color) => new THREE.MeshToonMaterial({ color });
  const blanco = mat(0xffffff), pecho = mat(0xeaf6fc), ala = mat(0xdceef8);
  const azul = mat(0x0a51a0), azulOscuro = mat(0x063a72), amarillo = mat(0xf2d849);
  const naranja = mat(0xf0a81e), pata = mat(0xefa216), negro = mat(0x0c2135);

  const esfera = (r, m, seg = 32) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), m);
  const bob = new THREE.Group();     // se gira y se mueve entero
  const torso = new THREE.Group();   // se inclina sobre las patas
  bob.add(torso);

  // Cuerpo
  const cuerpo = esfera(1, blanco); cuerpo.scale.set(1, 0.95, 0.9); cuerpo.position.y = 1.05; torso.add(cuerpo);
  const panza = esfera(0.72, pecho); panza.position.set(0, 0.95, 0.32); torso.add(panza);
  const alas = [];
  for (const lado of [-1, 1]) {
    // El ala gira desde el hombro: el grupo está en el hombro y la malla cuelga.
    const hombro = new THREE.Group(); hombro.position.set(0.82 * lado, 1.45, -0.05);
    const a = esfera(0.55, ala); a.scale.set(0.35, 0.85, 1); a.position.set(0.06 * lado, -0.4, 0);
    hombro.add(a); torso.add(hombro);
    alas.push({ hombro, lado });
  }
  const cola = esfera(0.4, ala); cola.scale.set(0.8, 0.35, 1); cola.position.set(0, 0.85, -0.95); torso.add(cola);

  // Patas (fuera del torso: no se inclinan)
  for (const lado of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12), pata);
    p.position.set(0.35 * lado, 0.12, 0.1); bob.add(p);
    const pie = esfera(0.16, pata); pie.scale.set(1, 0.35, 1.5); pie.position.set(0.35 * lado, -0.03, 0.22); bob.add(pie);
  }

  // Cabeza
  const cabeza = new THREE.Group(); cabeza.position.set(0, 2.15, 0.1); torso.add(cabeza);
  cabeza.add(esfera(0.68, blanco));

  const gorra = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), azul);
  gorra.position.y = 0.08; cabeza.add(gorra);
  const visera = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.13, 40), azulOscuro);
  visera.position.y = 0.12; cabeza.add(visera);
  const boton = esfera(0.09, amarillo, 16); boton.position.y = 0.79; cabeza.add(boton);

  const ojos = [], pupilas = [];
  for (const lado of [-1, 1]) {
    const ojo = new THREE.Group(); ojo.position.set(0.25 * lado, -0.02, 0.56); cabeza.add(ojo);
    ojo.add(esfera(0.17, blanco, 24));
    const pupila = new THREE.Group(); pupila.position.z = 0.12; ojo.add(pupila);
    pupila.add(esfera(0.085, negro, 16));
    const brillo = esfera(0.03, blanco, 8); brillo.position.set(0.03, 0.04, 0.07); pupila.add(brillo);
    ojos.push(ojo); pupilas.push(pupila);
  }

  // Pico de arriba
  const picoSup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.2, 1.5, 20), amarillo);
  picoSup.rotation.x = Math.PI / 2; picoSup.scale.set(1.3, 1, 0.45);
  picoSup.position.set(0, -0.2, 1.25); cabeza.add(picoSup);

  // Mandíbula con la bolsa: gira desde la base del pico
  const mandibula = new THREE.Group(); mandibula.position.set(0, -0.3, 0.5); cabeza.add(mandibula);
  const bolsa = esfera(0.42, naranja); bolsa.scale.set(0.75, 0.55, 1.45);
  bolsa.position.set(0, -0.12, 0.62); mandibula.add(bolsa);
  const picoInf = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.16, 1.4, 16), amarillo);
  picoInf.rotation.x = Math.PI / 2; picoInf.scale.set(1.2, 1, 0.3);
  picoInf.position.set(0, 0.02, 0.72); mandibula.add(picoInf);

  // Lo que se mueve, con su valor actual (para suavizar).
  const p = { inclina: 0, cabX: 0, cabZ: 0, cabY: 0, pupX: 0, pupY: 0, ojo: 1, ala: 0.2 };

  return {
    raiz: bob,
    /** Pone la pose de cada cuadro. t en ms, v = apertura de la boca. */
    animar(estado, t, v, parpadeo) {
      let m = { inclina: 0, cabX: 0, cabZ: 0, cabY: 0, pupX: 0, pupY: 0, ojo: 1, ala: 0.2 };
      if (estado === "escuchando") {
        m = { ...m, inclina: 0.09, cabX: 0.1, cabZ: 0.2 + Math.sin(t / 900) * 0.03, ojo: 1.15, ala: 0.28 };
      } else if (estado === "pensando") {
        m = { ...m, cabX: -0.22, cabZ: -0.1, cabY: Math.sin(t / 650) * 0.18, pupX: 0.05, pupY: 0.07,
              ala: 0.15, inclina: -0.03 };
      } else if (estado === "hablando") {
        m = { ...m, cabX: -v * 0.1 + Math.sin(t / 230) * 0.04, cabZ: Math.sin(t / 700) * 0.07,
              cabY: Math.sin(t / 1100) * 0.08, ala: 0.22 + v * 0.35, inclina: 0.02 };
      }
      for (const k of Object.keys(p)) p[k] = suave(p[k], m[k], k === "ala" ? 0.25 : 0.09);

      torso.rotation.x = p.inclina;
      cabeza.rotation.set(p.cabX, p.cabY, p.cabZ);
      for (const pu of pupilas) pu.position.set(p.pupX, p.pupY, 0.12);
      for (const o of ojos) o.scale.set(p.ojo, p.ojo * (1 - parpadeo * 0.9), p.ojo);
      for (const { hombro, lado } of alas) hombro.rotation.z = p.ala * lado;

      mandibula.rotation.x = v * MODELO_3D.anguloMaximo;
      bolsa.scale.y = 0.55 + v * 0.25;           // la bolsa se infla
    },
  };
}

/* ------------------------------------------------------------------------
   Modelo de Meshy (GLB)
   ------------------------------------------------------------------------ */

async function cargarModelo(THREE, url) {
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const gltf = await new GLTFLoader().loadAsync(url);
  const raiz = gltf.scene;

  // Ajusta el tamaño y lo apoya en el suelo, venga como venga de Meshy.
  const caja = new THREE.Box3().setFromObject(raiz);
  const tam = caja.getSize(new THREE.Vector3());
  raiz.scale.setScalar(2.9 / Math.max(tam.y, 0.001));
  const caja2 = new THREE.Box3().setFromObject(raiz);
  const centro = caja2.getCenter(new THREE.Vector3());
  raiz.position.set(-centro.x, -caja2.min.y, -centro.z);
  const envoltura = new THREE.Group(); envoltura.add(raiz);

  let mandibula = null;
  const formas = [], nombres = [];
  raiz.traverse((o) => {
    if (o.name) nombres.push(o.name);
    if (!mandibula && MODELO_3D.nombreMandibula.test(o.name)) mandibula = o;
    if (o.morphTargetDictionary) {
      for (const [nombre, i] of Object.entries(o.morphTargetDictionary)) {
        if (MODELO_3D.nombreForma.test(nombre)) formas.push({ malla: o, i });
      }
    }
  });
  const reposo = mandibula ? mandibula.rotation[MODELO_3D.ejeMandibula] : 0;
  console.info("[Bob 3D] modelo cargado. Piezas:", nombres,
    "| mandíbula:", mandibula?.name || "no encontrada", "| formas de boca:", formas.length);
  if (!mandibula && !formas.length) {
    console.warn("[Bob 3D] El modelo no tiene pico separado ni forma de boca: " +
                 "Bob se balanceará al hablar. Ver instrucciones en bob3d.js.");
  }

  const p = { x: 0, z: 0 };
  return {
    raiz: envoltura,
    animar(estado, t, v) {
      const m = estado === "escuchando" ? { x: 0.08, z: 0.08 }
              : estado === "pensando"   ? { x: -0.06, z: Math.sin(t / 650) * 0.06 }
              : estado === "hablando"   ? { x: Math.sin(t / 230) * 0.03, z: Math.sin(t / 700) * 0.04 }
              : { x: 0, z: 0 };
      p.x = suave(p.x, m.x); p.z = suave(p.z, m.z);
      envoltura.rotation.x = p.x; envoltura.rotation.z = p.z;

      if (mandibula) mandibula.rotation[MODELO_3D.ejeMandibula] = reposo + v * MODELO_3D.anguloMaximo;
      for (const f of formas) f.malla.morphTargetInfluences[f.i] = v;
      if (!mandibula && !formas.length) envoltura.scale.y = 1 + v * 0.03;
    },
  };
}

/* ------------------------------------------------------------------------
   Un escenario con Bob
   ------------------------------------------------------------------------ */

const COLOR_ANILLO = { escuchando: 0x1b88c4, pensando: 0xf2d849, hablando: 0xf0a81e, reposo: 0x87dbef };

/**
 * Crea a Bob en 3D dentro de `caja` (un elemento con tamaño).
 * Devuelve { estado, ponerEstado(estado), girar() } o null si no hay 3D.
 */
export async function crearBob3D(caja, { anillo = false } = {}) {
  let THREE;
  try {
    THREE = await cargarThree();
  } catch (e) {
    console.warn("[Bob 3D] No se pudo cargar three.js; queda el Bob dibujado.", e.message);
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    console.warn("[Bob 3D] Este dispositivo no tiene WebGL; queda el Bob dibujado.");
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.classList.add("bob3d-lienzo");
  caja.prepend(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  escena.add(new THREE.HemisphereLight(0xffffff, 0x87dbef, 1.6));
  const sol = new THREE.DirectionalLight(0xffffff, 1.8);
  sol.position.set(3, 6, 5); escena.add(sol);

  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 40),
    new THREE.MeshBasicMaterial({ color: 0x063a72, transparent: true, opacity: 0.18 }),
  );
  sombra.rotation.x = -Math.PI / 2; sombra.scale.set(1, 0.6, 1); escena.add(sombra);

  // Anillo en el piso que dice, con su color y su pulso, qué está haciendo Bob.
  let aro = null;
  if (anillo) {
    aro = new THREE.Mesh(
      new THREE.RingGeometry(1.35, 1.5, 64),
      new THREE.MeshBasicMaterial({ color: COLOR_ANILLO.reposo, transparent: true, opacity: 0, side: THREE.DoubleSide }),
    );
    aro.rotation.x = -Math.PI / 2; aro.position.y = 0.01; escena.add(aro);
  }

  let bob = null;
  if (MODELO_3D.url) {
    try { bob = await cargarModelo(THREE, new URL(MODELO_3D.url, import.meta.url).href); }
    catch (e) { console.warn("[Bob 3D] No se pudo cargar el modelo; uso el provisional.", e); }
  }
  bob ??= armarBobProvisional(THREE);
  bob.raiz.rotation.y = MODELO_3D.giroInicial;
  escena.add(bob.raiz);

  // Encuadre: en pantallas verticales la cámara se aleja para que quepa el pico.
  const ajustar = () => {
    const w = caja.clientWidth, h = caja.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspecto = w / h;
    camara.aspect = aspecto;
    camara.position.set(0, 1.9, Math.max(9.5, 7 / aspecto));
    camara.lookAt(0.2, 1.45, 0.4);
    camara.updateProjectionMatrix();
  };
  new ResizeObserver(ajustar).observe(caja);
  ajustar();

  let giroObjetivo = MODELO_3D.giroInicial;
  const control = {
    estado: "reposo",
    ponerEstado(e) { if (ESTADOS.includes(e)) control.estado = e; },
    girar() { giroObjetivo = -giroObjetivo; },
  };

  let proximoParpadeo = performance.now() + 2500;
  const color = new THREE.Color();
  const animar = (t) => {
    requestAnimationFrame(animar);
    if (!caja.isConnected || !caja.getClientRects().length) return;  // oculto: no gasta batería
    // Con el modo en vivo abierto, el Bob del chat queda tapado: no se dibuja.
    if (document.body.classList.contains("vivo-abierto") && !caja.closest(".vivo")) return;

    const estado = boca.hablando ? "hablando" : control.estado;
    const v = boca.valor;

    let parpadeo = 0;
    const pp = t - proximoParpadeo;
    if (pp > 0) {
      parpadeo = pp < 140 ? Math.sin((pp / 140) * Math.PI) : 0;
      if (pp >= 140) proximoParpadeo = t + 2500 + Math.random() * 3000;
    }

    bob.animar(estado, t, v, parpadeo);
    bob.raiz.position.y = Math.sin(t / 700) * 0.04 + (estado === "pensando" ? 0.05 : 0);
    const giroExtra = estado === "escuchando" ? -0.2 : estado === "pensando" ? Math.sin(t / 1300) * 0.1 : 0;
    bob.raiz.rotation.y = suave(bob.raiz.rotation.y, giroObjetivo + giroExtra + Math.sin(t / 2300) * 0.06, 0.05);

    if (aro) {
      const pulso = estado === "escuchando" ? 1 + Math.sin(t / 260) * 0.06
                  : estado === "hablando" ? 1 + v * 0.12
                  : estado === "pensando" ? 1 + Math.sin(t / 500) * 0.03 : 1;
      aro.scale.setScalar(suave(aro.scale.x, pulso, 0.3));
      aro.material.opacity = suave(aro.material.opacity, estado !== "reposo" ? 0.75 : 0, 0.08);
      aro.material.color.lerp(color.setHex(COLOR_ANILLO[estado]), 0.08);
    }

    renderer.render(escena, camara);
  };
  requestAnimationFrame(animar);
  return control;
}

/* ------------------------------------------------------------------------
   Escenario pequeño del chat
   ------------------------------------------------------------------------ */

export async function iniciarBob3D(selector = "#bob3d") {
  const caja = document.querySelector(selector);
  if (!caja) return;
  caja.hidden = false;                 // necesita tamaño para crear el lienzo
  const control = await crearBob3D(caja);
  if (!control) { caja.hidden = true; return; }
  document.body.classList.add("con-bob3d");
  caja.addEventListener("click", (ev) => {
    if (ev.target.closest("button")) return;
    control.girar();
  });
}
