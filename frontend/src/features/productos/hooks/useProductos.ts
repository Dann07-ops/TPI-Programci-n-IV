import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  actualizarProducto,
  actualizarStock,
  crearProducto,
  eliminarProducto,
  listarProductos,
} from "../api/productos";
import type {
  FiltrosProductos,
  ProductoCreate,
  ProductoStockUpdate,
  ProductoUpdate,
} from "../types/producto";

export const productosKeys = {
  todos: ["productos"] as const,
  lista: (filtros: FiltrosProductos) => ["productos", filtros] as const,
};

export function useProductos(filtros: FiltrosProductos) {
  return useQuery({
    // La key incluye los filtros: cada combinación (página, búsqueda,
    // categoría) se cachea por separado y cambiarlos dispara un nuevo pedido.
    queryKey: productosKeys.lista(filtros),
    queryFn: () => listarProductos(filtros),
    // Mientras llega la página nueva, se sigue mostrando la anterior
    placeholderData: keepPreviousData,
  });
}

function useInvalidarProductos() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: productosKeys.todos });
}

export function useCrearProducto() {
  const invalidar = useInvalidarProductos();
  return useMutation({
    mutationFn: (datos: ProductoCreate) => crearProducto(datos),
    onSuccess: invalidar,
  });
}

export function useActualizarProducto() {
  const invalidar = useInvalidarProductos();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoUpdate }) => actualizarProducto(id, datos),
    onSuccess: invalidar,
  });
}

export function useActualizarStock() {
  const invalidar = useInvalidarProductos();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoStockUpdate }) => actualizarStock(id, datos),
    onSuccess: invalidar,
  });
}

export function useEliminarProducto() {
  const invalidar = useInvalidarProductos();
  return useMutation({
    mutationFn: (id: number) => eliminarProducto(id),
    onSuccess: invalidar,
  });
}
