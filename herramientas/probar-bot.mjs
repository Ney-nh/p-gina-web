/* Prueba que el asistente entienda preguntas reales: con tildes o sin ellas,
   con errores de escritura, letras estiradas, muletillas, el nombre al
   inicio y palabras repetidas.

   Si cambias claves en assets/bot.js, corre esto para ver que nada se rompió.
   Si alguien hace una pregunta que no entiende, agrégala aquí con el tema
   que debería salir, y ajusta las claves hasta que pase.

   Uso:  node herramientas/probar-bot.mjs
*/
import { entender } from "../assets/bot.js";

const datos = {
  categorias: [
    { id: "lacteos", nombre: "Lácteos", lado: "frio", stock: 3 },
    { id: "frutas", nombre: "Frutas", lado: "frio", stock: 0 },
    { id: "fritos", nombre: "Fritos", lado: "caliente", stock: 5 },
    { id: "bebidas", nombre: "Bebidas", lado: "frio", stock: 2 },
  ],
  total: 10,
  hoy: { entradas: 2, salidas: 1 },
};

/* [frase, tema esperado]. "?" significa que debe ofrecer "¿Te refieres a…?"
   con ese tema primero; "-" que no debe responder nada con seguridad. */
const CASOS = [
  // la pregunta que falló en la presentación, y sus variantes
  ["¿Cómo se creó el proyecto?", "creacion"],
  ["como se creo el proyecto", "creacion"],
  ["como se creo este proyecto", "creacion"],
  ["como se kreo el proyeto", "creacion"],
  ["cómo cómo se creó el proyecto", "creacion"],
  ["oye bob como se creo el proyecto", "creacion"],
  ["eh bob, como nació el proyecto?", "creacion"],
  ["de donde salio la idea", "creacion"],
  ["como surgio el proyecto", "creacion"],
  ["como fue creado", "creacion"],
  ["como lo desarrollaron", "creacion"],
  ["historia del proyecto", "creacion"],
  ["como hicieron este proyecto", "creacion"],

  // equipo, objetivo, nombre, Bob
  ["quienes hicieron el proyecto", "equipo"],
  ["quien creo el proyecto", "equipo"],
  ["quienes son los integrantes", "equipo"],
  ["cual es el objetivo del proyecto", "objetivo"],
  ["que problema resuelve", "objetivo"],
  ["a quien ayuda esto", "objetivo"],
  ["que significa dirt", "nombre_dirt"],
  ["por que se llama dirt", "nombre_dirt"],
  ["quien eres", "quien_eres"],
  ["como te llamas", "quien_eres"],
  ["por que eres un pelicano", "quien_eres"],
  ["quien es bob", "quien_eres"],
  ["que sabes hacer", "que_sabes"],
  ["en que me puedes ayudar", "que_sabes"],
  ["eres inteligencia artificial", "como_entiende"],
  ["como me entiendes", "como_entiende"],
  ["que materiales usaron", "materiales"],
  ["que componentes tiene", "materiales"],
  ["donde se guardan los datos", "datos_nube"],
  ["usan firebase?", "datos_nube"],
  ["que mejoras le harian a futuro", "mejoras"],
  ["cuales son las limitaciones", "mejoras"],

  // los temas de siempre, con errores
  ["como dono", "donar"],
  ["komo dono alimentos", "donar"],
  ["quiero donar comida", "donar"],
  ["kiero donar", "donar"],
  ["como puedo dejar comida", "donar"],
  ["como retiro algo", "retirar"],
  ["kiero sacar comida", "retirar"],
  ["necesito comida", "retirar"],
  ["por que hay dos puertas", "lados"],
  ["porq hay dos compuertas", "lados"],
  ["para que es el lado frio", "lados"],
  ["la compuerta no abre", "compuerta_problema"],
  ["la conpuerta no se abre", "compuerta_problema"],
  ["el arduino no se conecta", "no_conecta_bluetooth"],
  ["el arduno no conecta", "no_conecta_bluetooth"],
  ["funciona en iphone", "navegador"],
  ["me pide permiso", "permiso_bluetooth"],
  ["como funciona por dentro", "como_funciona"],
  ["que tecnologia usaron", "como_funciona"],
  ["que pasa si se va la luz", "sin_luz"],
  ["funciona sin internet", "sin_luz"],
  ["que no se puede donar", "que_no_donar"],
  ["puedo donar comida preparada", "que_no_donar"],
  ["y si la compuerta se queda abierta", "seguridad_cierre"],
  ["me equivoque en un registro", "borrar_registro"],
  ["cuanto tiempo queda abierta", "tiempo"],
  ["que es dirt", "que_es"],
  ["de que se trata", "que_es"],
  ["cuanto cuesta", "costo"],
  ["es gratis", "costo"],
  ["cuanto puedo llevar", "limite"],
  ["holaaaa", "saludo"],
  ["hola bob", "saludo"],
  ["buenos diaz", "saludo"],
  ["q tal", "saludo"],
  ["muchas grax", "gracias"],
  ["chao", "despedida"],
  ["por que piden mi cedula", "documento"],

  // frases que no se usaron para ajustar las claves
  ["bob como hicieron todo esto", "creacion"],
  ["y esto como lo armaron", "creacion"],
  ["cuentame la historia", "creacion"],
  ["por que decidieron hacer esto", "creacion"],
  ["como se creooo el proyectooo", "creacion"],
  ["como se creo el poryecto", "creacion"],
  ["como se llaman los creadores", "equipo"],
  ["quienes estan detras de esto", "equipo"],
  ["que motivo el proyecto", "objetivo"],
  ["que hace el arduino", "como_funciona"],
  ["que servos usaron", "materiales"],
  ["que es un servo", "materiales"],
  ["que significa D.I.R.T.", "nombre_dirt"],
  ["por que se abre solo un lado", "dos_servos"],
  ["la compuerta esta trabada", "compuerta_problema"],
  ["como conecto el arduino", "no_conecta_bluetooth"],
  ["eres un robot?", "quien_eres"],
  ["bob", "saludo"],
  ["gracias bob", "gracias"],
  ["donde dejo la comida", "donar"],
  ["que pasa si no hay internet", "sin_luz"],

  // datos reales
  ["que hay disponible", "inventario"],
  ["q hay", "inventario"],
  ["hay leche?", "inventario"],
  ["quedan frutas", "inventario"],
  ["hay jugos", "inventario"],
  ["cuantas donaciones van hoy", "movimientos"],

  // no deben confundirse
  ["cuanto tiempo dura abierta la compuerta", "tiempo"],
  ["cuanto cuesta la leche", "costo"],

  // rescate: algo cercano pero sin certeza
  ["el proyecto", "?"],
  ["la idea", "?"],

  // no tiene nada que ver: no debe inventar
  ["cual es la capital de francia", "-"],
  ["me gusta el futbol", "-"],
  ["quien gano el partido", "-"],
  ["como esta el clima", "-"],
  ["cual es tu color favorito", "-"],
];

let bien = 0;
const fallos = [];
for (const [frase, esperado] of CASOS) {
  const r = entender(frase, datos, { nombre: "Bob" });
  let ok;
  if (esperado === "-") ok = !r.seguro && !r.opciones?.length;
  else if (esperado === "?") ok = !r.seguro && r.opciones?.length > 0;
  else ok = r.seguro && r.tema === esperado;
  if (ok) bien++;
  else fallos.push(`  «${frase}»  esperaba ${esperado}, salió ${r.tema ?? (r.opciones?.length ? "? " + r.opciones.map((o) => o.id).join("/") : "-")}`);
}

// la respuesta "sí" a un "¿Te refieres a…?"
const ofrecido = entender("la idea", datos, { nombre: "Bob" });
const conSi = entender("siii", datos, { nombre: "Bob", pendiente: ofrecido.pendiente });
const siOk = ofrecido.pendiente && conSi.seguro && conSi.tema === ofrecido.pendiente.id;
if (siOk) bien++; else fallos.push("  «sí» después de «¿Te refieres a…?» no respondió el tema ofrecido");

const total = CASOS.length + 1;
console.log(`Asistente: ${bien} de ${total} preguntas bien entendidas.`);
if (fallos.length) {
  console.log("\nFallan:\n" + fallos.join("\n"));
  process.exit(1);
}
console.log("Todo en orden.");
