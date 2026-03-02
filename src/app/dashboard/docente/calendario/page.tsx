"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  Award,
  X,
  Save,
  Monitor,
  Users,
  BookOpen,
  FlaskConical,
  Wrench,
} from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

interface CalendarEvent {
  id: number;
  tipo: "clase" | "evaluacion";
  fecha: string;
  titulo: string;
  subtitulo: string;
  modalidad?: string;
  puntosAsignados?: number;
  docenteAsignaturaId: number;
  contenido?: string;
  metodologias?: string;
  instrumentos?: string;
  descripcion?: string;
}

interface Materia {
  id: number;
  asignatura: { nombre: string; codigo: string };
  sede?: { id: number; nombre: string };
  gestion: number;
  periodo: string;
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TIPOS_CLASE = ["Teórica", "Práctica", "Teórica/Práctica", "Laboratorio"];
const MODALIDADES = ["Presencial", "Virtual"];
const INSTRUMENTOS = [
  "Prueba escrita", "Prueba oral", "Presentación oral", "Rúbrica",
  "Lista de cotejo", "Portafolio", "Trabajo práctico", "Proyecto",
  "Informe de laboratorio", "Defensa de proyecto", "Ensayo", "Otro",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export default function CalendarioPage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterMateria, setFilterMateria] = useState<string>("");
  const [editing, setEditing] = useState(false);

  // Edit state for clase
  const [editTipoClase, setEditTipoClase] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editModalidad, setEditModalidad] = useState("");
  const [editContenido, setEditContenido] = useState("");
  const [editMetodologias, setEditMetodologias] = useState<string[]>([]);
  // Edit state for evaluacion
  const [editPuntos, setEditPuntos] = useState("");
  const [editInstrumentos, setEditInstrumentos] = useState<string[]>([]);
  const [editDescripcion, setEditDescripcion] = useState("");

  const { data: materias = [] } = useQuery<Materia[]>({
    queryKey: ["mis-materias-all"],
    queryFn: async () => {
      const res = await fetch("/api/docente/mis-materias");
      if (!res.ok) return [];
      const data = await res.json();
      return data.asignaturas ?? [];
    },
  });

  const materiasBySede = useMemo(() => {
    const map = new Map<string, Materia[]>();
    for (const m of materias) {
      const sedeName = m.sede?.nombre ?? "Sin sede";
      if (!map.has(sedeName)) map.set(sedeName, []);
      map.get(sedeName)!.push(m);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.asignatura.nombre.localeCompare(b.asignatura.nombre));
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [materias]);

  const queryParams = filterMateria ? `?docenteAsignaturaId=${filterMateria}` : "";
  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["calendario-eventos", filterMateria],
    queryFn: async () => {
      const res = await fetch(`/api/docente/calendario${queryParams}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ev: CalendarEvent) => {
      const endpoint = ev.tipo === "clase"
        ? `/api/docente/contenidos/${ev.id}`
        : `/api/docente/evaluaciones/${ev.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendario-eventos"] });
      queryClient.invalidateQueries({ queryKey: ["contenidos-clase"] });
      queryClient.invalidateQueries({ queryKey: ["evaluaciones"] });
      toast.success("Registro eliminado");
      setSelectedEvent(null);
      setEditing(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) throw new Error("Sin evento");
      const isClase = selectedEvent.tipo === "clase";
      const endpoint = isClase
        ? `/api/docente/contenidos/${selectedEvent.id}`
        : `/api/docente/evaluaciones/${selectedEvent.id}`;

      const body = isClase
        ? {
            docenteAsignaturaId: selectedEvent.docenteAsignaturaId,
            tipoClase: editTipoClase,
            fecha: new Date(editFecha).toISOString(),
            modalidad: editModalidad,
            contenido: editContenido,
            metodologias: editMetodologias,
          }
        : {
            docenteAsignaturaId: selectedEvent.docenteAsignaturaId,
            fecha: new Date(editFecha).toISOString(),
            puntosAsignados: Number(editPuntos),
            instrumentos: editInstrumentos,
            descripcion: editDescripcion || undefined,
          };

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al actualizar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendario-eventos"] });
      queryClient.invalidateQueries({ queryKey: ["contenidos-clase"] });
      queryClient.invalidateQueries({ queryKey: ["evaluaciones"] });
      toast.success("Registro actualizado");
      setSelectedEvent(null);
      setEditing(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openEvent(ev: CalendarEvent) {
    setSelectedEvent(ev);
    setEditing(false);
  }

  function startEditing() {
    if (!selectedEvent) return;
    setEditFecha(new Date(selectedEvent.fecha).toISOString().split("T")[0]);
    if (selectedEvent.tipo === "clase") {
      setEditTipoClase(selectedEvent.titulo);
      setEditModalidad(selectedEvent.modalidad ?? "Presencial");
      setEditContenido(selectedEvent.contenido ?? "");
      try { setEditMetodologias(JSON.parse(selectedEvent.metodologias ?? "[]")); } catch { setEditMetodologias([]); }
    } else {
      setEditPuntos(String(selectedEvent.puntosAsignados ?? 0));
      setEditDescripcion(selectedEvent.descripcion ?? "");
      try { setEditInstrumentos(JSON.parse(selectedEvent.instrumentos ?? "[]")); } catch { setEditInstrumentos([]); }
    }
    setEditing(true);
  }

  function closeModal() {
    setSelectedEvent(null);
    setEditing(false);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const d = new Date(ev.fecha);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    }
    return map;
  }, [events, month, year]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  }

  function getEventColor(ev: CalendarEvent) {
    if (ev.tipo === "evaluacion") return "bg-emerald-500";
    return ev.modalidad === "Virtual" ? "bg-purple-500" : "bg-blue-500";
  }
  function getEventLabel(ev: CalendarEvent) {
    if (ev.tipo === "evaluacion") return "Evaluación";
    return ev.modalidad === "Virtual" ? "Clase Virtual" : "Clase Presencial";
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendario Académico</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualiza, edita o elimina tus clases y evaluaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={filterMateria} onChange={(e) => setFilterMateria(e.target.value)} className="w-56">
            <option value="">Todas las materias</option>
            {materiasBySede.map(([sedeName, materiasSede]) => (
              <optgroup key={sedeName} label={sedeName}>
                {materiasSede.map((m) => (
                  <option key={m.id} value={m.id}>{m.asignatura.nombre} ({m.asignatura.codigo})</option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
            <h2 className="text-lg font-semibold text-foreground">{MESES[month]} {year}</h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DIAS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-t border-l border-gray-200">
            {cells.map((day, idx) => {
              const isToday = day !== null && isSameDay(new Date(year, month, day), today);
              const dayEvents = day ? (eventsByDate[day.toString()] || []) : [];
              return (
                <div key={idx} className={`min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-200 p-1 sm:p-1.5 ${day === null ? "bg-gray-50" : "bg-white"}`}>
                  {day !== null && (
                    <>
                      <div className={`text-xs font-medium mb-1 ${isToday ? "bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-foreground pl-1"}`}>{day}</div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <button
                            key={`${ev.tipo}-${ev.id}`}
                            onClick={() => openEvent(ev)}
                            className={`w-full text-left text-[10px] sm:text-xs text-white rounded px-1 py-0.5 truncate cursor-pointer ${getEventColor(ev)} hover:opacity-80 transition-opacity`}
                            title={`${getEventLabel(ev)} - ${ev.subtitulo}`}
                          >{ev.titulo}</button>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} más</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <span className="text-xs text-muted-foreground font-medium">Leyenda:</span>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500" /><span className="text-xs text-foreground">Presenciales</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500" /><span className="text-xs text-foreground">Virtuales</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /><span className="text-xs text-foreground">Evaluaciones</span></div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Modal detalle / edición ─── */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) closeModal(); }}>
        {selectedEvent && !editing && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getEventColor(selectedEvent)}`} />
                {getEventLabel(selectedEvent)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{formatShortDate(selectedEvent.fecha)}</span>
                {selectedEvent.modalidad && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{selectedEvent.modalidad}</span>}
                {selectedEvent.puntosAsignados !== undefined && <span className="flex items-center gap-1.5"><Award className="h-4 w-4" />{selectedEvent.puntosAsignados} pts</span>}
              </div>
              <div><p className="text-xs text-muted-foreground font-medium mb-1">Asignatura</p><p className="text-sm text-foreground">{selectedEvent.subtitulo}</p></div>
              {selectedEvent.contenido && <div><p className="text-xs text-muted-foreground font-medium mb-1">Contenido</p><p className="text-sm text-foreground">{selectedEvent.contenido}</p></div>}
              {selectedEvent.descripcion && <div><p className="text-xs text-muted-foreground font-medium mb-1">Descripción</p><p className="text-sm text-foreground">{selectedEvent.descripcion}</p></div>}
              {selectedEvent.metodologias && (() => {
                let m: string[] = []; try { m = JSON.parse(selectedEvent.metodologias); } catch { /* */ }
                return m.length > 0 ? <div><p className="text-xs text-muted-foreground font-medium mb-1.5">Metodologías</p><div className="flex flex-wrap gap-1.5">{m.map((x) => <Badge key={x} variant="secondary" className="text-[11px]">{x}</Badge>)}</div></div> : null;
              })()}
              {selectedEvent.instrumentos && (() => {
                let inst: string[] = []; try { inst = JSON.parse(selectedEvent.instrumentos); } catch { /* */ }
                return inst.length > 0 ? <div><p className="text-xs text-muted-foreground font-medium mb-1.5">Instrumentos</p><div className="flex flex-wrap gap-1.5">{inst.map((x) => <Badge key={x} variant="info" className="text-[11px]">{x}</Badge>)}</div></div> : null;
              })()}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={startEditing}>
                <Pencil className="mr-2 h-4 w-4" />Editar
              </Button>
              <Button variant="destructive" onClick={() => { if (confirm("¿Eliminar este registro del calendario?")) deleteMutation.mutate(selectedEvent); }}>
                <Trash2 className="mr-2 h-4 w-4" />Eliminar
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ─── Modo edición: Clase ─── */}
        {selectedEvent && editing && selectedEvent.tipo === "clase" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Editar Clase
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Clase</Label>
                  <Select value={editTipoClase} onChange={(e) => setEditTipoClase(e.target.value)}>
                    {TIPOS_CLASE.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fecha</Label>
                  <Input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Modalidad</Label>
                <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                  {MODALIDADES.map((m) => {
                    const Icon = m === "Virtual" ? Monitor : Users;
                    return (
                      <button key={m} type="button" onClick={() => setEditModalidad(m)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${editModalidad === m ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                      ><Icon className="h-4 w-4" />{m}</button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Contenido Desarrollado</Label>
                <Textarea value={editContenido} onChange={(e) => setEditContenido(e.target.value)} className="min-h-[80px] text-sm" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Metodologías ({editMetodologias.length} seleccionadas)</Label>
                {editMetodologias.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {editMetodologias.map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px] cursor-pointer hover:bg-gray-200" onClick={() => setEditMetodologias((p) => p.filter((x) => x !== m))}>
                        {m} <X className="ml-0.5 h-2.5 w-2.5" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}><X className="mr-1.5 h-4 w-4" />Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending || !editContenido.trim()}>
                  <Save className="mr-1.5 h-4 w-4" />{updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {/* ─── Modo edición: Evaluación ─── */}
        {selectedEvent && editing && selectedEvent.tipo === "evaluacion" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Editar Evaluación
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Fecha</Label>
                  <Input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Puntos Asignados</Label>
                  <Input type="number" min={0} max={100} value={editPuntos} onChange={(e) => setEditPuntos(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Instrumentos Utilizados</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {INSTRUMENTOS.map((inst) => {
                    const sel = editInstrumentos.includes(inst);
                    return (
                      <label key={inst} className={`flex items-center gap-2 rounded-md p-2 cursor-pointer border transition-colors duration-200 text-xs ${sel ? "bg-primary-light border-primary/30" : "border-gray-200 hover:bg-gray-50"}`}>
                        <input type="checkbox" checked={sel} onChange={() => setEditInstrumentos((p) => sel ? p.filter((x) => x !== inst) : [...p, inst])} className="h-3.5 w-3.5 accent-primary shrink-0" />
                        {inst}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descripción (opcional)</Label>
                <Textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} className="min-h-[60px] text-sm" />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}><X className="mr-1.5 h-4 w-4" />Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending || Number(editPuntos) <= 0}>
                  <Save className="mr-1.5 h-4 w-4" />{updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </Dialog>
    </div>
  );
}
