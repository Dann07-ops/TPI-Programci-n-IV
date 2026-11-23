import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Producto } from "../features/productos/types/producto";

export interface CartItem {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  imagen_url: string | null;
  stock: number; // para no dejar pedir más de lo que hay
}

interface CartState {
  items: CartItem[];
  agregar: (producto: Producto, cantidad?: number) => void;
  quitar: (productoId: number) => void;
  cambiarCantidad: (productoId: number, cantidad: number) => void;
  vaciar: () => void;
  total: () => number;
  cantidadItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, cantidad = 1) => {
        const existente = get().items.find((i) => i.producto_id === producto.id);
        if (existente) {
          // Si ya está, se suma la cantidad (un producto no se repite: RN-01)
          get().cambiarCantidad(producto.id, existente.cantidad + cantidad);
          return;
        }
        set({
          items: [
            ...get().items,
            {
              producto_id: producto.id,
              nombre: producto.nombre,
              precio_unitario: producto.precio_base,
              cantidad: Math.min(cantidad, producto.stock),
              imagen_url: producto.imagen_url,
              stock: producto.stock,
            },
          ],
        });
      },

      quitar: (productoId) =>
        set({ items: get().items.filter((i) => i.producto_id !== productoId) }),

      cambiarCantidad: (productoId, cantidad) =>
        set({
          items: get().items.map((i) =>
            i.producto_id === productoId
              ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)) }
              : i,
          ),
        }),

      vaciar: () => set({ items: [] }),

      total: () => get().items.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0),

      cantidadItems: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    { name: "foodstore-cart" },
  ),
);
