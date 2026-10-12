/* Revisa que todos los módulos de JavaScript del proyecto sean sintácticamente
   válidos, y que el documento de preguntas esté al día con el bot.

   Un error de sintaxis en un solo archivo deja la página entera sin
   funcionar, y en el navegador solo se ve una línea en la consola que nadie
   mira. Correr esto antes de subir cambios evita publicar una página rota.

   Uso:  node herramientas/revisar.mjs
*/
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const saltar = new Set(["node_modules", ".git", "herramientas"]);
const problemas = [];

function buscar(dir) {
  for (const nombre of readdirSync(dir)) {
    if (saltar.has(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) buscar(ruta);
    else if (nombre.endsWith(".js") || nombre.endsWith(".mjs")) revisar(ruta);
  }
}

function revisar(ruta) {
  const corto = relative(raiz, ruta);
  try {
    // --check de Node entiende módulos cuando la extensión es .mjs; para los
    // .js se le pasa por la entrada estándar declarando el tipo.
    execFileSync(process.execPath, ["--input-type=module", "--check"], {
      input: readFileSync(ruta, "utf8"),
      stdio: ["pipe", "ignore", "pipe"],
    });
    console.log("  bien  " + corto);
  } catch (e) {
    const detalle = String(e.stderr || e.message).split("\n")
      .find((l) => l.includes("Error")) || "error de sintaxis";
    console.log("  ROTO  " + corto + "  ->  " + detalle.trim());
    problemas.push(corto);
  }
}

console.log("Sintaxis de los módulos:");
buscar(raiz);

// El documento de preguntas se genera del bot: si alguien añade un tema y no
// lo regenera, aquí salta.
const bot = readFileSync(join(raiz, "assets/bot.js"), "utf8");
const doc = readFileSync(join(raiz, "docs/PREGUNTAS.md"), "utf8");
const temasEnBot = (bot.match(/^    id: "/gm) || []).length;
const temasEnDoc = Number((doc.match(/· (\d+) temas/) || [])[1] || 0);

console.log("\nDocumento de preguntas:");
if (temasEnBot === temasEnDoc) {
  console.log(`  bien  ${temasEnBot} temas, al día`);
} else {
  console.log(`  VIEJO  el bot tiene ${temasEnBot} temas y el documento ${temasEnDoc}`);
  console.log("         corre: node herramientas/generar-preguntas.mjs");
  problemas.push("docs/PREGUNTAS.md");
}

console.log("\n" + (problemas.length
  ? `${problemas.length} problema(s): ` + problemas.join(", ")
  : "Todo en orden."));
process.exit(problemas.length ? 1 : 0);
