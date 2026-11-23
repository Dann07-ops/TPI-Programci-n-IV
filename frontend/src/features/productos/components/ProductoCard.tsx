import { useState } from "react";

import { Button } from "../../../shared/ui/Button";
import { formatPrecio } from "../../../shared/utils/formato";
import { useCartStore } from "../../../store/cartStore";
import type { Producto } from "../types/producto";

interface ProductoCardProps {
  producto: Producto;
}

export function ProductoCard({ producto }: ProductoCardProps) {
  const agregar = useCartStore((s) => s.agregar);
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0);
  const [imagenRota, setImagenRota] = useState(false);

  const sinStock = producto.stock === 0;
  const vendible = producto.disponible && !sinStock;
  const llegoAlMaximo = enCarrito >= producto.stock;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {producto.imagen_url && !imagenRota ? (
        <img
          src={producto.imagen_url}
          alt={producto.nombre}
          className="h-40 w-full object-cover"
          onError={() => setImagenRota(true)}
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-orange-50 text-5xl">🍽️</div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium uppercase text-orange-600">{producto.categoria.nombre}</span>
        <h3 className="mt-1 font-semibold text-gray-900">{producto.nombre}</h3>
        {producto.descripcion && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{producto.descripcion}</p>}

        <div className="mt-auto pt-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-lg font-bold">{formatPrecio(producto.precio_base)}</span>
            <span className={`text-xs ${vendible ? "text-gray-500" : "text-red-600"}`}>
              {!producto.disponible ? "No disponible" : sinStock ? "Sin stock" : `Stock: ${producto.stock}`}
            </span>
          </div>
          <Button
            className="w-full"
            disabled={!vendible || llegoAlMaximo}
            onClick={() => agregar(producto)}
          >
            {llegoAlMaximo && vendible ? "Máximo en el carrito" : "Agregar al carrito"}
            {enCarrito > 0 && !llegoAlMaximo && ` (${enCarrito})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
