"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  Building2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// --- Types ---

interface Sede {
  id: number;
  nombre: string;
  codigo: string;
}

interface DocenteAsignatura {
  id: number;
  asignatura: { id: number; nombre: string; codigo: string };
  docente: { usuario: { name: string } };
}

interface SedeDetail extends Sede {
  docenteAsignaturas: DocenteAsignatura[];
}

interface Horario {
  id: number;
  sedeId: number;
  docenteAsignaturaId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  aula: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  docenteAsignatura: {
    asignatura: { id: number; nombre: string; codigo: string };
    docente: { usuario: { name: string } };
  };
}

// --- Constants ---

const DIAS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS = [
  { num: 1, label: "Lun", full: "Lunes" },
  { num: 2, label: "Mar", full: "Martes" },
  { num: 3, label: "Mié", full: "Miércoles" },
  { num: 4, label: "Jue", full: "Jueves" },
  { num: 5, label: "Vie", full: "Viernes" },
  { num: 6, label: "Sáb", full: "Sábado" },
];

const HORA_INICIO = 7;
const HORA_FIN = 22;
const HORAS = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i);

const SUBJECT_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800" },
  { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800" },
  { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-800" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800" },
  { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-800" },
  { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-800" },
  { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800" },
  { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-800" },
  { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-800" },
];

function getSubjectColor(subjectId: number) {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length];
}

function parseHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// --- Component ---

export default function HorariosPage() {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const [selectedSedeId, setSelectedSedeId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [formData, setFormData] = useState({
    docenteAsignaturaId: "",
    diaSemana: "1",
    horaInicio: "08:00",
    horaFin: "10:00",
    aula: "",
    fechaInicio: "",
    fechaFin: "",
  });

  const weekDates = useMemo(() => {
    return DIAS.map((dia, i) => ({
      ...dia,
      date: addDays(weekStart, i),
    }));
  }, [weekStart]);

  const weekEnd = useMemo(() => addDays(weekStart, 5), [weekStart]);

  const weekLabel = useMemo(() => {
    const startMonth = MESES[weekStart.getMonth()];
    const endMonth = MESES[weekEnd.getMonth()];
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${weekStart.getDate()} – ${weekEnd.getDate()} de ${startMonth} ${weekStart.getFullYear()}`;
    }
    return `${weekStart.getDate()} ${startMonth} – ${weekEnd.getDate()} ${endMonth} ${weekStart.getFullYear()}`;
  }, [weekStart, weekEnd]);

  const goToday = useCallback(() => setWeekStart(getMonday(new Date())), []);
  const goPrevWeek = useCallback(() => setWeekStart((w) => addDays(w, -7)), []);
  const goNextWeek = useCallback(() => setWeekStart((w) => addDays(w, 7)), []);
  const goPrevMonth = useCallback(() => setWeekStart((w) => addDays(w, -28)), []);
  const goNextMonth = useCallback(() => setWeekStart((w) => addDays(w, 28)), []);

  const isCurrentWeek = useMemo(() => {
    const currentMonday = getMonday(new Date());
    return isSameDay(weekStart, currentMonday);
  }, [weekStart]);

  // Fetch sedes
  const { data: sedes = [] } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: () => fetch("/api/sedes").then((r) => r.json()),
  });

  // Fetch horarios for selected sede
  const { data: horarios = [], isLoading: loadingHorarios } = useQuery<Horario[]>({
    queryKey: ["horarios", selectedSedeId],
    queryFn: () =>
      fetch(`/api/horarios?sedeId=${selectedSedeId}`).then((r) => r.json()),
    enabled: !!selectedSedeId,
  });

  // Filter horarios for current week based on fechaInicio/fechaFin
  const filteredHorarios = useMemo(() => {
    const wsISO = formatDateISO(weekStart);
    const weISO = formatDateISO(weekEnd);
    return horarios.filter((h) => {
      if (!h.fechaInicio && !h.fechaFin) return true;
      if (h.fechaInicio && h.fechaInicio > weISO) return false;
      if (h.fechaFin && h.fechaFin < wsISO) return false;
      return true;
    });
  }, [horarios, weekStart, weekEnd]);

  // Fetch sede detail (includes docenteAsignaturas) for form
  const { data: sedeDetail } = useQuery<SedeDetail>({
    queryKey: ["sede-detail", selectedSedeId],
    queryFn: () =>
      fetch(`/api/sedes/${selectedSedeId}`).then((r) => r.json()),
    enabled: !!selectedSedeId,
  });

  const docenteAsignaturas = sedeDetail?.docenteAsignaturas ?? [];

  // Color map
  const subjectColorMap = useMemo(() => {
    const map = new Map<number, (typeof SUBJECT_COLORS)[0]>();
    const uniqueSubjects = [
      ...new Set(horarios.map((h) => h.docenteAsignatura.asignatura.id)),
    ];
    uniqueSubjects.forEach((id, idx) => {
      map.set(id, SUBJECT_COLORS[idx % SUBJECT_COLORS.length]);
    });
    return map;
  }, [horarios]);

  // Create horario
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch("/api/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Error al crear horario");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horarios", selectedSedeId] });
      toast.success("Horario creado exitosamente");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Error al crear horario"),
  });

  // Update horario
  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(`/api/horarios/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("Error al actualizar horario");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horarios", selectedSedeId] });
      toast.success("Horario actualizado exitosamente");
      setDialogOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error("Error al actualizar horario"),
  });

  // Delete horario
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/horarios/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Error al eliminar");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horarios", selectedSedeId] });
      toast.success("Horario eliminado");
    },
    onError: () => toast.error("Error al eliminar horario"),
  });

  function resetForm() {
    setFormData({
      docenteAsignaturaId: "",
      diaSemana: "1",
      horaInicio: "08:00",
      horaFin: "10:00",
      aula: "",
      fechaInicio: "",
      fechaFin: "",
    });
    setEditingId(null);
  }

  function openEditDialog(horario: Horario) {
    setEditingId(horario.id);
    setFormData({
      docenteAsignaturaId: String(horario.docenteAsignaturaId),
      diaSemana: String(horario.diaSemana),
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      aula: horario.aula ?? "",
      fechaInicio: horario.fechaInicio ?? "",
      fechaFin: horario.fechaFin ?? "",
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSedeId || !formData.docenteAsignaturaId) return;

    const payload = {
      docenteAsignaturaId: parseInt(formData.docenteAsignaturaId),
      diaSemana: parseInt(formData.diaSemana),
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      aula: formData.aula,
      fechaInicio: formData.fechaInicio || "",
      fechaFin: formData.fechaFin || "",
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate({ sedeId: selectedSedeId, ...payload });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Group filtered horarios by day
  const horariosByDay = useMemo(() => {
    const map = new Map<number, Horario[]>();
    DIAS.forEach((d) => map.set(d.num, []));
    filteredHorarios.forEach((h) => {
      const list = map.get(h.diaSemana);
      if (list) list.push(h);
    });
    return map;
  }, [filteredHorarios]);

  const ROW_HEIGHT = 56;

  const todayFormatted = `${DIAS_FULL[today.getDay()]} ${today.getDate()} de ${MESES[today.getMonth()]} de ${today.getFullYear()}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Horarios de Clase
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de horarios semanales por sede
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedSedeId?.toString() ?? ""}
            onChange={(e) =>
              setSelectedSedeId(e.target.value ? parseInt(e.target.value) : null)
            }
            className="w-56"
          >
            <option value="">Seleccionar sede...</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </Select>
          {selectedSedeId && (
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          )}
        </div>
      </div>

      {/* Current date indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">Hoy:</span>
        <span>{todayFormatted}</span>
      </div>

      {/* Content */}
      {!selectedSedeId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">
              Seleccione una sede para ver su horario semanal
            </p>
          </CardContent>
        </Card>
      ) : loadingHorarios ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Cargando horarios...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Horario Semanal
              </CardTitle>

              {/* Week navigation */}
              <div className="flex items-center gap-2">
                {/* Left controls group */}
                <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="relative group/pm">
                    <button
                      onClick={goPrevMonth}
                      className="flex items-center justify-center h-9 w-9 hover:bg-gray-100 transition-colors cursor-pointer border-r border-gray-200"
                    >
                      <ChevronsLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover/pm:opacity-100 transition-opacity shadow-lg z-50">
                      Mes anterior
                    </span>
                  </div>
                  <div className="relative group/pw">
                    <button
                      onClick={goPrevWeek}
                      className="flex items-center justify-center h-9 w-9 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover/pw:opacity-100 transition-opacity shadow-lg z-50">
                      Semana anterior
                    </span>
                  </div>
                </div>

                {/* Center: Today button + week label */}
                <div className="flex items-center gap-2.5">
                  <Button
                    variant={isCurrentWeek ? "secondary" : "outline"}
                    size="sm"
                    onClick={goToday}
                    className="h-9 px-4 text-xs font-semibold"
                  >
                    <CalendarDays className="h-3.5 w-3.5 mr-1" />
                    Hoy
                  </Button>
                  <span className="text-sm font-semibold text-foreground hidden sm:inline min-w-[200px] text-center">
                    {weekLabel}
                  </span>
                </div>

                {/* Right controls group */}
                <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="relative group/nw">
                    <button
                      onClick={goNextWeek}
                      className="flex items-center justify-center h-9 w-9 hover:bg-gray-100 transition-colors cursor-pointer border-r border-gray-200"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover/nw:opacity-100 transition-opacity shadow-lg z-50">
                      Semana siguiente
                    </span>
                  </div>
                  <div className="relative group/nm">
                    <button
                      onClick={goNextMonth}
                      className="flex items-center justify-center h-9 w-9 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <ChevronsRight className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover/nm:opacity-100 transition-opacity shadow-lg z-50">
                      Mes siguiente
                    </span>
                  </div>
                </div>
              </div>

              <Badge variant="secondary">
                {filteredHorarios.length} clase{filteredHorarios.length !== 1 && "s"}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-foreground sm:hidden mt-1 text-center">{weekLabel}</p>
          </CardHeader>
          <CardContent>
            {/* Schedule Grid */}
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[800px]"
                style={{
                  gridTemplateColumns: "64px repeat(6, 1fr)",
                }}
              >
                {/* Header row with day names + dates */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200" />
                {weekDates.map((dia) => {
                  const isToday = isSameDay(dia.date, today);
                  return (
                    <div
                      key={dia.num}
                      className={`sticky top-0 z-10 border-b border-l border-gray-200 px-2 py-2 text-center ${
                        isToday ? "bg-primary/5" : "bg-gray-50"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${isToday ? "text-primary" : "text-gray-700"}`}>
                        {dia.label}
                      </p>
                      <p className={`text-xs ${isToday ? "text-primary font-medium" : "text-gray-400"}`}>
                        {formatDateShort(dia.date)}
                      </p>
                    </div>
                  );
                })}

                {/* Time column */}
                <div className="relative">
                  {HORAS.map((h) => (
                    <div
                      key={h}
                      className="border-b border-gray-100 text-xs text-gray-400 pr-2 text-right flex items-start justify-end pt-1"
                      style={{ height: ROW_HEIGHT }}
                    >
                      {formatHour(h)}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDates.map((dia) => {
                  const isToday = isSameDay(dia.date, today);
                  return (
                    <div
                      key={dia.num}
                      className={`relative border-l border-gray-200 ${isToday ? "bg-primary/[0.02]" : ""}`}
                    >
                      {HORAS.map((h) => (
                        <div
                          key={h}
                          className="border-b border-gray-100"
                          style={{ height: ROW_HEIGHT }}
                        />
                      ))}

                      {/* Schedule blocks */}
                      {(horariosByDay.get(dia.num) ?? []).map((horario) => {
                        const startH = parseHour(horario.horaInicio);
                        const endH = parseHour(horario.horaFin);
                        const top = (startH - HORA_INICIO) * ROW_HEIGHT;
                        const height = (endH - startH) * ROW_HEIGHT;
                        const color =
                          subjectColorMap.get(
                            horario.docenteAsignatura.asignatura.id
                          ) ?? getSubjectColor(horario.docenteAsignatura.asignatura.id);

                        return (
                          <div
                            key={horario.id}
                            className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 overflow-hidden group cursor-default ${color.bg} ${color.border}`}
                            style={{ top, height: Math.max(height, 30) }}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-xs font-semibold leading-tight truncate ${color.text}`}
                                >
                                  {horario.docenteAsignatura.asignatura.nombre}
                                </p>
                                {height >= 45 && (
                                  <p className="text-[10px] text-gray-600 truncate mt-0.5">
                                    {horario.docenteAsignatura.docente.usuario.name}
                                  </p>
                                )}
                                {height >= 65 && horario.aula && (
                                  <p className="text-[10px] text-gray-500 truncate">
                                    Aula: {horario.aula}
                                  </p>
                                )}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                <div className="relative group/edit">
                                  <button
                                    onClick={() => openEditDialog(horario)}
                                    className="p-1 rounded-md hover:bg-white/70 cursor-pointer transition-colors"
                                  >
                                    <Pencil className="h-4 w-4 text-gray-600" />
                                  </button>
                                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 group-hover/edit:opacity-100 transition-opacity shadow-lg z-50">
                                    Editar horario
                                  </span>
                                </div>
                                <div className="relative group/del">
                                  <button
                                    onClick={() => deleteMutation.mutate(horario.id)}
                                    className="p-1 rounded-md hover:bg-red-50 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </button>
                                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[11px] text-white opacity-0 group-hover/del:opacity-100 transition-opacity shadow-lg z-50">
                                    Eliminar horario
                                  </span>
                                </div>
                              </div>
                            </div>
                            {height >= 45 && (
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {horario.horaInicio} - {horario.horaFin}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            {filteredHorarios.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                {[...subjectColorMap.entries()].map(([subjectId, color]) => {
                  const subject = horarios.find(
                    (h) => h.docenteAsignatura.asignatura.id === subjectId
                  )?.docenteAsignatura.asignatura;
                  if (!subject) return null;
                  return (
                    <span
                      key={subjectId}
                      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border ${color.bg} ${color.border} ${color.text}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${color.bg.replace("100", "400")}`}
                      />
                      {subject.codigo} - {subject.nombre}
                    </span>
                  );
                })}
              </div>
            )}

            {filteredHorarios.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p>No hay horarios para esta semana</p>
                <p className="text-sm mt-1">
                  Navegue a otra semana o haga clic en &quot;Agregar&quot; para crear uno
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar Horario" : "Agregar Horario"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="docenteAsignatura">Docente - Asignatura</Label>
            <Select
              id="docenteAsignatura"
              value={formData.docenteAsignaturaId}
              onChange={(e) =>
                setFormData({ ...formData, docenteAsignaturaId: e.target.value })
              }
              required
            >
              <option value="">Seleccionar...</option>
              {docenteAsignaturas.map((da) => (
                <option key={da.id} value={da.id}>
                  {da.asignatura.nombre} — {da.docente.usuario.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diaSemana">Día de la Semana</Label>
            <Select
              id="diaSemana"
              value={formData.diaSemana}
              onChange={(e) =>
                setFormData({ ...formData, diaSemana: e.target.value })
              }
              required
            >
              {DIAS.map((d) => (
                <option key={d.num} value={d.num}>
                  {d.full}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora Inicio</Label>
              <Input
                id="horaInicio"
                type="time"
                value={formData.horaInicio}
                onChange={(e) =>
                  setFormData({ ...formData, horaInicio: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFin">Hora Fin</Label>
              <Input
                id="horaFin"
                type="time"
                value={formData.horaFin}
                onChange={(e) =>
                  setFormData({ ...formData, horaFin: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aula">Aula</Label>
            <Input
              id="aula"
              placeholder="Ej: A-201"
              value={formData.aula}
              onChange={(e) =>
                setFormData({ ...formData, aula: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={formData.fechaInicio}
                onChange={(e) =>
                  setFormData({ ...formData, fechaInicio: e.target.value })
                }
              />
              <p className="text-[11px] text-muted-foreground">Desde cuándo se dicta</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={formData.fechaFin}
                onChange={(e) =>
                  setFormData({ ...formData, fechaFin: e.target.value })
                }
              />
              <p className="text-[11px] text-muted-foreground">Hasta cuándo se dicta</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
