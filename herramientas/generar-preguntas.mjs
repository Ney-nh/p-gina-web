/* Genera docs/PREGUNTAS.md leyendo directamente assets/bot.js.
   Así el documento nunca se desfasa del bot: si alguien añade un tema y no
   vuelve a correr esto, la diferencia salta en el repositorio.

   Uso:  node herramientas/generar-preguntas.mjs
*/
import { writeFileSync } from "node:fs";
import { TEMAS, CLAVES_INVENTARIO, CLAVES_MOVIMIENTOS, SUGERENCIAS, SIN_RESPUESTA,
         PROYECTO, textoDe } from "../assets/bot.js";

const hoy = new Date().toISOString().slice(0, 10);
const totalClaves = TEMAS.reduce((a, t) => a + t.claves.length, 0)
  + CLAVES_INVENTARIO.length + CLAVES_MOVIMIENTOS.length;

const pendientes = Object.entries({
  "nombres del equipo (equipo)": PROYECTO.equipo.length,
  "institución (institucion)": PROYECTO.institucion,
  "curso (curso)": PROYECTO.curso,
  "significado de las siglas (siglas)": PROYECTO.siglas,
}).filter(([, v]) => !v).map(([k]) => k);

const lineas = [
  "# Preguntas que responde el asistente",
  "",
  "Este documento se genera solo a partir de `assets/bot.js`.",
  "No lo edites a mano: cambia los temas en ese archivo y vuelve a correr",
  "`node herramientas/generar-preguntas.mjs`.",
  "",
  `Última generación: ${hoy} · ${TEMAS.length} temas · ${totalClaves} frases clave`,
  "",
  "Las respuestas se muestran como las dice Bob; en la versión verde las dice",
  "Dora, con el nombre y el género ajustados.",
  "",
];

if (pendientes.length) {
  lineas.push("> **Datos del proyecto sin llenar** en `PROYECTO`, al inicio de `assets/bot.js`:");
  lineas.push("> " + pendientes.join(", ") + ".");
  lineas.push("> Mientras estén vacíos, el asistente responde sin ellos y no inventa nada.", "");
}

lineas.push(
  "## Cómo entiende una pregunta",
  "",
  "1. **Normaliza**: quita tildes, signos y mayúsculas; recorta letras estiradas",
  "   (`holaaa`), cambia abreviaturas (`q`, `xq`, `pa`), quita muletillas (`eh`, `mmm`),",
  "   el nombre al inicio (`oye Bob`) y palabras repetidas (`como como`).",
  "2. **Tolera errores**: compara cada palabra por su raíz (`dono` = `donar`), por cómo",
  "   suena (`aser` = `hacer`) y con uno o dos errores de letra (`proyeto`).",
  "3. **Catálogo**: cada tema tiene muchas formas de preguntarlo (abajo).",
  "4. **Rescate**: si no está seguro, pregunta «¿Te refieres a…?» con botones y",
  "   entiende un «sí» como respuesta.",
  "",
  "Las preguntas que no entendió quedan anotadas en el navegador donde se hicieron.",
  "Para verlas, en la consola: `JSON.parse(localStorage.getItem(\"bot:sin-respuesta\"))`.",
  "",
  "---",
  "",
);

for (const tema of TEMAS) {
  lineas.push(`## ${tema.pregunta}`);
  lineas.push("");
  lineas.push(textoDe(tema, "Bob"));
  lineas.push("");
  lineas.push(`<details><summary>Cómo se reconoce (${tema.claves.length} frases)</summary>`);
  lineas.push("");
  lineas.push(tema.claves.map((c) => `\`${c}\``).join(" · "));
  lineas.push("");
  lineas.push("</details>");
  lineas.push("");
}

lineas.push("---", "");
lineas.push("## Preguntas que se responden con los datos del momento", "");
lineas.push("Estas no tienen respuesta escrita: el asistente lee el inventario real");
lineas.push("y arma la frase con las cifras de ese instante.", "");
lineas.push("**Qué hay en la despensa.** Responde con el stock de cada categoría y el");
lineas.push("total. Si se nombra una categoría concreta (o algo como «leche» o «jugos»),");
lineas.push("responde solo por ella y dice en qué lado está. Se reconoce con:", "");
lineas.push(CLAVES_INVENTARIO.map((c) => `\`${c}\``).join(" · "), "");
lineas.push("**Movimientos de hoy.** Responde cuántas donaciones y cuántos retiros van");
lineas.push("en el día. Se reconoce con:", "");
lineas.push(CLAVES_MOVIMIENTOS.map((c) => `\`${c}\``).join(" · "), "");

lineas.push("---", "");
lineas.push("## Cuando no entiende", "");
lineas.push("Si algún tema se acerca, ofrece hasta dos con botones: «No estoy del todo");
lineas.push("seguro. ¿Te refieres a…?». Si nada se acerca, responde esto en lugar de");
lineas.push("inventarse algo:", "");
lineas.push("> " + SIN_RESPUESTA, "");

lineas.push("---", "");
lineas.push("## Atajos que ofrece al abrir el chat", "");
for (const s of SUGERENCIAS) lineas.push(`- ${s}`);
lineas.push("");

writeFileSync(new URL("../docs/PREGUNTAS.md", import.meta.url), lineas.join("\n"));
console.log(`docs/PREGUNTAS.md generado: ${TEMAS.length} temas, ${totalClaves} frases clave`);
