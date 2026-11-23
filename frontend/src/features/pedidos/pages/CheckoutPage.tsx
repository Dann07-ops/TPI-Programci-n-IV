import { Navigate, useNavigate } from "react-router-dom";

import { handleApiError } from "../../../shared/api/handleApiError";
import { Alerta } from "../../../shared/components/Alerta";
import { Card } from "../../../shared/ui/Card";
import { formatPrecio } from "../../../shared/utils/formato";
import { useCartStore } from "../../../store/cartStore";
import { CheckoutForm, type DatosCheckout } from "../components/CheckoutForm";
import { useCrearPedido } from "../hooks/usePedidos";

export function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const vaciar = useCartStore((s) => s.vaciar);
  const crearPedido = useCrearPedido();
  const navigate = useNavigate();

  // No se puede confirmar un carrito vacío (salvo justo después de crear el pedido)
  if (items.length === 0 && !crearPedido.isSuccess) return <Navigate to="/carrito" replace />;

  const confirmar = async (datos: DatosCheckout) => {
    try {
      await crearPedido.mutateAsync({
        // Solo se envía qué producto y cuántos: el precio lo pone el servidor
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        forma_pago: datos.forma_pago,
        direccion_entrega: datos.direccion_entrega.trim(),
        notas: datos.notas.trim() || null,
      });
      vaciar();
      navigate("/mis-pedidos", { replace: true, state: { pedidoCreado: true } });
    } catch {
      // El error queda en crearPedido.error y se muestra abajo
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h1 className="mb-4 text-2xl font-bold">Confirmar pedido</h1>
        <div className="mb-4">
          <Alerta mensaje={crearPedido.isError ? handleApiError(crearPedido.error) : null} />
        </div>
        <CheckoutForm onConfirmar={confirmar} />
      </Card>

      <Card className="h-fit p-5">
        <h2 className="mb-3 text-lg font-semibold">Tu pedido</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.producto_id} className="flex justify-between gap-2">
              <span>
                {i.cantidad} × {i.nombre}
              </span>
              <span className="font-medium">{formatPrecio(i.precio_unitario * i.cantidad)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrecio(total)}</span>
        </div>
      </Card>
    </div>
  );
}
