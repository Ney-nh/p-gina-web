/* =========================================================================
   BOB 3D — Beta, solo en la página de prueba
   -------------------------------------------------------------------------
   Muestra a Bob en 3D dentro del chat y le abre el pico al ritmo de su voz
   (el valor boca.valor de voz-bob.js, entre 0 y 1).

   Usa three.js, que el navegador descarga de jsDelivr (ver el importmap en
   prueba/index.html). Si no carga —sin internet, sin WebGL—, el escenario
   se esconde y queda el Bob dibujado de siempre.

   DOS MODOS
   1. Sin modelo (MODELO_3D.url vacío): un Bob provisional armado con
      esferas y conos, con los colores del dibujo. Sirve para probar todo
      el circuito voz → boca mientras llega el modelo de Meshy.
   2. Con el modelo de Meshy: pon el archivo en prueba/modelos/ y su ruta
      en MODELO_3D.url. Para que mueva la boca, el GLB necesita UNA de
      estas dos cosas, que se preparan en Blender:
        a) el pico de abajo como pieza aparte, con un nombre que contenga
           "mandibula", "jaw" o "pico_inf" (y su origen en la bisagra);
        b) una forma de boca (shape key / morph target) llamada "boca",
           "mouth", "open" o "jaw_open".
      Si no tiene ninguna de las dos, Bob se balancea al hablar, y la
      consola dice qué piezas encontró.
   ========================================================================= */

import { boca } from "./voz-bob.js";

export const MODELO_3D = {
  url: "",                       // ej. "modelos/bob.glb"
  nombreMandibula: /mandibula|mand[ií]bula|jaw|pico_?inf|lower/i,
  nombreForma: /^(boca|mouth|open|jaw_?open|abrir)/i,
  ejeMandibula: "x",             // eje de giro de la pieza del pico
  anguloMaximo: 0.5,             // radianes que se abre (≈ 29°)
  giroInicial: 0.55,             // cuánto se gira para verse de tres cuartos (pico a la derecha)
};

/* ------------------------------------------------------------------------
   Bob provisional, hecho de piezas
   ------------------------------------------------------------------------ */

function armarBobProvisional(THREE) {
  const mat = (color, extra = {}) => new THREE.MeshToonMaterial({ color, ...extra });
  const blanco = mat(0xffffff), pecho = mat(0xeaf6fc), ala = mat(0xdceef8);
  const azul = mat(0x0a51a0), azulOscuro = mat(0x063a72), amarillo = mat(0xf2d849);
  const naranja = mat(0xf0a81e), pata = mat(0xefa216), negro = mat(0x0c2135);

  const esfera = (r, m, seg = 32) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), m);
  const bob = new THREE.Group();

  // Cuerpo
  const cuerpo = esfera(1, blanco); cuerpo.scale.set(1, 0.95, 0.9); cuerpo.position.y = 1.05; bob.add(cuerpo);
  const panza = esfera(0.72, pecho); panza.position.set(0, 0.95, 0.32); bob.add(panza);
  for (const lado of [-1, 1]) {
    const a = esfera(0.55, ala); a.scale.set(0.35, 0.85, 1); a.position.set(0.88 * lado, 1.05, -0.05);
    a.rotation.z = 0.2 * lado; bob.add(a);
  }
  const cola = esfera(0.4, ala); cola.scale.set(0.8, 0.35, 1); cola.position.set(0, 0.85, -0.95); bob.add(cola);

  // Patas
  for (const lado of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12), pata);
    p.position.set(0.35 * lado, 0.12, 0.1); bob.add(p);
    const pie = esfera(0.16, pata); pie.scale.set(1, 0.35, 1.5); pie.position.set(0.35 * lado, -0.03, 0.22); bob.add(pie);
  }

  // Cabeza (todo lo de la cabeza va en un grupo, para que asienta al hablar)
  const cabeza = new THREE.Group(); cabeza.position.set(0, 2.15, 0.1); bob.add(cabeza);
  cabeza.add(esfera(0.68, blanco));

  // Gorra de marinero
  const gorra = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), azul);
  gorra.position.y = 0.08; cabeza.add(gorra);
  const visera = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.13, 40), azulOscuro);
  visera.position.y = 0.12; cabeza.add(visera);
  const boton = esfera(0.09, amarillo, 16); boton.position.y = 0.79; cabeza.add(boton);

  // Ojos
  const ojos = [];
  for (const lado of [-1, 1]) {
    const ojo = new THREE.Group(); ojo.position.set(0.25 * lado, -0.02, 0.56); cabeza.add(ojo);
    ojo.add(esfera(0.17, blanco, 24));
    const pupila = esfera(0.085, negro, 16); pupila.position.z = 0.12; ojo.add(pupila);
    const brillo = esfera(0.03, blanco, 8); brillo.position.set(0.03, 0.04, 0.19); ojo.add(brillo);
    ojos.push(ojo);
  }

  // Pico de arriba: largo y plano, hacia delante
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

  return {
    raiz: bob,
    abrir(v) {
      mandibula.rotation.x = v * MODELO_3D.anguloMaximo;
      bolsa.scale.y = 0.55 + v * 0.25;           // la bolsa se infla
      cabeza.rotation.x = -v * 0.06;             // la cabeza acompaña un poco
    },
    parpadear(v) { for (const o of ojos) o.scale.y = 1 - v * 0.9; },
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
  const escala = 2.9 / Math.max(tam.y, 0.001);
  raiz.scale.setScalar(escala);
  const caja2 = new THREE.Box3().setFromObject(raiz);
  const centro = caja2.getCenter(new THREE.Vector3());
  raiz.position.set(-centro.x, -caja2.min.y, -centro.z);
  const envoltura = new THREE.Group(); envoltura.add(raiz);

  // Busca con qué abrir la boca.
  let mandibula = null;
  const formas = [];
  const nombres = [];
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
    "| mandíbula:", mandibula?.name || "no encontrada",
    "| formas de boca:", formas.length);
  if (!mandibula && !formas.length) {
    console.warn("[Bob 3D] El modelo no tiene pico separado ni forma de boca: " +
                 "Bob se balanceará al hablar. Ver instrucciones en bob3d.js.");
  }

  return {
    raiz: envoltura,
    abrir(v) {
      if (mandibula) mandibula.rotation[MODELO_3D.ejeMandibula] = reposo + v * MODELO_3D.anguloMaximo;
      for (const f of formas) f.malla.morphTargetInfluences[f.i] = v;
      if (!mandibula && !formas.length) {
        envoltura.rotation.z = Math.sin(performance.now() / 90) * 0.04 * v;
        envoltura.scale.y = 1 + v * 0.03;
      }
    },
    parpadear() {},
  };
}

/* ------------------------------------------------------------------------
   Escenario
   ------------------------------------------------------------------------ */

export async function iniciarBob3D(selector = "#bob3d") {
  const caja = document.querySelector(selector);
  if (!caja) return;

  let THREE;
  try {
    THREE = await import("three");
  } catch (e) {
    console.warn("[Bob 3D] No se pudo cargar three.js; queda el Bob dibujado.", e.message);
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    console.warn("[Bob 3D] Este dispositivo no tiene WebGL; queda el Bob dibujado.");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  caja.prepend(renderer.domElement);
  caja.hidden = false;
  document.body.classList.add("con-bob3d");

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camara.position.set(0, 1.9, 9.5);
  camara.lookAt(0, 1.45, 0.4);

  escena.add(new THREE.HemisphereLight(0xffffff, 0x87dbef, 1.6));
  const sol = new THREE.DirectionalLight(0xffffff, 1.8);
  sol.position.set(3, 6, 5); escena.add(sol);

  // Sombra suave en el piso
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 32),
    new THREE.MeshBasicMaterial({ color: 0x063a72, transparent: true, opacity: 0.18 }),
  );
  sombra.rotation.x = -Math.PI / 2; sombra.scale.set(1, 0.6, 1); escena.add(sombra);

  let bob;
  if (MODELO_3D.url) {
    try {
      bob = await cargarModelo(THREE, MODELO_3D.url);
    } catch (e) {
      console.warn("[Bob 3D] No se pudo cargar el modelo; uso el provisional.", e);
    }
  }
  if (!bob) bob = armarBobProvisional(THREE);
  bob.raiz.rotation.y = MODELO_3D.giroInicial;
  escena.add(bob.raiz);

  // Tamaño: sigue al contenedor.
  const ajustar = () => {
    const w = caja.clientWidth, h = caja.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  };
  new ResizeObserver(ajustar).observe(caja);
  ajustar();

  // Tocar a Bob lo hace girar un poco hacia el otro lado.
  let giroObjetivo = MODELO_3D.giroInicial;
  caja.addEventListener("click", () => { giroObjetivo = -giroObjetivo; });

  let proximoParpadeo = performance.now() + 2500;
  const animar = (t) => {
    requestAnimationFrame(animar);
    if (caja.offsetParent === null) return;   // el chat está cerrado: no gasta batería

    const v = boca.valor;
    bob.abrir(v);

    // Flota, y al hablar se mueve un poco más.
    bob.raiz.position.y = Math.sin(t / 700) * 0.04 + (boca.hablando ? Math.sin(t / 160) * 0.02 : 0);
    bob.raiz.rotation.y += (giroObjetivo + Math.sin(t / 2300) * 0.08 - bob.raiz.rotation.y) * 0.05;

    // Parpadea cada pocos segundos.
    const p = t - proximoParpadeo;
    if (p > 0) {
      bob.parpadear(p < 140 ? Math.sin((p / 140) * Math.PI) : 0);
      if (p >= 140) proximoParpadeo = t + 2500 + Math.random() * 3000;
    }

    renderer.render(escena, camara);
  };
  requestAnimationFrame(animar);
}
