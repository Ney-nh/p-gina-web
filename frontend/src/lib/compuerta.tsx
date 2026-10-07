/**
 * Control de la compuerta del Arduino UNO R4 WiFi por Bluetooth LE.
 *
 * Replica la funcionalidad de la app de App Inventor:
 *   - conectar con el Arduino que se anuncia como "DIRT"
 *   - configurar el ángulo de apertura (0 a 180 grados)
 *   - abrir y cerrar la compuerta
 *   - cierre automático a los N segundos
 *   - leer la respuesta que notifica el Arduino
 *
 * IMPORTANTE: usa la API Web Bluetooth, que solo existe en navegadores
 * basados en Chromium (Chrome y Edge en Android, Windows, macOS y Linux).
 * No funciona en Safari, ni en iOS, ni en una app Expo compilada como APK
 * nativo. Por eso todo está protegido con `soportaBluetooth()`: si el
 * entorno no lo soporta, la app sigue funcionando y solo se oculta el
 * control de compuerta.
 *
 * Los UUID coinciden exactamente con el sketch servo_ble_dirt.ino.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

// --- Debe coincidir con el sketch del Arduino ---
export const SERVICIO_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
export const CARAC_COMANDO_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214";
export const CARAC_ESTADO_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";
export const NOMBRE_DISPOSITIVO = "DIRT";

/** Segundos que la compuerta permanece abierta antes de cerrarse sola. */
export const SEGUNDOS_CIERRE = 5;

export type EstadoCompuerta =
  | "no-soportado"
  | "desconectado"
  | "conectando"
  | "conectado"
  | "abierta";

interface CompuertaContextValue {
  estado: EstadoCompuerta;
  /** Último mensaje que notificó el Arduino, o el error más reciente. */
  mensaje: string | null;
  /** Ángulo de apertura configurado (0-180). Persiste mientras viva la app. */
  angulo: number;
  setAngulo: (valor: number) => void;
  /** Segundos que faltan para el cierre automático, o null si no hay cuenta. */
  cuentaAtras: number | null;
  soportado: boolean;
  conectar: () => Promise<void>;
  desconectar: () => void;
  /** Abre la compuerta y programa el cierre automático. */
  abrir: () => Promise<void>;
  cerrar: () => Promise<void>;
}

const noop = async () => {};

const CompuertaContext = createContext<CompuertaContextValue>({
  estado: "no-soportado",
  mensaje: null,
  angulo: 90,
  setAngulo: () => {},
  cuentaAtras: null,
  soportado: false,
  conectar: noop,
  desconectar: () => {},
  abrir: noop,
  cerrar: noop,
});

export const useCompuerta = () => useContext(CompuertaContext);

export function soportaBluetooth(): boolean {
  return (
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    // @ts-expect-error: Web Bluetooth no está en los tipos de React Native
    typeof navigator.bluetooth !== "undefined"
  );
}

export function CompuertaProvider({ children }: { children: ReactNode }) {
  const soportado = soportaBluetooth();
  const [estado, setEstado] = useState<EstadoCompuerta>(
    soportado ? "desconectado" : "no-soportado",
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [angulo, setAngulo] = useState(90);
  const [cuentaAtras, setCuentaAtras] = useState<number | null>(null);

  const dispositivoRef = useRef<any>(null);
  const comandoRef = useRef<any>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const limpiarIntervalo = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    setCuentaAtras(null);
  }, []);

  const enviar = useCallback(async (texto: string) => {
    const carac = comandoRef.current;
    if (!carac) throw new Error("La compuerta no está conectada.");
    const datos = new TextEncoder().encode(texto);
    // writeValueWithResponse no existe en navegadores antiguos.
    if (typeof carac.writeValueWithResponse === "function") {
      await carac.writeValueWithResponse(datos);
    } else {
      await carac.writeValue(datos);
    }
  }, []);

  const onDesconectado = useCallback(() => {
    comandoRef.current = null;
    dispositivoRef.current = null;
    limpiarIntervalo();
    setEstado("desconectado");
    setMensaje("El Arduino se desconectó.");
  }, [limpiarIntervalo]);

  const conectar = useCallback(async () => {
    if (!soportado) {
      setMensaje(
        "Este navegador no soporta Bluetooth. Usa Chrome en Android o en computador.",
      );
      return;
    }
    setEstado("conectando");
    setMensaje("Buscando el Arduino...");
    try {
      // @ts-expect-error: Web Bluetooth no está en los tipos de React Native
      const dispositivo = await navigator.bluetooth.requestDevice({
        filters: [{ name: NOMBRE_DISPOSITIVO }],
        optionalServices: [SERVICIO_UUID],
      });
      dispositivo.addEventListener("gattserverdisconnected", onDesconectado);

      const servidor = await dispositivo.gatt.connect();
      const servicio = await servidor.getPrimaryService(SERVICIO_UUID);
      const comando = await servicio.getCharacteristic(CARAC_COMANDO_UUID);

      // La característica de estado es opcional: si el sketch no la expone,
      // la conexión sigue siendo válida y solo se pierden las notificaciones.
      try {
        const estadoCarac = await servicio.getCharacteristic(CARAC_ESTADO_UUID);
        await estadoCarac.startNotifications();
        estadoCarac.addEventListener("characteristicvaluechanged", (e: any) => {
          const texto = new TextDecoder().decode(e.target.value).trim();
          if (texto) setMensaje(`Arduino: ${texto}`);
        });
      } catch {
        // sin notificaciones
      }

      dispositivoRef.current = dispositivo;
      comandoRef.current = comando;
      setEstado("conectado");
      setMensaje("Conectado con el Arduino.");
    } catch (e: any) {
      setEstado("desconectado");
      // El usuario cerró el diálogo del navegador: no es un error real.
      if (e?.name === "NotFoundError") {
        setMensaje("No se seleccionó ningún dispositivo.");
      } else {
        setMensaje(e?.message || "No se pudo conectar con el Arduino.");
      }
    }
  }, [soportado, onDesconectado]);

  const cerrar = useCallback(async () => {
    limpiarIntervalo();
    try {
      await enviar("C");
      setEstado("conectado");
      setMensaje("Compuerta cerrada.");
    } catch (e: any) {
      setMensaje(e?.message || "No se pudo cerrar la compuerta.");
    }
  }, [enviar, limpiarIntervalo]);

  const abrir = useCallback(async () => {
    try {
      await enviar(String(Math.round(angulo)));
      setEstado("abierta");
      setMensaje(`Compuerta abierta a ${Math.round(angulo)} grados.`);

      // Cuenta regresiva visible + cierre automático.
      limpiarIntervalo();
      setCuentaAtras(SEGUNDOS_CIERRE);
      intervaloRef.current = setInterval(() => {
        setCuentaAtras((v) => {
          if (v === null) return null;
          if (v <= 1) {
            // El cierre se dispara fuera del setState para no encadenar efectos.
            setTimeout(() => {
              cerrar().catch(() => {});
            }, 0);
            return null;
          }
          return v - 1;
        });
      }, 1000);
    } catch (e: any) {
      setMensaje(e?.message || "No se pudo abrir la compuerta.");
      throw e;
    }
  }, [enviar, angulo, limpiarIntervalo, cerrar]);

  const desconectar = useCallback(() => {
    limpiarIntervalo();
    const d = dispositivoRef.current;
    if (d?.gatt?.connected) d.gatt.disconnect();
    comandoRef.current = null;
    dispositivoRef.current = null;
    setEstado(soportado ? "desconectado" : "no-soportado");
    setMensaje(null);
  }, [limpiarIntervalo, soportado]);

  // Al desmontar, soltar el dispositivo para no dejar el Arduino ocupado.
  useEffect(() => {
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      const d = dispositivoRef.current;
      if (d?.gatt?.connected) d.gatt.disconnect();
    };
  }, []);

  return (
    <CompuertaContext.Provider
      value={{
        estado,
        mensaje,
        angulo,
        setAngulo,
        cuentaAtras,
        soportado,
        conectar,
        desconectar,
        abrir,
        cerrar,
      }}
    >
      {children}
    </CompuertaContext.Provider>
  );
}
