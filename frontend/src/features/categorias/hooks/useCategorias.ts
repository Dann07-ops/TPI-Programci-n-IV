import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from "../api/categorias";
import type { CategoriaCreate, CategoriaUpdate } from "../types/categoria";

export const categoriasKeys = {
  todas: ["categorias"] as const,
};

export function useCategorias() {
  return useQuery({
    queryKey: categoriasKeys.todas,
    queryFn: listarCategorias,
  });
}

/** Después de cualquier cambio se invalidan las categorías y también los
 *  productos, porque cada producto trae su categoría anidada. */
function useInvalidarCatalogo() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: categoriasKeys.todas });
    void queryClient.invalidateQueries({ queryKey: ["productos"] });
  };
}

export function useCrearCategoria() {
  const invalidar = useInvalidarCatalogo();
  return useMutation({
    mutationFn: (datos: CategoriaCreate) => crearCategoria(datos),
    onSuccess: invalidar,
  });
}

export function useActualizarCategoria() {
  const invalidar = useInvalidarCatalogo();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CategoriaUpdate }) => actualizarCategoria(id, datos),
    onSuccess: invalidar,
  });
}

export function useEliminarCategoria() {
  const invalidar = useInvalidarCatalogo();
  return useMutation({
    mutationFn: (id: number) => eliminarCategoria(id),
    onSuccess: invalidar,
  });
}
