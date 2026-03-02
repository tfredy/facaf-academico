"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  LogIn,
  FileText,
  ClipboardList,
  UserCog,
  Shield,
  Pencil,
  Trash2,
  Plus,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActividadUsuario {
  id: number;
  accion: string;
  entidad: string;
  entidadId: string | null;
  detalle: string | null;
  ip: string | null;
  createdAt: string;
}

const ACCION_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  login: { icon: LogIn, color: "text-emerald-600 bg-emerald-50", label: "Inicio de sesión" },
  crear: { icon: Plus, color: "text-blue-600 bg-blue-50", label: "Creación" },
  actualizar: { icon: Pencil, color: "text-amber-600 bg-amber-50", label: "Actualización" },
  eliminar: { icon: Trash2, color: "text-red-600 bg-red-50", label: "Eliminación" },
  ver: { icon: Eye, color: "text-gray-600 bg-gray-100", label: "Visualización" },
  cambiar_password: { icon: Shield, color: "text-purple-600 bg-purple-50", label: "Seguridad" },
};

const ENTIDAD_LABELS: Record<string, string> = {
  sesion: "Sesión",
  perfil: "Perfil",
  contenido_clase: "Contenido de Clase",
  evaluacion: "Evaluación",
  calificacion: "Calificación",
  asistencia: "Asistencia",
  inscripcion: "Inscripción",
  malla: "Malla Curricular",
  asignatura: "Asignatura",
  docente: "Docente",
  estudiante: "Estudiante",
  periodo_examen: "Periodo de Examen",
};

function formatFecha(dateStr: string) {
  const d = new Date(dateStr);
  const ahora = new Date();
  const diffMin = Math.floor((ahora.getTime() - d.getTime()) / 60000);

  if (diffMin < 1) return "Ahora mismo";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffMin < 1440) return `Hace ${Math.floor(diffMin / 60)}h`;

  return d.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TabActividad() {
  const { data: actividades = [], isLoading } = useQuery<ActividadUsuario[]>({
    queryKey: ["actividades-usuario"],
    queryFn: async () => {
      const res = await fetch("/api/perfil/actividades");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const grouped = actividades.reduce<Record<string, ActividadUsuario[]>>((acc, a) => {
    const d = new Date(a.createdAt);
    const ahora = new Date();
    const diffDays = Math.floor((ahora.getTime() - d.getTime()) / 86400000);
    let key: string;
    if (diffDays === 0) key = "Hoy";
    else if (diffDays === 1) key = "Ayer";
    else if (diffDays < 7) key = "Esta semana";
    else key = "Anteriores";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const groupOrder = ["Hoy", "Ayer", "Esta semana", "Anteriores"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Registro de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-5">
            Las últimas 50 acciones realizadas en tu cuenta.
          </p>

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Cargando actividad...</p>
          ) : actividades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No hay actividad registrada</p>
              <p className="text-xs mt-1">Tu actividad en el sistema aparecerá aquí</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupOrder
                .filter((key) => grouped[key]?.length)
                .map((groupKey) => (
                  <div key={groupKey}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {groupKey}
                    </h3>
                    <div className="relative pl-6 border-l-2 border-gray-100 space-y-0">
                      {grouped[groupKey].map((act) => {
                        const config = ACCION_CONFIG[act.accion] ?? {
                          icon: Activity,
                          color: "text-gray-600 bg-gray-100",
                          label: act.accion,
                        };
                        const Icon = config.icon;
                        const [iconColor, iconBg] = config.color.split(" ");
                        return (
                          <div key={act.id} className="relative flex gap-3 pb-4 last:pb-0">
                            {/* Dot on timeline */}
                            <div className={cn(
                              "absolute -left-[23px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white",
                              iconBg
                            )}>
                              <Icon className={cn("h-2.5 w-2.5", iconColor)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground">
                                  {config.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  en {ENTIDAD_LABELS[act.entidad] ?? act.entidad}
                                </span>
                              </div>
                              {act.detalle && (
                                <p className="text-xs text-gray-500 mt-0.5">{act.detalle}</p>
                              )}
                              <p className="text-[11px] text-gray-400 mt-0.5">{formatFecha(act.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
