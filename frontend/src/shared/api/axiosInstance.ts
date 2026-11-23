import axios from "axios";

import { useAuthStore } from "../../store/authStore";

const CUENTA_DESACTIVADA = "Cuenta de usuario desactivada";

// Rutas donde un 401 es una respuesta "normal" y no significa sesión vencida:
// el login con credenciales malas y la verificación inicial de sesión.
const RUTAS_SIN_LIMPIEZA = ["/auth/token", "/auth/me"];

/** Cliente HTTP único de la aplicación. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
  // Hace que el navegador adjunte la cookie HttpOnly en cada petición.
  // El frontend nunca lee ni guarda el token.
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      const url = error.config?.url ?? "";
      const detail = (data as { detail?: unknown } | undefined)?.detail;

      const sesionVencida =
        status === 401 && !RUTAS_SIN_LIMPIEZA.some((ruta) => url.includes(ruta));
      const cuentaDesactivada = status === 400 && detail === CUENTA_DESACTIVADA;

      if (sesionVencida || cuentaDesactivada) {
        // Al quedar sin usuario, ProtectedRoute redirige a /login.
        useAuthStore.getState().limpiarSesion();
      }
    }
    return Promise.reject(error);
  },
);
