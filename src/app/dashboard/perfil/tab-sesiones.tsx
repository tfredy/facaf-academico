"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SesionLogin {
  id: number;
  ip: string | null;
  navegador: string | null;
  dispositivo: string | null;
  exitoso: boolean;
  createdAt: string;
}

function getDeviceIcon(dispositivo: string | null) {
  if (dispositivo === "Móvil") return Smartphone;
  if (dispositivo === "Tablet") return Tablet;
  return Monitor;
}

function formatFechaCompleta(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "Ahora mismo";
  if (diff < 60) return `Hace ${diff} min`;
  if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`;
  if (diff < 2880) return "Ayer";
  return `Hace ${Math.floor(diff / 1440)} días`;
}

export function TabSesiones() {
  const { data: sesiones = [], isLoading } = useQuery<SesionLogin[]>({
    queryKey: ["sesiones-login"],
    queryFn: async () => {
      const res = await fetch("/api/perfil/sesiones");
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Historial de Accesos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-5">
            Registro de los últimos 30 inicios de sesión en tu cuenta.
          </p>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Cargando historial...</p>
          ) : sesiones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No hay registros de acceso todavía</p>
              <p className="text-xs mt-1">Los accesos se registran automáticamente al iniciar sesión</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sesiones.map((sesion, idx) => {
                const DeviceIcon = getDeviceIcon(sesion.dispositivo);
                const isFirst = idx === 0;
                return (
                  <div
                    key={sesion.id}
                    className={cn(
                      "flex items-center gap-4 py-3.5",
                      isFirst && "bg-primary/[0.02] -mx-2 px-2 rounded-lg"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      sesion.exitoso ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    )}>
                      <DeviceIcon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {sesion.navegador ?? "Navegador"} - {sesion.dispositivo ?? "Escritorio"}
                        </p>
                        {isFirst && (
                          <Badge variant="success" className="text-[10px]">Sesión actual</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatFechaCompleta(sesion.createdAt)}</span>
                        {sesion.ip && (
                          <span className="text-xs text-gray-400">IP: {sesion.ip}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {sesion.exitoso ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        sesion.exitoso ? "text-emerald-600" : "text-red-500"
                      )}>
                        {sesion.exitoso ? "Exitoso" : "Fallido"}
                      </span>
                    </div>

                    <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block w-24 text-right">
                      {timeAgo(sesion.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
