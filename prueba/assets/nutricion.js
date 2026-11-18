/* =========================================================================
   INFORMACIÓN NUTRICIONAL — pestaña "Nutrición" (solo en la página de prueba)
   -------------------------------------------------------------------------
   Tres alimentos de referencia por cada categoría de la despensa. Los
   valores son aproximados, por 100 g o 100 ml, tomados de tablas de
   composición de alimentos (USDA FoodData Central). Cada marca cambia un
   poco: para un producto concreto, lo que manda es su etiqueta.

   Para añadir un alimento, agrega un objeto a la lista de su categoría.
   La imagen es un dibujo SVG propio (sección DIBUJOS, abajo).
   ========================================================================= */

/* Filas de la tabla: qué nutriente, en qué unidad. */
const NUTRIENTES = [
  { id: "kcal",   nombre: "Energía",       unidad: "kcal" },
  { id: "prot",   nombre: "Proteína",      unidad: "g" },
  { id: "grasa",  nombre: "Grasa",         unidad: "g" },
  { id: "carb",   nombre: "Carbohidratos", unidad: "g" },
  { id: "azucar", nombre: "Azúcares",      unidad: "g" },
];

const CATEGORIAS_NUTRICION = [
  {
    id: "lacteos", nombre: "Lácteos", emoji: "🥛", lado: "frío",
    resumen: "Fuente de proteína y calcio para huesos y dientes. Van al lado frío " +
             "porque se dañan rápido sin refrigeración.",
    alimentos: [
      {
        id: "leche", nombre: "Leche entera", porcion: "100 ml",
        kcal: 61, prot: 3.2, grasa: 3.3, carb: 4.8, azucar: 5.1,
        destaca: "Calcio: 113 mg",
        descripcion: "Un vaso (250 ml) aporta cerca de un tercio del calcio que " +
                     "necesita al día un adulto. Una vez abierta, consúmela en dos " +
                     "o tres días y mantenla siempre en frío.",
      },
      {
        id: "yogur", nombre: "Yogur natural", porcion: "100 g",
        kcal: 61, prot: 3.5, grasa: 3.3, carb: 4.7, azucar: 4.7,
        destaca: "Calcio: 121 mg",
        descripcion: "Trae bacterias buenas para la digestión. El natural tiene " +
                     "mucho menos azúcar que el saborizado: si lo quieres dulce, " +
                     "agrégale fruta picada.",
      },
      {
        id: "queso", nombre: "Queso fresco", porcion: "100 g",
        kcal: 299, prot: 18.1, grasa: 23.8, carb: 3.0, azucar: 2.3,
        destaca: "Calcio: 566 mg",
        descripcion: "Muy rico en proteína y calcio, pero también en grasa y sal. " +
                     "Una tajada delgada (unos 30 g) es una buena porción para " +
                     "acompañar la arepa.",
      },
    ],
  },
  {
    id: "frutas", nombre: "Frutas", emoji: "🍎", lado: "frío",
    resumen: "Aportan fibra, vitaminas y agua, con muy poca grasa. Se guardan en " +
             "el lado frío para que duren más días frescas.",
    alimentos: [
      {
        id: "manzana", nombre: "Manzana", porcion: "100 g",
        kcal: 52, prot: 0.3, grasa: 0.2, carb: 13.8, azucar: 10.4,
        destaca: "Fibra: 2,4 g",
        descripcion: "Cómela con cáscara: ahí está buena parte de la fibra, que " +
                     "ayuda a la digestión y da sensación de llenura. Lávala bien " +
                     "antes.",
      },
      {
        id: "banano", nombre: "Banano", porcion: "100 g",
        kcal: 89, prot: 1.1, grasa: 0.3, carb: 22.8, azucar: 12.2,
        destaca: "Potasio: 358 mg",
        descripcion: "Energía rápida y fácil de llevar, ideal antes de hacer " +
                     "ejercicio. El potasio ayuda a los músculos. Si tiene manchas " +
                     "cafés está más dulce, no dañado.",
      },
      {
        id: "mango", nombre: "Mango", porcion: "100 g",
        kcal: 60, prot: 0.8, grasa: 0.4, carb: 15.0, azucar: 13.7,
        destaca: "Vitamina C: 36 mg",
        descripcion: "Una porción cubre casi la mitad de la vitamina C del día, " +
                     "que ayuda a las defensas. Es de las frutas más dulces: mejor " +
                     "entero que en jugo con azúcar.",
      },
    ],
  },
  {
    id: "fritos", nombre: "Fritos", emoji: "🍟", lado: "caliente",
    resumen: "Dan mucha energía en poca cantidad, pero tienen bastante grasa y sal. " +
             "Mejor como antojo ocasional que como comida principal.",
    alimentos: [
      {
        id: "papas", nombre: "Papas fritas de paquete", porcion: "100 g",
        kcal: 536, prot: 7.0, grasa: 34.6, carb: 52.9, azucar: 0.3,
        destaca: "Sodio: 525 mg",
        descripcion: "Un paquete pequeño (unos 30 g) ya suma unas 160 kcal. " +
                     "Revisa en la etiqueta el sodio, y acompáñalas con agua en " +
                     "vez de gaseosa.",
      },
      {
        id: "platanitos", nombre: "Platanitos", porcion: "100 g",
        kcal: 520, prot: 2.0, grasa: 30.0, carb: 62.0, azucar: 2.0,
        destaca: "Sodio: ~200 mg",
        descripcion: "Hechos de plátano verde frito. Llenan más que las papas " +
                     "porque tienen más almidón, pero la grasa es parecida. Los " +
                     "valores varían bastante entre marcas.",
      },
      {
        id: "chicharron", nombre: "Chicharrón de paquete", porcion: "100 g",
        kcal: 544, prot: 61.3, grasa: 31.3, carb: 0, azucar: 0,
        destaca: "Sodio: 1.818 mg",
        descripcion: "Tiene mucha proteína y nada de azúcar, pero es de los " +
                     "productos más salados: 100 g pasan de la mitad del sodio " +
                     "recomendado en un día.",
      },
    ],
  },
  {
    id: "bebidas", nombre: "Bebidas", emoji: "🧃", lado: "frío",
    resumen: "Hidratan, pero no todas igual: el agua no aporta calorías y las " +
             "bebidas azucaradas pueden tener tanta azúcar como un postre.",
    alimentos: [
      {
        id: "jugo", nombre: "Jugo de naranja", porcion: "100 ml",
        kcal: 45, prot: 0.7, grasa: 0.2, carb: 10.4, azucar: 8.4,
        destaca: "Vitamina C: 50 mg",
        descripcion: "Un vaso cubre la vitamina C del día. Al exprimirla se pierde " +
                     "la fibra de la fruta, así que un vaso al día es suficiente; " +
                     "mejor sin azúcar añadida.",
      },
      {
        id: "agua", nombre: "Agua", porcion: "100 ml",
        kcal: 0, prot: 0, grasa: 0, carb: 0, azucar: 0,
        destaca: "Sin calorías",
        descripcion: "La mejor bebida para calmar la sed. Con el calor de Santa " +
                     "Marta conviene tomar varios vasos al día, aunque no se " +
                     "sienta sed.",
      },
      {
        id: "gaseosa", nombre: "Gaseosa", porcion: "100 ml",
        kcal: 37, prot: 0, grasa: 0, carb: 9.6, azucar: 9.0,
        destaca: "Azúcar añadida",
        descripcion: "Una botella personal (400 ml) trae unos 36 g de azúcar, " +
                     "cerca de nueve cucharaditas. Tómala de vez en cuando y " +
                     "prefiere el agua para el día a día.",
      },
    ],
  },
];

/* =========================================================================
   DIBUJOS — ilustraciones propias, simples, en SVG (viewBox 0 0 64 64)
   ========================================================================= */

const DIBUJOS = {
  leche: `
    <path d="M22 18h20l4 8v30a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V26z" fill="#fff" stroke="#1B88C4" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 18l4-10h12l4 10" fill="#D6EEF9" stroke="#1B88C4" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M18 26h28" stroke="#1B88C4" stroke-width="2.5"/>
    <rect x="23" y="34" width="18" height="12" rx="3" fill="#1B88C4"/>
    <path d="M28 40c2-3 6-3 8 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  yogur: `
    <path d="M16 22h32l-4 34a3 3 0 0 1-3 2H23a3 3 0 0 1-3-2z" fill="#fff" stroke="#1B88C4" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="13" y="15" width="38" height="8" rx="3" fill="#87DBEF" stroke="#1B88C4" stroke-width="2.5"/>
    <path d="M20 36h24" stroke="#D6EEF9" stroke-width="7"/>
    <circle cx="28" cy="46" r="2" fill="#D4453B"/><circle cx="35" cy="44" r="2" fill="#D4453B"/>`,
  queso: `
    <path d="M8 44 50 20l6 6v24H8z" fill="#F6C44A" stroke="#A8880A" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M8 44h48" stroke="#A8880A" stroke-width="2.5"/>
    <circle cx="22" cy="50" r="3" fill="#E0A81E"/><circle cx="40" cy="48" r="4" fill="#E0A81E"/>
    <circle cx="46" cy="34" r="3" fill="#E0A81E"/><circle cx="32" cy="38" r="2" fill="#E0A81E"/>`,
  manzana: `
    <path d="M32 20c-6-5-20-4-20 12 0 14 10 24 16 24 2 0 3-1 4-1s2 1 4 1c6 0 16-10 16-24 0-16-14-17-20-12z" fill="#D4453B" stroke="#9E2A22" stroke-width="2.5"/>
    <path d="M32 20c0-6 2-10 5-12" stroke="#6B4A1E" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M34 14c6-6 14-4 14-4s-2 8-10 8c-2 0-4-2-4-4z" fill="#4CAF50"/>
    <path d="M20 30c0-4 2-6 5-7" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".6"/>`,
  banano: `
    <path d="M12 22c4 22 24 34 42 26 2-1 2-4 0-4-16 4-30-6-36-24-1-3-6-2-6 2z" fill="#F2D849" stroke="#A8880A" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M16 24c6 14 18 22 32 22" stroke="#D9B92E" stroke-width="2" fill="none"/>
    <path d="M12 22l-2-6 5-1 2 5" fill="#6B4A1E"/>`,
  mango: `
    <path d="M14 34c0-14 12-24 26-22 10 2 12 12 8 22-4 12-14 20-24 18-6-1-10-8-10-18z" fill="#F0A81E" stroke="#B5651D" stroke-width="2.5"/>
    <path d="M40 14c4-2 10 0 10 0" stroke="#6B4A1E" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M14 34c4-6 10-6 14-12" stroke="#E2563C" stroke-width="6" fill="none" stroke-linecap="round" opacity=".55"/>
    <path d="M36 42c4-2 6-6 7-10" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".55"/>`,
  papas: `
    <path d="M14 10h36l-3 8 3 8-3 8 3 8-3 8 3 8H14l3-8-3-8 3-8-3-8 3-8z" fill="#EFA216" stroke="#8A5A06" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="32" cy="32" rx="11" ry="9" fill="#F8E08A" stroke="#C98A0B" stroke-width="2"/>
    <path d="M26 31c3-2 9-2 12 1" stroke="#C98A0B" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  platanitos: `
    <path d="M8 34h48c0 12-10 20-24 20S8 46 8 34z" fill="#0A51A0" stroke="#063A72" stroke-width="2.5"/>
    <ellipse cx="20" cy="30" rx="8" ry="5" fill="#F6D35B" stroke="#C98A0B" stroke-width="2"/>
    <ellipse cx="34" cy="27" rx="8" ry="5" fill="#F6D35B" stroke="#C98A0B" stroke-width="2"/>
    <ellipse cx="45" cy="31" rx="8" ry="5" fill="#F6D35B" stroke="#C98A0B" stroke-width="2"/>
    <ellipse cx="28" cy="33" rx="8" ry="5" fill="#F6D35B" stroke="#C98A0B" stroke-width="2"/>`,
  chicharron: `
    <path d="M10 38c2-10 8-14 14-12 2-6 10-8 14-4 6-4 16 0 16 8 4 4 2 12-4 13H14c-5-1-6-3-4-5z" fill="#D9963A" stroke="#8A5A06" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M18 36c3-3 6-3 8 0M30 32c3-3 6-3 8 0M40 38c3-3 6-3 8 0" stroke="#F3C77A" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  jugo: `
    <path d="M18 14h28l-4 42a2 2 0 0 1-2 2H24a2 2 0 0 1-2-2z" fill="#fff" stroke="#2E7D6E" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M20 24h24l-3 31H23z" fill="#F7A21B"/>
    <circle cx="46" cy="16" r="8" fill="#F7A21B" stroke="#C47A0B" stroke-width="2"/>
    <path d="M46 10v12M40 16h12" stroke="#FCD27A" stroke-width="1.8"/>
    <path d="M30 6l4 18" stroke="#D4453B" stroke-width="3" stroke-linecap="round"/>`,
  agua: `
    <rect x="26" y="6" width="12" height="6" rx="2" fill="#1B88C4"/>
    <path d="M26 12h12v4c6 3 8 8 8 14v24a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V30c0-6 2-11 8-14z" fill="#D6EEF9" stroke="#1B88C4" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="18" y="32" width="28" height="12" fill="#87DBEF"/>
    <path d="M32 35c-3 4-3 6 0 6s3-2 0-6z" fill="#1B88C4"/>`,
  gaseosa: `
    <rect x="18" y="10" width="28" height="46" rx="5" fill="#D4453B" stroke="#9E2A22" stroke-width="2.5"/>
    <rect x="20" y="8" width="24" height="5" rx="2" fill="#B8C4CC" stroke="#7E97A6" stroke-width="2"/>
    <rect x="20" y="53" width="24" height="5" rx="2" fill="#B8C4CC" stroke="#7E97A6" stroke-width="2"/>
    <path d="M18 30c8 4 20-4 28 0v6c-8-4-20 4-28 0z" fill="#fff"/>
    <circle cx="25" cy="22" r="1.6" fill="#fff" opacity=".7"/><circle cx="30" cy="18" r="1.2" fill="#fff" opacity=".7"/>`,
};

function dibujo(id, nombre) {
  return `<svg class="nut-img" viewBox="0 0 64 64" role="img" aria-label="${nombre}">${DIBUJOS[id] || ""}</svg>`;
}

/* =========================================================================
   PINTAR LA PESTAÑA
   ========================================================================= */

/** Número con coma decimal, como se escribe en Colombia. */
function cifra(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",");
}

function seccionCategoria(cat) {
  const cabeceras = cat.alimentos.map((a) => `
    <th scope="col">
      ${dibujo(a.id, a.nombre)}
      <span class="nut-alimento">${a.nombre}</span>
      <span class="nut-porcion">por ${a.porcion}</span>
    </th>`).join("");

  const filas = NUTRIENTES.map((n) => {
    // Se resalta el valor más alto de cada fila dentro de la categoría.
    const max = Math.max(...cat.alimentos.map((a) => a[n.id]));
    const celdas = cat.alimentos.map((a) => {
      const alto = max > 0 && a[n.id] === max ? " nut-alto" : "";
      return `<td class="${alto.trim()}">${cifra(a[n.id])} <small>${n.unidad}</small></td>`;
    }).join("");
    return `<tr><th scope="row">${n.nombre}</th>${celdas}</tr>`;
  }).join("");

  const destaca = `<tr class="nut-destaca"><th scope="row">Destaca</th>${
    cat.alimentos.map((a) => `<td>${a.destaca}</td>`).join("")
  }</tr>`;

  const fichas = cat.alimentos.map((a) => `
    <article class="nut-ficha">
      ${dibujo(a.id, a.nombre)}
      <div>
        <h4>${a.nombre}</h4>
        <p>${a.descripcion}</p>
      </div>
    </article>`).join("");

  return `
    <section class="nut-cat" data-cat="${cat.id}" style="--c: var(--cat-${cat.id})">
      <header class="nut-cat-cabecera">
        <h3><span>${cat.emoji}</span> ${cat.nombre}</h3>
        <span class="nut-lado ${cat.lado === "frío" ? "frio" : "caliente"}">Lado ${cat.lado}</span>
      </header>
      <p class="nut-resumen">${cat.resumen}</p>
      <div class="nut-tabla-caja">
        <table class="nut-tabla">
          <caption>Información nutricional de ${cat.nombre.toLowerCase()}</caption>
          <thead><tr><th scope="col" class="nut-esquina">Nutriente</th>${cabeceras}</tr></thead>
          <tbody>${filas}${destaca}</tbody>
        </table>
      </div>
      <div class="nut-fichas">${fichas}</div>
    </section>`;
}

export function iniciarNutricion(selector = "#nutricion-contenido") {
  const caja = document.querySelector(selector);
  if (!caja) return;

  const chips = [`<button class="chip chip-on" data-cat="">Todas</button>`]
    .concat(CATEGORIAS_NUTRICION.map((c) =>
      `<button class="chip" data-cat="${c.id}">${c.emoji} ${c.nombre}</button>`))
    .join("");

  caja.innerHTML = `
    <div class="chips nut-filtro" id="nut-filtro">${chips}</div>
    ${CATEGORIAS_NUTRICION.map(seccionCategoria).join("")}
    <p class="nut-nota">
      Valores aproximados por 100 g o 100 ml, tomados de tablas de composición de
      alimentos (USDA FoodData Central). Cada marca varía: para un producto
      concreto, revisa su etiqueta. En color, el valor más alto de cada fila
      dentro de la categoría. Esta información es orientativa y no
      reemplaza la recomendación de un profesional de la salud.
    </p>`;

  caja.querySelector("#nut-filtro").onclick = (ev) => {
    const chip = ev.target.closest(".chip");
    if (!chip) return;
    caja.querySelectorAll("#nut-filtro .chip").forEach((c) => c.classList.toggle("chip-on", c === chip));
    caja.querySelectorAll(".nut-cat").forEach((s) => {
      s.hidden = !!chip.dataset.cat && s.dataset.cat !== chip.dataset.cat;
    });
  };
}

export { CATEGORIAS_NUTRICION, NUTRIENTES };
