import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { handleApiError } from "../../../shared/api/handleApiError";
import { Alerta } from "../../../shared/components/Alerta";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { primerError } from "../../../shared/utils/formato";
import { useAuthStore } from "../../../store/authStore";
import type { LoginData } from "../types/auth";

export function LoginPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const cargandoSesion = useAuthStore((s) => s.cargando);
  const login = useAuthStore((s) => s.login);
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde;
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { username: "", password: "" } as LoginData,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await login(value);
        // No hace falta navegar acá: al quedar el usuario en el store,
        // el componente se vuelve a renderizar y entra en el <Navigate> de abajo.
      } catch (e) {
        setError(handleApiError(e));
      }
    },
  });

  // Con sesión iniciada: volver a la página que se quería ver,
  // o al panel si es admin, o al catálogo si es cliente.
  if (usuario && !cargandoSesion) {
    const destino = desde ?? (usuario.role === "admin" ? "/admin/resumen" : "/");
    return <Navigate to={destino} replace />;
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Ingresar</h1>
        <p className="mb-5 text-sm text-gray-500">Accedé con tu usuario para hacer pedidos.</p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Ingresá tu usuario") }}
          >
            {(field) => (
              <Input
                id="username"
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value ? undefined : "Ingresá tu contraseña") }}
          >
            {(field) => (
              <Input
                id="password"
                type="password"
                label="Contraseña"
                autoComplete="current-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
              />
            )}
          </form.Field>

          <Alerta mensaje={error} />

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit} cargando={isSubmitting}>
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="font-medium text-orange-600 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  );
}
