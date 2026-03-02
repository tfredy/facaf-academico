"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  X,
  Check,
  Monitor,
  Users,
  BookOpen,
  FlaskConical,
  Wrench,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatShortDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TIPOS_CLASE = [
  { value: "Teórica", label: "Teórica", icon: BookOpen, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { value: "Práctica", label: "Práctica", icon: Wrench, color: "bg-amber-50 border-amber-200 text-amber-700" },
  { value: "Teórica/Práctica", label: "Teórica/Práctica", icon: FlaskConical, color: "bg-purple-50 border-purple-200 text-purple-700" },
  { value: "Laboratorio", label: "Laboratorio", icon: FlaskConical, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
];

const MODALIDADES = [
  { value: "Presencial", label: "Presencial", icon: Users },
  { value: "Virtual", label: "Virtual", icon: Monitor },
];

const METODOLOGIAS = [
  { titulo: "Retroalimentación de contenidos", descripcion: "Revisión y retroalimentación de los contenidos aprendidos." },
  { titulo: "Explorar conocimientos previos", descripcion: "Identificación de conocimientos previos de los estudiantes." },
  { titulo: "Exposición oral", descripcion: "Presentación oral de un tema por parte del docente o estudiante." },
  { titulo: "Clase magistral", descripcion: "Sesión expositiva dirigida por el docente." },
  { titulo: "Evaluación de aprendizajes", descripcion: "Evaluación de los aprendizajes alcanzados." },
  { titulo: "Elaboración de resumen", descripcion: "Creación de resúmenes para sintetizar información." },
  { titulo: "Mapas conceptuales", descripcion: "Uso de diagramas para organizar y representar conocimientos." },
  { titulo: "Debate", descripcion: "Discusión estructurada sobre un tema específico." },
  { titulo: "Discusión dirigida", descripcion: "Intercambio de ideas guiado por el docente." },
  { titulo: "Taller", descripcion: "Sesión práctica para desarrollar habilidades específicas." },
  { titulo: "Clases prácticas", descripcion: "Actividades prácticas para aplicar conocimientos." },
  { titulo: "Resolución de ejercicios y problemas", descripcion: "Resolución de problemas para reforzar el aprendizaje." },
  { titulo: "Aprendizaje cooperativo", descripcion: "Trabajo en equipo para alcanzar objetivos comunes." },
  { titulo: "Aprendizaje basado en proyectos", descripcion: "Desarrollo de proyectos como método de aprendizaje." },
  { titulo: "Aula invertida", descripcion: "Estudio previo de contenidos para trabajar en clase." },
  { titulo: "Foro", descripcion: "Espacio para discusión y participación en línea o presencial." },
  { titulo: "Guías didácticas", descripcion: "Materiales que orientan el aprendizaje." },
  { titulo: "Producciones escritas y gráficas", descripcion: "Creación de textos y gráficos para expresar ideas." },
  { titulo: "Monografías, ensayos, investigaciones", descripcion: "Elaboración de trabajos escritos y cronológicos." },
  { titulo: "Tareas", descripcion: "Actividades asignadas para realizar fuera del aula." },
  { titulo: "Simulaciones", descripcion: "Recreación de situaciones para aprendizaje práctico." },
  { titulo: "Lectura comentada", descripcion: "Lectura y análisis crítico de textos." },
  { titulo: "Estudio de casos", descripcion: "Análisis detallado de situaciones reales o hipotéticas." },
  { titulo: "Experimentación", descripcion: "Realización de experimentos para comprobar teorías." },
  { titulo: "Otro", descripcion: "Método no especificado." },
];

interface ContenidoClase {
  id: number;
  tipoClase: string;
  fecha: string;
  modalidad: string;
  contenido: string;
  metodologias: string;
  observaciones: string | null;
}

interface FormClaseProps {
  docenteAsignaturaId: number;
}

export function FormClase({ docenteAsignaturaId }: FormClaseProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContenidoClase | null>(null);
  const [metodologiasExpanded, setMetodologiasExpanded] = useState(true);

  const [tipoClase, setTipoClase] = useState("Teórica");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [modalidad, setModalidad] = useState("Presencial");
  const [contenido, setContenido] = useState("");
  const [selectedMetodologias, setSelectedMetodologias] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");

  const { data: registros = [], isLoading } = useQuery<ContenidoClase[]>({
    queryKey: ["contenidos-clase", docenteAsignaturaId],
    queryFn: async () => {
      const res = await fetch(`/api/docente/contenidos?docenteAsignaturaId=${docenteAsignaturaId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        docenteAsignaturaId,
        tipoClase,
        fecha: new Date(fecha).toISOString(),
        modalidad,
        contenido,
        metodologias: selectedMetodologias,
        observaciones: observaciones || undefined,
      };
      const url = editing ? `/api/docente/contenidos/${editing.id}` : "/api/docente/contenidos";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contenidos-clase", docenteAsignaturaId] });
      toast.success(editing ? "Clase actualizada" : "Clase registrada correctamente");
      closeForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/docente/contenidos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contenidos-clase", docenteAsignaturaId] });
      toast.success("Registro eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setTipoClase("Teórica");
    setFecha(new Date().toISOString().split("T")[0]);
    setModalidad("Presencial");
    setContenido("");
    setSelectedMetodologias([]);
    setObservaciones("");
    setFormOpen(true);
  }

  function openEdit(reg: ContenidoClase) {
    setEditing(reg);
    setTipoClase(reg.tipoClase);
    setFecha(new Date(reg.fecha).toISOString().split("T")[0]);
    setModalidad(reg.modalidad);
    setContenido(reg.contenido);
    try { setSelectedMetodologias(JSON.parse(reg.metodologias)); } catch { setSelectedMetodologias([]); }
    setObservaciones(reg.observaciones ?? "");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function toggleMetodologia(titulo: string) {
    setSelectedMetodologias((prev) =>
      prev.includes(titulo) ? prev.filter((m) => m !== titulo) : [...prev, titulo]
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Registro de Clases</h2>
        {!formOpen && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Clase
          </Button>
        )}
      </div>

      {/* ─── FORMULARIO EXPANDIDO ─── */}
      {formOpen && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="border-b bg-gray-50/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                  <BookOpen className="h-4 w-4" />
                </div>
                {editing ? "Editar Clase" : "Registrar Nueva Clase"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
              className="space-y-8"
            >
              {/* ── Sección 1: Información básica ── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">1</span>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Información de la Clase</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Tipo de Clase - selector visual */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de Clase</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIPOS_CLASE.map((t) => {
                        const Icon = t.icon;
                        const selected = tipoClase === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setTipoClase(t.value)}
                            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                              selected
                                ? `${t.color} border-current shadow-sm`
                                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fecha de la Clase</Label>
                    <Input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Modalidad - pill toggle */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Modalidad</Label>
                    <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                      {MODALIDADES.map((m) => {
                        const Icon = m.icon;
                        const selected = modalidad === m.value;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setModalidad(m.value)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                              selected
                                ? "bg-white text-primary shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Sección 2: Contenido ── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">2</span>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Contenido Desarrollado</h3>
                </div>
                <Textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Describe los temas y contenidos desarrollados durante la clase..."
                  className="min-h-[120px] text-sm leading-relaxed"
                />
              </div>

              {/* ── Sección 3: Metodologías ── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">3</span>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Metodologías Utilizadas</h3>
                    {selectedMetodologias.length > 0 && (
                      <Badge variant="success" className="ml-2 text-xs">
                        {selectedMetodologias.length} seleccionada{selectedMetodologias.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMetodologiasExpanded(!metodologiasExpanded)}
                    className="text-muted-foreground"
                  >
                    {metodologiasExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {metodologiasExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {METODOLOGIAS.map((m) => {
                      const selected = selectedMetodologias.includes(m.titulo);
                      return (
                        <button
                          key={m.titulo}
                          type="button"
                          onClick={() => toggleMetodologia(m.titulo)}
                          className={`group flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                            selected
                              ? "border-primary/40 bg-primary/5"
                              : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50"
                          }`}
                        >
                          <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-gray-300 group-hover:border-gray-400"
                          }`}>
                            {selected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium leading-tight ${selected ? "text-primary" : "text-foreground"}`}>
                              {m.titulo}
                            </p>
                            <p className="text-xs text-gray-400 leading-snug mt-0.5">{m.descripcion}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!metodologiasExpanded && selectedMetodologias.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMetodologias.map((m) => (
                      <Badge
                        key={m}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => toggleMetodologia(m)}
                      >
                        {m}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Sección 4: Observaciones ── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-white text-xs font-bold">4</span>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Observaciones <span className="font-normal normal-case">(opcional)</span></h3>
                </div>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales sobre la clase..."
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* ── Acciones ── */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeForm} className="px-6">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending || !contenido.trim()} className="px-8">
                  {saveMutation.isPending
                    ? "Guardando..."
                    : editing ? "Actualizar Clase" : "Registrar Clase"
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── LISTADO DE CLASES REGISTRADAS ─── */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Cargando registros...</p>
      ) : registros.length === 0 && !formOpen ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mx-auto mb-4">
            <Clock className="h-7 w-7 text-gray-400" />
          </div>
          <p className="font-medium text-foreground">No hay clases registradas</p>
          <p className="text-sm mt-1">Empieza registrando tu primera clase para esta asignatura</p>
        </div>
      ) : registros.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {registros.length} clase{registros.length !== 1 ? "s" : ""} registrada{registros.length !== 1 ? "s" : ""}
          </p>
          {registros.map((reg) => {
            let metodos: string[] = [];
            try { metodos = JSON.parse(reg.metodologias); } catch { /* empty */ }
            const tipoInfo = TIPOS_CLASE.find((t) => t.value === reg.tipoClase);
            return (
              <Card key={reg.id} className="group hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Indicador lateral de modalidad */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      reg.modalidad === "Virtual" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {reg.modalidad === "Virtual" ? <Monitor className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-foreground">{reg.tipoClase}</h4>
                            {tipoInfo && (
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${tipoInfo.color}`}>
                                {reg.modalidad}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatShortDate(reg.fecha)}
                          </p>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(reg)} title="Editar" className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { if (confirm("¿Eliminar este registro?")) deleteMutation.mutate(reg.id); }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-accent" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{reg.contenido}</p>

                      {metodos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {metodos.slice(0, 5).map((m) => (
                            <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0">{m}</Badge>
                          ))}
                          {metodos.length > 5 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{metodos.length - 5} más
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
