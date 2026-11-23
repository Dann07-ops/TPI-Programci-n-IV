import { Link } from "react-router-dom";

import { Card } from "../../../shared/ui/Card";

export function UnauthorizedPage() {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <p className="text-5xl">🚫</p>
      <h1 className="mt-3 text-2xl font-bold">Sin permiso</h1>
      <p className="mt-2 text-gray-600">No tenés permisos para acceder a esta sección.</p>
      <Link to="/" className="mt-5 inline-block font-medium text-orange-600 hover:underline">
        Volver al inicio
      </Link>
    </Card>
  );
}
