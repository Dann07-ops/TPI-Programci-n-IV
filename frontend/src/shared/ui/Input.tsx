import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100";

function Etiqueta({ id, label }: { id?: string; label?: string }) {
  if (!label) return null;
  return (
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
      {label}
    </label>
  );
}

function MensajeError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-sm text-red-600">{error}</p>;
}

interface CampoProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: CampoProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <Etiqueta id={id} label={label} />
      <input id={id} className={`${base} ${error ? "border-red-500" : "border-gray-300"}`} {...props} />
      <MensajeError error={error} />
    </div>
  );
}

export function Select({ label, error, id, className = "", children, ...props }: CampoProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <Etiqueta id={id} label={label} />
      <select id={id} className={`${base} bg-white ${error ? "border-red-500" : "border-gray-300"}`} {...props}>
        {children}
      </select>
      <MensajeError error={error} />
    </div>
  );
}

export function TextArea({ label, error, id, className = "", ...props }: CampoProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <Etiqueta id={id} label={label} />
      <textarea id={id} className={`${base} ${error ? "border-red-500" : "border-gray-300"}`} {...props} />
      <MensajeError error={error} />
    </div>
  );
}
