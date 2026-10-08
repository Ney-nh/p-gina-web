# D.I.R.T. Comunitario

Control de donaciones de alimentos con registro de entradas y salidas, y una
compuerta física de **doble lado** que se abre sola según el tipo de alimento.

La página es estática: no hay servidor que mantener. El navegador habla
directamente con Firestore para los datos y con el Arduino por Bluetooth para
la compuerta.

---

## 1. Cómo funciona

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

## 2. Puesta en marcha

### 2.1 Firebase

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

### 2.2 Arduino

1. Abre `arduino/dirt_dos_compuertas/dirt_dos_compuertas.ino` en el IDE.
2. Instala la librería **ArduinoBLE** desde Herramientas → Administrar Bibliotecas.
3. Selecciona la placa **Arduino UNO R4 WiFi** y súbelo.
4. Abre el Monitor Serie a **115200**. Debe anunciarse como `DIRT`.

Conexiones:

| Elemento | Pin |
|---|---|
| Servo frío, señal | D9 |
| Servo caliente, señal | D10 |
| Ambos servos, +5 V | fuente externa de 5 V · 2 A |
| Ambos servos, GND | riel negativo, unido al GND del Arduino |

La masa común entre la fuente y el Arduino es obligatoria. Con dos servos el
consumo se duplica: no los alimentes desde el pin de 5 V de la placa, y pon un
capacitor de 1000 µF entre los rieles, cerca de los servos.

### 2.3 Publicar la página

En GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`.**
A los dos minutos la página queda en `https://ney-nh.github.io/p-gina-web/`.

No hay nada que compilar: lo que está en el repositorio es lo que se sirve.

---

## 3. Dónde funciona el Bluetooth

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

## 4. Protocolo Bluetooth

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

## 5. Estructura

```
index.html                          la aplicación entera
assets/
├── app.css                         estilos, modo claro y oscuro
├── app.js                          categorías, Firestore, Bluetooth, interfaz
└── firebase-config.js              ← aquí va tu configuración
arduino/
└── dirt_dos_compuertas/
    └── dirt_dos_compuertas.ino     sketch de los dos servos
firestore.rules                     reglas de seguridad de la base
docs/HISTORIAL.md                   qué cambió respecto a versiones anteriores
```

---

## 6. Seguridad: lo que hay que saber

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
