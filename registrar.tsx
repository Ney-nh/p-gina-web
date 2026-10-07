/**
 * Pantalla de registro de movimiento.
 *
 * Cambios respecto a la versión anterior:
 *   - Integra el control de la compuerta del Arduino (lo que hacía la app
 *     de App Inventor). Si hay conexión BLE, al guardar se acciona la
 *     compuerta y se muestra la cuenta regresiva del cierre automático.
 *   - La validación de datos sigue siendo previa: sin nombre, documento y
 *     categoría no se guarda nada ni se envía nada al Arduino.
 *   - El movimiento guardado deja constancia de si accionó la compuerta.
 */

import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";

import { fonts, makeStyles, useTheme } from "@/src/theme";
import { CATEGORIAS, type CategoriaId, type Tipo } from "@/src/constants/categories";
import { api, type Movimiento, type MovimientoInput } from "@/src/lib/api";
import { Chip } from "@/src/components/chip";
import { useToast } from "@/src/components/toast";
import { PanelCompuerta } from "@/src/components/panel-compuerta";
import { useCompuerta } from "@/src/lib/compuerta";

const OPCIONES: { id: Tipo; label: string }[] = [
  { id: "entrada", label: "Entrada" },
  { id: "salida", label: "Salida" },
];

export default function Registrar() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tipo?: string }>();
  const compuerta = useCompuerta();

  const [tipo, setTipo] = useState<Tipo>(
    params.tipo === "salida" ? "salida" : "entrada",
  );
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [categoria, setCategoria] = useState<CategoriaId | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Cuando el guardado abre la compuerta, la pantalla se queda mostrando
  // el estado en vez de volver atrás de inmediato.
  const [guardado, setGuardado] = useState<Movimiento | null>(null);

  const conectada = compuerta.estado === "conectado" || compuerta.estado === "abierta";

  const guardar = useMutation({
    mutationFn: (input: MovimientoInput) => api.crearMovimiento(input),
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      queryClient.invalidateQueries({ queryKey: ["resumen"] });

      if (variables.compuerta_abierta) {
        // Datos ya guardados: ahora sí se acciona el servo.
        setGuardado(data);
        try {
          await compuerta.abrir();
        } catch {
          setError(
            "El registro quedó guardado, pero no se pudo accionar la compuerta.",
          );
        }
        return;
      }

      toast(
        variables.tipo === "entrada" ? "Entrada registrada" : "Salida registrada",
      );
      router.back();
    },
    onError: (e: Error) =>
      setError(e.message || "No se pudo guardar. Intenta de nuevo."),
  });

  const onSubmit = () => {
    if (nombre.trim().length < 2) {
      setError("Escribe el nombre completo.");
      return;
    }
    if (documento.trim().length < 3) {
      setError("Escribe el número de documento (mínimo 3 dígitos).");
      return;
    }
    if (!categoria) {
      setError("Elige la categoría del alimento.");
      return;
    }
    setError(null);
    guardar.mutate({
      tipo,
      nombre: nombre.trim(),
      documento: documento.trim(),
      categoria,
      cantidad,
      nota: nota.trim() || null,
      compuerta_abierta: conectada,
    });
  };

  const accent = tipo === "entrada" ? colors.success : colors.error;
  const onAccent = tipo === "entrada" ? colors.onSuccess : colors.onError;

  // ---- Vista posterior al guardado con compuerta accionada ----
  if (guardado) {
    return (
      <View style={styles.screen} testID="registrar-exito">
        <View style={[styles.exitoWrap, { paddingTop: insets.top + 40 }]}>
          <View style={[styles.exitoIcon, { backgroundColor: accent }]}>
            <MaterialCommunityIcons name="check" size={38} color={onAccent} />
          </View>
          <Text style={styles.exitoTitle}>
            {guardado.tipo === "entrada" ? "Entrada registrada" : "Salida registrada"}
          </Text>
          <Text style={styles.exitoSub}>
            {guardado.nombre} · T.I. {guardado.documento}
          </Text>

          <View style={styles.exitoPanel}>
            <PanelCompuerta compacto />
          </View>
        </View>

        <View style={[styles.sticky, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={[styles.submit, { backgroundColor: colors.brandPrimary }]}
            onPress={() => router.back()}
            testID="registrar-listo"
          >
            <Text style={[styles.submitText, { color: colors.onBrandPrimary }]}>
              Listo
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="registrar-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          testID="registrar-close"
          hitSlop={10}
          style={styles.closeBtn}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Registrar movimiento</Text>
        <View style={styles.closeBtn} />
      </View>

      {/* Segmentado ENTRADA / SALIDA */}
      <View style={styles.segment}>
        {OPCIONES.map((o) => {
          const selected = tipo === o.id;
          const bg = o.id === "entrada" ? colors.success : colors.error;
          const fg = o.id === "entrada" ? colors.onSuccess : colors.onError;
          return (
            <Pressable
              key={o.id}
              onPress={() => {
                setTipo(o.id);
                setError(null);
              }}
              testID={`registrar-tipo-${o.id}`}
              style={[styles.segmentBtn, selected && { backgroundColor: bg }]}
            >
              <MaterialCommunityIcons
                name={o.id === "entrada" ? "arrow-down-box" : "arrow-up-box"}
                size={18}
                color={selected ? fg : colors.muted}
              />
              <Text style={[styles.segmentText, selected && { color: fg }]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.form, { paddingBottom: 140 }]}
        bottomOffset={110}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>¿Quién hace el movimiento?</Text>
        <View style={styles.gap12}>
          <TextInput
            style={styles.input}
            placeholder="Nombre completo"
            placeholderTextColor={colors.muted}
            value={nombre}
            onChangeText={(t) => {
              setNombre(t);
              setError(null);
            }}
            autoCapitalize="words"
            testID="registrar-nombre-input"
          />
          <TextInput
            style={styles.input}
            placeholder="Número de documento (T.I. / C.C.)"
            placeholderTextColor={colors.muted}
            value={documento}
            onChangeText={(t) => {
              setDocumento(t.replace(/\D/g, "").slice(0, 12));
              setError(null);
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            testID="registrar-documento-input"
          />
        </View>

        <Text style={styles.sectionLabel}>¿Qué alimento?</Text>
        <View style={styles.catGrid}>
          {CATEGORIAS.map((c) => {
            const selected = categoria === c.id;
            const catAccent = colors[c.colorKey];
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setCategoria(c.id);
                  setError(null);
                }}
                testID={`registrar-cat-${c.id}`}
                style={[
                  styles.catCard,
                  selected && {
                    borderColor: catAccent,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={c.icon}
                  size={28}
                  color={selected ? catAccent : colors.onSurfaceTertiary}
                />
                <Text style={[styles.catLabel, selected && { color: catAccent }]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>¿Cuántas unidades?</Text>
        <View style={styles.stepperRow}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setCantidad((v) => Math.max(1, v - 1))}
            testID="registrar-cantidad-menos"
          >
            <MaterialCommunityIcons
              name="minus"
              size={20}
              color={colors.onBrandPrimary}
            />
          </Pressable>
          <Text style={styles.cantidad} testID="registrar-cantidad-valor">
            {cantidad}
          </Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setCantidad((v) => Math.min(999, v + 1))}
            testID="registrar-cantidad-mas"
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={colors.onBrandPrimary}
            />
          </Pressable>
        </View>
        <View style={styles.quickRow}>
          {[1, 2, 5, 10].map((n) => (
            <Chip
              key={n}
              label={String(n)}
              selected={cantidad === n}
              onPress={() => setCantidad(n)}
              testID={`registrar-cantidad-${n}`}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Nota (opcional)</Text>
        <TextInput
          style={[styles.input, styles.notaInput]}
          placeholder="Ej.: 2 litros de leche entera"
          placeholderTextColor={colors.muted}
          value={nota}
          onChangeText={setNota}
          multiline
          testID="registrar-nota-input"
        />

        <Text style={styles.sectionLabel}>Compuerta física</Text>
        <PanelCompuerta />
      </KeyboardAwareScrollView>

      <KeyboardStickyView bottom={insets.bottom + 16} style={styles.sticky}>
        {error ? (
          <Text style={styles.errorText} testID="registrar-error">
            {error}
          </Text>
        ) : null}
        <Pressable
          style={[styles.submit, { backgroundColor: accent }]}
          onPress={onSubmit}
          disabled={guardar.isPending}
          testID="registrar-submit"
        >
          {guardar.isPending ? (
            <ActivityIndicator size="small" color={onAccent} />
          ) : (
            <Text style={[styles.submitText, { color: onAccent }]}>
              {conectada
                ? tipo === "entrada"
                  ? "Guardar y abrir compuerta"
                  : "Guardar salida y abrir"
                : tipo === "entrada"
                  ? "Guardar entrada"
                  : "Guardar salida"}
            </Text>
          )}
        </Pressable>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    color: colors.onSurface,
    fontFamily: fonts.medium,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 999,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 8,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  segmentText: { fontSize: 14, fontWeight: "500", color: colors.muted },
  form: { paddingHorizontal: 16, paddingTop: 20, gap: 8 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.onSurface,
    marginTop: 8,
    fontFamily: fonts.medium,
  },
  gap12: { gap: 12 },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
    color: colors.onSurface,
  },
  notaInput: {
    height: "auto",
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catCard: {
    flexGrow: 1,
    flexBasis: 0,
    maxWidth: "48%",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
  },
  catLabel: { fontSize: 14, fontWeight: "500", color: colors.onSurfaceTertiary },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  cantidad: {
    fontSize: 24,
    fontWeight: "500",
    color: colors.onSurface,
    minWidth: 48,
    textAlign: "center",
    fontFamily: fonts.medium,
  },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  sticky: { paddingHorizontal: 16, gap: 8 },
  errorText: { color: colors.error, fontSize: 13, textAlign: "center" },
  submit: {
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { fontSize: 16, fontWeight: "500", fontFamily: fonts.medium },
  // --- vista de éxito con compuerta ---
  exitoWrap: { flex: 1, paddingHorizontal: 24, alignItems: "center", gap: 10 },
  exitoIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  exitoTitle: {
    fontSize: 22,
    fontWeight: "500",
    color: colors.onSurface,
    fontFamily: fonts.medium,
    textAlign: "center",
  },
  exitoSub: { fontSize: 14, color: colors.muted, textAlign: "center" },
  exitoPanel: { alignSelf: "stretch", marginTop: 24 },
}));
