import { useForm } from "@tanstack/react-form";

import { Button } from "../../../shared/ui/Button";
import { Input, Select, TextArea } from "../../../shared/ui/Input";
import { primerError } from "../../../shared/utils/formato";
import type { Categoria } from "../../categorias/types/categoria";
import type { Producto, ProductoCreate } from "../types/producto";

interface ProductoFormProps {
  inicial?: Producto;
  categorias: Categoria[];
  onGuardar: (datos: ProductoCreate) => Promise<void>;
  onCancelar: () => void;
}

interface ValoresForm {
  nombre: string;
  descripcion: string;
  precio_base: string;
  imagen_url: string;
  stock: string;
  disponible: boolean;
  categoria_id: string;
}

export function ProductoForm({ inicial, categorias, onGuardar, onCancelar }: ProductoFormProps) {
  const valoresIniciales: ValoresForm = {
    nombre: inicial?.nombre ?? "",
    descripcion: inicial?.descripcion ?? "",
    precio_base: inicial ? String(inicial.precio_base) : "",
    imagen_url: inicial?.imagen_url ?? "",
    stock: inicial ? String(inicial.stock) : "0",
    disponible: inicial?.disponible ?? true,
    categoria_id: inicial ? String(inicial.categoria_id) : "",
  };

  const form = useForm({
    defaultValues: valoresIniciales,
    onSubmit: async ({ value }) =>
      onGuardar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: Number(value.precio_base),
        imagen_url: value.imagen_url.trim() || null,
        stock: Number(value.stock),
        disponible: value.disponible,
        categoria_id: Number(value.categoria_id),
      }),
  });

  const errorDe = (meta: { isTouched: boolean; errors: unknown[] }) =>
    meta.isTouched ? primerError(meta.errors) : undefined;

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
          onChange: ({ value }) =>
            !value.trim() ? "El nombre es obligatorio" : value.length > 150 ? "Máximo 150 caracteres" : undefined,
        }}
      >
        {(field) => (
          <Input
            id="prod-nombre"
            label="Nombre"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={errorDe(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="descripcion">
        {(field) => (
          <TextArea
            id="prod-descripcion"
            label="Descripción"
            rows={2}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field
          name="precio_base"
          validators={{
            onChange: ({ value }) =>
              value === "" || Number.isNaN(Number(value))
                ? "Ingresá un precio"
                : Number(value) < 0
                  ? "No puede ser negativo"
                  : undefined,
          }}
        >
          {(field) => (
            <Input
              id="prod-precio"
              label="Precio"
              type="number"
              min={0}
              step="0.01"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={errorDe(field.state.meta)}
            />
          )}
        </form.Field>

        <form.Field
          name="stock"
          validators={{
            onChange: ({ value }) =>
              !Number.isInteger(Number(value)) || value === ""
                ? "Debe ser un número entero"
                : Number(value) < 0
                  ? "No puede ser negativo"
                  : undefined,
          }}
        >
          {(field) => (
            <Input
              id="prod-stock"
              label="Stock"
              type="number"
              min={0}
              step={1}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              error={errorDe(field.state.meta)}
            />
          )}
        </form.Field>
      </div>

      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (value ? undefined : "Elegí una categoría") }}
      >
        {(field) => (
          <Select
            id="prod-categoria"
            label="Categoría"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={errorDe(field.state.meta)}
          >
            <option value="">Seleccionar...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
      </form.Field>

      <form.Field name="imagen_url">
        {(field) => (
          <Input
            id="prod-imagen"
            label="URL de la imagen (opcional)"
            placeholder="https://..."
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              className="h-4 w-4 accent-orange-600"
            />
            Disponible para la venta
          </label>
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
