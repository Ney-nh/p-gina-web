/**
 * Panel de control de la compuerta física (Arduino UNO R4 WiFi por BLE).
 *
 * Reúne lo que hacía la app de App Inventor: conectar, configurar el ángulo
 * de apertura, cerrar manualmente y ver la respuesta del Arduino.
 *
 * Si el navegador no soporta Web Bluetooth, el panel se muestra en modo
 * informativo y la app sigue funcionando como registro de alimentos.
 */

import { Pressable, Text, View } from "react-native";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { fonts, makeStyles, useTheme } from "@/src/theme";
import { Chip } from "@/src/components/chip";
import { useCompuerta } from "@/src/lib/compuerta";

const ANGULOS_RAPIDOS = [45, 90, 135, 180];

export function PanelCompuerta({ compacto = false }: { compacto?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const {
    estado,
    mensaje,
    angulo,
    setAngulo,
    cuentaAtras,
    soportado,
    conectar,
    desconectar,
    cerrar,
  } = useCompuerta();

  const conectado = estado === "conectado" || estado === "abierta";

  if (!soportado) {
    return (
      <View style={styles.aviso} testID="compuerta-no-soportado">
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={colors.muted}
        />
        <Text style={styles.avisoText}>
          Para accionar la compuerta abre esta app en Chrome (Android o
          computador). El registro de alimentos funciona igual aquí.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card} testID="compuerta-panel">
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons
            name={conectado ? "bluetooth-connect" : "bluetooth-off"}
            size={20}
            color={conectado ? colors.success : colors.muted}
          />
          <Text style={styles.title}>Compuerta</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: conectado ? colors.success : colors.surfaceTertiary },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: conectado ? colors.onSuccess : colors.muted },
            ]}
          >
            {estado === "conectando"
              ? "Conectando"
              : conectado
                ? "Conectada"
                : "Sin conexión"}
          </Text>
        </View>
      </View>

      {!conectado ? (
        <Pressable
          style={styles.connectBtn}
          onPress={() => conectar()}
          disabled={estado === "conectando"}
          testID="compuerta-conectar"
        >
          <MaterialCommunityIcons
            name="bluetooth"
            size={18}
            color={colors.onBrandPrimary}
          />
          <Text style={styles.connectText}>Conectar con el Arduino</Text>
        </Pressable>
      ) : (
        <>
          {!compacto ? (
            <>
              <Text style={styles.label}>Ángulo de apertura</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setAngulo(Math.max(0, angulo - 5))}
                  testID="compuerta-angulo-menos"
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={20}
                    color={colors.onBrandPrimary}
                  />
                </Pressable>
                <Text style={styles.angulo} testID="compuerta-angulo-valor">
                  {angulo}°
                </Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setAngulo(Math.min(180, angulo + 5))}
                  testID="compuerta-angulo-mas"
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={colors.onBrandPrimary}
                  />
                </Pressable>
              </View>
              <View style={styles.quickRow}>
                {ANGULOS_RAPIDOS.map((a) => (
                  <Chip
                    key={a}
                    label={`${a}°`}
                    selected={angulo === a}
                    onPress={() => setAngulo(a)}
                    testID={`compuerta-angulo-${a}`}
                  />
                ))}
              </View>
            </>
          ) : null}

          {cuentaAtras !== null ? (
            <Text style={styles.cuenta} testID="compuerta-cuenta">
              Se cierra sola en {cuentaAtras} s
            </Text>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => cerrar()}
              testID="compuerta-cerrar"
            >
              <Text style={styles.secondaryText}>Cerrar ahora</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={desconectar}
              testID="compuerta-desconectar"
            >
              <Text style={styles.secondaryText}>Desconectar</Text>
            </Pressable>
          </View>
        </>
      )}

      {mensaje ? (
        <Text style={styles.mensaje} testID="compuerta-mensaje">
          {mensaje}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.onSurface,
    fontFamily: fonts.medium,
  },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "500" },
  connectBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  connectText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.onBrandPrimary,
    fontFamily: fonts.medium,
  },
  label: { fontSize: 13, color: colors.muted, marginTop: 4 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  angulo: {
    fontSize: 22,
    fontWeight: "500",
    color: colors.onSurface,
    minWidth: 64,
    textAlign: "center",
    fontFamily: fonts.medium,
  },
  quickRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  cuenta: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.onSurface,
    fontFamily: fonts.medium,
  },
  actionsRow: { flexDirection: "row", gap: 8 },
  secondaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 14, fontWeight: "500", color: colors.onSurface },
  mensaje: { fontSize: 12, color: colors.muted },
  aviso: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 16,
    padding: 12,
  },
  avisoText: { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 17 },
}));
