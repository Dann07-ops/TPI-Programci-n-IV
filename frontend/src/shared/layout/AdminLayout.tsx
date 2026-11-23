import { NavLink, Outlet } from "react-router-dom";

const secciones = [
  { to: "/admin/resumen", texto: "Resumen" },
  { to: "/admin/pedidos", texto: "Pedidos" },
  { to: "/admin/productos", texto: "Productos" },
  { to: "/admin/categorias", texto: "Categorías" },
  { to: "/admin/usuarios", texto: "Usuarios" },
];

export function AdminLayout() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Panel de administración</h1>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {secciones.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm font-medium ${
                isActive ? "bg-orange-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            {s.texto}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
