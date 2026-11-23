import { useEffect } from "react";

import { AppRouter } from "./routes/AppRouter";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  // Única llamada al servidor dentro de un useEffect (lo permite el enunciado):
  // al montar la app, confirmar si la cookie de sesión sigue siendo válida.
  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  return <AppRouter />;
}
