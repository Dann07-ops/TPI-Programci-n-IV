import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

/** Instancia única de TanStack Query para toda la app. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // No reintenta errores 4xx (no se van a arreglar solos)
      retry: (intentos, error) => {
        if (axios.isAxiosError(error) && error.response && error.response.status < 500) {
          return false;
        }
        return intentos < 2;
      },
    },
  },
});
