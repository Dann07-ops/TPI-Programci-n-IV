import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cambiarEstadoPedido,
  cancelarPedido,
  crearPedido,
  listarPedidos,
  obtenerPedido,
  obtenerResumen,
} from "../api/pedidos";
import type { EstadoPedido, FiltrosPedidos, PedidoCreate } from "../types/pedido";

export const pedidosKeys = {
  todos: ["pedidos"] as const,
  lista: (filtros: FiltrosPedidos) => ["pedidos", "lista", filtros] as const,
  detalle: (id: number) => ["pedidos", "detalle", id] as const,
  resumen: ["pedidos", "resumen"] as const,
};

export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: pedidosKeys.lista(filtros),
    queryFn: () => listarPedidos(filtros),
    placeholderData: keepPreviousData,
  });
}

export function usePedido(id: number | null) {
  return useQuery({
    queryKey: pedidosKeys.detalle(id ?? 0),
    queryFn: () => obtenerPedido(id ?? 0),
    enabled: id !== null, // solo se pide cuando hay un pedido seleccionado
  });
}

export function useResumenPedidos() {
  return useQuery({
    queryKey: pedidosKeys.resumen,
    queryFn: obtenerResumen,
  });
}

/** Crear, cancelar o cambiar el estado de un pedido modifica el stock:
 *  se invalidan los pedidos (incluido el resumen, por compartir el prefijo
 *  "pedidos") y los productos. */
function useInvalidarPedidosYStock() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: pedidosKeys.todos });
    void queryClient.invalidateQueries({ queryKey: ["productos"] });
  };
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidosYStock();
  return useMutation({
    mutationFn: (datos: PedidoCreate) => crearPedido(datos),
    onSuccess: invalidar,
  });
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidosYStock();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstadoPedido(id, estado),
    onSuccess: invalidar,
  });
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidosYStock();
  return useMutation({
    mutationFn: (id: number) => cancelarPedido(id),
    onSuccess: invalidar,
  });
}
