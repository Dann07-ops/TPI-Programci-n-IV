import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { activarUsuario, desactivarUsuario, listarUsuarios } from "../api/usuarios";

export const usuariosKeys = {
  todos: ["usuarios"] as const,
};

export function useUsuarios(habilitado = true) {
  return useQuery({
    queryKey: usuariosKeys.todos,
    queryFn: listarUsuarios,
    enabled: habilitado,
  });
}

export function useActivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activarUsuario(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usuariosKeys.todos }),
  });
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => desactivarUsuario(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: usuariosKeys.todos }),
  });
}
