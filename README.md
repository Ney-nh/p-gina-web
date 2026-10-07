# D.I.R.T. Comunitario

Control de donaciones de alimentos con registro de entradas y salidas, y
accionamiento de una compuerta física por Bluetooth.

El sistema tiene tres piezas:

| Pieza | Tecnología | Función |
|---|---|---|
| App | Expo (React Native) + expo-router | Registro de movimientos y control de la compuerta |
| API | FastAPI + MongoDB | Persistencia de los movimientos y el resumen por categoría |
| Compuerta | Arduino UNO R4 WiFi + servo | Apertura física, gobernada por Bluetooth LE |

## Estado de este repositorio

⚠ **Incompleto.** Por ahora solo contiene los archivos modificados para
quitar la autenticación con Google e integrar el control de la compuerta.
Falta exportar el proyecto completo desde Emergent con **"Save to GitHub"**:
las pestañas, `src/theme.ts`, `src/constants/categories.ts`, los componentes
compartidos y la configuración de Expo.

Cuando ese código llegue, los archivos de aquí se superponen en sus rutas, que
ya están colocadas correctamente.

## Estructura

```
backend/
└── server.py                      API de movimientos, sin autenticación
frontend/
├── app/
│   ├── _layout.tsx                layout raíz, sin gate de sesión
│   └── registrar.tsx              registro + accionamiento de la compuerta
└── src/
    ├── lib/
    │   ├── api.ts                 cliente HTTP
    │   └── compuerta.tsx          cliente Web Bluetooth del Arduino
    └── components/
        └── panel-compuerta.tsx    tarjeta de UI de la compuerta
```

`CAMBIOS.md` detalla qué se modificó, qué archivos hay que borrar y qué
limpieza queda pendiente en los archivos que aún no están en el repositorio.

## Protocolo Bluetooth

La app habla con el sketch `servo_ble_dirt.ino` del Arduino UNO R4 WiFi.

| Elemento | Valor |
|---|---|
| Nombre BLE | `DIRT` |
| Servicio | `19b10000-e8f2-537e-4f6c-d104768a1214` |
| Comando (escritura) | `19b10001-e8f2-537e-4f6c-d104768a1214` |
| Estado (notificación) | `19b10002-e8f2-537e-4f6c-d104768a1214` |

Comandos aceptados: `A` abre a 90°, `C` cierra, un número de 0 a 180 posiciona
el servo en ese ángulo, `?` devuelve el ángulo actual.

El control usa **Web Bluetooth**, disponible solo en navegadores Chromium:
Chrome en Android y Chrome o Edge de escritorio. En Safari, iOS o en un APK
nativo de Expo, el registro de alimentos funciona igual y el control de la
compuerta se oculta.

## Variables de entorno

Crea `backend/.env` a partir de este modelo. **No lo subas al repositorio**:
está cubierto por `.gitignore`.

```
MONGO_URL=mongodb://usuario:clave@host:27017
DB_NAME=dirt_comunitario
# Opcional. Si se omite, se permite cualquier origen (sin credenciales).
ALLOWED_ORIGINS=https://tu-dominio.com
```

## Nota de seguridad

La API no tiene autenticación: cualquiera que conozca la URL puede crear,
listar y borrar movimientos. Es adecuado para una demostración académica. Para
un uso real conviene añadir al menos una clave compartida en una cabecera,
dado que los registros contienen nombres y números de documento.
