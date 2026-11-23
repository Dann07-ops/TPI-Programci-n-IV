import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { handleApiError } from "../../../shared/api/handleApiError";
import { Alerta } from "../../../shared/components/Alerta";
import { DataTable } from "../../../shared/components/DataTable";
import { EstadoError } from "../../../shared/components/EstadoError";
import { SkeletonFilas } from "../../../shared/components/Skeleton";
import { Button } from "../../../shared/ui/Button";
import { useAuthStore } from "../../../store/authStore";
import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from "../hooks/useUsuarios";
import type { Usuario } from "../types/usuario";

export function AdminUsuariosPage() {
  const { data, isPending, isError, error, refetch } = useUsuarios();
  const activar = useActivarUsuario();
  const desactivar = useDesactivarUsuario();
  const usuarioSesion = useAuthStore((s) => s.usuario);

  const errorAccion = activar.error ?? desactivar.error;

  const columnas = useMemo<ColumnDef<Usuario>[]>(
    () => [
      { accessorKey: "username", header: "Usuario" },
      { accessorKey: "full_name", header: "Nombre" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Rol",
        cell: ({ row }) => (
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
              row.original.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-700"
            }`}
          >
            {row.original.role}
          </span>
        ),
      },
      {
        accessorKey: "disabled",
        header: "Estado",
        cell: ({ row }) =>
          row.original.disabled ? (
            <span className="font-medium text-red-600">Desactivado</span>
          ) : (
            <span className="font-medium text-green-700">Activo</span>
          ),
      },
      {
        id: "acciones",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          const esYo = u.id === usuarioSesion?.id;
          return (
            <div className="flex gap-2">
              {u.disabled ? (
                <Button
                  tamano="sm"
                  cargando={activar.isPending && activar.variables === u.id}
                  onClick={() => activar.mutate(u.id)}
                >
                  Activar
                </Button>
              ) : (
                // El botón Desactivar no se muestra en la fila del usuario de la sesión
                !esYo && (
                  <Button
                    variante="peligro"
                    tamano="sm"
                    cargando={desactivar.isPending && desactivar.variables === u.id}
                    onClick={() => {
                      if (window.confirm(`¿Desactivar a "${u.username}"? No podrá iniciar sesión.`)) {
                        desactivar.mutate(u.id);
                      }
                    }}
                  >
                    Desactivar
                  </Button>
                )
              )}
              {esYo && <span className="text-xs text-gray-400">(vos)</span>}
            </div>
          );
        },
      },
    ],
    [activar, desactivar, usuarioSesion],
  );

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Usuarios</h2>
      <div className="mb-4">
        <Alerta mensaje={errorAccion ? handleApiError(errorAccion) : null} />
      </div>
      {isPending ? (
        <SkeletonFilas />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : (
        <DataTable data={data} columns={columnas} />
      )}
    </div>
  );
}
