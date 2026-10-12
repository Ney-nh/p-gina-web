/* Genera docs/PREGUNTAS.md leyendo directamente assets/bot.js.
   Así el documento nunca se desfasa del bot: si alguien añade un tema y no
   vuelve a correr esto, la diferencia salta en el repositorio.

   Uso:  node herramientas/generar-preguntas.mjs
*/
import { writeFileSync } from "node:fs";
import { TEMAS, CLAVES_INVENTARIO, CLAVES_MOVIMIENTOS, SUGERENCIAS, SIN_RESPUESTA }
  from "../assets/bot.js";

const hoy = new Date().toISOString().slice(0, 10);

/** Convierte una clave suelta en una pregunta que una persona escribiría. */
function comoPregunta(clave) {
  const c = clave.trim();
  return c.charAt(0).toUpperCase() + c.slice(1);
}

const lineas = [
  "# Preguntas que responde la asistente",
  "",
  "Este documento se genera solo a partir de `assets/bot.js`.",
  "No lo edites a mano: cambia los temas en ese archivo y vuelve a correr",
  "`node herramientas/generar-preguntas.mjs`.",
  "",
  `Última generación: ${hoy} · ${TEMAS.length} temas`,
  "",
  "---",
  "",
];

for (const tema of TEMAS) {
  lineas.push(`## ${comoPregunta(tema.claves[0])}`);
  lineas.push("");
  lineas.push(tema.respuesta);
  lineas.push("");
  lineas.push("<details><summary>Cómo se reconoce la pregunta</summary>");
  lineas.push("");
  lineas.push(tema.claves.map((c) => `\`${c}\``).join(" · "));
  lineas.push("");
  lineas.push("</details>");
  lineas.push("");
}

lineas.push("---", "");
lineas.push("## Preguntas que se responden con los datos del momento", "");
lineas.push("Estas no tienen respuesta escrita: la asistente lee el inventario real");
lineas.push("y arma la frase con las cifras de ese instante.", "");
lineas.push("**Qué hay en la despensa.** Responde con el stock de cada categoría y el");
lineas.push("total. Si se nombra una categoría concreta, responde solo por ella y dice");
lineas.push("en qué lado está. Se reconoce con:", "");
lineas.push(CLAVES_INVENTARIO.map((c) => `\`${c}\``).join(" · "), "");
lineas.push("**Movimientos de hoy.** Responde cuántas donaciones y cuántos retiros van");
lineas.push("en el día. Se reconoce con:", "");
lineas.push(CLAVES_MOVIMIENTOS.map((c) => `\`${c}\``).join(" · "), "");

lineas.push("---", "");
lineas.push("## Cuando no entiende", "");
lineas.push("Si ninguna palabra encaja lo suficiente, responde esto en lugar de");
lineas.push("inventarse algo:", "");
lineas.push("> " + SIN_RESPUESTA, "");

lineas.push("---", "");
lineas.push("## Atajos que ofrece al abrir el chat", "");
for (const s of SUGERENCIAS) lineas.push(`- ${s}`);
lineas.push("");

writeFileSync(new URL("../docs/PREGUNTAS.md", import.meta.url), lineas.join("\n"));
console.log(`docs/PREGUNTAS.md generado: ${TEMAS.length} temas`);
