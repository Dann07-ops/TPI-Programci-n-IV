import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { handleApiError } from "../../../shared/api/handleApiError";
import { Alerta } from "../../../shared/components/Alerta";
import { EstadoError } from "../../../shared/components/EstadoError";
import { EstadoVacio } from "../../../shared/components/EstadoVacio";
import { Paginacion } from "../../../shared/components/Paginacion";
import { SkeletonFilas } from "../../../shared/components/Skeleton";
import { BadgeEstado } from "../../../shared/ui/BadgeEstado";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Modal } from "../../../shared/ui/Modal";
import { formatFecha, formatPrecio } from "../../../shared/utils/formato";
import { PedidoDetalle } from "../components/PedidoDetalle";
import { useCancelarPedido, usePedidos } from "../hooks/usePedidos";

const POR_PAGINA = 10;

export function MisPedidosPage() {
  const [pagina, setPagina] = useState(0);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const location = useLocation();
  const pedidoCreado = (location.state as { pedidoCreado?: boolean } | null)?.pedidoCreado;

  const { data, isPending, isError, error, refetch } = usePedidos({
    skip: pagina * POR_PAGINA,
    limit: POR_PAGINA,
  });
  const cancelar = useCancelarPedido();

  const confirmarCancelacion = (id: number) => {
    if (window.confirm(`¿Cancelar el pedido #${id}? El stock se devolverá al negocio.`)) {
      cancelar.mutate(id);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Mis pedidos</h1>

      <div className="mb-4 space-y-2">
        {pedidoCreado && <Alerta tipo="exito" mensaje="¡Pedido confirmado! Te avisamos cuando esté en preparación." />}
        <Alerta mensaje={cancelar.isError ? handleApiError(cancelar.error) : null} />
      </div>

      {isPending ? (
        <SkeletonFilas filas={4} />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hiciste pedidos"
          accion={
            <Link to="/">
              <Button>Ir al catálogo</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((pedido) => (
              <Card key={pedido.id} className="flex flex-wrap items-center gap-4">
                <div className="min-w-24">
                  <p className="font-semibold">Pedido #{pedido.id}</p>
                  <p className="text-sm text-gray-500">{formatFecha(pedido.created_at)}</p>
                </div>
                <BadgeEstado estado={pedido.estado} />
                <p className="flex-1 text-sm text-gray-600">
                  {pedido.items.length} producto{pedido.items.length === 1 ? "" : "s"} ·{" "}
                  {pedido.forma_pago === "EFECTIVO" ? "Efectivo" : "Transferencia"}
                </p>
                <p className="text-lg font-bold">{formatPrecio(pedido.total)}</p>
                <div className="flex gap-2">
                  <Button variante="secundario" tamano="sm" onClick={() => setSeleccionado(pedido.id)}>
                    Ver detalle
                  </Button>
                  {/* El cliente solo puede cancelar en PENDIENTE (RN-04) */}
                  {pedido.estado === "PENDIENTE" && (
                    <Button
                      variante="peligro"
                      tamano="sm"
                      cargando={cancelar.isPending && cancelar.variables === pedido.id}
                      onClick={() => confirmarCancelacion(pedido.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Paginacion
            pagina={pagina}
            totalPaginas={Math.ceil(data.total / POR_PAGINA)}
            onCambiar={setPagina}
          />
        </>
      )}

      <Modal
        abierto={seleccionado !== null}
        titulo={`Pedido #${seleccionado ?? ""}`}
        onClose={() => setSeleccionado(null)}
      >
        {seleccionado !== null && <PedidoDetalle pedidoId={seleccionado} />}
      </Modal>
    </div>
  );
}
