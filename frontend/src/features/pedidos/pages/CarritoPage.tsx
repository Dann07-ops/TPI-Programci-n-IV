import { Link, useNavigate } from "react-router-dom";

import { EstadoVacio } from "../../../shared/components/EstadoVacio";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { formatPrecio } from "../../../shared/utils/formato";
import { useAuthStore } from "../../../store/authStore";
import { useCartStore } from "../../../store/cartStore";

export function CarritoPage() {
  const items = useCartStore((s) => s.items);
  const quitar = useCartStore((s) => s.quitar);
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad);
  const vaciar = useCartStore((s) => s.vaciar);
  const total = useCartStore((s) => s.total());
  const usuario = useAuthStore((s) => s.usuario);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu carrito está vacío"
        mensaje="Agregá productos desde el catálogo."
        accion={
          <Link to="/">
            <Button>Ver catálogo</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tu carrito</h1>
          <Button variante="fantasma" tamano="sm" onClick={vaciar}>
            Vaciar carrito
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.producto_id} className="flex items-center gap-4">
              {item.imagen_url ? (
                <img src={item.imagen_url} alt={item.nombre} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-orange-50 text-2xl">🍽️</div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-sm text-gray-500">{formatPrecio(item.precio_unitario)} c/u</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variante="secundario"
                  tamano="sm"
                  disabled={item.cantidad <= 1}
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                  aria-label="Restar uno"
                >
                  −
                </Button>
                <span className="w-8 text-center font-medium">{item.cantidad}</span>
                <Button
                  variante="secundario"
                  tamano="sm"
                  disabled={item.cantidad >= item.stock}
                  onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                  aria-label="Sumar uno"
                >
                  +
                </Button>
              </div>

              <p className="w-28 text-right font-semibold">{formatPrecio(item.precio_unitario * item.cantidad)}</p>
              <Button variante="fantasma" tamano="sm" onClick={() => quitar(item.producto_id)} aria-label="Quitar">
                ✕
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Card className="h-fit p-5">
        <h2 className="mb-3 text-lg font-semibold">Resumen</h2>
        <div className="flex justify-between text-gray-600">
          <span>Productos</span>
          <span>{items.reduce((acc, i) => acc + i.cantidad, 0)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrecio(total)}</span>
        </div>
        <Button className="mt-4 w-full" onClick={() => navigate("/checkout")}>
          {usuario ? "Confirmar pedido" : "Ingresar para confirmar"}
        </Button>
        <p className="mt-2 text-xs text-gray-500">
          Los precios y el stock se verifican al confirmar el pedido.
        </p>
      </Card>
    </div>
  );
}
