# Preguntas que responde el asistente

Este documento se genera solo a partir de `assets/bot.js`.
No lo edites a mano: cambia los temas en ese archivo y vuelve a correr
`node herramientas/generar-preguntas.mjs`.

Última generación: 2026-10-16 · 34 temas · 580 frases clave

Las respuestas se muestran como las dice Bob; en la versión verde las dice
Dora, con el nombre y el género ajustados.

> **Datos del proyecto sin llenar** en `PROYECTO`, al inicio de `assets/bot.js`:
> nombres del equipo (equipo), institución (institucion), curso (curso), significado de las siglas (siglas).
> Mientras estén vacíos, el asistente responde sin ellos y no inventa nada.

## Cómo entiende una pregunta

1. **Normaliza**: quita tildes, signos y mayúsculas; recorta letras estiradas
   (`holaaa`), cambia abreviaturas (`q`, `xq`, `pa`), quita muletillas (`eh`, `mmm`),
   el nombre al inicio (`oye Bob`) y palabras repetidas (`como como`).
2. **Tolera errores**: compara cada palabra por su raíz (`dono` = `donar`), por cómo
   suena (`aser` = `hacer`) y con uno o dos errores de letra (`proyeto`).
3. **Catálogo**: cada tema tiene muchas formas de preguntarlo (abajo).
4. **Rescate**: si no está seguro, pregunta «¿Te refieres a…?» con botones y
   entiende un «sí» como respuesta.

Las preguntas que no entendió quedan anotadas en el navegador donde se hicieron.
Para verlas, en la consola: `JSON.parse(localStorage.getItem("bot:sin-respuesta"))`.

---

## ¿Cómo dono alimentos?

Para donar: toca el botón verde Registrar entrada, escribe tu nombre y tu número de documento, elige qué alimento traes y cuántas unidades. Al guardar, la compuerta se abre sola del lado que corresponde y tienes cinco segundos para dejar los alimentos dentro.

<details><summary>Cómo se reconoce (25 frases)</summary>

`donar` · `dejar comida` · `dejar alimentos` · `aportar` · `entregar comida` · `traer comida` · `regalar` · `dar comida` · `quiero ayudar` · `como dono` · `contribuir` · `quiero donar` · `como puedo donar` · `donde dejo` · `como dejo` · `tengo comida que me sobra` · `me sobra comida` · `hacer una donacion` · `registrar entrada` · `como ayudo` · `puedo dejar` · `puedo traer` · `traje comida` · `vengo a dejar` · `boton verde`

</details>

## ¿Cómo retiro algo?

Para retirar: toca el botón naranja Registrar salida, escribe tu nombre y tu documento, y elige qué vas a llevar. La compuerta se abre y tienes cinco segundos. No tienes que pedir permiso a nadie: la despensa está para eso.

<details><summary>Cómo se reconoce (22 frases)</summary>

`retirar` · `sacar comida` · `tomar comida` · `llevar comida` · `necesito comida` · `coger` · `como saco` · `puedo llevar` · `recibir comida` · `me puedo servir` · `como retiro` · `quiero sacar` · `quiero llevar` · `tengo hambre` · `necesito alimentos` · `como obtengo` · `como consigo comida` · `registrar salida` · `boton naranja` · `vengo a recoger` · `recoger comida` · `pedir comida`

</details>

## ¿Por qué hay dos puertas?

La despensa tiene dos compartimentos. El lado frío guarda lo que necesita conservarse fresco: lácteos, frutas y bebidas. El lado caliente guarda lo seco y lo frito. Tú no eliges: al marcar el alimento, la aplicación abre el lado correcto por su cuenta.

<details><summary>Cómo se reconoce (20 frases)</summary>

`lado` · `lado frio` · `lado caliente` · `dos puertas` · `dos compuertas` · `por que dos` · `cual puerta` · `que puerta` · `compartimento` · `compartimentos` · `nevera` · `dos lados` · `por que tiene dos` · `frio y caliente` · `donde va cada cosa` · `donde se guarda` · `en que lado` · `dos compartimentos` · `parte fria` · `parte caliente`

</details>

## ¿Qué alimentos se pueden donar?

Se manejan cuatro categorías: lácteos, frutas, fritos y bebidas. Lácteos, frutas y bebidas van al lado frío; los fritos van al lado caliente.

<details><summary>Cómo se reconoce (13 frases)</summary>

`que puedo donar` · `que alimentos` · `categorias` · `que reciben` · `que se puede donar` · `tipos de comida` · `que aceptan` · `que comida reciben` · `que tipo de alimentos` · `que productos` · `que clase de comida` · `cuales categorias` · `que se puede traer`

</details>

## ¿Por qué piden mi documento?

Se pide el nombre y el documento para llevar la cuenta de lo que entra y sale, y así saber qué hace falta reponer. Del documento solo se guardan los últimos cuatro dígitos: el número completo nunca sale de tu teléfono. No hay que crear cuenta ni contraseña.

<details><summary>Cómo se reconoce (14 frases)</summary>

`documento` · `cedula` · `por que piden` · `privacidad` · `para que mi nombre` · `identificacion` · `me registran` · `tarjeta de identidad` · `mis datos` · `es seguro dar mi documento` · `que hacen con mis datos` · `datos personales` · `por que me piden datos` · `guardan mi cedula`

</details>

## La compuerta no abre

Si la compuerta no abre, mira arriba si dice Conectada. Si dice Sin conexión, toca Conectar la compuerta y elige DIRT. Si ya está conectada y aun así no abre, revisa que los servos tengan corriente: con dos servos hace falta una fuente externa, no alcanza con el USB. Tu registro quedó guardado de todas formas.

<details><summary>Cómo se reconoce (15 frases)</summary>

`no abre` · `no se abre` · `la compuerta no` · `no abrio` · `no se abrio` · `atascada` · `trabada` · `sigue cerrada` · `no quiere abrir` · `no se mueve` · `el servo no se mueve` · `no funciona la compuerta` · `la puerta no abre` · `no hace nada` · `no responde la compuerta`

</details>

## El Arduino no se conecta

Lo más común es que el Arduino esté emparejado en los ajustes del teléfono. Entra a Ajustes, Bluetooth, busca DIRT y desvincúlalo. Esta página no necesita emparejar nada: lo encuentra sola. Después apaga y enciende el Bluetooth, reinicia el Arduino y vuelve a intentar.

<details><summary>Cómo se reconoce (18 frases)</summary>

`no se conecta` · `no conecta` · `no encuentra` · `no aparece` · `error de conexion` · `connection failed` · `no lo detecta` · `no sale en la lista` · `fallo la conexion` · `no se enlaza` · `arduino no conecta` · `no me conecta` · `bluetooth no funciona` · `no encuentra el arduino` · `como conecto` · `como me conecto` · `conectar bluetooth` · `no aparece dirt`

</details>

## ¿En qué navegador funciona?

La compuerta solo se puede accionar desde Chrome o Edge, en Android o en computador. En iPhone y en Safari no existe la función de Bluetooth del navegador. Desde cualquier teléfono sí se puede registrar y consultar el inventario, que es la mayor parte.

<details><summary>Cómo se reconoce (15 frases)</summary>

`que navegador` · `safari` · `iphone` · `firefox` · `edge` · `chrome` · `no me sale el boton` · `no veo el boton de conectar` · `desde mi iphone` · `funciona en iphone` · `ios` · `funciona en celular` · `desde el celular` · `en que telefono funciona` · `android`

</details>

## No me deja conectar, pide permiso

En Android 12 o más nuevo hace falta el permiso de Dispositivos cercanos. Si lo negaste sin querer, entra a Ajustes, Aplicaciones, busca el navegador y concédeselo. Luego recarga la página.

<details><summary>Cómo se reconoce (8 frases)</summary>

`permiso` · `no me deja` · `bloqueo` · `me pide permiso` · `dispositivos cercanos` · `no tengo permiso` · `denegado` · `permiso de bluetooth`

</details>

## ¿Cómo funciona por dentro?

La página habla por Bluetooth con un Arduino UNO R4 WiFi que mueve dos servos, uno por cada compartimento. Los registros se guardan en Firestore, así que se ven al instante en cualquier teléfono. La página está hecha en HTML, CSS y JavaScript y es estática: no hay servidor que mantener.

<details><summary>Cómo se reconoce (22 frases)</summary>

`como funciona por dentro` · `que tecnologia` · `como esta hecho` · `arduino` · `que usa` · `programacion` · `como esta programado` · `que lleva por dentro` · `tecnicamente` · `como funciona` · `como funciona el sistema` · `arquitectura` · `que lenguaje` · `en que esta programado` · `como se comunica` · `que tecnologias usaron` · `funcionamiento` · `explicacion tecnica` · `bluetooth` · `que hace el arduino` · `para que el arduino` · `como se mueve la compuerta`

</details>

## ¿Cómo se creó el proyecto?

Empezó como una aplicación móvil con inicio de sesión, un servidor propio y una compuerta de un solo servo. Para que cualquiera pudiera usarla desde el teléfono sin instalar nada, se rehízo como página web: los datos pasaron a Firestore, la compuerta pasó a tener dos lados, frío y caliente, cada uno con su servo controlado por un Arduino por Bluetooth, y al final se sumó Bob para resolver dudas por voz o por escrito.

<details><summary>Cómo se reconoce (36 frases)</summary>

`como se creo el proyecto` · `como se creo` · `como lo crearon` · `como lo hicieron` · `como nacio` · `como surgio` · `como empezo` · `como inicio` · `de donde salio la idea` · `de donde surgio la idea` · `como se les ocurrio` · `historia del proyecto` · `como se desarrollo` · `como lo desarrollaron` · `proceso de creacion` · `como fue creado` · `como se hizo el proyecto` · `como hicieron el proyecto` · `como armaron` · `como lo construyeron` · `origen del proyecto` · `creacion del proyecto` · `desarrollo del proyecto` · `como nacio la idea` · `como llegaron a esto` · `por que lo crearon` · `por que lo hicieron` · `etapas del proyecto` · `versiones anteriores` · `como evoluciono` · `cuentame la historia` · `la historia` · `por que decidieron` · `como empezaron` · `que los motivo` · `como se les vino la idea`

</details>

## ¿Quiénes hicieron el proyecto?

D.I.R.T. lo creó el equipo que te lo está presentando. Con gusto te cuentan quién hizo cada parte.

<details><summary>Cómo se reconoce (23 frases)</summary>

`quienes lo hicieron` · `quien lo hizo` · `quien la hizo` · `quien lo creo` · `quienes lo crearon` · `quien creo el proyecto` · `integrantes` · `autores` · `quienes son ustedes` · `quienes participaron` · `creadores` · `desarrolladores` · `quien lo desarrollo` · `quienes trabajaron` · `el equipo` · `de quien es el proyecto` · `quien lo programo` · `nombres del equipo` · `quienes estan detras` · `detras del proyecto` · `como se llaman los creadores` · `nombres de los creadores` · `quienes lo presentan`

</details>

## ¿Cuál es el objetivo del proyecto?

Que los alimentos que a unos les sobran lleguen a quienes los necesitan, sin trámites ni costo. La aplicación lleva la cuenta de lo que entra y sale para saber qué hace falta reponer, y la compuerta guarda cada alimento en el compartimento correcto, frío o caliente, para que se conserve mejor.

<details><summary>Cómo se reconoce (21 frases)</summary>

`objetivo` · `proposito` · `para que lo hicieron` · `que problema resuelve` · `que problema soluciona` · `a quien ayuda` · `a quienes beneficia` · `impacto` · `cual es la finalidad` · `por que es importante` · `beneficio` · `beneficios` · `a quien va dirigido` · `para quien es` · `que aporta` · `justificacion` · `cual es la meta` · `importancia` · `motivacion` · `que motivo el proyecto` · `por que es necesario`

</details>

## ¿Qué significa D.I.R.T.?

D.I.R.T. Comunitario es el nombre de esta despensa compartida. El significado de cada letra te lo cuenta mejor el equipo que la creó.

<details><summary>Cómo se reconoce (11 frases)</summary>

`que significa dirt` · `significado de dirt` · `por que se llama dirt` · `que quiere decir dirt` · `siglas` · `que significan las siglas` · `de donde viene el nombre` · `por que ese nombre` · `que significa el nombre` · `dirt que significa` · `nombre del proyecto`

</details>

## ¿Quién eres?

Soy Bob, el asistente de D.I.R.T. Comunitario. Te ayudo a donar, a retirar alimentos y a saber qué hay disponible, por escrito o hablando. Soy un pelícano porque es el ave de Santa Marta y porque carga la comida en la bolsa del pico, igual que esta despensa.

<details><summary>Cómo se reconoce (14 frases)</summary>

`quien eres` · `como te llamas` · `cual es tu nombre` · `que eres` · `eres un robot` · `eres una persona` · `quien es bob` · `quien es dora` · `por que un pelicano` · `pelicano` · `que animal eres` · `eres un pajaro` · `presentate` · `por que te llamas`

</details>

## ¿En qué me puedes ayudar?

Te puedo explicar cómo donar o retirar alimentos, decirte qué hay disponible ahora mismo, por qué la despensa tiene dos lados, qué hacer si la compuerta o el Bluetooth fallan, y contarte cómo se creó el proyecto y cómo funciona por dentro.

<details><summary>Cómo se reconoce (15 frases)</summary>

`que sabes hacer` · `que puedes hacer` · `en que me ayudas` · `en que me puedes ayudar` · `ayuda` · `ayudame` · `opciones` · `menu` · `que te puedo preguntar` · `que preguntas respondes` · `para que sirves` · `que sabes` · `no se que preguntar` · `instrucciones` · `como te uso`

</details>

## ¿Cómo entiendes lo que te digo?

Comparo tu pregunta con una lista de temas y de frases que los disparan. Antes de comparar quito tildes, signos y muletillas, y tolero errores de escritura, letras repetidas y palabras dichas dos veces. Si no estoy seguro, te pregunto a qué te refieres en vez de inventar. La voz la transcribe y la pronuncia el propio navegador. Opcionalmente puedo apoyarme en un modelo de lenguaje que corre en el mismo computador con Ollama.

<details><summary>Cómo se reconoce (18 frases)</summary>

`como me entiendes` · `como entiendes` · `eres inteligencia artificial` · `usas ia` · `inteligencia artificial` · `usas chatgpt` · `chatgpt` · `como funciona el bot` · `como funciona el asistente` · `como funcionas` · `reconocimiento de voz` · `como me escuchas` · `eres una ia` · `tienes ia` · `ollama` · `modelo de lenguaje` · `palabras clave` · `como respondes`

</details>

## ¿Qué materiales usaron?

Por dentro lleva un Arduino UNO R4 WiFi, dos servos SG90, uno por compartimento, una fuente externa de 5 voltios y 2 amperios para los servos y cuatro capacitores de 100 microfaradios en paralelo que estabilizan la alimentación, montados en protoboard. Por software: esta página web, Firestore para los datos y Bluetooth de baja energía para hablar con el Arduino.

<details><summary>Cómo se reconoce (19 frases)</summary>

`materiales` · `componentes` · `que materiales usaron` · `que componentes` · `hardware` · `que se necesita para armarlo` · `lista de materiales` · `que piezas` · `servomotor` · `servomotores` · `servo` · `sg90` · `fuente de poder` · `capacitor` · `que arduino` · `electronica` · `circuito` · `protoboard` · `conexiones`

</details>

## ¿Dónde se guardan los datos?

Cada registro se guarda en Firestore, la base de datos en la nube de Firebase, y aparece al instante en todos los teléfonos que tengan la página abierta. Del documento solo se guardan los últimos cuatro dígitos. El historial se puede exportar a un archivo que abre en Excel. Si Firebase no está configurado, la app guarda en el propio navegador para que la demostración no se caiga.

<details><summary>Cómo se reconoce (17 frases)</summary>

`donde se guardan los datos` · `base de datos` · `firebase` · `firestore` · `nube` · `donde queda guardado` · `donde se guarda la informacion` · `se guarda en internet` · `base de datos en la nube` · `donde se almacena` · `almacenamiento` · `historial` · `exportar` · `excel` · `csv` · `como guardan` · `como guardan la informacion`

</details>

## ¿Qué mejoras tendría a futuro?

Lo siguiente sería añadir inicio de sesión para quien administra: hoy cualquiera con el enlace puede registrar y ver el historial, lo cual sirve para una demostración, pero con datos reales de personas haría falta controlar el acceso. Otra mejora sería poder accionar la compuerta desde iPhone, que hoy no permite Bluetooth desde el navegador.

<details><summary>Cómo se reconoce (17 frases)</summary>

`mejoras` · `que mejorarian` · `a futuro` · `que sigue` · `proximos pasos` · `limitaciones` · `desventajas` · `que le falta` · `que se puede mejorar` · `trabajo futuro` · `que le agregarian` · `escalar` · `puntos debiles` · `fallas` · `riesgos` · `se puede hackear` · `es seguro el sistema`

</details>

## ¿Qué pasa si se va la luz?

Sin internet la compuerta sigue funcionando, porque el Bluetooth no lo necesita. Lo que no se puede es guardar en la nube hasta que vuelva la conexión. Si se va la luz, el Arduino se apaga y la compuerta queda cerrada.

<details><summary>Cómo se reconoce (13 frases)</summary>

`se va la luz` · `sin luz` · `sin energia` · `apagon` · `sin internet` · `sin señal` · `sin datos` · `no hay wifi` · `si no hay internet` · `si se va el internet` · `corte de luz` · `funciona sin internet` · `offline`

</details>

## ¿Cómo sé si la comida está en buen estado?

Antes de donar, revisa la fecha de vencimiento y que el empaque esté cerrado. No se recibe comida preparada ni abierta, porque no hay forma de saber cómo se guardó. Si algo se ve en mal estado, mejor avisarle a quien esté encargado.

<details><summary>Cómo se reconoce (14 frases)</summary>

`esta buena` · `en buen estado` · `vencida` · `caducada` · `fecha de vencimiento` · `se daña` · `esta fresca` · `cuanto dura la comida` · `mal estado` · `vencimiento` · `esta dañada` · `es segura la comida` · `higiene` · `se puede comer`

</details>

## ¿Qué no se puede donar?

No se reciben sobras ni comida preparada, ni paquetes abiertos, ni nada vencido. Sí se reciben alimentos sellados y dentro de su fecha: lácteos, frutas, fritos y bebidas.

<details><summary>Cómo se reconoce (14 frases)</summary>

`que no puedo donar` · `que no se puede donar` · `que no reciben` · `no aceptan` · `prohibido` · `puedo donar comida hecha` · `puedo donar comida preparada` · `comida preparada` · `sobras` · `comida abierta` · `puedo donar almuerzo` · `que no se recibe` · `que no se puede traer` · `restricciones`

</details>

## ¿Quién mantiene la despensa?

La despensa la sostiene la comunidad: funciona con lo que la gente deja. El registro de cada movimiento permite saber qué se está acabando y reponerlo a tiempo.

<details><summary>Cómo se reconoce (10 frases)</summary>

`quien la cuida` · `quien mantiene` · `quien la maneja` · `de quien es la despensa` · `quien responde` · `quien administra` · `encargado` · `quien la llena` · `quien la surte` · `quien repone`

</details>

## ¿Cómo sabe qué lado abrir?

No lo eliges tú. Al marcar la categoría del alimento, la aplicación envía al Arduino la orden del lado que corresponde: lácteos, frutas y bebidas al frío; fritos al caliente. Así nadie guarda algo donde no va.

<details><summary>Cómo se reconoce (10 frases)</summary>

`dos servos` · `como sabe que lado` · `quien elige el lado` · `por que ese lado` · `como decide` · `abre sola` · `como sabe donde va` · `por que se abrio ese lado` · `como elige` · `se abre automaticamente`

</details>

## ¿Y si la compuerta se queda abierta?

Hay tres cierres encadenados. La página cierra a los cinco segundos. Si eso falla, el Arduino cierra cualquier lado que lleve más de quince segundos abierto. Y si se pierde la conexión, cierra todo de inmediato.

<details><summary>Cómo se reconoce (8 frases)</summary>

`se queda abierta` · `y si no cierra` · `se olvida abierta` · `no se cierra` · `quedo abierta` · `que pasa si no cierra` · `cierre de seguridad` · `cierre automatico`

</details>

## Me equivoqué en un registro

En la pestaña Historial cada registro tiene un botón para eliminarlo. El dato no se pierde del todo: queda marcado como eliminado, para que el conteo no se descuadre.

<details><summary>Cómo se reconoce (10 frases)</summary>

`me equivoque` · `borrar` · `eliminar registro` · `corregir` · `esta mal` · `puse mal` · `deshacer` · `borrar registro` · `anular` · `error en el registro`

</details>

## ¿Cuánto tiempo queda abierta la compuerta?

La compuerta se queda abierta cinco segundos y se cierra sola. Si necesitas cerrarla antes, hay un botón para hacerlo. Y si algo se traba, el Arduino la cierra solo a los quince segundos.

<details><summary>Cómo se reconoce (8 frases)</summary>

`cuanto tiempo` · `cuantos segundos` · `se cierra` · `cierra sola` · `cuanto dura abierta` · `se cierra rapido` · `cuanto tiempo abierta` · `cuanto tarda en cerrar`

</details>

## ¿Qué es D.I.R.T.?

Esto es D.I.R.T. Comunitario, una despensa de alimentos compartida. Cualquiera puede dejar alimentos que le sobran y cualquiera puede tomar los que necesita. La aplicación lleva el registro y abre la compuerta sola según el tipo de alimento.

<details><summary>Cómo se reconoce (15 frases)</summary>

`que es dirt` · `que es esto` · `de que se trata` · `para que sirve` · `que es la despensa` · `explicame` · `de que va` · `en que consiste` · `que es el proyecto` · `de que trata el proyecto` · `que hace` · `resumen del proyecto` · `cuentame del proyecto` · `que es una despensa comunitaria` · `dirt`

</details>

## ¿Cuánto cuesta usarla?

No cuesta nada. Ni donar ni retirar. La despensa se sostiene con lo que la gente deja.

<details><summary>Cómo se reconoce (8 frases)</summary>

`cuanto cuesta` · `cuanto vale` · `es gratis` · `hay que pagar` · `precio` · `tiene costo` · `se paga` · `cobran`

</details>

## ¿Cuánto puedo llevar?

No hay un límite fijo. La idea es que tomes lo que necesitas y dejes para los que vienen después.

<details><summary>Cómo se reconoce (8 frases)</summary>

`cuanto puedo llevar` · `cuanto puedo sacar` · `limite` · `maximo` · `puedo llevar todo` · `cuantas unidades puedo` · `cuanto me puedo llevar` · `hay un limite`

</details>

## Hola

Hola, bienvenido. Soy Bob, el asistente de D.I.R.T., la despensa comunitaria. ¿En qué te puedo ayudar hoy? Puedo explicarte cómo donar, cómo retirar alimentos, o decirte qué hay disponible ahora mismo.

<details><summary>Cómo se reconoce (27 frases)</summary>

`hola como estas` · `y que mas` · `que mas` · `q tal` · `como estas` · `que tal bro` · `buenas tardes como estas` · `buenos dias como estas` · `hola` · `buenas` · `buenos dias` · `buenas tardes` · `buenas noches` · `que tal` · `saludos` · `hey` · `como vas` · `como te va` · `que hubo` · `quiubo` · `epa` · `hello` · `hi` · `bob` · `dora` · `como esta usted` · `como esta bob`

</details>

## Gracias

Con mucho gusto, gracias por usar D.I.R.T. Si te queda alguna otra duda, aquí estoy para ayudarte.

<details><summary>Cómo se reconoce (22 frases)</summary>

`gracias` · `gracias dirt` · `gracias bob` · `gracias dora` · `muchas gracias` · `te pasaste` · `genial` · `perfecto` · `listo` · `listo muchas gracias` · `excelente` · `chevere` · `bacano` · `muy amable` · `te lo agradezco` · `mil gracias` · `buenisimo` · `thank you` · `ok` · `vale` · `entendido` · `ya entendi`

</details>

## Adiós

Hasta luego, ha sido un gusto ayudarte. Espero que disfrutes tu experiencia en D.I.R.T. ¡Que te vaya muy bien!

<details><summary>Cómo se reconoce (11 frases)</summary>

`adios` · `chao` · `chao bob` · `adios bob` · `hasta luego` · `nos vemos` · `bye` · `hasta pronto` · `me voy` · `hasta mañana` · `nos hablamos`

</details>

---

## Preguntas que se responden con los datos del momento

Estas no tienen respuesta escrita: el asistente lee el inventario real
y arma la frase con las cifras de ese instante.

**Qué hay en la despensa.** Responde con el stock de cada categoría y el
total. Si se nombra una categoría concreta (o algo como «leche» o «jugos»),
responde solo por ella y dice en qué lado está. Se reconoce con:

`que hay` · `hay comida` · `hay algo` · `disponible` · `inventario` · `stock` · `cuanto hay` · `que tienen` · `queda` · `hay frutas` · `hay lacteos` · `hay bebidas` · `hay fritos` · `esta vacia` · `esta llena` · `que queda` · `que hay disponible` · `que alimentos hay` · `cuantos alimentos hay` · `cuanta comida hay` · `existencias` · `que tienen ahorita` · `que puedo llevar` · `que hay para llevar` · `hay algo de comer`

**Movimientos de hoy.** Responde cuántas donaciones y cuántos retiros van
en el día. Se reconoce con:

`cuantas personas` · `cuanta gente` · `hoy` · `movimientos` · `registros` · `cuantos donaron` · `estadisticas` · `actividad` · `cuantas donaciones` · `cuantos retiros` · `cuantos registros` · `cuanto se ha donado` · `como va el dia` · `resumen de hoy`

---

## Cuando no entiende

Si algún tema se acerca, ofrece hasta dos con botones: «No estoy del todo
seguro. ¿Te refieres a…?». Si nada se acerca, responde esto en lugar de
inventarse algo:

> Todavía no tengo respuesta para eso. Puedo ayudarte con cómo donar, cómo retirar alimentos, qué hay disponible, por qué la despensa tiene dos lados o cómo se creó el proyecto.

---

## Atajos que ofrece al abrir el chat

- ¿Cómo dono alimentos?
- ¿Cómo retiro algo?
- ¿Qué hay disponible?
- ¿Por qué hay dos puertas?
- ¿Cómo se creó el proyecto?
- El Arduino no se conecta
