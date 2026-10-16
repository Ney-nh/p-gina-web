/* =========================================================================
   EL ASISTENTE DE LA DESPENSA (Bob en la versión azul, Dora en la verde)
   -------------------------------------------------------------------------
   Responde dudas sobre la despensa y sobre el proyecto, por escrito o
   hablando. El nombre lo pone cada página (.bot-nombre strong), así que
   este archivo sirve para las dos versiones.

   Cómo entiende una pregunta, en cuatro capas:

     1. NORMALIZA   minúsculas, sin tildes ni signos, letras estiradas
                    ("holaaa"), abreviaturas ("q", "xq", "pa"), muletillas
                    ("eh", "mmm"), el nombre al inicio ("oye Bob") y
                    palabras repetidas ("como como").
     2. TOLERA      cada palabra se compara por su raíz ("dono" = "donar"),
                    por cómo suena ("aser" = "hacer", "vevida" = "bebida")
                    y con uno o dos errores de letra ("proyeto").
     3. CATÁLOGO    cada tema tiene muchas formas de preguntarlo.
     4. RESCATE     si no está seguro, pregunta "¿Te refieres a…?" con
                    botones, y entiende un "sí" como respuesta.

   Ollama es opcional (sección 6): solo se consulta cuando las capas
   anteriores no están seguras, y si falla se sigue con el rescate.
   ========================================================================= */

/* =========================================================================
   0. DATOS DEL PROYECTO — llenar con los datos reales del equipo
   -------------------------------------------------------------------------
   Lo que quede vacío no se dice: el asistente nunca se inventa un nombre.
   ========================================================================= */

export const PROYECTO = {
  equipo: ["Mateo Urzola", "Thaimy Brid", "Dayana Oyaga"],
  institucion: "el IED Liceo Samario",
  curso: "Tecnología, Innovación e Informática",
  siglas: "Despensa Inteligente Reutilizable y Transportable",
};

/* =========================================================================
   1. LO QUE EL ASISTENTE SABE
   -------------------------------------------------------------------------
   Cada tema tiene:
     titulo     cómo se nombra al ofrecerlo en "¿Te refieres a…?"
     pregunta   la pregunta que se envía al tocar ese botón
     claves     frases que lo disparan. No hacen falta tildes, ni variantes
                de conjugación, ni errores de escritura: la comparación ya
                los tolera. Sí conviene poner formas distintas de decirlo.
     respuesta  texto fijo, o una función que recibe { nombre }.
                {nombre} dentro del texto se cambia por Bob o Dora.
   ========================================================================= */

/* Bob es él y Dora es ella: las respuestas se ajustan solas. */
const FEMENINOS = new Set(["Dora"]);
function genero(nombre, el, ella) {
  return FEMENINOS.has(nombre) ? ella : el;
}

function procedencia() {
  const partes = [PROYECTO.curso, PROYECTO.institucion].filter(Boolean);
  return partes.join(" de ").replace(/\bde el\b/g, "del");
}

function listar(xs) {
  return xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " y " + xs.at(-1);
}

export const TEMAS = [
  {
    id: "donar",
    titulo: "cómo donar",
    pregunta: "¿Cómo dono alimentos?",
    claves: ["donar", "dejar comida", "dejar alimentos", "aportar", "entregar comida", "traer comida",
             "regalar", "dar comida", "quiero ayudar", "como dono", "contribuir", "quiero donar",
             "como puedo donar", "donde dejo", "como dejo", "tengo comida que me sobra",
             "me sobra comida", "hacer una donacion", "registrar entrada", "como ayudo",
             "puedo dejar", "puedo traer", "traje comida", "vengo a dejar", "boton verde"],
    respuesta:
      "Para donar: toca el botón verde Registrar entrada, escribe tu nombre y tu " +
      "número de documento, elige qué alimento traes y cuántas unidades. Al guardar, " +
      "la compuerta se abre sola del lado que corresponde y tienes cinco segundos " +
      "para dejar los alimentos dentro.",
  },
  {
    id: "retirar",
    titulo: "cómo retirar alimentos",
    pregunta: "¿Cómo retiro algo?",
    claves: ["retirar", "sacar comida", "tomar comida", "llevar comida", "necesito comida", "coger",
             "como saco", "puedo llevar", "recibir comida", "me puedo servir", "como retiro",
             "quiero sacar", "quiero llevar", "tengo hambre", "necesito alimentos",
             "como obtengo", "como consigo comida", "registrar salida", "boton naranja",
             "vengo a recoger", "recoger comida", "pedir comida"],
    respuesta:
      "Para retirar: toca el botón naranja Registrar salida, escribe tu nombre y tu " +
      "documento, y elige qué vas a llevar. La compuerta se abre y tienes cinco " +
      "segundos. No tienes que pedir permiso a nadie: la despensa está para eso.",
  },
  {
    id: "lados",
    titulo: "por qué hay dos lados",
    pregunta: "¿Por qué hay dos puertas?",
    claves: ["lado", "lado frio", "lado caliente", "dos puertas", "dos compuertas", "por que dos",
             "cual puerta", "que puerta", "compartimento", "compartimentos", "nevera",
             "dos lados", "por que tiene dos", "frio y caliente", "donde va cada cosa",
             "donde se guarda", "en que lado", "dos compartimentos", "parte fria", "parte caliente"],
    respuesta:
      "La despensa tiene dos compartimentos. El lado frío guarda lo que necesita " +
      "conservarse fresco: lácteos, frutas y bebidas. El lado caliente guarda lo seco " +
      "y lo frito. Tú no eliges: al marcar el alimento, la aplicación abre el lado " +
      "correcto por su cuenta.",
  },
  {
    id: "categorias",
    titulo: "qué alimentos se reciben",
    pregunta: "¿Qué alimentos se pueden donar?",
    claves: ["que puedo donar", "que alimentos", "categorias", "que reciben", "que se puede donar",
             "tipos de comida", "que aceptan", "que comida reciben", "que tipo de alimentos",
             "que productos", "que clase de comida", "cuales categorias", "que se puede traer"],
    respuesta:
      "Se manejan cuatro categorías: lácteos, frutas, fritos y bebidas. Lácteos, " +
      "frutas y bebidas van al lado frío; los fritos van al lado caliente.",
  },
  {
    id: "documento",
    titulo: "por qué se pide el documento",
    pregunta: "¿Por qué piden mi documento?",
    claves: ["documento", "cedula", "por que piden", "privacidad", "para que mi nombre",
             "identificacion", "me registran", "tarjeta de identidad", "mis datos",
             "es seguro dar mi documento", "que hacen con mis datos", "datos personales",
             "por que me piden datos", "guardan mi cedula"],
    respuesta:
      "Se pide el nombre y el documento para llevar la cuenta de lo que entra y sale, " +
      "y así saber qué hace falta reponer. Del documento solo se guardan los últimos " +
      "cuatro dígitos: el número completo nunca sale de tu teléfono. No hay que crear " +
      "cuenta ni contraseña.",
  },
  {
    id: "compuerta_problema",
    titulo: "la compuerta no abre",
    pregunta: "La compuerta no abre",
    claves: ["no abre", "no se abre", "la compuerta no", "no abrio", "no se abrio",
             "atascada", "trabada", "sigue cerrada", "no quiere abrir", "no se mueve",
             "el servo no se mueve", "no funciona la compuerta", "la puerta no abre",
             "no hace nada", "no responde la compuerta"],
    respuesta:
      "Si la compuerta no abre, mira arriba si dice Conectada. Si dice Sin conexión, " +
      "toca Conectar la compuerta y elige DIRT. Si ya está conectada y aun así no " +
      "abre, revisa que los servos tengan corriente: con dos servos hace falta una " +
      "fuente externa, no alcanza con el USB. Tu registro quedó guardado de todas " +
      "formas.",
  },
  {
    id: "no_conecta_bluetooth",
    titulo: "el Arduino no se conecta",
    pregunta: "El Arduino no se conecta",
    claves: ["no se conecta", "no conecta", "no encuentra", "no aparece", "error de conexion",
             "connection failed", "no lo detecta", "no sale en la lista", "fallo la conexion",
             "no se enlaza", "arduino no conecta", "no me conecta", "bluetooth no funciona",
             "no encuentra el arduino", "como conecto", "como me conecto", "conectar bluetooth",
             "no aparece dirt"],
    respuesta:
      "Lo más común es que el Arduino esté emparejado en los ajustes del teléfono. " +
      "Entra a Ajustes, Bluetooth, busca DIRT y desvincúlalo. Esta página no necesita " +
      "emparejar nada: lo encuentra sola. Después apaga y enciende el Bluetooth, " +
      "reinicia el Arduino y vuelve a intentar.",
  },
  {
    id: "navegador",
    titulo: "en qué navegador funciona",
    pregunta: "¿En qué navegador funciona?",
    claves: ["que navegador", "safari", "iphone", "firefox", "edge", "chrome",
             "no me sale el boton", "no veo el boton de conectar", "desde mi iphone",
             "funciona en iphone", "ios", "funciona en celular", "desde el celular",
             "en que telefono funciona", "android"],
    respuesta:
      "La compuerta solo se puede accionar desde Chrome o Edge, en Android o en " +
      "computador. En iPhone y en Safari no existe la función de Bluetooth del " +
      "navegador. Desde cualquier teléfono sí se puede registrar y consultar el " +
      "inventario, que es la mayor parte.",
  },
  {
    id: "permiso_bluetooth",
    titulo: "permisos de Bluetooth",
    pregunta: "No me deja conectar, pide permiso",
    claves: ["permiso", "no me deja", "bloqueo", "me pide permiso", "dispositivos cercanos",
             "no tengo permiso", "denegado", "permiso de bluetooth"],
    respuesta:
      "En Android 12 o más nuevo hace falta el permiso de Dispositivos cercanos. Si lo " +
      "negaste sin querer, entra a Ajustes, Aplicaciones, busca el navegador y " +
      "concédeselo. Luego recarga la página.",
  },
  {
    id: "como_funciona",
    titulo: "cómo funciona por dentro",
    pregunta: "¿Cómo funciona por dentro?",
    claves: ["como funciona por dentro", "que tecnologia", "como esta hecho", "arduino",
             "que usa", "programacion", "como esta programado", "que lleva por dentro",
             "tecnicamente", "como funciona", "como funciona el sistema", "arquitectura",
             "que lenguaje", "en que esta programado", "como se comunica", "que tecnologias usaron",
             "funcionamiento", "explicacion tecnica", "bluetooth", "que hace el arduino",
             "para que el arduino", "como se mueve la compuerta"],
    respuesta:
      "La página habla por Bluetooth con un Arduino UNO R4 WiFi que mueve dos servos, " +
      "uno por cada compartimento. Los registros se guardan en Firestore, así que se " +
      "ven al instante en cualquier teléfono. La página está hecha en HTML, CSS y " +
      "JavaScript y es estática: no hay servidor que mantener.",
  },
  {
    id: "creacion",
    titulo: "cómo se creó el proyecto",
    pregunta: "¿Cómo se creó el proyecto?",
    claves: ["como se creo el proyecto", "como se creo", "como lo crearon", "como lo hicieron",
             "como nacio", "como surgio", "como empezo", "como inicio", "de donde salio la idea",
             "de donde surgio la idea", "como se les ocurrio", "historia del proyecto",
             "como se desarrollo", "como lo desarrollaron", "proceso de creacion",
             "como fue creado", "como se hizo el proyecto", "como hicieron el proyecto",
             "como armaron", "como lo construyeron", "origen del proyecto", "creacion del proyecto",
             "desarrollo del proyecto", "como nacio la idea", "como llegaron a esto",
             "por que lo crearon", "por que lo hicieron", "etapas del proyecto",
             "versiones anteriores", "como evoluciono", "cuentame la historia", "la historia",
             "por que decidieron", "como empezaron", "que los motivo", "como se les vino la idea"],
    respuesta: ({ nombre }) => {
      const donde = procedencia();
      const inicio = donde ? `El proyecto se desarrolló para ${donde}. ` : "";
      return inicio +
        "Empezó como una aplicación móvil con inicio de sesión, un servidor propio y una " +
        "compuerta de un solo servo. Para que cualquiera pudiera usarla desde el " +
        "teléfono sin instalar nada, se rehízo como página web: los datos pasaron a " +
        "Firestore, la compuerta pasó a tener dos lados, frío y caliente, cada uno con su " +
        "servo controlado por un Arduino por Bluetooth, y al final se sumó " + nombre +
        " para resolver dudas por voz o por escrito.";
    },
  },
  {
    id: "equipo",
    titulo: "quiénes hicieron el proyecto",
    pregunta: "¿Quiénes hicieron el proyecto?",
    claves: ["quienes lo hicieron", "quien lo hizo", "quien la hizo", "quien lo creo",
             "quienes lo crearon", "quien creo el proyecto", "integrantes", "autores",
             "quienes son ustedes", "quienes participaron", "creadores", "desarrolladores",
             "quien lo desarrollo", "quienes trabajaron", "el equipo", "de quien es el proyecto",
             "quien lo programo", "nombres del equipo", "quienes estan detras", "detras del proyecto",
             "como se llaman los creadores", "nombres de los creadores", "quienes lo presentan"],
    respuesta: () => {
      const donde = procedencia();
      const contexto = donde ? `, para ${donde}` : "";
      if (PROYECTO.equipo.length) {
        return `D.I.R.T. lo crearon ${listar(PROYECTO.equipo)}${contexto}.`;
      }
      return `D.I.R.T. lo creó el equipo que te lo está presentando${contexto}. ` +
             "Con gusto te cuentan quién hizo cada parte.";
    },
  },
  {
    id: "objetivo",
    titulo: "para qué sirve el proyecto",
    pregunta: "¿Cuál es el objetivo del proyecto?",
    claves: ["objetivo", "proposito", "para que lo hicieron", "que problema resuelve",
             "que problema soluciona", "a quien ayuda", "a quienes beneficia", "impacto",
             "cual es la finalidad", "por que es importante", "beneficio", "beneficios",
             "a quien va dirigido", "para quien es", "que aporta", "justificacion",
             "cual es la meta", "importancia", "motivacion", "que motivo el proyecto",
             "por que es necesario"],
    respuesta:
      "Que los alimentos que a unos les sobran lleguen a quienes los necesitan, sin " +
      "trámites ni costo. La aplicación lleva la cuenta de lo que entra y sale para " +
      "saber qué hace falta reponer, y la compuerta guarda cada alimento en el " +
      "compartimento correcto, frío o caliente, para que se conserve mejor.",
  },
  {
    id: "nombre_dirt",
    titulo: "qué significa D.I.R.T.",
    pregunta: "¿Qué significa D.I.R.T.?",
    claves: ["que significa dirt", "significado de dirt", "por que se llama dirt",
             "que quiere decir dirt", "siglas", "que significan las siglas", "de donde viene el nombre",
             "por que ese nombre", "que significa el nombre", "dirt que significa", "nombre del proyecto"],
    respuesta: () =>
      PROYECTO.siglas
        ? `D.I.R.T. significa ${PROYECTO.siglas}.`
        : "D.I.R.T. Comunitario es el nombre de esta despensa compartida. El significado " +
          "de cada letra te lo cuenta mejor el equipo que la creó.",
  },
  {
    id: "quien_eres",
    titulo: "quién soy",
    pregunta: "¿Quién eres?",
    claves: ["quien eres", "como te llamas", "cual es tu nombre", "que eres", "eres un robot",
             "eres una persona", "quien es bob", "quien es dora", "por que un pelicano",
             "pelicano", "que animal eres", "eres un pajaro", "presentate", "por que te llamas"],
    respuesta: ({ nombre }) => {
      const base = `Soy ${nombre}, ${genero(nombre, "el asistente", "la asistente")} de D.I.R.T. Comunitario. Te ayudo a donar, ` +
                   "a retirar alimentos y a saber qué hay disponible, por escrito o hablando.";
      return nombre === "Bob"
        ? base + " Soy un pelícano porque es el ave de Santa Marta y porque carga la comida " +
                 "en la bolsa del pico, igual que esta despensa."
        : base;
    },
  },
  {
    id: "que_sabes",
    titulo: "en qué te puedo ayudar",
    pregunta: "¿En qué me puedes ayudar?",
    claves: ["que sabes hacer", "que puedes hacer", "en que me ayudas", "en que me puedes ayudar",
             "ayuda", "ayudame", "opciones", "menu", "que te puedo preguntar", "que preguntas respondes",
             "para que sirves", "que sabes", "no se que preguntar", "instrucciones", "como te uso"],
    respuesta:
      "Te puedo explicar cómo donar o retirar alimentos, decirte qué hay disponible " +
      "ahora mismo, por qué la despensa tiene dos lados, qué hacer si la compuerta o el " +
      "Bluetooth fallan, y contarte cómo se creó el proyecto y cómo funciona por dentro.",
  },
  {
    id: "como_entiende",
    titulo: "cómo entiendo lo que dices",
    pregunta: "¿Cómo entiendes lo que te digo?",
    claves: ["como me entiendes", "como entiendes", "eres inteligencia artificial", "usas ia",
             "inteligencia artificial", "usas chatgpt", "chatgpt", "como funciona el bot",
             "como funciona el asistente", "como funcionas", "reconocimiento de voz",
             "como me escuchas", "eres una ia", "tienes ia", "ollama", "modelo de lenguaje",
             "palabras clave", "como respondes"],
    respuesta:
      "Comparo tu pregunta con una lista de temas y de frases que los disparan. Antes de " +
      "comparar quito tildes, signos y muletillas, y tolero errores de escritura, letras " +
      "repetidas y palabras dichas dos veces. Si no estoy {seguro}, te pregunto a qué te " +
      "refieres en vez de inventar. La voz la transcribe y la pronuncia el propio navegador. " +
      "Opcionalmente puedo apoyarme en un modelo de lenguaje que corre en el mismo computador " +
      "con Ollama.",
  },
  {
    id: "materiales",
    titulo: "qué materiales se usaron",
    pregunta: "¿Qué materiales usaron?",
    claves: ["materiales", "componentes", "que materiales usaron", "que componentes",
             "hardware", "que se necesita para armarlo", "lista de materiales", "que piezas",
             "servomotor", "servomotores", "servo", "sg90", "fuente de poder", "capacitor",
             "que arduino", "electronica", "circuito", "protoboard", "conexiones"],
    respuesta:
      "Por dentro lleva un Arduino UNO R4 WiFi, dos servos SG90, uno por compartimento, " +
      "una fuente externa de 5 voltios y 2 amperios para los servos y cuatro " +
      "capacitores de 100 microfaradios en paralelo que estabilizan la alimentación, " +
      "montados en protoboard. Por software: esta página web, Firestore para los datos " +
      "y Bluetooth de baja energía para hablar con el Arduino.",
  },
  {
    id: "datos_nube",
    titulo: "dónde se guardan los datos",
    pregunta: "¿Dónde se guardan los datos?",
    claves: ["donde se guardan los datos", "base de datos", "firebase", "firestore", "nube",
             "donde queda guardado", "donde se guarda la informacion", "se guarda en internet",
             "base de datos en la nube", "donde se almacena", "almacenamiento", "historial",
             "exportar", "excel", "csv", "como guardan", "como guardan la informacion"],
    respuesta:
      "Cada registro se guarda en Firestore, la base de datos en la nube de Firebase, y " +
      "aparece al instante en todos los teléfonos que tengan la página abierta. Del " +
      "documento solo se guardan los últimos cuatro dígitos. El historial se puede " +
      "exportar a un archivo que abre en Excel. Si Firebase no está configurado, la app " +
      "guarda en el propio navegador para que la demostración no se caiga.",
  },
  {
    id: "mejoras",
    titulo: "qué se puede mejorar",
    pregunta: "¿Qué mejoras tendría a futuro?",
    claves: ["mejoras", "que mejorarian", "a futuro", "que sigue", "proximos pasos",
             "limitaciones", "desventajas", "que le falta", "que se puede mejorar",
             "trabajo futuro", "que le agregarian", "escalar", "puntos debiles", "fallas",
             "riesgos", "se puede hackear", "es seguro el sistema"],
    respuesta:
      "Lo siguiente sería añadir inicio de sesión para quien administra: hoy cualquiera " +
      "con el enlace puede registrar y ver el historial, lo cual sirve para una " +
      "demostración, pero con datos reales de personas haría falta controlar el acceso. " +
      "Otra mejora sería poder accionar la compuerta desde iPhone, que hoy no permite " +
      "Bluetooth desde el navegador.",
  },
  {
    id: "sin_luz",
    titulo: "qué pasa sin luz o sin internet",
    pregunta: "¿Qué pasa si se va la luz?",
    claves: ["se va la luz", "sin luz", "sin energia", "apagon", "sin internet",
             "sin señal", "sin datos", "no hay wifi", "si no hay internet", "si se va el internet",
             "corte de luz", "funciona sin internet", "offline"],
    respuesta:
      "Sin internet la compuerta sigue funcionando, porque el Bluetooth no lo necesita. " +
      "Lo que no se puede es guardar en la nube hasta que vuelva la conexión. Si se va " +
      "la luz, el Arduino se apaga y la compuerta queda cerrada.",
  },
  {
    id: "comida_estado",
    titulo: "el estado de los alimentos",
    pregunta: "¿Cómo sé si la comida está en buen estado?",
    claves: ["esta buena", "en buen estado", "vencida", "caducada", "fecha de vencimiento",
             "se daña", "esta fresca", "cuanto dura la comida", "mal estado", "vencimiento",
             "esta dañada", "es segura la comida", "higiene", "se puede comer"],
    respuesta:
      "Antes de donar, revisa la fecha de vencimiento y que el empaque esté cerrado. " +
      "No se recibe comida preparada ni abierta, porque no hay forma de saber cómo se " +
      "guardó. Si algo se ve en mal estado, mejor avisarle a quien esté encargado.",
  },
  {
    id: "que_no_donar",
    titulo: "qué no se puede donar",
    pregunta: "¿Qué no se puede donar?",
    claves: ["que no puedo donar", "que no se puede donar", "que no reciben", "no aceptan", "prohibido",
             "puedo donar comida hecha", "puedo donar comida preparada", "comida preparada", "sobras", "comida abierta",
             "puedo donar almuerzo", "que no se recibe", "que no se puede traer", "restricciones"],
    respuesta:
      "No se reciben sobras ni comida preparada, ni paquetes abiertos, ni nada vencido. " +
      "Sí se reciben alimentos sellados y dentro de su fecha: lácteos, frutas, fritos y " +
      "bebidas.",
  },
  {
    id: "quien_mantiene",
    titulo: "quién mantiene la despensa",
    pregunta: "¿Quién mantiene la despensa?",
    claves: ["quien la cuida", "quien mantiene", "quien la maneja", "de quien es la despensa",
             "quien responde", "quien administra", "encargado", "quien la llena",
             "quien la surte", "quien repone"],
    respuesta:
      "La despensa la sostiene la comunidad: funciona con lo que la gente deja. El " +
      "registro de cada movimiento permite saber qué se está acabando y reponerlo a " +
      "tiempo.",
  },
  {
    id: "dos_servos",
    titulo: "cómo sabe qué lado abrir",
    pregunta: "¿Cómo sabe qué lado abrir?",
    claves: ["dos servos", "como sabe que lado", "quien elige el lado", "por que ese lado",
             "como decide", "abre sola", "como sabe donde va", "por que se abrio ese lado",
             "como elige", "se abre automaticamente"],
    respuesta:
      "No lo eliges tú. Al marcar la categoría del alimento, la aplicación envía al " +
      "Arduino la orden del lado que corresponde: lácteos, frutas y bebidas al frío; " +
      "fritos al caliente. Así nadie guarda algo donde no va.",
  },
  {
    id: "seguridad_cierre",
    titulo: "qué pasa si no se cierra",
    pregunta: "¿Y si la compuerta se queda abierta?",
    claves: ["se queda abierta", "y si no cierra", "se olvida abierta", "no se cierra",
             "quedo abierta", "que pasa si no cierra", "cierre de seguridad", "cierre automatico"],
    respuesta:
      "Hay tres cierres encadenados. La página cierra a los cinco segundos. Si eso " +
      "falla, el Arduino cierra cualquier lado que lleve más de quince segundos " +
      "abierto. Y si se pierde la conexión, cierra todo de inmediato.",
  },
  {
    id: "borrar_registro",
    titulo: "cómo corregir un registro",
    pregunta: "Me equivoqué en un registro",
    claves: ["me equivoque", "borrar", "eliminar registro", "corregir", "esta mal",
             "puse mal", "deshacer", "borrar registro", "anular", "error en el registro"],
    respuesta:
      "En la pestaña Historial cada registro tiene un botón para eliminarlo. El dato no " +
      "se pierde del todo: queda marcado como eliminado, para que el conteo no se " +
      "descuadre.",
  },
  {
    id: "tiempo",
    titulo: "cuánto tiempo queda abierta",
    pregunta: "¿Cuánto tiempo queda abierta la compuerta?",
    claves: ["cuanto tiempo", "cuantos segundos", "se cierra", "cierra sola",
             "cuanto dura abierta", "se cierra rapido", "cuanto tiempo abierta", "cuanto tarda en cerrar"],
    respuesta:
      "La compuerta se queda abierta cinco segundos y se cierra sola. Si necesitas " +
      "cerrarla antes, hay un botón para hacerlo. Y si algo se traba, el Arduino la " +
      "cierra solo a los quince segundos.",
  },
  {
    id: "que_es",
    titulo: "qué es D.I.R.T.",
    pregunta: "¿Qué es D.I.R.T.?",
    claves: ["que es dirt", "que es esto", "de que se trata", "para que sirve",
             "que es la despensa", "explicame", "de que va", "en que consiste",
             "que es el proyecto", "de que trata el proyecto", "que hace", "resumen del proyecto",
             "cuentame del proyecto", "que es una despensa comunitaria", "dirt"],
    respuesta:
      "Esto es D.I.R.T. Comunitario, una despensa de alimentos compartida. " +
      "Cualquiera puede dejar alimentos que le sobran y cualquiera puede tomar los " +
      "que necesita. La aplicación lleva el registro y abre la compuerta sola según " +
      "el tipo de alimento.",
  },
  {
    id: "costo",
    titulo: "si tiene costo",
    pregunta: "¿Cuánto cuesta usarla?",
    claves: ["cuanto cuesta", "cuanto vale", "es gratis", "hay que pagar", "precio",
             "tiene costo", "se paga", "cobran"],
    respuesta:
      "No cuesta nada. Ni donar ni retirar. La despensa se sostiene con lo que la " +
      "gente deja.",
  },
  {
    id: "limite",
    titulo: "si hay límite para llevar",
    pregunta: "¿Cuánto puedo llevar?",
    claves: ["cuanto puedo llevar", "cuanto puedo sacar", "limite", "maximo",
             "puedo llevar todo", "cuantas unidades puedo", "cuanto me puedo llevar", "hay un limite"],
    respuesta:
      "No hay un límite fijo. La idea es que tomes lo que necesitas y dejes para los " +
      "que vienen después.",
  },
  {
    id: "saludo",
    titulo: "saludar",
    pregunta: "Hola",
    claves: ["hola como estas", "y que mas", "que mas", "q tal", "como estas", "que tal bro",
             "buenas tardes como estas", "buenos dias como estas", "hola", "buenas", "buenos dias",
             "buenas tardes", "buenas noches", "que tal", "saludos", "hey", "como vas", "como te va",
             "que hubo", "quiubo", "epa", "hello", "hi", "bob", "dora", "como esta usted",
             "como esta bob"],
    respuesta:
      "Hola, bienvenido. Soy {nombre}, {el asistente} de D.I.R.T., la despensa comunitaria. " +
      "¿En qué te puedo ayudar hoy? Puedo explicarte cómo donar, cómo " +
      "retirar alimentos, o decirte qué hay disponible ahora mismo.",
  },
  {
    id: "gracias",
    titulo: "agradecer",
    pregunta: "Gracias",
    claves: ["gracias", "gracias dirt", "gracias bob", "gracias dora", "muchas gracias", "te pasaste", "genial",
             "perfecto", "listo", "listo muchas gracias", "excelente", "chevere", "bacano",
             "muy amable", "te lo agradezco", "mil gracias", "buenisimo", "thank you", "ok", "vale",
             "entendido", "ya entendi"],
    respuesta: "Con mucho gusto, gracias por usar D.I.R.T. Si te queda alguna otra duda, aquí estoy para ayudarte.",
  },
  {
    id: "despedida",
    titulo: "despedirse",
    pregunta: "Adiós",
    claves: ["adios", "chao", "chao bob", "adios bob", "hasta luego", "nos vemos", "bye", "hasta pronto", "me voy",
             "hasta mañana", "nos hablamos"],
    respuesta: "Hasta luego, ha sido un gusto ayudarte. Espero que disfrutes tu experiencia en D.I.R.T. ¡Que te vaya muy bien!",
  },
];

/* Temas que no se responden con texto fijo, sino con los datos de verdad. */
export const CLAVES_INVENTARIO = [
  "que hay", "hay comida", "hay algo", "disponible", "inventario", "stock",
  "cuanto hay", "que tienen", "queda", "hay frutas", "hay lacteos", "hay bebidas",
  "hay fritos", "esta vacia", "esta llena", "que queda", "que hay disponible",
  "que alimentos hay", "cuantos alimentos hay", "cuanta comida hay", "existencias",
  "que tienen ahorita", "que puedo llevar", "que hay para llevar", "hay algo de comer",
];

export const CLAVES_MOVIMIENTOS = [
  "cuantas personas", "cuanta gente", "hoy", "movimientos", "registros",
  "cuantos donaron", "estadisticas", "actividad", "cuantas donaciones", "cuantos retiros",
  "cuantos registros", "cuanto se ha donado", "como va el dia", "resumen de hoy",
];

/* Palabras que identifican cada categoría, para "¿hay leche?" o "¿quedan jugos?". */
const SINONIMOS_CATEGORIA = {
  lacteos: ["lacteos", "leche", "yogur", "yogurt", "queso", "kumis", "avena"],
  frutas:  ["frutas", "manzana", "banano", "guineo", "mango", "pera", "naranja", "guayaba", "uva"],
  fritos:  ["fritos", "papas", "papitas", "paquetes", "empanada", "chicharron", "platanitos", "mecato"],
  bebidas: ["bebidas", "jugo", "jugos", "agua", "gaseosa", "refresco", "limonada"],
};

export const SIN_RESPUESTA =
  "Todavía no tengo respuesta para eso. Puedo ayudarte con cómo donar, cómo retirar " +
  "alimentos, qué hay disponible, por qué la despensa tiene dos lados o cómo se creó " +
  "el proyecto.";

export const SUGERENCIAS = [
  "¿Cómo dono alimentos?",
  "¿Cómo retiro algo?",
  "¿Qué hay disponible?",
  "¿Por qué hay dos puertas?",
  "¿Cómo se creó el proyecto?",
  "El Arduino no se conecta",
];

/* =========================================================================
   2. CAPA 1 — NORMALIZAR
   ========================================================================= */

/* Abreviaturas de chat y escrituras comunes, palabra por palabra. */
const ABREVIATURAS = {
  q: "que", k: "que", ke: "que", qe: "que", qu: "que",
  xq: "porque", pq: "porque", porq: "porque", xk: "porque", pk: "porque", xke: "porque",
  x: "por", tb: "tambien", tmb: "tambien", tbn: "tambien", d: "de", pa: "para",
  cmo: "como", cm: "como", kmo: "como", dnd: "donde", dond: "donde", toy: "estoy",
  ta: "esta", tas: "estas", bn: "bien", msj: "mensaje", info: "informacion",
  xfa: "porfavor", plis: "porfavor", pls: "porfavor", porfa: "porfavor",
  ud: "usted", uds: "ustedes", vos: "tu", sq: "es que", nose: "no se",
  ola: "hola", olas: "hola", grax: "gracias", grx: "gracias", graxias: "gracias",
  arduno: "arduino", ardiuno: "arduino", aurduino: "arduino",
  servomotor: "servo", bluetooh: "bluetooth", bluetuh: "bluetooth", blutut: "bluetooth",
  bluetut: "bluetooth", blututh: "bluetooth",
};

/* Muletillas que no aportan nada, en cualquier parte de la frase. */
const MULETILLAS = new Set([
  "eh", "ehh", "em", "emm", "mm", "mmm", "ah", "ahh", "uh", "um", "umm", "pues",
  "porfavor", "osea", "ajam", "bueno",
]);

/* Formas de llamar al asistente: se quitan solo al inicio ("oye Bob, ¿…?"),
   para no romper preguntas como "¿quién es Bob?". También lo que el
   reconocimiento de voz suele escuchar en lugar de "Bob". */
const VOCATIVOS = new Set([
  "oye", "oiga", "ey", "hey", "mira", "disculpa", "perdon", "ok", "okay", "dale",
  "bob", "bop", "bobb", "bobs", "bobi", "bobby", "vob", "vop", "boob", "pop", "bo", "bou",
  "dora", "dori",
]);

/** Quita tildes, signos y mayúsculas para comparar sin tropiezos. */
export function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // la sigla escrita de cualquier forma: "D.I.R.T.", "d i r t", "D1RT"
    .replace(/\bd\s*[.\s]\s*i\s*[.\s]\s*r\s*[.\s]\s*t\b\.?/g, "dirt")
    .replace(/\bd1rt\b/g, "dirt")
    .replace(/[¿?¡!.,;:()"'´`*_\-/\\[\]{}<>@#$%^&+=|~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normaliza y además limpia lo que escribe o dice una persona real. */
export function limpiar(texto) {
  let palabras = normalizar(texto)
    // letras estiradas: "holaaaa" -> "hola", "siiii" -> "si"
    .replace(/([a-z])\1{2,}/g, "$1")
    .split(" ")
    .filter(Boolean)
    .flatMap((p) => (ABREVIATURAS[p] ?? p).split(" "))
    .filter((p) => !MULETILLAS.has(p));

  // "o sea" en dos palabras
  palabras = palabras.filter((p, i) => !(p === "o" && palabras[i + 1] === "sea") &&
                                       !(p === "sea" && palabras[i - 1] === "o"));

  // el nombre o un "oye" al principio, siempre que quede algo después
  let i = 0;
  while (i < palabras.length - 1 && i < 3 && VOCATIVOS.has(palabras[i])) i++;
  palabras = palabras.slice(i);

  // palabras repetidas seguidas: "como como se creo" -> "como se creo"
  palabras = palabras.filter((p, j) => p !== palabras[j - 1]);

  return palabras.join(" ");
}

/* =========================================================================
   3. CAPA 2 — COMPARAR CON TOLERANCIA
   ========================================================================= */

/* Palabras de relleno gramatical: no se exigen dentro de una clave.
   "como se creo el proyecto" encaja con "como se creo este proyecto". */
const FUNCIONALES = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a", "en",
  "y", "e", "o", "u", "se", "me", "te", "lo", "le", "les", "mi", "mis", "tu", "tus",
  "su", "sus", "es", "son", "con", "este", "esta", "esto", "estos", "estas", "ese", "esa", "eso",
  "fue", "ser", "muy", "ya", "si",
]);

/* Palabras demasiado comunes para que por sí solas sugieran un tema. */
const GENERICAS = new Set([
  ...FUNCIONALES, "que", "como", "cual", "cuales", "cuando", "donde", "quien", "quienes",
  "cuanto", "cuanta", "cuantos", "cuantas", "porque", "por", "para", "hay", "puedo",
  "puede", "pueden", "tiene", "tienen", "tengo", "hacer", "hace", "no", "yo", "ustedes",
  "usted", "algo", "todo", "nada", "bien", "mal", "quiero", "necesito", "saber",
]);

const SUFIJOS = [
  "aciones", "iciones", "acion", "icion", "amente", "mente", "ciones", "cion",
  "aremos", "ieron", "iendo", "ando", "aron", "ados", "idos", "adas", "idas",
  "ado", "ido", "ada", "ida", "aste", "iste", "amos", "emos", "imos",
  "ar", "er", "ir", "as", "es", "os", "an", "en", "a", "e", "o", "s",
];

/** Raíz aproximada: "dono", "donar", "donaron", "donacion" -> "don". */
function raiz(p) {
  if (p.length < 4) return p;
  for (const s of SUFIJOS) {
    if (p.endsWith(s) && p.length - s.length >= 3) return p.slice(0, -s.length);
  }
  return p;
}

/** Cómo suena en español: "aser" = "hacer", "vevida" = "bebida", "kreo" = "creo". */
function sonido(p) {
  return p
    .replace(/ch/g, "1")
    .replace(/qu/g, "k")
    .replace(/ll/g, "y")
    .replace(/c(?=[ei])/g, "s")
    .replace(/z/g, "s")
    .replace(/c/g, "k")
    .replace(/v/g, "b")
    .replace(/w/g, "u")
    .replace(/h/g, "")
    .replace(/1/g, "ch")
    .replace(/y$/, "i")
    .replace(/(.)\1+/g, "$1");
}

/** Distancia de edición con transposición (Damerau, versión simple). */
function distancia(a, b, tope) {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  const m = a.length, n = b.length;
  let prev2 = null, prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let mejorFila = i;
    for (let j = 1; j <= n; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + coste);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur.push(v);
      if (v < mejorFila) mejorFila = v;
    }
    if (mejorFila > tope) return tope + 1;
    prev2 = prev; prev = cur;
  }
  return prev[n];
}

/** Prepara una palabra con sus tres formas de comparación. */
function ficha(p) {
  const r = raiz(p);
  return { p, r, s: sonido(p), sr: sonido(r) };
}

/** Qué tan parecida es una palabra de la clave a una palabra de la frase (0 a 1). */
function parecido(k, u) {
  if (k.p === u.p) return 1;
  if (k.s === u.s) return 0.9;
  // Las palabras gramaticales ("esto", "esta", "estas") solo valen si son iguales.
  if (FUNCIONALES.has(k.p) || FUNCIONALES.has(u.p)) return 0;
  // singular y plural: "servo" = "servos", "lado" = "lados", "mejor" = "mejores"
  if (k.p + "s" === u.p || u.p + "s" === k.p || k.p + "es" === u.p || u.p + "es" === k.p) return 0.95;
  // Una palabra común ("como", "puedo") solo se aproxima a otra palabra
  // común: si no, "como" encajaría con "comida" por la raíz.
  if (GENERICAS.has(k.p) !== GENERICAS.has(u.p)) return 0;
  if (k.r === u.r && k.r.length >= 3) return 0.85;
  if (k.sr === u.sr && k.sr.length >= 3) return 0.8;
  // errores de letra: solo en palabras de 5 o más, y con la misma inicial
  const largo = Math.min(k.s.length, u.s.length);
  if (largo < 5 || k.s[0] !== u.s[0]) return 0;
  const tope = largo >= 8 ? 2 : 1;
  return distancia(k.s, u.s, tope) <= tope ? 0.75 : 0;
}

/* Las claves se preparan una sola vez. */
const cacheClaves = new Map();
function prepararClave(clave) {
  let c = cacheClaves.get(clave);
  if (!c) {
    const texto = limpiarClave(clave);
    const todas = texto.split(" ").filter(Boolean);
    // Se quitan las palabras gramaticales, salvo que solo queden palabras
    // comunes: "que es esto" no puede reducirse a un "que" suelto.
    const utiles = todas.filter((p) => !FUNCIONALES.has(p));
    const sirven = utiles.some((p) => !GENERICAS.has(p));
    const palabras = (sirven ? utiles : todas).map(ficha);
    c = { texto, palabras, varias: palabras.length >= 2 };
    cacheClaves.set(clave, c);
  }
  return c;
}

/* Una clave pasa por la misma limpieza, menos quitar el nombre del
   asistente: "quien es bob" debe seguir diciendo "bob". */
function limpiarClave(clave) {
  return normalizar(clave)
    .split(" ")
    .flatMap((p) => (ABREVIATURAS[p] ?? p).split(" "))
    .join(" ");
}

/**
 * Puntúa una clave contra la frase.
 *   puntos  2 si es una palabra sola; de 3 a 3,5 si son varias y están todas
 *           (más palabras, más específica), y medio punto más si aparecen
 *           seguidas tal cual. Todo multiplicado por qué tan seguro es el
 *           parecido más débil.
 *   pista   cuántas palabras con contenido de la clave sí aparecen, aunque
 *           no estén todas: sirve para el "¿Te refieres a…?".
 */
function puntuarClave(frase, clave) {
  const c = prepararClave(clave);
  let minimo = 1, pista = 0;
  for (const k of c.palabras) {
    let mejor = 0;
    for (const u of frase.fichas) {
      const v = parecido(k, u);
      if (v > mejor) { mejor = v; if (v === 1) break; }
    }
    if (mejor >= 0.75 && !GENERICAS.has(k.p)) pista += mejor;
    if (mejor < minimo) minimo = mejor;
  }
  if (minimo < 0.75) return { puntos: 0, pista };
  const base = c.varias ? 2.5 + 0.25 * Math.min(c.palabras.length, 4) : 2;
  const seguidas = c.varias && ` ${frase.texto} `.includes(` ${c.texto} `) ? 0.5 : 0;
  return { puntos: (base + seguidas) * minimo, pista: 0 };
}

/**
 * Puntúa un tema: cuenta sobre todo su mejor clave, y algo las demás que
 * también encajan. Así un tema con muchos sinónimos no gana solo por eso.
 */
function puntuar(frase, claves) {
  let mejor = 0, resto = 0, pista = 0;
  for (const clave of claves) {
    const r = puntuarClave(frase, clave);
    if (r.puntos > mejor) { resto += mejor; mejor = r.puntos; }
    else resto += r.puntos;
    pista = Math.max(pista, r.pista);
  }
  return { puntos: mejor + 0.15 * resto, pista };
}

function prepararFrase(texto) {
  const limpio = limpiar(texto);
  return { texto: limpio, fichas: limpio.split(" ").filter(Boolean).map(ficha) };
}

/* =========================================================================
   4. RESPUESTAS CON DATOS REALES
   ========================================================================= */

function responderInventario(datos) {
  const conStock = datos.categorias.filter((c) => c.stock > 0);
  if (!conStock.length) {
    return "Ahora mismo la despensa está vacía. Si puedes traer algo, se agradece.";
  }
  const lista = listar(conStock.map((c) => `${c.stock} de ${c.nombre.toLowerCase()}`));
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

/** Busca si la frase nombra una categoría ("leche", "jugos", "frutas"…). */
function categoriaNombrada(frase, datos) {
  for (const c of datos.categorias) {
    const palabras = SINONIMOS_CATEGORIA[c.id] || [normalizar(c.nombre)];
    for (const w of palabras) {
      const k = ficha(w);
      if (frase.fichas.some((u) => parecido(k, u) >= 0.75)) return c.id;
    }
  }
  return null;
}

/** "¿Hay…?", "¿quedan…?", "¿cuántas…?" sin que sea por tiempo o por precio. */
function pideExistencia(frase) {
  const t = frase.texto;
  if (/\b(hay|queda|quedan|tienen|tienes|disponibles?|existen?|stock)\b/.test(t)) return true;
  return /\bcuant[oa]s?\b/.test(t) && !/\b(tiempo|dura|cuesta|vale|tarda|demora|segundos|puedo)\b/.test(t);
}

export function textoDe(tema, nombre = "Bob") {
  const r = typeof tema.respuesta === "function" ? tema.respuesta({ nombre }) : tema.respuesta;
  return r
    .replaceAll("{nombre}", nombre)
    .replaceAll("{el asistente}", genero(nombre, "el asistente", "la asistente"))
    .replaceAll("{seguro}", genero(nombre, "seguro", "segura"));
}

/* =========================================================================
   5. EL CEREBRO PROPIO, CON LA CAPA 4 (RESCATE)
   -------------------------------------------------------------------------
   entender() devuelve qué hacer con la pregunta:
     { texto, seguro: true }                       respuesta directa
     { texto, seguro: false, opciones, pendiente } "¿Te refieres a…?"
   ========================================================================= */

const UMBRAL = 2;        // puntos mínimos para responder sin preguntar
const UMBRAL_PISTA = 0.9; // con menos que esto ni se ofrece una opción

const AFIRMA = new Set(["si", "sip", "sii", "claro", "exacto", "eso", "correcto", "dale",
  "ok", "okay", "aja", "afirmativo", "obvio", "por supuesto", "de una", "ese", "esa",
  "si eso", "si claro", "si por favor", "si porfavor", "eso mismo", "asi es", "exactamente"]);
const NIEGA = new Set(["no", "nop", "nel", "negativo", "no gracias", "tampoco", "ninguno", "ninguna"]);

export function entender(pregunta, datos, contexto = {}) {
  const nombre = contexto.nombre || "Bob";
  const frase = prepararFrase(pregunta);
  if (!frase.texto) return { texto: SIN_RESPUESTA, seguro: false, opciones: [] };

  // ¿Responde "sí" o "no" a un "¿Te refieres a…?" anterior?
  if (contexto.pendiente) {
    if (AFIRMA.has(frase.texto)) return { texto: textoDe(contexto.pendiente, nombre), seguro: true, tema: contexto.pendiente.id };
    if (NIEGA.has(frase.texto)) {
      return { texto: "Listo. Pregúntamelo con otras palabras, o elige uno de estos temas.",
               seguro: false, opciones: TEMAS.filter((t) => ["donar", "retirar", "creacion", "como_funciona"].includes(t.id)) };
    }
  }

  // ¿Pregunta por una categoría concreta? ("¿hay leche?", "¿quedan frutas?")
  const cat = categoriaNombrada(frase, datos);
  if (cat && pideExistencia(frase)) {
    return { texto: responderCategoria(datos, cat), seguro: true, tema: "inventario" };
  }

  const inv = puntuar(frase, CLAVES_INVENTARIO);
  const mov = puntuar(frase, CLAVES_MOVIMIENTOS);

  const ranking = TEMAS
    .map((tema) => ({ tema, ...puntuar(frase, tema.claves) }))
    .sort((a, b) => b.puntos - a.puntos || b.pista - a.pista);
  const mejor = ranking[0];

  // En un empate gana el tema concreto: "por qué hay dos puertas" contiene
  // "que hay", pero no está pidiendo el inventario.
  if (inv.puntos > mejor.puntos && inv.puntos >= UMBRAL) {
    return { texto: responderInventario(datos), seguro: true, tema: "inventario" };
  }
  if (mov.puntos > mejor.puntos && mov.puntos >= UMBRAL) {
    return { texto: responderMovimientos(datos), seguro: true, tema: "movimientos" };
  }
  if (mejor.puntos >= UMBRAL) {
    return { texto: textoDe(mejor.tema, nombre), seguro: true, tema: mejor.tema.id };
  }

  // CAPA 4: no está seguro. Ofrece los temas que más se acercaron.
  const candidatos = ranking
    .map((r) => ({ ...r, cerca: r.puntos + r.pista }))
    .filter((r) => r.cerca >= UMBRAL_PISTA)
    .sort((a, b) => b.cerca - a.cerca)
    .slice(0, 2)
    .map((r) => r.tema);

  if (candidatos.length === 1 ||
      (candidatos.length === 2 && ranking.find((r) => r.tema === candidatos[0]).puntos >= 1.4)) {
    return {
      texto: `No estoy del todo ${genero(nombre, "seguro", "segura")}. ¿Te refieres a ${candidatos[0].titulo}?`,
      seguro: false, opciones: candidatos, pendiente: candidatos[0],
    };
  }
  if (candidatos.length === 2) {
    return {
      texto: `No estoy del todo ${genero(nombre, "seguro", "segura")}. ¿Quieres saber ${candidatos[0].titulo} o ${candidatos[1].titulo}?`,
      seguro: false, opciones: candidatos,
    };
  }
  return { texto: SIN_RESPUESTA, seguro: false, opciones: [] };
}

/** Para ajustar claves: los temas que más puntúan con una frase y por qué clave. */
export function explicar(pregunta, cuantos = 3) {
  const frase = prepararFrase(pregunta);
  return TEMAS.map((tema) => {
    const r = puntuar(frase, tema.claves);
    const clave = tema.claves
      .map((c) => ({ c, p: puntuarClave(frase, c).puntos }))
      .sort((a, b) => b.p - a.p)[0];
    return { tema: tema.id, puntos: +r.puntos.toFixed(2), pista: +r.pista.toFixed(2),
             clave: clave.p ? clave.c : "" };
  }).sort((a, b) => b.puntos - a.puntos || b.pista - a.pista).slice(0, cuantos)
    .concat([{ limpio: frase.texto }]);
}

/** Versión corta: solo el texto. */
export function pensar(pregunta, datos, contexto) {
  return entender(pregunta, datos, contexto).texto;
}

/* Guarda en este navegador las preguntas que no entendió, para ampliar el
   catálogo después. Para verlas, en la consola del navegador:
       JSON.parse(localStorage.getItem("bot:sin-respuesta"))            */
function anotarDuda(pregunta) {
  console.info("Pregunta sin respuesta segura:", pregunta);
  try {
    const lista = JSON.parse(localStorage.getItem("bot:sin-respuesta") || "[]");
    lista.push({ pregunta, cuando: new Date().toISOString() });
    localStorage.setItem("bot:sin-respuesta", JSON.stringify(lista.slice(-200)));
  } catch { /* almacenamiento bloqueado: no pasa nada */ }
}

/* =========================================================================
   6. OLLAMA — opcional, para tu propio computador
   -------------------------------------------------------------------------
   Para encenderlo:

     1. Instala Ollama desde ollama.com y descarga un modelo:
            ollama pull llama3.2
     2. Deja que Ollama acepte peticiones desde la página. En Windows,
        PowerShell como administrador:
            setx OLLAMA_ORIGINS "https://ney-nh.github.io,http://localhost"
        Cierra Ollama desde la bandeja del sistema y vuelve a abrirlo.
     3. Cambia `activo` a true aquí abajo.

   Solo se le pregunta cuando el conocimiento propio no está seguro. Lleva
   como contexto todas las respuestas de este archivo y la orden de no salir
   de ellas. Si no responde en 8 segundos, se sigue con el "¿Te refieres a…?".
   ========================================================================= */

const OLLAMA = {
  activo: false,
  url: "http://localhost:11434/api/chat",
  modelo: "llama3.2",
  esperaMs: 8000,
};

function instrucciones(datos, nombre) {
  const inventario = datos.categorias
    .map((c) => `${c.nombre}: ${c.stock} unidades (lado ${c.lado})`)
    .join("; ");
  const conocimiento = TEMAS
    .filter((t) => !["saludo", "gracias", "despedida"].includes(t.id))
    .map((t) => `- ${t.titulo}: ${textoDe(t, nombre)}`)
    .join("\n");
  return (
    `Eres ${nombre}, ${genero(nombre, "el asistente", "la asistente")} de una despensa comunitaria de alimentos llamada ` +
    "D.I.R.T. Comunitario, en Santa Marta, Colombia. Respondes en español, en dos " +
    "o tres frases como máximo, con calidez y sin tecnicismos.\n\n" +
    "Responde SOLO con la información de abajo. Si la pregunta no está cubierta, di " +
    "con amabilidad que no tienes ese dato y que el equipo del proyecto puede " +
    "contarlo. Nunca inventes nombres, fechas, cifras ni datos.\n\n" +
    `Lo que sabes:\n${conocimiento}\n\n` +
    `Inventario ahora mismo: ${inventario}. Hoy ha habido ${datos.hoy.entradas} ` +
    `donaciones y ${datos.hoy.salidas} retiros.`
  );
}

async function preguntarAOllama(pregunta, datos, historial, nombre) {
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
        options: { temperature: 0.2 },
        messages: [
          { role: "system", content: instrucciones(datos, nombre) },
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
   7. VOZ
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
   8. LA INTERFAZ
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

  // El nombre sale de la propia página, así cada tema puede llamarlo
  // como quiera sin tocar este archivo.
  const NOMBRE = $(".bot-nombre strong")?.textContent.trim() || "Bob";

  let hablando = true;           // responder también en voz alta
  let escuchando = false;
  let pensando = false;
  let pendiente = null;          // tema ofrecido en "¿Te refieres a…?"
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

  /* Botones de "¿Te refieres a…?" dentro de la conversación. */
  function opciones(temas) {
    if (!temas?.length) return;
    const caja = document.createElement("div");
    caja.className = "bot-sugerencias bot-opciones";
    for (const t of temas) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bot-sug";
      b.textContent = t.pregunta;
      b.onclick = () => { caja.remove(); responder(t.pregunta); };
      caja.appendChild(b);
    }
    hilo.appendChild(caja);
    hilo.scrollTop = hilo.scrollHeight;
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
    hilo.querySelectorAll(".bot-opciones").forEach((o) => o.remove());
    burbuja(texto, "yo");

    const esperando = burbuja("…", "dora");
    esperando.classList.add("burbuja-esperando");

    const datos = estadoDespensa();
    let r = entender(texto, datos, { nombre: NOMBRE, pendiente });

    if (!r.seguro && OLLAMA.activo) {
      try {
        r = { texto: await preguntarAOllama(texto, datos, historial, NOMBRE), seguro: true };
      } catch (e) {
        console.warn("Ollama no respondió, sigo con el conocimiento propio:", e.message);
      }
    } else {
      // Una pausa mínima para que no parezca que la respuesta estaba escrita.
      await new Promise((ok) => setTimeout(ok, 260));
    }

    if (!r.seguro) anotarDuda(texto);
    pendiente = r.pendiente || null;

    esperando.remove();
    burbuja(r.texto, "dora");
    opciones(r.opciones);
    historial.push({ role: "user", content: texto },
                   { role: "assistant", content: r.texto });

    if (hablando) hablar(r.texto);
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
      altavoz.setAttribute("aria-label", hablando ? `Silenciar a ${NOMBRE}` : `Que ${NOMBRE} hable`);
      altavoz.title = hablando ? "Silenciar" : "Activar voz";
    };
    altavoz.onclick = () => { hablando = !hablando; if (!hablando) callar(); pintarAltavoz(); };
    pintarAltavoz();
  }

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !panel.hidden) cerrarPanel();
  });
}
