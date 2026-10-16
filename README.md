# D.I.R.T. Comunitario

Control de donaciones de alimentos con registro de entradas y salidas, y una
compuerta física de **doble lado** que se abre sola según el tipo de alimento.

La página es estática: no hay servidor que mantener. El navegador habla
directamente con Firestore para los datos y con el Arduino por Bluetooth para
la compuerta.

---

## 1. Las dos versiones

| | Dirección | Para qué |
|---|---|---|
| **Principal** | https://ney-nh.github.io/p-gina-web/ | Azul y amarillo, con Bob el pelícano |
| Respaldo | https://ney-nh.github.io/p-gina-web/verde/ | La versión verde anterior |

Comparten `assets/app.js`, `assets/bot.js` y `assets/firebase-config.js`, así
que **escriben en la misma base de datos** y un arreglo de lógica llega a las
dos. Lo único propio de cada una es su hoja de estilos y su `index.html`.

## 2. Cómo funciona

```
   Navegador (Chrome)
        │
        ├── Firestore  ──────► historial, inventario y resumen
        │
        └── Bluetooth LE ────► Arduino UNO R4 WiFi
                                    ├── servo D9  → lado FRÍO
                                    └── servo D10 → lado CALIENTE
```

Al registrar un movimiento, la categoría del alimento decide qué lado de la
compuerta se abre:

| Categoría | Lado |
|---|---|
| 🥛 Lácteos | ❄️ Frío |
| 🍎 Frutas | ❄️ Frío |
| 🧃 Bebidas | ❄️ Frío |
| 🍟 Fritos | 🔥 Caliente |

Para cambiar este destino basta con editar el campo `lado` de la categoría en
`assets/app.js`; no hay que tocar nada más.

El orden de las operaciones importa: **primero se guarda el registro y solo
después se mueve el servo.** Si el servo falla, el dato ya quedó guardado.

---

## 3. Puesta en marcha

### 3.1 Firebase

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto.
2. **Compilación → Firestore Database → Crear base de datos.** Elige la región
   `southamerica-east1`.
3. **Configuración del proyecto → Tus apps → `</>` (Web)** y registra la app.
4. Copia el bloque `firebaseConfig` que aparece y pégalo en
   `assets/firebase-config.js`.
5. Ve a la pestaña **Reglas** de Firestore y pega el contenido de
   `firestore.rules` de este repositorio. Publícalas.

Hasta que pegues la configuración, la app arranca en **modo local**: los
registros se guardan solo en ese navegador y la compuerta funciona igual. Sirve
para probar sin tener Firebase listo.

### 3.2 Arduino

1. Abre `arduino/dirt_dos_compuertas/dirt_dos_compuertas.ino` en el IDE.
2. Instala la librería **ArduinoBLE** desde Herramientas → Administrar Bibliotecas.
3. Selecciona la placa **Arduino UNO R4 WiFi** y súbelo.
4. Abre el Monitor Serie a **115200**. Debe anunciarse como `DIRT`.

Conexiones:

| Elemento | Pin |
|---|---|
| Servo frío, señal | D9 |
| Servo caliente, señal | D10 |
| Ambos servos, +5 V | fuente externa de 5 V · 2 A (dos SG90) |
| Ambos servos, GND | riel negativo, unido al GND del Arduino |

La masa común entre la fuente y el Arduino es obligatoria. Con dos servos el
consumo se duplica: no los alimentes desde el pin de 5 V de la placa, y pon un
capacitor de 1000 µF entre los rieles, cerca de los servos.

El diagrama de la protoboard, hueco por hueco, está en
**[docs/conexion-servos.svg](docs/conexion-servos.svg)**. Es vectorial, así que
se puede ampliar o imprimir sin que se pixele.

### 3.3 Publicar la página

En GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`.**
A los dos minutos la página queda en `https://ney-nh.github.io/p-gina-web/`.

No hay nada que compilar: lo que está en el repositorio es lo que se sirve.

---

## 4. Dónde funciona el Bluetooth

El control usa **Web Bluetooth**, que solo existe en navegadores Chromium.

| Entorno | Registro | Compuerta |
|---|---|---|
| Chrome en Android | Sí | Sí |
| Chrome o Edge en computador | Sí | Sí |
| Safari, iPhone, iPad | Sí | No |
| Firefox | Sí | No |

La app detecta el entorno: donde no hay soporte, el panel de la compuerta se
sustituye por un aviso y todo lo demás sigue funcionando. **Para la
demostración, usa Chrome en Android.**

Web Bluetooth exige HTTPS, que GitHub Pages ya da. Si abres el archivo con
doble clic (`file://`) el Bluetooth no aparece; usa la URL de GitHub Pages o
levanta un servidor local con `python3 -m http.server`.

---

## 5. Protocolo Bluetooth

| Elemento | Valor |
|---|---|
| Nombre | `DIRT` |
| Servicio | `19b10000-e8f2-537e-4f6c-d104768a1214` |
| Comando (escritura) | `19b10001-e8f2-537e-4f6c-d104768a1214` |
| Estado (notificación) | `19b10002-e8f2-537e-4f6c-d104768a1214` |

Comandos:

| Comando | Efecto |
|---|---|
| `FRIO:90` | Lado frío a 90° |
| `CALIENTE:120` | Lado caliente a 120° |
| `FRIO:0` | Cierra el lado frío |
| `CERRAR` | Cierra ambos lados |
| `?` | Devuelve el ángulo de cada lado |

El sketch acepta además `A`, `C` y un número suelto, por compatibilidad con la
versión anterior de un solo servo.

**Tres cierres automáticos**, por si alguno falla:

1. La página cierra el lado a los 5 segundos.
2. El Arduino cierra cualquier lado que lleve más de 15 segundos abierto.
3. El Arduino cierra todo al perder la conexión Bluetooth.

---

## 6. El bot

El botón **Pregúntale a Bob** abre un chat que responde dudas sobre la
despensa y sobre el proyecto, por escrito o hablando. Entiende preguntas como
«cómo dono», «qué hay disponible», «por qué hay dos puertas», «cómo se creó el
proyecto» o «la compuerta no abre», y responde con los **datos reales**: si
alguien pregunta si hay frutas (o leche, o jugos), lee el inventario y contesta
cuántas hay y en qué lado.

### Cómo entiende

| Capa | Qué hace | Ejemplo |
|---|---|---|
| 1. Normaliza | Quita tildes, signos y mayúsculas, letras estiradas, abreviaturas, muletillas, el nombre al inicio y palabras repetidas | «Oye Bob, ¿cómo cómo se creóóó?» → «como se creo» |
| 2. Tolera errores | Compara por raíz, por sonido y con uno o dos errores de letra | «komo se kreo el proyeto» → creación |
| 3. Catálogo | 34 temas y unas 580 frases clave | ver [docs/PREGUNTAS.md](docs/PREGUNTAS.md) |
| 4. Rescate | Si no está seguro, pregunta «¿Te refieres a…?» con botones y entiende un «sí» | «la idea» → ¿Te refieres a cómo se creó el proyecto? |

Nunca inventa: si nada se acerca, lo dice y ofrece los temas que sí conoce.
Las preguntas que no entendió quedan anotadas en ese navegador; para verlas,
en la consola: `JSON.parse(localStorage.getItem("bot:sin-respuesta"))`.

La voz la pone el propio navegador, así que no cuesta nada. Para transcribir
lo que se dice, Chrome usa el servicio de reconocimiento de voz de Google. El
micrófono pide permiso la primera vez. El botón del altavoz silencia las
respuestas habladas.

### Datos del proyecto

Al inicio de `assets/bot.js` está el bloque `PROYECTO`: nombres del equipo,
institución, curso y el significado de las siglas. Lo que quede vacío no se
dice; el bot responde sin ese dato en vez de inventarlo.

### Añadir o cambiar un tema

Edita la lista `TEMAS` en `assets/bot.js`. Cada tema tiene un `titulo` (cómo
se ofrece en «¿Te refieres a…?»), una `pregunta` (la que se envía al tocar el
botón), sus `claves` y la `respuesta`. No hace falta escribir variantes sin
tilde, en plural ni con errores: ya se toleran. Sí conviene poner formas
distintas de decir lo mismo.

Después:

```
node herramientas/probar-bot.mjs         # que siga entendiendo todo
node herramientas/generar-preguntas.mjs  # rehace docs/PREGUNTAS.md
```

Si alguien hace una pregunta que no entiende, agrégala a
`herramientas/probar-bot.mjs` con el tema esperado y ajusta las claves hasta
que pase. Para ver por qué una frase cae en un tema:

```
node -e 'import("./assets/bot.js").then(m => console.log(m.explicar("tu frase")))'
```

### Conectarle un modelo de verdad (opcional)

El bot puede usar **Ollama** corriendo en tu propio computador, sin clave de
API ni costo. Solo se le consulta cuando el conocimiento propio **no está
seguro**, y lleva como contexto todas las respuestas del bot con la orden de no
salirse de ellas. Si Ollama no está o no responde en ocho segundos, se sigue
con el «¿Te refieres a…?» y nadie lo nota.

1. Instala Ollama desde [ollama.com](https://ollama.com) y descarga un modelo:
   `ollama pull llama3.2`
2. Permite que la página le hable. En PowerShell como administrador:
   `setx OLLAMA_ORIGINS "https://ney-nh.github.io,http://localhost"`
   Después cierra Ollama desde la bandeja del sistema y vuelve a abrirlo.
3. En `assets/bot.js`, cambia `activo: false` por `activo: true` dentro de
   `OLLAMA`.

Ten en cuenta que esto **solo funciona en el computador donde corre Ollama**.
Quien abra la página desde otro dispositivo sigue hablando con el bot propio,
que responde igual las preguntas del catálogo.

## 7. Estructura

```
index.html                          la aplicación: tema azul con Bob
assets/
├── app.css                         estilos del tema azul, claro y oscuro
├── app.js                          categorías, Firestore, Bluetooth, interfaz
├── bot.js                          el bot: datos del proyecto, catálogo, voz y Ollama
├── bob.js                          el pelícano en SVG y su animación
└── firebase-config.js              ← aquí va tu configuración
marca/                              tus imágenes propias, si las pones
verde/                              la versión verde anterior, de respaldo
arduino/
└── dirt_dos_compuertas/
    └── dirt_dos_compuertas.ino     sketch de los dos servos
firestore.rules                     reglas de seguridad de la base
docs/
├── PREGUNTAS.md                    todo lo que el bot sabe responder
└── HISTORIAL.md                    qué cambió respecto a versiones anteriores
herramientas/
├── revisar.mjs                     sintaxis, documento al día y pruebas del bot
├── probar-bot.mjs                  110 preguntas reales que el bot debe entender
├── generar-preguntas.mjs           rehace PREGUNTAS.md desde bot.js
└── reglas/                         prueba firestore.rules con el emulador
```

---

## 8. Seguridad: lo que hay que saber

### El número de documento nunca se guarda completo

La persona escribe su T.I. entera, pero **solo los últimos cuatro dígitos
salen del dispositivo**. En la base queda `5432` y la longitud del número
original, que sirve nada más para pintar la cantidad correcta de asteriscos:
en pantalla se lee `******5432`.

Esto importa porque enmascarar solo al mostrar no protege nada: el número
completo seguiría en la base, legible por cualquiera con el enlace desde la
consola del navegador. Aquí no llega nunca.

Las reglas de Firestore rechazan un documento de más de cuatro caracteres,
así que tampoco se puede escribir uno completo saltándose la página.

Buscar sigue funcionando con el número entero: la página lo recorta y compara
por el final.

### Lo demás

La app no tiene inicio de sesión, tal como se pidió. Eso significa que
**cualquiera con el enlace puede registrar movimientos y ver el historial.**

Las reglas de `firestore.rules` acotan el riesgo: solo se puede escribir en la
colección `movimientos`, cada documento debe tener la forma exacta esperada, y
no se puede borrar nada de verdad (el borrado solo marca el registro). Aun así,
los datos siguen siendo públicos para quien tenga la URL.

Para una sustentación académica es adecuado. Si el sistema llegara a operar con
datos reales de personas, los nombres y números de documento son datos
personales y haría falta algún control de acceso.

Cuando termine la demostración, puedes cerrar la base cambiando el bloque
`match /movimientos/{id}` de las reglas por `allow read, write: if false;`.

Sobre la `apiKey` que queda visible en el repositorio: en Firebase para web
**no es un secreto**. Identifica al proyecto, no autoriza nada por sí sola.
Lo que protege los datos son las reglas de Firestore.


## 9. Antes de subir cambios

```
node herramientas/revisar.mjs
```

Comprueba la sintaxis de todos los módulos, que `docs/PREGUNTAS.md` esté al
día y que el bot siga entendiendo las preguntas del banco de pruebas. Un error de sintaxis en un solo archivo deja la página entera sin
funcionar, y en el navegador solo se ve una línea en la consola que nadie
mira.
