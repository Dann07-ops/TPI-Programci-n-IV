import { useState } from "react";

import { EstadoError } from "../../../shared/components/EstadoError";
import { EstadoVacio } from "../../../shared/components/EstadoVacio";
import { Paginacion } from "../../../shared/components/Paginacion";
import { SkeletonGrid } from "../../../shared/components/Skeleton";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { Button } from "../../../shared/ui/Button";
import { Input, Select } from "../../../shared/ui/Input";
import { useCategorias } from "../../categorias/hooks/useCategorias";
import { ProductoCard } from "../components/ProductoCard";
import { useProductos } from "../hooks/useProductos";
import type { FiltrosProductos } from "../types/producto";

const POR_PAGINA = 8;

export function CatalogoPage() {
  const [pagina, setPagina] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const busquedaDebounced = useDebounce(busqueda);

  const filtros: FiltrosProductos = {
    skip: pagina * POR_PAGINA, // paginación en el servidor: skip = página × limit
    limit: POR_PAGINA,
    search: busquedaDebounced.trim() || undefined,
    categoria_id: categoriaId,
  };

  const { data, isPending, isError, error, refetch, isFetching } = useProductos(filtros);
  const { data: categorias } = useCategorias();

  const totalPaginas = data ? Math.ceil(data.total / POR_PAGINA) : 0;
  const hayFiltros = Boolean(busqueda || categoriaId);

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaId(undefined);
    setPagina(0);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-gray-500">Elegí tus comidas favoritas y armá tu pedido.</p>
        </div>
        <Input
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(0); // al cambiar un filtro se vuelve a la primera página
          }}
          className="md:w-64"
          aria-label="Buscar productos"
        />
        <Select
          value={categoriaId ?? ""}
          onChange={(e) => {
            setCategoriaId(e.target.value ? Number(e.target.value) : undefined);
            setPagina(0);
          }}
          className="md:w-52"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categorias?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>

      {isPending ? (
        <SkeletonGrid cantidad={POR_PAGINA} />
      ) : isError ? (
        <EstadoError error={error} onReintentar={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EstadoVacio
          titulo="No encontramos productos"
          mensaje={hayFiltros ? "Probá con otra búsqueda o categoría." : "Todavía no hay productos cargados."}
          accion={
            hayFiltros ? (
              <Button variante="secundario" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">
            {data.total} producto{data.total === 1 ? "" : "s"}
            {isFetching && " · actualizando..."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}
    </div>
  );
}
