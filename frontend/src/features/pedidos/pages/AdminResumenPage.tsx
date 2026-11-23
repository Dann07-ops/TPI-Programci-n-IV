import { EstadoError } from "../../../shared/components/EstadoError";
import { Skeleton } from "../../../shared/components/Skeleton";
import { formatPrecio } from "../../../shared/utils/formato";
import { ResumenCard } from "../components/ResumenCard";
import { useResumenPedidos } from "../hooks/usePedidos";

export function AdminResumenPage() {
  const { data, isPending, isError, error, refetch } = useResumenPedidos();

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }
  if (isError) return <EstadoError error={error} onReintentar={() => void refetch()} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ResumenCard titulo="Pendientes" valor={data.pendientes} icono="⏳" color="bg-yellow-100" />
      <ResumenCard titulo="En preparación" valor={data.en_preparacion} icono="👨‍🍳" color="bg-blue-100" />
      <ResumenCard titulo="Entregados" valor={data.entregados} icono="✅" color="bg-green-100" />
      <ResumenCard titulo="Cancelados" valor={data.cancelados} icono="❌" color="bg-red-100" />
      <ResumenCard titulo="Pedidos de hoy" valor={data.pedidos_hoy} icono="📅" color="bg-purple-100" />
      <ResumenCard
        titulo="Ingresos (entregados)"
        valor={formatPrecio(data.ingresos_entregados)}
        icono="💰"
        color="bg-orange-100"
      />
    </div>
  );
}
