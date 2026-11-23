import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { handleApiError } from "../../../shared/api/handleApiError";
import { Alerta } from "../../../shared/components/Alerta";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { primerError } from "../../../shared/utils/formato";
import { useAuthStore } from "../../../store/authStore";
import { registerRequest } from "../api/auth";
import type { RegisterData } from "../types/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const registro = useMutation({
    mutationFn: async (datos: RegisterData) => {
      await registerRequest(datos);
      // Después de registrarse, se inicia sesión automáticamente
      await login({ username: datos.username, password: datos.password });
    },
    onSuccess: () => navigate("/", { replace: true }),
  });

  const form = useForm({
    defaultValues: { username: "", full_name: "", email: "", password: "", confirmar: "" },
    onSubmit: async ({ value }) => {
      const { confirmar: _confirmar, ...datos } = value;
      await registro.mutateAsync(datos).catch(() => undefined);
    },
  });

  const errorDe = (meta: { isTouched: boolean; errors: unknown[] }) =>
    meta.isTouched ? primerError(meta.errors) : undefined;

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6">
        <h1 className="mb-1 text-2xl font-bold">Crear cuenta</h1>
        <p className="mb-5 text-sm text-gray-500">Registrate para hacer tus pedidos.</p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) =>
                value.trim().length < 3 ? "Mínimo 3 caracteres" : value.length > 50 ? "Máximo 50 caracteres" : undefined,
            }}
          >
            {(field) => (
              <Input
                id="username"
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="full_name"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : "Ingresá tu nombre completo") }}
          >
            {(field) => (
              <Input
                id="full_name"
                label="Nombre completo"
                autoComplete="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{ onChange: ({ value }) => (EMAIL_REGEX.test(value) ? undefined : "Email inválido") }}
          >
            {(field) => (
              <Input
                id="email"
                type="email"
                label="Email"
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                value.length < 8 ? "Mínimo 8 caracteres" : value.length > 72 ? "Máximo 72 caracteres" : undefined,
            }}
          >
            {(field) => (
              <Input
                id="password"
                type="password"
                label="Contraseña"
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="confirmar"
            validators={{
              onChangeListenTo: ["password"],
              onChange: ({ value, fieldApi }) =>
                value === fieldApi.form.getFieldValue("password") ? undefined : "Las contraseñas no coinciden",
            }}
          >
            {(field) => (
              <Input
                id="confirmar"
                type="password"
                label="Repetir contraseña"
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <Alerta mensaje={registro.isError ? handleApiError(registro.error) : null} />

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit} cargando={isSubmitting}>
                Crear cuenta
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-orange-600 hover:underline">
            Ingresá
          </Link>
        </p>
      </Card>
    </div>
  );
}
