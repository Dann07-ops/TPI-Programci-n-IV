import axios from "axios";

interface ErrorValidacion {
  loc?: (string | number)[];
  msg?: string;
}

/** Convierte cualquier error de la API en un mensaje legible para la pantalla. */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "No se pudo conectar con el servidor. Verificá que el backend esté corriendo.";
    }
    const detail = (error.response.data as { detail?: unknown } | undefined)?.detail;

    // Errores de negocio: detail es un string ("Stock insuficiente...")
    if (typeof detail === "string") return detail;

    // Errores 422 de validación: detail es una lista
    if (Array.isArray(detail)) {
      return (detail as ErrorValidacion[])
        .map((e) => {
          const campo = e.loc?.[e.loc.length - 1];
          return campo ? `${String(campo)}: ${e.msg ?? ""}` : (e.msg ?? "");
        })
        .join(" · ");
    }
    return `Error ${error.response.status}`;
  }
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado";
}
