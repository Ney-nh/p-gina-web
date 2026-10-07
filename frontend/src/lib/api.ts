/**
 * Cliente HTTP de D.I.R.T. Comunitario.
 *
 * Cambios: se eliminó todo lo relacionado con la sesión de Google
 * (token, cabecera Authorization, manejador de 401 y endpoints /auth/*).
 * Se añadió el campo `compuerta_abierta` al movimiento.
 */

import type { CategoriaId, Tipo } from "@/src/constants/categories";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";

export interface Movimiento {
  id: string;
  tipo: Tipo;
  nombre: string;
  documento: string;
  categoria: CategoriaId;
  cantidad: number;
  nota?: string | null;
  compuerta_abierta?: boolean;
  created_at: string;
}

export interface CategoriaResumen {
  entradas: number;
  salidas: number;
  stock: number;
  ultima: string | null;
}

export interface Resumen {
  hoy: { entradas: number; salidas: number; aperturas: number };
  total_movimientos: number;
  por_categoria: Record<CategoriaId, CategoriaResumen>;
}

export interface MovimientoInput {
  tipo: Tipo;
  nombre: string;
  documento: string;
  categoria: CategoriaId;
  cantidad: number;
  nota?: string | null;
  compuerta_abierta?: boolean;
}

export interface MovimientoFilters {
  tipo?: Tipo;
  categoria?: CategoriaId;
  q?: string;
  limit?: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = "No se pudo conectar con el servidor";
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") message = body.detail;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const movimientosKey = (filters: MovimientoFilters = {}) =>
  ["movimientos", filters] as const;
export const resumenKey = ["resumen"] as const;

export const api = {
  crearMovimiento: (input: MovimientoInput) =>
    request<Movimiento>("/movimientos", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  listarMovimientos: (filters: MovimientoFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.tipo) params.set("tipo", filters.tipo);
    if (filters.categoria) params.set("categoria", filters.categoria);
    if (filters.q) params.set("q", filters.q);
    if (filters.limit) params.set("limit", String(filters.limit));
    const qs = params.toString();
    return request<Movimiento[]>(`/movimientos${qs ? `?${qs}` : ""}`);
  },

  resumen: () => request<Resumen>("/movimientos/resumen"),

  eliminarMovimiento: (id: string) =>
    request<{ ok: boolean }>(`/movimientos/${id}`, { method: "DELETE" }),
};
