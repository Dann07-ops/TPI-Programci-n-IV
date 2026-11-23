import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { Button } from "../ui/Button";

const claseLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-orange-100 text-orange-700" : "text-gray-700 hover:bg-gray-100"
  }`;

export function Navbar() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const cantidadCarrito = useCartStore((s) => s.cantidadItems());
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-4 text-xl font-bold text-orange-600">
          🍕 Food Store
        </Link>

        <NavLink to="/" end className={claseLink}>
          Catálogo
        </NavLink>
        <NavLink to="/carrito" className={claseLink}>
          Carrito
          {cantidadCarrito > 0 && (
            <span className="ml-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
              {cantidadCarrito}
            </span>
          )}
        </NavLink>
        {usuario && (
          <NavLink to="/mis-pedidos" className={claseLink}>
            Mis pedidos
          </NavLink>
        )}
        {/* El acceso al panel se muestra solo al admin (la protección real está en el backend) */}
        {usuario?.role === "admin" && (
          <NavLink to="/admin" className={claseLink}>
            Panel admin
          </NavLink>
        )}

        <div className="ml-auto flex items-center gap-3">
          {usuario ? (
            <>
              <span className="text-sm text-gray-600">
                {usuario.full_name}{" "}
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs uppercase text-gray-500">
                  {usuario.role}
                </span>
              </span>
              <Button variante="secundario" tamano="sm" onClick={cerrarSesion}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={claseLink}>
                Ingresar
              </NavLink>
              <NavLink to="/register" className={claseLink}>
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
