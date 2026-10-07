/**
 * Layout raíz.
 *
 * Cambios: se eliminó el "gate" de autenticación (splash → login → app).
 * La app entra directo a las pestañas. Se añadió CompuertaProvider, que
 * mantiene viva la conexión Bluetooth con el Arduino mientras se navega
 * entre pantallas.
 *
 * ⚠ OJO: no tuve a la vista tu _layout.tsx original, así que esta versión
 * reconstruye lo que describiste (fuentes Plus Jakarta Sans, react-query,
 * toasts y el modal de registro). Si tu archivo tenía algo más —un
 * ThemeProvider propio, SplashScreen, GestureHandlerRootView—, conserva
 * esas partes y aplica solo los dos cambios marcados con CAMBIO.
 */

import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ToastProvider } from "@/src/components/toast";
// CAMBIO 1: ya no se importa AuthProvider desde "@/src/lib/auth".
import { CompuertaProvider } from "@/src/lib/compuerta";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            {/* CAMBIO 2: CompuertaProvider sustituye a AuthProvider.
                Va por fuera del Stack para que la conexión BLE sobreviva
                al cambio de pantalla. */}
            <CompuertaProvider>
              <ToastProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="registrar"
                    options={{ presentation: "modal", animation: "slide_from_bottom" }}
                  />
                </Stack>
              </ToastProvider>
            </CompuertaProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
