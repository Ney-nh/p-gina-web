# D.I.R.T. Comunitario — cambios aplicados

Dos objetivos: **quitar el login de Google** y **fusionar la funcionalidad de
la app de App Inventor** (control de la compuerta por Bluetooth) dentro de
esta app, conservando su diseño.

---

## 1. Archivos que se REEMPLAZAN

| Ruta en el proyecto | Qué cambió |
|---|---|
| `backend/server.py` | Sin autenticación. CORS corregido. Campo `compuerta_abierta`. Búsqueda también por documento. |
| `frontend/src/lib/api.ts` | Sin token ni endpoints `/auth/*`. |
| `frontend/app/registrar.tsx` | Integra la compuerta: al guardar, acciona el servo y muestra el cierre automático. |
| `frontend/app/_layout.tsx` | Sin gate de sesión. Añade `CompuertaProvider`. ⚠ Ver nota abajo. |

## 2. Archivos NUEVOS

| Ruta | Qué hace |
|---|---|
| `frontend/src/lib/compuerta.tsx` | Cliente Web Bluetooth del Arduino: conectar, ángulo, abrir, cerrar, cierre automático, notificaciones. |
| `frontend/src/components/panel-compuerta.tsx` | Tarjeta de UI con estado de conexión, ángulo y botones. |

## 3. Archivos que se BORRAN

```
frontend/app/login.tsx
frontend/src/lib/auth.tsx
```

Y en `backend/requirements.txt` ya puedes quitar `httpx`, que solo se usaba
para hablar con el servicio de autenticación de Emergent.

## 4. Limpieza pendiente en archivos que no vi

En `app/(tabs)/index.tsx` había un saludo con el nombre del usuario, el avatar
de Google y el menú de cerrar sesión. Hay que quitar:

- cualquier `import { useAuth } from "@/src/lib/auth"` y su uso
- el avatar y el menú de cerrar sesión
- el saludo personalizado (sustitúyelo por un título fijo, p. ej. "D.I.R.T. Comunitario")

Si quieres el control de la compuerta también en la pantalla de Inicio:

```tsx
import { PanelCompuerta } from "@/src/components/panel-compuerta";
// ...dentro del scroll, donde quieras que aparezca:
<PanelCompuerta />
```

Para localizar lo que falta, busca estas cadenas en todo el proyecto y elimina
cada aparición: `useAuth`, `signInWithGoogle`, `signOut`, `setApiToken`,
`setUnauthorizedHandler`, `registrado_por`.

⚠ **Sobre `_layout.tsx`**: no tuve a la vista el original. Si el tuyo tenía más
cosas, consérvalas y aplica solo los dos cambios marcados como `CAMBIO` en el
archivo nuevo: quitar `AuthProvider` y envolver con `CompuertaProvider`.

---

## 5. Cómo funciona ahora la compuerta

El flujo reproduce el de App Inventor, con el diseño de esta app:

1. En **Registrar movimiento** aparece la tarjeta *Compuerta* con el botón
   **Conectar con el Arduino**.
2. Al pulsarlo, el navegador muestra el selector de dispositivos Bluetooth.
   Se elige **DIRT**, que es el nombre que publica el sketch.
3. Ya conectado, se puede ajustar el **ángulo de apertura** (0 a 180 grados,
   con atajos de 45, 90, 135 y 180).
4. Se llenan nombre, documento y categoría. **Sin esos tres datos no se guarda
   nada ni se envía nada al Arduino**, igual que antes.
5. El botón pasa a decir **"Guardar y abrir compuerta"**. Al pulsarlo: primero
   se guarda el movimiento en el servidor, y solo si eso tuvo éxito se acciona
   el servo.
6. La compuerta se cierra sola a los **5 segundos**, con cuenta regresiva
   visible. También hay botón de **Cerrar ahora**.

El movimiento queda guardado con `compuerta_abierta: true`, así que en los
reportes se distingue un registro que accionó la compuerta de uno hecho sin el
Arduino presente. El resumen incluye `hoy.aperturas`.

Si no hay conexión Bluetooth, el botón dice simplemente "Guardar entrada" y la
app se comporta como el registro de alimentos de siempre.

### Protocolo (idéntico al sketch `servo_ble_dirt.ino`)

| Elemento | Valor |
|---|---|
| Nombre BLE | `DIRT` |
| Servicio | `19b10000-e8f2-537e-4f6c-d104768a1214` |
| Comando (escritura) | `19b10001-e8f2-537e-4f6c-d104768a1214` |
| Estado (notificación) | `19b10002-e8f2-537e-4f6c-d104768a1214` |

Comandos: `A` abre a 90°, `C` cierra, un número de 0 a 180 posiciona el servo,
`?` devuelve el ángulo actual. **El sketch del Arduino no necesita ningún
cambio.**

---

## 6. Limitación importante: dónde funciona el Bluetooth

Se usa **Web Bluetooth**, que solo existe en navegadores Chromium.

| Entorno | Registro de alimentos | Compuerta |
|---|---|---|
| Chrome en Android | Sí | Sí |
| Chrome / Edge en computador | Sí | Sí |
| Safari, iPhone, iPad | Sí | No |
| APK nativo de Expo | Sí | No |

El código detecta el entorno: donde no hay soporte, la tarjeta de compuerta se
sustituye por un aviso y el resto de la app funciona normal. Para la
demostración, **usa Chrome en Android**.

Si más adelante necesitas un APK nativo con Bluetooth, habría que añadir
`react-native-ble-plx` y un *development build*. El archivo `compuerta.tsx`
está aislado justamente para que ese cambio toque un solo módulo.

---

## 7. Variables de entorno

En `backend/.env` ya no hacen falta las de autenticación. Quedan:

```
MONGO_URL=...
DB_NAME=...
# Opcional: restringe el acceso en producción, separado por comas.
# Si se omite, se permite cualquier origen (sin credenciales).
ALLOWED_ORIGINS=https://tu-dominio.com
```

---

## 8. Seguridad: lo que hay que saber

Al quitar el login, **la API queda abierta**: cualquiera que conozca la URL
puede crear, listar y borrar movimientos. Para una demostración académica
está bien, y es lo que pediste.

Si el sistema llegara a usarse de verdad con datos de personas reales
(nombres y documentos de identidad son datos personales), haría falta algún
control. La opción más liviana sería una clave compartida en una cabecera, sin
necesidad de usuarios ni Google. Dímelo y lo agrego.
