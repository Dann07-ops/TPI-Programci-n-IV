import { Card } from "../../../shared/ui/Card";

interface ResumenCardProps {
  titulo: string;
  valor: string | number;
  icono: string;
  color: string; // clases de Tailwind para el ícono
}

export function ResumenCard({ titulo, valor, icono, color }: ResumenCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${color}`}>{icono}</div>
      <div>
        <p className="text-sm text-gray-500">{titulo}</p>
        <p className="text-2xl font-bold">{valor}</p>
      </div>
    </Card>
  );
}
