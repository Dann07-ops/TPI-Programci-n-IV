import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { DataTable } from "../../../shared/components/DataTable";
import { BadgeEstado } from "../../../shared/ui/BadgeEstado";
import { Button } from "../../../shared/ui/Button";
import { formatFecha, formatPrecio } from "../../../shared/utils/formato";
import { TRANSICIONES, type EstadoPedido, type Pedido } from "../types/pedido";

const textoAccion: Record<EstadoPedido, string> = {
  PENDIENTE: "Pendiente",
  EN_PREPARACION: "Preparar",
  ENTREGADO: "Entregar",
  CANCELADO: "Cancelar",
};

interface TablaPedidosProps {
  pedidos: Pedido[];
  nombreCliente: (usuarioId: number) => string;
  onVer: (id: number) => void;
  onCambiarEstado: (id: number, estado: EstadoPedido) => void;
  procesandoId: number | null;
}

export function TablaPedidos({ pedidos, nombreCliente, onVer, onCambiarEstado, procesandoId }: TablaPedidosProps) {
  const columnas = useMemo<ColumnDef<Pedido>[]>(
    () => [
      { accessorKey: "id", header: "#" },
      {
        id: "cliente",
        header: "Cliente",
        accessorFn: (p) => nombreCliente(p.usuario_id),
      },
      {
        accessorKey: "created_at",
        header: "Fecha",
        cell: ({ row }) => formatFecha(row.original.created_at),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatPrecio(row.original.total),
      },
      {
        accessorKey: "forma_pago",
        header: "Pago",
        cell: ({ row }) => (row.original.forma_pago === "EFECTIVO" ? "Efectivo" : "Transferencia"),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => <BadgeEstado estado={row.original.estado} />,
      },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const pedido = row.original;
          // Botones según la máquina de estados: solo las transiciones válidas
          return (
            <div className="flex flex-wrap gap-2">
              <Button variante="secundario" tamano="sm" onClick={() => onVer(pedido.id)}>
                Ver
              </Button>
              {TRANSICIONES[pedido.estado].map((destino) => (
                <Button
                  key={destino}
                  tamano="sm"
                  variante={destino === "CANCELADO" ? "peligro" : "primario"}
                  disabled={procesandoId === pedido.id}
                  onClick={() => onCambiarEstado(pedido.id, destino)}
                >
                  {textoAccion[destino]}
                </Button>
              ))}
            </div>
          );
        },
      },
    ],
    [nombreCliente, onVer, onCambiarEstado, procesandoId],
  );

  return <DataTable data={pedidos} columns={columnas} />;
}
