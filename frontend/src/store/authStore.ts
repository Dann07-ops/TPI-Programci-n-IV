import { create } from "zustand";
import { persist } from "zustand/middleware";

import { loginRequest, logoutRequest, meRequest } from "../features/auth/api/auth";
import type { LoginData } from "../features/auth/types/auth";
import type { Usuario } from "../features/usuarios/types/usuario";
import { queryClient } from "../shared/api/queryClient";

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean;
  login: (datos: LoginData) => Promise<Usuario>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  limpiarSesion: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (datos) => {
        await loginRequest(datos); // el backend deja la cookie HttpOnly
        const usuario = await meRequest(); // y con ella pedimos el perfil
        queryClient.clear(); // no mezclar datos de una sesión anterior
        set({ usuario, cargando: false });
        return usuario;
      },

      logout: async () => {
        try {
          await logoutRequest(); // el backend borra la cookie
        } finally {
          queryClient.clear();
          set({ usuario: null });
        }
      },

      // Se llama una vez al montar la app: confirma con el backend si la
      // cookie sigue siendo válida (el usuario persistido puede estar vencido).
      checkSession: async () => {
        set({ cargando: true });
        try {
          const usuario = await meRequest();
          set({ usuario });
        } catch {
          set({ usuario: null });
        } finally {
          set({ cargando: false });
        }
      },

      limpiarSesion: () => {
        queryClient.clear();
        set({ usuario: null });
      },
    }),
    {
      name: "foodstore-auth",
      // Solo se guarda el usuario (nombre, email, rol). NUNCA el token:
      // el token vive en la cookie HttpOnly, fuera del alcance de JavaScript.
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
);
