import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "peligro" | "fantasma";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: "sm" | "md";
  cargando?: boolean;
}

const estilos: Record<Variante, string> = {
  primario: "bg-orange-600 text-white hover:bg-orange-700",
  secundario: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100",
  peligro: "bg-red-600 text-white hover:bg-red-700",
  fantasma: "text-gray-700 hover:bg-gray-100",
};

export function Button({
  variante = "primario",
  tamano = "md",
  cargando = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const tam = tamano === "sm" ? "px-3 py-1 text-sm" : "px-4 py-2";
  return (
    <button
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition
        disabled:cursor-not-allowed disabled:opacity-50 ${tam} ${estilos[variante]} ${className}`}
      {...props}
    >
      {cargando && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
