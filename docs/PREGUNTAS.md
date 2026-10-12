# Preguntas que responde la asistente

Este documento se genera solo a partir de `assets/bot.js`.
No lo edites a mano: cambia los temas en ese archivo y vuelve a correr
`node herramientas/generar-preguntas.mjs`.

Última generación: 2026-10-12 · 24 temas

---

## Donar

Para donar: toca el botón verde Registrar entrada, escribe tu nombre y tu número de documento, elige qué alimento traes y cuántas unidades. Al guardar, la compuerta se abre sola del lado que corresponde y tienes cinco segundos para dejar los alimentos dentro.

<details><summary>Cómo se reconoce la pregunta</summary>

`donar` · `dejar` · `aportar` · `entregar` · `traer` · `regalar` · `dar comida` · `quiero ayudar` · `como dono` · `contribuir`

</details>

## Retirar

Para retirar: toca el botón naranja Registrar salida, escribe tu nombre y tu documento, y elige qué vas a llevar. La compuerta se abre y tienes cinco segundos. No tienes que pedir permiso a nadie: la despensa está para eso.

<details><summary>Cómo se reconoce la pregunta</summary>

`retirar` · `sacar` · `tomar` · `llevar` · `necesito comida` · `coger` · `como saco` · `puedo llevar` · `recibir` · `me puedo servir`

</details>

## Lado

La despensa tiene dos compartimentos. El lado frío guarda lo que necesita conservarse fresco: lácteos, frutas y bebidas. El lado caliente guarda lo seco y lo frito. Tú no eliges: al marcar el alimento, la aplicación abre el lado correcto por su cuenta.

<details><summary>Cómo se reconoce la pregunta</summary>

`lado` · `frio` · `caliente` · `dos puertas` · `dos compuertas` · `por que dos` · `cual puerta` · `que puerta` · `compartimento` · `nevera`

</details>

## Que puedo donar

Se manejan cuatro categorías: lácteos, frutas, fritos y bebidas. Lácteos, frutas y bebidas van al lado frío; los fritos van al lado caliente.

<details><summary>Cómo se reconoce la pregunta</summary>

`que puedo donar` · `que alimentos` · `categorias` · `que reciben` · `que se puede` · `tipos de comida` · `que aceptan`

</details>

## Documento

Se pide el nombre y el documento para llevar la cuenta de lo que entra y sale, y así saber qué hace falta reponer. No se usa para nada más, y no hay que crear cuenta ni contraseña.

<details><summary>Cómo se reconoce la pregunta</summary>

`documento` · `cedula` · `por que piden` · `datos` · `privacidad` · `nombre` · `para que mi nombre` · `identificacion` · `me registran`

</details>

## No abre

Si la compuerta no abre, mira arriba si dice Conectada. Si dice Sin conexión, toca Conectar la compuerta y elige DIRT. Si ya está conectada y aun así no abre, revisa que los servos tengan corriente: con dos servos hace falta una fuente externa, no alcanza con el USB. Tu registro quedó guardado de todas formas.

<details><summary>Cómo se reconoce la pregunta</summary>

`no abre` · `no se abre` · `la compuerta no` · `no abrio` · `no se abrio` · `atascada` · `trabada` · `sigue cerrada` · `no quiere abrir`

</details>

## No se conecta

Lo más común es que el Arduino esté emparejado en los ajustes del teléfono. Entra a Ajustes, Bluetooth, busca DIRT y desvincúlalo. Esta página no necesita emparejar nada: lo encuentra sola. Después apaga y enciende el Bluetooth, reinicia el Arduino y vuelve a intentar.

<details><summary>Cómo se reconoce la pregunta</summary>

`no se conecta` · `no conecta` · `no encuentra` · `no aparece` · `error de conexion` · `connection failed` · `no lo detecta` · `no sale en la lista` · `fallo la conexion` · `no se enlaza` · `arduino no conecta` · `no me conecta`

</details>

## Que navegador

La compuerta solo se puede accionar desde Chrome o Edge, en Android o en computador. En iPhone y en Safari no existe la función de Bluetooth del navegador. Desde cualquier teléfono sí se puede registrar y consultar el inventario, que es la mayor parte.

<details><summary>Cómo se reconoce la pregunta</summary>

`que navegador` · `safari` · `iphone` · `firefox` · `edge` · `chrome` · `no me sale el boton` · `no veo el boton de conectar` · `desde mi iphone` · `funciona en iphone` · `ios`

</details>

## Permiso

En Android 12 o más nuevo hace falta el permiso de Dispositivos cercanos. Si lo negaste sin querer, entra a Ajustes, Aplicaciones, busca el navegador y concédeselo. Luego recarga la página.

<details><summary>Cómo se reconoce la pregunta</summary>

`permiso` · `no me deja` · `bloqueo` · `me pide permiso` · `dispositivos cercanos` · `no tengo permiso` · `denegado`

</details>

## Como funciona por dentro

La página habla por Bluetooth con un Arduino UNO R4 WiFi que mueve dos servos, uno por cada compartimento. Los registros se guardan en Firestore, así que se ven al instante en cualquier teléfono. La página es estática: no hay servidor que mantener.

<details><summary>Cómo se reconoce la pregunta</summary>

`como funciona por dentro` · `que tecnologia` · `como esta hecho` · `arduino` · `como lo hicieron` · `que usa` · `servo` · `programacion` · `como esta programado` · `que lleva por dentro` · `tecnicamente`

</details>

## Se va la luz

Sin internet la compuerta sigue funcionando, porque el Bluetooth no lo necesita. Lo que no se puede es guardar en la nube hasta que vuelva la conexión. Si se va la luz, el Arduino se apaga y la compuerta queda cerrada.

<details><summary>Cómo se reconoce la pregunta</summary>

`se va la luz` · `sin luz` · `sin energia` · `apagon` · `sin internet` · `sin señal` · `sin datos` · `no hay wifi`

</details>

## Esta buena

Antes de donar, revisa la fecha de vencimiento y que el empaque esté cerrado. No se recibe comida preparada ni abierta, porque no hay forma de saber cómo se guardó. Si algo se ve en mal estado, mejor avisarle a quien esté encargado.

<details><summary>Cómo se reconoce la pregunta</summary>

`esta buena` · `en buen estado` · `vencida` · `caducada` · `fecha de vencimiento` · `se daña` · `esta fresca` · `cuanto dura` · `mal estado`

</details>

## Que no puedo donar

No se reciben sobras ni comida preparada, ni paquetes abiertos, ni nada vencido. Sí se reciben alimentos sellados y dentro de su fecha: lácteos, frutas, fritos y bebidas.

<details><summary>Cómo se reconoce la pregunta</summary>

`que no puedo donar` · `que no reciben` · `no aceptan` · `prohibido` · `puedo donar comida hecha` · `comida preparada` · `sobras`

</details>

## Quien la cuida

La despensa la sostiene la comunidad: funciona con lo que la gente deja. El registro de cada movimiento permite saber qué se está acabando y reponerlo a tiempo.

<details><summary>Cómo se reconoce la pregunta</summary>

`quien la cuida` · `quien mantiene` · `quien la maneja` · `de quien es` · `quien responde` · `quien la hizo` · `quien administra` · `encargado`

</details>

## Dos servos

No lo eliges tú. Al marcar la categoría del alimento, la aplicación envía al Arduino la orden del lado que corresponde: lácteos, frutas y bebidas al frío; fritos al caliente. Así nadie guarda algo donde no va.

<details><summary>Cómo se reconoce la pregunta</summary>

`dos servos` · `como sabe que lado` · `quien elige el lado` · `por que ese lado` · `como decide` · `abre sola`

</details>

## Se queda abierta

Hay tres cierres encadenados. La página cierra a los cinco segundos. Si eso falla, el Arduino cierra cualquier lado que lleve más de quince segundos abierto. Y si se pierde la conexión, cierra todo de inmediato.

<details><summary>Cómo se reconoce la pregunta</summary>

`se queda abierta` · `y si no cierra` · `que pasa si` · `se olvida abierta` · `no se cierra`

</details>

## Me equivoque

En la pestaña Historial cada registro tiene un botón para eliminarlo. El dato no se pierde del todo: queda marcado como eliminado, para que el conteo no se descuadre.

<details><summary>Cómo se reconoce la pregunta</summary>

`me equivoque` · `borrar` · `eliminar registro` · `corregir` · `esta mal` · `puse mal` · `deshacer`

</details>

## Cuanto tiempo

La compuerta se queda abierta cinco segundos y se cierra sola. Si necesitas cerrarla antes, hay un botón para hacerlo. Y si algo se traba, el Arduino la cierra solo a los quince segundos.

<details><summary>Cómo se reconoce la pregunta</summary>

`cuanto tiempo` · `cuantos segundos` · `se cierra` · `cierra sola` · `cuanto dura` · `se cierra rapido`

</details>

## Que es dirt

Esto es D.I.R.T. Comunitario, una despensa de alimentos compartida. Cualquiera puede dejar alimentos que le sobran y cualquiera puede tomar los que necesita. La aplicación lleva el registro y abre la compuerta sola según el tipo de alimento.

<details><summary>Cómo se reconoce la pregunta</summary>

`que es dirt` · `que es esto` · `de que se trata` · `para que sirve` · `que es la despensa` · `explicame` · `de que va`

</details>

## Cuanto cuesta

No cuesta nada. Ni donar ni retirar. La despensa se sostiene con lo que la gente deja.

<details><summary>Cómo se reconoce la pregunta</summary>

`cuanto cuesta` · `cuanto vale` · `es gratis` · `hay que pagar` · `precio`

</details>

## Cuanto puedo llevar

No hay un límite fijo. La idea es que tomes lo que necesitas y dejes para los que vienen después.

<details><summary>Cómo se reconoce la pregunta</summary>

`cuanto puedo llevar` · `cuanto puedo sacar` · `limite` · `maximo` · `puedo llevar todo` · `cuantas unidades`

</details>

## Hola

Hola. Soy la asistente de la despensa. Puedo explicarte cómo donar, cómo retirar alimentos, o decirte qué hay disponible ahora mismo.

<details><summary>Cómo se reconoce la pregunta</summary>

`hola` · `buenas` · `buenos dias` · `buenas tardes` · `buenas noches` · `que tal` · `saludos` · `hey`

</details>

## Gracias

Con mucho gusto. Si te queda otra duda, aquí estoy.

<details><summary>Cómo se reconoce la pregunta</summary>

`gracias` · `muchas gracias` · `te pasaste` · `genial` · `perfecto` · `listo`

</details>

## Adios

Hasta luego. Que te vaya bien.

<details><summary>Cómo se reconoce la pregunta</summary>

`adios` · `chao` · `hasta luego` · `nos vemos` · `bye`

</details>

---

## Preguntas que se responden con los datos del momento

Estas no tienen respuesta escrita: la asistente lee el inventario real
y arma la frase con las cifras de ese instante.

**Qué hay en la despensa.** Responde con el stock de cada categoría y el
total. Si se nombra una categoría concreta, responde solo por ella y dice
en qué lado está. Se reconoce con:

`que hay` · `hay comida` · `hay algo` · `disponible` · `inventario` · `stock` · `cuanto hay` · `que tienen` · `queda` · `hay frutas` · `hay lacteos` · `hay bebidas` · `hay fritos` · `esta vacia` · `esta llena`

**Movimientos de hoy.** Responde cuántas donaciones y cuántos retiros van
en el día. Se reconoce con:

`cuantas personas` · `cuanta gente` · `hoy` · `movimientos` · `registros` · `cuantos donaron` · `estadisticas` · `actividad`

---

## Cuando no entiende

Si ninguna palabra encaja lo suficiente, responde esto en lugar de
inventarse algo:

> No estoy segura de eso. Puedo ayudarte con cómo donar, cómo retirar alimentos, qué hay disponible, o por qué la despensa tiene dos lados.

---

## Atajos que ofrece al abrir el chat

- ¿Cómo dono alimentos?
- ¿Cómo retiro algo?
- ¿Qué hay disponible?
- ¿Por qué hay dos puertas?
- El Arduino no se conecta
- ¿Qué no se puede donar?
