"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  GraduationCap,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TIPO_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  periodo_examen: { icon: Calendar, color: "text-amber-600", bg: "bg-amber-50", label: "Periodo de Examen" },
  calificacion: { icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50", label: "Calificación" },
  asistencia: { icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50", label: "Asistencia" },
  contenido_clase: { icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50", label: "Clase" },
  evaluacion: { icon: ClipboardList, color: "text-indigo-600", bg: "bg-indigo-50", label: "Evaluación" },
  inscripcion: { icon: GraduationCap, color: "text-cyan-600", bg: "bg-cyan-50", label: "Inscripción" },
  academico: { icon: Settings, color: "text-orange-600", bg: "bg-orange-50", label: "Académico" },
  sistema: { icon: AlertTriangle, color: "text-gray-600", bg: "bg-gray-100", label: "Sistema" },
};

interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  createdAt: string;
}

function formatFecha(dateStr: string) {
  const d = new Date(dateStr);
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Ahora mismo";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffMin < 1440) return `Hace ${Math.floor(diffMin / 60)}h`;
  if (diffMin < 2880) return "Ayer";
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" });
}

export default function NotificacionesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ notificaciones: Notificacion[]; totalNoLeidas: number }>({
    queryKey: ["notificaciones-all"],
    queryFn: async () => {
      const res = await fetch("/api/notificaciones?limit=100");
      if (!res.ok) return { notificaciones: [], totalNoLeidas: 0 };
      return res.json();
    },
  });

  const notificaciones = data?.notificaciones ?? [];
  const totalNoLeidas = data?.totalNoLeidas ?? 0;

  const mutation = useMutation({
    mutationFn: async (body: { accion: string; id?: number }) => {
      const res = await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      queryClient.invalidateQueries({ queryKey: ["notificaciones-all"] });
    },
  });

  const grouped = notificaciones.reduce<Record<string, Notificacion[]>>((acc, n) => {
    const d = new Date(n.createdAt);
    const ahora = new Date();
    const diffDays = Math.floor((ahora.getTime() - d.getTime()) / 86400000);
    let key: string;
    if (diffDays === 0) key = "Hoy";
    else if (diffDays === 1) key = "Ayer";
    else if (diffDays < 7) key = "Esta semana";
    else key = "Anteriores";
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  const groupOrder = ["Hoy", "Ayer", "Esta semana", "Anteriores"];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalNoLeidas > 0
              ? `${totalNoLeidas} notificaci${totalNoLeidas === 1 ? "ón" : "ones"} sin leer`
              : "Todas leídas"
            }
          </p>
        </div>
        {totalNoLeidas > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutation.mutate({ accion: "marcar_todas" })}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Cargando notificaciones...</p>
      ) : notificaciones.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
              <Bell className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-foreground">Sin notificaciones</p>
            <p className="text-sm text-muted-foreground mt-1">Las notificaciones aparecerán aquí cuando haya novedades</p>
          </CardContent>
        </Card>
      ) : (
        groupOrder
          .filter((key) => grouped[key]?.length)
          .map((groupKey) => (
            <div key={groupKey}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                {groupKey}
              </h2>
              <Card>
                <CardContent className="p-0 divide-y divide-gray-100">
                  {grouped[groupKey].map((notif) => {
                    const config = TIPO_CONFIG[notif.tipo] ?? TIPO_CONFIG.sistema;
                    const Icon = config.icon;
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          "group flex gap-4 px-4 py-4 transition-colors duration-200",
                          notif.leida ? "hover:bg-gray-50" : "bg-primary/[0.02] hover:bg-primary/[0.04]",
                          notif.enlace && "cursor-pointer"
                        )}
                        onClick={() => {
                          if (!notif.leida) mutation.mutate({ accion: "marcar_leida", id: notif.id });
                          if (notif.enlace) window.location.href = notif.enlace;
                        }}
                      >
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                          <Icon className={cn("h-5 w-5", config.color)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "text-sm",
                                  notif.leida ? "text-foreground" : "text-foreground font-semibold"
                                )}>
                                  {notif.titulo}
                                </p>
                                {!notif.leida && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">{notif.mensaje}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className={cn(
                                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border",
                                  config.bg, config.color
                                )}>
                                  {config.label}
                                </span>
                                <span className="text-[11px] text-gray-400">{formatFecha(notif.createdAt)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.leida && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); mutation.mutate({ accion: "marcar_leida", id: notif.id }); }}
                                  className="rounded-md p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary-light transition-all duration-200"
                                  title="Marcar como leída"
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); mutation.mutate({ accion: "eliminar", id: notif.id }); }}
                                className="rounded-md p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-accent hover:bg-accent-light transition-all duration-200"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))
      )}
    </div>
  );
}
