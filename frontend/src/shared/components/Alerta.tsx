export function Alerta({ mensaje, tipo = "error" }: { mensaje: string | null; tipo?: "error" | "exito" }) {
  if (!mensaje) return null;
  const clase =
    tipo === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700";
  return <div className={`rounded-lg border px-4 py-3 text-sm ${clase}`}>{mensaje}</div>;
}
