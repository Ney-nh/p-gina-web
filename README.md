# D.I.R.T. Comunitario

Despensa comunitaria de alimentos con registro de entradas y salidas, dos
lados para conservar mejor la comida (frío y caliente), información
nutricional y **Bob**, el pelícano que resuelve dudas por escrito, por voz o en
una conversación en vivo.

La página es estática: no hay servidor que mantener. El navegador habla
directamente con Firestore para los datos y, para la prueba de conexión, con
el Arduino por Bluetooth.

---

## 1. Las dos páginas

| | Dirección | Para qué |
|---|---|---|
| **Real** | https://ney-nh.github.io/p-gina-web/ | La que se presenta |
| Prueba | https://ney-nh.github.io/p-gina-web/prueba/ | Para probar cambios antes de pasarlos a la real |

Las dos cargan **el mismo código** de `assets/`. La de prueba solo cambia la
colección de Firestore (`movimientos_prueba`), para no mezclar datos, y lleva
una cinta roja arriba. Ver [prueba/LEEME.md](prueba/LEEME.md).

## 2. Cómo funciona

```
   Navegador (cualquier teléfono, tableta o computador)
        │
        ├── Firestore  ──────► historial, inventario y resumen
        │
        └── Bluetooth LE ────► Arduino UNO R4 WiFi  (solo la prueba de conexión)
```

Cada categoría de alimento va en uno de los dos lados de la despensa. Al
registrar, la página dice en cuál:

| Categoría | Lado |
|---|---|
| 🥛 Lácteos | ❄️ Frío |
| 🍎 Frutas | ❄️ Frío |
| 🧃 Bebidas | ❄️ Frío |
| 🍟 Fritos | 🔥 Caliente |

Para cambiar el lado de una categoría basta con editar su campo `lado` en
`assets/app.js`.

Después de cada entrada o salida aparece un mensaje distinto: hay diez para
quien dona y diez para quien retira, y no se repite ninguno hasta que salen
todos. Se cambian en la lista `MENSAJES` de `assets/app.js`.

La despensa ya **no mueve compuertas ni servomotores**. Los registros siguen
guardando el campo `compuerta_abierta`, siempre en `false`, porque las reglas
de Firestore publicadas lo exigen.

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
registros se guardan solo en ese navegador. Sirve para probar sin tener
Firebase listo.

### 3.2 Arduino (prueba de conexión)

1. Abre `arduino/dirt_conexion/dirt_conexion.ino` en el IDE.
2. Instala la librería **ArduinoBLE** desde Herramientas → Administrar Bibliotecas.
3. Selecciona la placa **Arduino UNO R4 WiFi** y súbelo.
4. Abre el Monitor Serie a **115200**. Debe anunciarse como `DIRT`.

No hay que conectarle nada más que el cable USB. En la página, el botón
**Probar conexión con el Arduino** lo busca, le manda una prueba y muestra
la respuesta y cuánto tardó. El LED de la placa queda encendido mientras hay
una página conectada y parpadea tres veces con cada prueba.

Si la placa todavía tiene cargado el sketch anterior de las compuertas, la
prueba funciona igual: la página acepta cualquier respuesta.

### 3.3 Publicar la página

En GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`.**
A los dos minutos la página queda en `https://ney-nh.github.io/p-gina-web/`.

No hay nada que compilar: lo que está en el repositorio es lo que se sirve.

---

## 4. Dónde funciona cada cosa

| Entorno | Registro, inventario, nutrición, Bob | Prueba del Arduino | Hablarle a Bob |
|---|---|---|---|
| Chrome en Android | Sí | Sí | Sí |
| Chrome o Edge en computador | Sí | Sí | Sí |
| Safari, iPhone, iPad | Sí | No | Escribiendo |
| Firefox | Sí | No | Escribiendo |

La prueba del Arduino usa **Web Bluetooth**, que solo existe en navegadores
Chromium y exige HTTPS (GitHub Pages ya lo da). Donde no hay soporte, el botón
se cambia por un aviso y todo lo demás sigue funcionando.

---

## 5. Protocolo Bluetooth

| Elemento | Valor |
|---|---|
| Nombre | `DIRT` |
| Servicio | `19b10000-e8f2-537e-4f6c-d104768a1214` |
| Comando (escritura) | `19b10001-e8f2-537e-4f6c-d104768a1214` |
| Estado (notificación) | `19b10002-e8f2-537e-4f6c-d104768a1214` |

La página escribe `?` y el Arduino responde `OK D1RT` por la característica de
estado. Si no responde en tres segundos, la página lo avisa.

---

## 6. El bot

El botón **Pregúntale a Bob** abre un chat que responde dudas sobre la
despensa y sobre el proyecto, por escrito o hablando. Entiende preguntas como
«cómo dono», «qué hay disponible», «por qué hay dos lados», «cómo se creó el
proyecto» o «el Arduino no se conecta», y responde con los **datos reales**: si
alguien pregunta si hay frutas (o leche, o jugos), lee el inventario y contesta
cuántas hay y en qué lado.

### Cómo entiende

| Capa | Qué hace | Ejemplo |
|---|---|---|
| 1. Normaliza | Quita tildes, signos y mayúsculas, letras estiradas, abreviaturas, muletillas, el nombre al inicio y palabras repetidas | «Oye Bob, ¿cómo cómo se creóóó?» → «como se creo» |
| 2. Tolera errores | Compara por raíz, por sonido y con uno o dos errores de letra | «komo se kreo el proyeto» → creación |
| 3. Catálogo | 30 temas y unas 540 frases clave | ver [docs/PREGUNTAS.md](docs/PREGUNTAS.md) |
| 4. Rescate | Si no está seguro, pregunta «¿Te refieres a…?» con botones y entiende un «sí» | «la idea» → ¿Te refieres a cómo se creó el proyecto? |

Nunca inventa: si nada se acerca, lo dice y ofrece los temas que sí conoce.
Las preguntas que no entendió quedan anotadas en ese navegador; para verlas,
en la consola: `JSON.parse(localStorage.getItem("bot:sin-respuesta"))`.

La voz la pone el propio navegador, así que no cuesta nada. Para transcribir
lo que se dice, Chrome usa el servicio de reconocimiento de voz de Google. El
micrófono pide permiso la primera vez. El botón del altavoz silencia las
respuestas habladas.

### Bob 3D y el modo en vivo (Beta)

Al abrir el chat aparece Bob en 3D, que abre el pico al ritmo de lo que dice.
Con **Hablar en vivo** (o `?vivo` al final de la dirección) se abre una
pantalla completa para conversar por voz como en una llamada: Bob escucha,
piensa y responde, y vuelve a escuchar solo. Tocarlo mientras habla lo
interrumpe. Responde con el mismo catálogo del chat; no usa IA.

- `assets/voz-bob.js`: voz de Bob y apertura de la boca, sílaba por sílaba.
- `assets/bob3d.js`: Bob en 3D con three.js (se descarga de jsDelivr). Si no
  carga, queda el Bob dibujado. Es un Bob provisional hecho de piezas; para
  poner el modelo de Meshy, ver el comentario al inicio del archivo y
  `modelos/LEEME.txt`.
- `assets/vivo.js`: la pantalla del modo en vivo.

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
index.html                          la página real
prueba/index.html                   la página de prueba (mismo código, otra colección)
assets/
├── app.css                         estilos, claro y oscuro
├── app.js                          categorías, Firestore, prueba del Arduino, interfaz
├── bot.js                          el bot: datos del proyecto, catálogo, voz y Ollama
├── bob.js                          el pelícano en SVG y su animación
├── nutricion.js / .css             pestaña de información nutricional
├── voz-bob.js                      voz de Bob y boca sincronizada (Beta)
├── bob3d.js / .css                 Bob en 3D (Beta)
├── vivo.js / .css                  modo en vivo (Beta)
└── firebase-config.js              ← aquí va tu configuración
marca/                              tus imágenes propias, si las pones
modelos/                            aquí va el modelo 3D de Bob, cuando exista
azul/                               dirección vieja: redirige a la página real
arduino/
└── dirt_conexion/
    └── dirt_conexion.ino           sketch de la prueba de conexión
firestore.rules                     reglas de seguridad de la base
docs/
├── PREGUNTAS.md                    todo lo que el bot sabe responder
├── HISTORIAL.md                    qué cambió respecto a versiones anteriores
└── bob.png                         Bob en PNG, para el material de la presentación
herramientas/
├── revisar.mjs                     sintaxis, documento al día y pruebas del bot
├── probar-bot.mjs                  preguntas reales que el bot debe entender
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

## IA opcional para Bob (Ollama)

Bob responde con sus propias reglas. Si se enciende la IA, solo se le pregunta
a Ollama cuando Bob no está seguro. Se enciende **solo en el navegador donde se
abre el enlace**: los demás no notan nada.

| Enlace | Qué hace |
|---|---|
| `…/p-gina-web/?ia=local` | usa Ollama en este mismo computador |
| `…/p-gina-web/?ia=https://xxxx.trycloudflare.com` | usa Ollama en otro computador, a través de un túnel |
| `…/p-gina-web/?ia=off` | apaga la IA |

Cuando la IA está encendida, el chat dice "Asistente · con IA" (o "IA sin conexión").

### Presentar desde un computador que no es tuyo (túnel)

En **tu portátil** (Windows, PowerShell):

```powershell
ollama pull llama3.2
setx OLLAMA_ORIGINS "https://ney-nh.github.io"
# cerrar Ollama desde la bandeja y volver a abrirlo
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:11434 --http-host-header localhost:11434
```

Copia la dirección `https://….trycloudflare.com` que aparece y, en el computador
de la presentación, abre:
`https://ney-nh.github.io/p-gina-web/?ia=https://….trycloudflare.com`

El portátil debe seguir encendido y con internet. **Al terminar, cierra
cloudflared (Ctrl+C)**: mientras esté abierto, cualquiera con la dirección
puede usar tu Ollama. La dirección cambia cada vez que se abre el túnel.
