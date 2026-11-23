import { useEffect, useState } from "react";

/** Devuelve el valor recién cuando dejó de cambiar durante `ms` milisegundos.
 *  Evita pedir el catálogo al servidor en cada tecla de la búsqueda. */
export function useDebounce<T>(valor: T, ms = 400): T {
  const [debounced, setDebounced] = useState(valor);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(timer);
  }, [valor, ms]);

  return debounced;
}
