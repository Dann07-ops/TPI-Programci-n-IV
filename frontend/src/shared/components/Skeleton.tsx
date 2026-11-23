export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

/** Grilla de tarjetas "fantasma" mientras carga el catálogo. */
export function SkeletonGrid({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <Skeleton className="mb-3 h-36 w-full" />
          <Skeleton className="mb-2 h-5 w-3/4" />
          <Skeleton className="mb-4 h-4 w-1/2" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Filas "fantasma" para tablas y listas. */
export function SkeletonFilas({ filas = 5 }: { filas?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
