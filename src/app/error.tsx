"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-green-900 p-4">
      <div className="text-center max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Error al cargar la aplicación
        </h1>
        <p className="text-emerald-100">
          Ocurrió un problema en el servidor. Probá de nuevo o recargá la página.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => window.location.href = "/login"}
            variant="secondary"
            className="bg-white text-emerald-800 hover:bg-emerald-50"
          >
            Ir al login
          </Button>
          <Button
            onClick={reset}
            variant="outline"
            className="border-white text-white hover:bg-white/10"
          >
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}
