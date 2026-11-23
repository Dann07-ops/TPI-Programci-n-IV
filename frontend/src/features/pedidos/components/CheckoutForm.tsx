import { useForm } from "@tanstack/react-form";

import { Button } from "../../../shared/ui/Button";
import { Input, Select, TextArea } from "../../../shared/ui/Input";
import { primerError } from "../../../shared/utils/formato";
import type { FormaPago } from "../types/pedido";

export interface DatosCheckout {
  direccion_entrega: string;
  forma_pago: FormaPago;
  notas: string;
}

interface CheckoutFormProps {
  onConfirmar: (datos: DatosCheckout) => Promise<void>;
}

export function CheckoutForm({ onConfirmar }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: "", forma_pago: "EFECTIVO", notas: "" } as DatosCheckout,
    onSubmit: async ({ value }) => onConfirmar(value),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="direccion_entrega"
        validators={{
          // Misma regla que el backend (RN-06): entre 5 y 200 caracteres
          onChange: ({ value }) => {
            const largo = value.trim().length;
            if (largo < 5) return "La dirección debe tener al menos 5 caracteres";
            if (largo > 200) return "La dirección no puede superar los 200 caracteres";
            return undefined;
          },
        }}
      >
        {(field) => (
          <Input
            id="direccion_entrega"
            label="Dirección de entrega"
            placeholder="Calle, número, piso, depto."
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <Select
            id="forma_pago"
            label="Forma de pago"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value as FormaPago)}
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </Select>
        )}
      </form.Field>

      <form.Field
        name="notas"
        validators={{ onChange: ({ value }) => (value.length > 500 ? "Máximo 500 caracteres" : undefined) }}
      >
        {(field) => (
          <TextArea
            id="notas"
            label="Notas (opcional)"
            rows={3}
            placeholder="Ej.: tocar timbre 2B, sin cebolla..."
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={primerError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="w-full" disabled={!canSubmit} cargando={isSubmitting}>
            Confirmar pedido
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
