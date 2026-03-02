"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  ClipboardList,
  BookOpen,
  FileText,
  GraduationCap,
  Settings,
  AlertTriangle,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIAS = [
  {
    key: "periodo_examen",
    icon: Calendar,
    color: "text-amber-600 bg-amber-50",
    titulo: "Periodos de Examen",
    descripcion: "Cuando se habilitan o modifican periodos de exámenes",
  },
  {
    key: "calificacion",
    icon: ClipboardList,
    color: "text-blue-600 bg-blue-50",
    titulo: "Calificaciones",
    descripcion: "Cuando se publican o actualizan calificaciones",
  },
  {
    key: "asistencia",
    icon: BookOpen,
    color: "text-purple-600 bg-purple-50",
    titulo: "Asistencia",
    descripcion: "Registro de asistencia e inasistencias",
  },
  {
    key: "contenido_clase",
    icon: FileText,
    color: "text-emerald-600 bg-emerald-50",
    titulo: "Contenido de Clases",
    descripcion: "Cuando docentes registran clases o contenidos",
  },
  {
    key: "evaluacion",
    icon: ClipboardList,
    color: "text-indigo-600 bg-indigo-50",
    titulo: "Evaluaciones",
    descripcion: "Evaluaciones programadas y resultados",
  },
  {
    key: "inscripcion",
    icon: GraduationCap,
    color: "text-cyan-600 bg-cyan-50",
    titulo: "Inscripciones",
    descripcion: "Nuevas inscripciones de estudiantes",
  },
  {
    key: "academico",
    icon: Settings,
    color: "text-orange-600 bg-orange-50",
    titulo: "Académico",
    descripcion: "Solicitudes y comunicados de la unidad académica",
  },
  {
    key: "sistema",
    icon: AlertTriangle,
    color: "text-gray-600 bg-gray-100",
    titulo: "Sistema",
    descripcion: "Actualizaciones y recordatorios del sistema",
  },
];

interface Props {
  prefNotificaciones: Record<string, boolean>;
}

export function TabNotificaciones({ prefNotificaciones }: Props) {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(prefNotificaciones);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefNotificaciones: prefs }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Preferencias actualizadas");
    },
    onError: () => toast.error("Error al guardar preferencias"),
  });

  function togglePref(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleAll(enabled: boolean) {
    const updated: Record<string, boolean> = {};
    CATEGORIAS.forEach((c) => { updated[c.key] = enabled; });
    setPrefs(updated);
  }

  const allEnabled = CATEGORIAS.every((c) => prefs[c.key] !== false);
  const allDisabled = CATEGORIAS.every((c) => prefs[c.key] === false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Preferencias de Notificaciones
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAll(true)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${allEnabled ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Todas
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => toggleAll(false)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${allDisabled ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Ninguna
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-5">
            Elige qué tipo de notificaciones deseas recibir. Las notificaciones desactivadas no aparecerán en tu panel.
          </p>

          <div className="divide-y divide-gray-100">
            {CATEGORIAS.map((cat) => {
              const Icon = cat.icon;
              const enabled = prefs[cat.key] !== false;
              const [iconColor, iconBg] = cat.color.split(" ");
              return (
                <div
                  key={cat.key}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{cat.titulo}</p>
                    <p className="text-xs text-muted-foreground">{cat.descripcion}</p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => togglePref(cat.key)}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-5 border-t mt-5">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Guardando..." : "Guardar Preferencias"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
