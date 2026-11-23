import { useCallback, useState } from "react";

import { handleApiError } from "../../../shared/api/handleApiError";
import { Alerta } from "../../../shared/components/Alerta";
import { EstadoError } from "../../../shared/components/EstadoError";
import { SkeletonFilas } from "../../../shared/components/Skeleton";
import { textoEstado } from "../../../shared/ui/BadgeEstado";
import { Select } from "../../../shared/ui/Input";
import { Modal } from "../../../shared/ui/Modal";
import { useUsuarios } from "../../usuarios/hooks/useUsuarios";
import { PedidoDetalle } from "../components/PedidoDetalle";
import { TablaPedidos } from "../components/TablaPedidos";
import { useCambiarEstadoPedido, usePedidos } from "../hooks/usePedidos";
import { ESTADOS_PEDIDO, type EstadoPedido } from "../types/pedido";

export function AdminPedidosPage() {
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);

  // El panel pide hasta 100 y pagina en el cliente con TanStack Table
  const { data, isPending, isError, error, refetch } = usePedidos({ skip: 0, limit: 100, estado });
  const { data: usuarios } = useUsuarios();
  const cambiarEstado = useCambiarEstadoPedido();

  const nombreCliente = useCallback(
    (usuarioId: number) => usuarios?.find((u) => u.id === usuarioId)?.username ?? `Usuario #${usuarioId}`,
    [usuarios],
  );

  const onCambiarEstado = useCallback(
    (id: number, nuevo: EstadoPedido) => {
      const accion = nuevo === "CANCELADO" ? "cancelar (se restituye el stock)" : `pasar a "${textoEstado(nuevo)}"`;
      if (window.confirm(`¿Seguro que querés ${accion} el pedido #${id}?`)) {
        cambiarEstado.mutate({ id, estado: nuevo });
      }
    },
    [cambiarEstado],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold">Pedidos</h2>
        <Select
          value={estado ?? ""}
          onChange={(e) => setEstado(e.target.value ? (e.target.value as EstadoPedido) : undefined)}
          className="w-56"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_PEDIDO.map((e) => (
            <option key={e} value={e}>
              {textoEstado(e)}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-4">
        <Alerta mensaje={cambiarEstado.isError ? handleApiError(cambiarEstado.error) : null} />
      </div>

      {isPending ? (
        <SkeletonFilas />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : (
        <TablaPedidos
          pedidos={data.items}
          nombreCliente={nombreCliente}
          onVer={setSeleccionado}
          onCambiarEstado={onCambiarEstado}
          procesandoId={cambiarEstado.isPending ? (cambiarEstado.variables?.id ?? null) : null}
        />
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
