import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { handleApiError } from "../../../shared/api/handleApiError";
import { Alerta } from "../../../shared/components/Alerta";
import { DataTable } from "../../../shared/components/DataTable";
import { EstadoError } from "../../../shared/components/EstadoError";
import { SkeletonFilas } from "../../../shared/components/Skeleton";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import { CategoriaForm } from "../components/CategoriaForm";
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from "../hooks/useCategorias";
import type { Categoria, CategoriaCreate } from "../types/categoria";

// undefined = modal cerrado · null = creando · Categoria = editando
type Edicion = Categoria | null | undefined;

export function AdminCategoriasPage() {
  const { data, isPending, isError, error, refetch } = useCategorias();
  const crear = useCrearCategoria();
  const actualizar = useActualizarCategoria();
  const eliminar = useEliminarCategoria();
  const [edicion, setEdicion] = useState<Edicion>(undefined);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const abrir = (categoria: Categoria | null) => {
    setErrorForm(null);
    setEdicion(categoria);
  };

  const guardar = async (datos: CategoriaCreate) => {
    try {
      if (edicion) await actualizar.mutateAsync({ id: edicion.id, datos });
      else await crear.mutateAsync(datos);
      setEdicion(undefined);
    } catch (e) {
      setErrorForm(handleApiError(e)); // ej.: 409 nombre duplicado
    }
  };

  const columnas = useMemo<ColumnDef<Categoria>[]>(
    () => [
      { accessorKey: "id", header: "#" },
      { accessorKey: "nombre", header: "Nombre" },
      {
        accessorKey: "descripcion",
        header: "Descripción",
        cell: ({ row }) => row.original.descripcion ?? <span className="text-gray-400">—</span>,
      },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variante="secundario" tamano="sm" onClick={() => abrir(row.original)}>
              Editar
            </Button>
            <Button
              variante="peligro"
              tamano="sm"
              onClick={() => {
                if (
                  window.confirm(
                    `¿Dar de baja "${row.original.nombre}"? Sus productos siguen visibles: dalos de baja aparte si corresponde.`,
                  )
                ) {
                  eliminar.mutate(row.original.id);
                }
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Categorías</h2>
        <Button onClick={() => abrir(null)}>+ Nueva categoría</Button>
      </div>

      <div className="mb-4">
        <Alerta mensaje={eliminar.isError ? handleApiError(eliminar.error) : null} />
      </div>

      {isPending ? (
        <SkeletonFilas />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : (
        <DataTable data={data} columns={columnas} />
      )}

      <Modal
        abierto={edicion !== undefined}
        titulo={edicion ? `Editar "${edicion.nombre}"` : "Nueva categoría"}
        onClose={() => setEdicion(undefined)}
      >
        <div className="mb-4">
          <Alerta mensaje={errorForm} />
        </div>
        <CategoriaForm
          key={edicion?.id ?? "nueva"}
          inicial={edicion ?? undefined}
          onGuardar={guardar}
          onCancelar={() => setEdicion(undefined)}
        />
      </Modal>
    </div>
  );
}
