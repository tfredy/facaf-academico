"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Info, ClipboardCheck } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const INSTRUMENTOS = [
  "Prueba escrita",
  "Prueba oral",
  "Presentación oral",
  "Rúbrica",
  "Lista de cotejo",
  "Portafolio",
  "Trabajo práctico",
  "Proyecto",
  "Informe de laboratorio",
  "Defensa de proyecto",
  "Ensayo",
  "Otro",
];

interface RegistroEvaluacion {
  id: number;
  fecha: string;
  puntosAsignados: number;
  instrumentos: string;
  descripcion: string | null;
}

interface FormEvaluacionProps {
  docenteAsignaturaId: number;
}

export function FormEvaluacion({ docenteAsignaturaId }: FormEvaluacionProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RegistroEvaluacion | null>(null);

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [puntosAsignados, setPuntosAsignados] = useState<string>("0");
  const [selectedInstrumentos, setSelectedInstrumentos] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");

  const { data: registros = [], isLoading } = useQuery<RegistroEvaluacion[]>({
    queryKey: ["evaluaciones", docenteAsignaturaId],
    queryFn: async () => {
      const res = await fetch(`/api/docente/evaluaciones?docenteAsignaturaId=${docenteAsignaturaId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totalPuntos = registros.reduce((sum, r) => sum + r.puntosAsignados, 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        docenteAsignaturaId,
        fecha: new Date(fecha).toISOString(),
        puntosAsignados: Number(puntosAsignados),
        instrumentos: selectedInstrumentos,
        descripcion: descripcion || undefined,
      };
      const url = editing ? `/api/docente/evaluaciones/${editing.id}` : "/api/docente/evaluaciones";
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
      queryClient.invalidateQueries({ queryKey: ["evaluaciones", docenteAsignaturaId] });
      toast.success(editing ? "Evaluación actualizada" : "Evaluación registrada");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/docente/evaluaciones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluaciones", docenteAsignaturaId] });
      toast.success("Evaluación eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditing(null);
    setFecha(new Date().toISOString().split("T")[0]);
    setPuntosAsignados("0");
    setSelectedInstrumentos([]);
    setDescripcion("");
    setDialogOpen(true);
  }

  function openEdit(reg: RegistroEvaluacion) {
    setEditing(reg);
    setFecha(new Date(reg.fecha).toISOString().split("T")[0]);
    setPuntosAsignados(String(reg.puntosAsignados));
    try { setSelectedInstrumentos(JSON.parse(reg.instrumentos)); } catch { setSelectedInstrumentos([]); }
    setDescripcion(reg.descripcion ?? "");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  function toggleInstrumento(inst: string) {
    setSelectedInstrumentos((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Registro de Evaluaciones</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total puntos asignados: <strong className="text-foreground">{totalPuntos}</strong> / 100
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Evaluación
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Cargando registros...</p>
      ) : registros.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No hay evaluaciones registradas para esta asignatura</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((reg) => {
            let instrumentos: string[] = [];
            try { instrumentos = JSON.parse(reg.instrumentos); } catch { /* empty */ }
            return (
              <Card key={reg.id} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">Evaluación</CardTitle>
                        <Badge variant="success" className="text-xs">
                          {reg.puntosAsignados} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatShortDate(reg.fecha)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(reg)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { if (confirm("¿Eliminar esta evaluación?")) deleteMutation.mutate(reg.id); }}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-accent" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reg.descripcion && (
                    <p className="text-sm text-foreground mb-2">{reg.descripcion}</p>
                  )}
                  {instrumentos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {instrumentos.map((inst) => (
                        <Badge key={inst} variant="info" className="text-[11px]">{inst}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de formulario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Evaluación" : "Registrar Nueva Evaluación"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de la Evaluación</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Puntos Asignados</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={puntosAsignados}
                onChange={(e) => setPuntosAsignados(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instrumentos Utilizados</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INSTRUMENTOS.map((inst) => (
                <label
                  key={inst}
                  className={`flex items-center gap-2 rounded-md p-2.5 cursor-pointer border transition-colors duration-200 ${
                    selectedInstrumentos.includes(inst)
                      ? "bg-primary-light border-primary/30"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInstrumentos.includes(inst)}
                    onChange={() => toggleInstrumento(inst)}
                    className="h-4 w-4 accent-primary shrink-0"
                  />
                  <span className="text-sm">{inst}</span>
                </label>
              ))}
            </div>
          </div>

          <Alert variant="info">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">
                <strong>Obs:</strong> Se entiende que es una prueba escrita en la mayoría de los casos.
                Pero es importante seleccionar de qué está compuesta. En los casos de defensa de Proyectos,
                especificar presentación Oral y si se ha utilizado una rúbrica, lista de cotejo u otro instrumento.
              </p>
            </div>
          </Alert>

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle de la evaluación..."
              className="min-h-[70px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button type="submit" disabled={saveMutation.isPending || Number(puntosAsignados) <= 0}>
              {saveMutation.isPending ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
