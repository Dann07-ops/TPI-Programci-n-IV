import type { ReactNode } from "react";

interface EstadoVacioProps {
  titulo: string;
  mensaje?: string;
  accion?: ReactNode;
}

export function EstadoVacio({ titulo, mensaje, accion }: EstadoVacioProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white py-12 text-center">
      <p className="text-4xl">🍽️</p>
      <h3 className="mt-2 text-lg font-semibold text-gray-800">{titulo}</h3>
      {mensaje && <p className="mt-1 text-gray-500">{mensaje}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}
