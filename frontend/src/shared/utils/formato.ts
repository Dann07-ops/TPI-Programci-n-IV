const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatPrecio(valor: number): string {
  return formatoPrecio.format(valor);
}

export function formatFecha(iso: string): string {
  return formatoFecha.format(new Date(iso));
}

/** Primer mensaje de error de un campo de TanStack Form. */
export function primerError(errores: unknown[]): string | undefined {
  const error = errores.find((e) => e !== undefined && e !== null && e !== "");
  return error === undefined ? undefined : String(error);
}
