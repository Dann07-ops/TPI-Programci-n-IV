import { useForm } from "@tanstack/react-form";

import { Button } from "../../../shared/ui/Button";
import { Input, TextArea } from "../../../shared/ui/Input";
import { primerError } from "../../../shared/utils/formato";
import type { Categoria, CategoriaCreate } from "../types/categoria";

interface CategoriaFormProps {
  inicial?: Categoria;
  onGuardar: (datos: CategoriaCreate) => Promise<void>;
  onCancelar: () => void;
}

export function CategoriaForm({ inicial, onGuardar, onCancelar }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: inicial?.nombre ?? "", descripcion: inicial?.descripcion ?? "" },
    onSubmit: async ({ value }) =>
      onGuardar({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }),
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
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length;
            if (largo < 2) return "Mínimo 2 caracteres";
            if (largo > 100) return "Máximo 100 caracteres";
            return undefined;
          },
        }}
      >
        {(field) => (
          <Input
            id="cat-nombre"
            label="Nombre"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={field.state.meta.isTouched ? primerError(field.state.meta.errors) : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="descripcion"
        validators={{ onChange: ({ value }) => (value.length > 500 ? "Máximo 500 caracteres" : undefined) }}
      >
        {(field) => (
          <TextArea
            id="cat-descripcion"
            label="Descripción"
            rows={3}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={primerError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      <div className="flex justify-end gap-2">
        <Button type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} cargando={isSubmitting}>
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
