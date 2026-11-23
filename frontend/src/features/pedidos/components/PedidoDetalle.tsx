import { EstadoError } from "../../../shared/components/EstadoError";
import { SkeletonFilas } from "../../../shared/components/Skeleton";
import { BadgeEstado } from "../../../shared/ui/BadgeEstado";
import { formatFecha, formatPrecio } from "../../../shared/utils/formato";
import { usePedido } from "../hooks/usePedidos";

/** Detalle de un pedido con sus líneas (GET /pedidos/{id}). */
export function PedidoDetalle({ pedidoId }: { pedidoId: number }) {
  const { data: pedido, isPending, isError, error } = usePedido(pedidoId);

  if (isPending) return <SkeletonFilas filas={4} />;
  if (isError) return <EstadoError error={error} />;

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-gray-500">Estado</p>
          <BadgeEstado estado={pedido.estado} />
        </div>
        <div>
          <p className="text-gray-500">Fecha</p>
          <p>{formatFecha(pedido.created_at)}</p>
        </div>
        <div>
          <p className="text-gray-500">Forma de pago</p>
          <p>{pedido.forma_pago === "EFECTIVO" ? "Efectivo" : "Transferencia"}</p>
        </div>
        <div>
          <p className="text-gray-500">Última actualización</p>
          <p>{formatFecha(pedido.updated_at)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Dirección de entrega</p>
          <p>{pedido.direccion_entrega}</p>
        </div>
        {pedido.notas && (
          <div className="col-span-2">
            <p className="text-gray-500">Notas</p>
            <p>{pedido.notas}</p>
          </div>
        )}
      </div>

      <table className="w-full">
        <thead className="border-b text-left text-gray-500">
          <tr>
            <th className="py-2">Producto</th>
            <th className="py-2 text-right">Precio</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {pedido.items.map((linea) => (
            <tr key={linea.producto_id} className="border-b border-gray-100">
              <td className="py-2">{linea.nombre_producto}</td>
              <td className="py-2 text-right">{formatPrecio(linea.precio_unitario)}</td>
              <td className="py-2 text-right">{linea.cantidad}</td>
              <td className="py-2 text-right">{formatPrecio(linea.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td colSpan={3} className="py-2 text-right">
              Total
            </td>
            <td className="py-2 text-right">{formatPrecio(pedido.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
