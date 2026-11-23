import { Navigate, Outlet, useLocation } from "react-router-dom";

import type { Rol } from "../features/usuarios/types/usuario";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  roles?: Rol[];
}

/** Sin sesión → /login. Sin el rol pedido → /unauthorized.
 *  Es solo comodidad para la UI: la protección real está en el backend (require_role). */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const cargando = useAuthStore((s) => s.cargando);
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!usuario) {
    // Guarda a dónde quería ir para volver después del login
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
