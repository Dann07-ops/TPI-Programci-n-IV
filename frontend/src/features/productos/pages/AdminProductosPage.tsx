import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { handleApiError } from "../../../shared/api/handleApiError";
import { Alerta } from "../../../shared/components/Alerta";
import { DataTable } from "../../../shared/components/DataTable";
import { EstadoError } from "../../../shared/components/EstadoError";
import { SkeletonFilas } from "../../../shared/components/Skeleton";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import { formatPrecio } from "../../../shared/utils/formato";
import { useCategorias } from "../../categorias/hooks/useCategorias";
import { ProductoForm } from "../components/ProductoForm";
import { StockForm } from "../components/StockForm";
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from "../hooks/useProductos";
import type { Producto, ProductoCreate, ProductoStockUpdate } from "../types/producto";

type ModalAbierto =
  | { tipo: "crear" }
  | { tipo: "editar"; producto: Producto }
  | { tipo: "stock"; producto: Producto }
  | null;

export function AdminProductosPage() {
  // El panel pide limit=100 y pagina del lado del cliente con TanStack Table
  const { data, isPending, isError, error, refetch } = useProductos({ skip: 0, limit: 100 });
  const { data: categorias = [] } = useCategorias();
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();
  const actualizarStock = useActualizarStock();
  const eliminar = useEliminarProducto();

  const [modal, setModal] = useState<ModalAbierto>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const abrir = (m: ModalAbierto) => {
    setErrorForm(null);
    setModal(m);
  };

  const ejecutar = async (accion: () => Promise<unknown>) => {
    try {
      await accion();
      setModal(null);
    } catch (e) {
      setErrorForm(handleApiError(e));
    }
  };

  const guardarProducto = (datos: ProductoCreate) =>
    ejecutar(() =>
      modal?.tipo === "editar"
        ? actualizar.mutateAsync({ id: modal.producto.id, datos })
        : crear.mutateAsync(datos),
    );

  const guardarStock = (datos: ProductoStockUpdate) =>
    ejecutar(() =>
      modal?.tipo === "stock" ? actualizarStock.mutateAsync({ id: modal.producto.id, datos }) : Promise.resolve(),
    );

  const columnas = useMemo<ColumnDef<Producto>[]>(
    () => [
      { accessorKey: "id", header: "#" },
      { accessorKey: "nombre", header: "Nombre" },
      {
        id: "categoria",
        header: "Categoría",
        accessorFn: (p) => p.categoria.nombre,
      },
      {
        accessorKey: "precio_base",
        header: "Precio",
        cell: ({ row }) => formatPrecio(row.original.precio_base),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
          <span className={row.original.stock === 0 ? "font-semibold text-red-600" : ""}>{row.original.stock}</span>
        ),
      },
      {
        accessorKey: "disponible",
        header: "Disponible",
        cell: ({ row }) =>
          row.original.disponible ? (
            <span className="text-green-700">Sí</span>
          ) : (
            <span className="text-red-600">No</span>
          ),
      },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Button variante="secundario" tamano="sm" onClick={() => abrir({ tipo: "editar", producto: row.original })}>
              Editar
            </Button>
            <Button variante="secundario" tamano="sm" onClick={() => abrir({ tipo: "stock", producto: row.original })}>
              Stock
            </Button>
            <Button
              variante="peligro"
              tamano="sm"
              onClick={() => {
                if (window.confirm(`¿Dar de baja "${row.original.nombre}"?`)) eliminar.mutate(row.original.id);
              }}
            >
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [eliminar],
  );

  const titulo =
    modal?.tipo === "crear"
      ? "Nuevo producto"
      : modal?.tipo === "editar"
        ? `Editar "${modal.producto.nombre}"`
        : modal?.tipo === "stock"
          ? `Stock de "${modal.producto.nombre}"`
          : "";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Productos</h2>
        <Button onClick={() => abrir({ tipo: "crear" })} disabled={categorias.length === 0}>
          + Nuevo producto
        </Button>
      </div>

      <div className="mb-4">
        <Alerta mensaje={eliminar.isError ? handleApiError(eliminar.error) : null} />
      </div>

      {isPending ? (
        <SkeletonFilas />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : (
        <DataTable data={data.items} columns={columnas} />
      )}

      <Modal abierto={modal !== null} titulo={titulo} onClose={() => setModal(null)}>
        <div className="mb-4">
          <Alerta mensaje={errorForm} />
        </div>
        {(modal?.tipo === "crear" || modal?.tipo === "editar") && (
          <ProductoForm
            key={modal.tipo === "editar" ? modal.producto.id : "nuevo"}
            inicial={modal.tipo === "editar" ? modal.producto : undefined}
            categorias={categorias}
            onGuardar={guardarProducto}
            onCancelar={() => setModal(null)}
          />
        )}
        {modal?.tipo === "stock" && (
          <StockForm
            key={modal.producto.id}
            producto={modal.producto}
            onGuardar={guardarStock}
            onCancelar={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  );
}
