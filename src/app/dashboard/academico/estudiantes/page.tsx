"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { estudianteSchema, type EstudianteFormData } from "@/lib/validators/estudiante";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SedeOption {
  id: number;
  nombre: string;
}

interface Malla {
  id: number;
  nombre: string;
  codigo: string;
}

interface Estudiante {
  id: number;
  usuarioId: string;
  matricula: string;
  mallaCurricularId: number;
  semestreActual: number;
  usuario: {
    id: string;
    name: string | null;
    email: string | null;
  };
  sedeId?: number | null;
  sede?: { id: number; nombre: string } | null;
  mallaCurricular?: { id: number; nombre: string };
}

export default function EstudiantesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEstudiante, setEditingEstudiante] = useState<Estudiante | null>(null);
  const [sedeFilter, setSedeFilter] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstudianteFormData>({
    resolver: zodResolver(estudianteSchema) as never,
    defaultValues: { semestreActual: 1 },
  });

  const { data: sedes = [] } = useQuery<SedeOption[]>({
    queryKey: ["sedes"],
    queryFn: async () => {
      const res = await fetch("/api/sedes");
      return res.json();
    },
  });

  const { data: estudiantes = [], isLoading } = useQuery<Estudiante[]>({
    queryKey: ["estudiantes", sedeFilter],
    queryFn: async () => {
      const url = sedeFilter ? `/api/estudiantes?sedeId=${sedeFilter}` : "/api/estudiantes";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar estudiantes");
      return res.json();
    },
  });

  const { data: mallas = [] } = useQuery<Malla[]>({
    queryKey: ["mallas"],
    queryFn: async () => {
      const res = await fetch("/api/mallas");
      if (!res.ok) throw new Error("Error al cargar mallas");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EstudianteFormData) => {
      const res = await fetch("/api/estudiantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear estudiante");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      toast.success("Estudiante registrado exitosamente");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EstudianteFormData }) => {
      const res = await fetch(`/api/estudiantes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar estudiante");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      toast.success("Estudiante actualizado exitosamente");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/estudiantes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al eliminar estudiante");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] });
      toast.success("Estudiante eliminado exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditingEstudiante(null);
    reset({ nombre: "", email: "", matricula: "", mallaCurricularId: undefined as unknown as number, semestreActual: 1, sedeId: undefined as unknown as number });
    setDialogOpen(true);
  }

  function openEdit(est: Estudiante) {
    setEditingEstudiante(est);
    reset({
      nombre: est.usuario.name ?? "",
      email: est.usuario.email ?? "",
      matricula: est.matricula,
      mallaCurricularId: est.mallaCurricularId,
      semestreActual: est.semestreActual,
      sedeId: est.sedeId ?? undefined,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingEstudiante(null);
    reset();
  }

  function onSubmit(data: EstudianteFormData) {
    if (editingEstudiante) {
      updateMutation.mutate({ id: editingEstudiante.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleDelete(est: Estudiante) {
    if (confirm(`¿Eliminar al estudiante "${est.usuario.name}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(est.id);
    }
  }

  const filtered = estudiantes.filter((e) => {
    const nombre = (e.usuario.name ?? "").toLowerCase();
    const email = (e.usuario.email ?? "").toLowerCase();
    const matricula = e.matricula.toLowerCase();
    const q = search.toLowerCase();
    return nombre.includes(q) || email.includes(q) || matricula.includes(q);
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Estudiantes</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Estudiante
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={sedeFilter}
          onChange={(e) => setSedeFilter(e.target.value)}
          className="max-w-[200px]"
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matrícula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Malla Curricular</TableHead>
              <TableHead>Semestre Actual</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Cargando estudiantes...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {search ? "No se encontraron resultados" : "No hay estudiantes registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((est) => (
                <TableRow key={est.id}>
                  <TableCell className="font-mono">{est.matricula}</TableCell>
                  <TableCell className="font-medium">{est.usuario.name}</TableCell>
                  <TableCell>{est.usuario.email}</TableCell>
                  <TableCell>{est.sede?.nombre ?? "Sin sede"}</TableCell>
                  <TableCell>{est.mallaCurricular?.nombre ?? "—"}</TableCell>
                  <TableCell>{est.semestreActual}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(est)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(est)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            {editingEstudiante ? "Editar Estudiante" : "Nuevo Estudiante"}
          </DialogTitle>
          <DialogDescription>
            {editingEstudiante
              ? "Modifica los datos del estudiante."
              : "Completa los datos para registrar un nuevo estudiante."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="est-nombre">Nombre</Label>
            <Input id="est-nombre" {...register("nombre")} placeholder="Nombre completo" />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="est-email">Email</Label>
            <Input id="est-email" type="email" {...register("email")} placeholder="correo@ejemplo.com" />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="est-matricula">Matrícula</Label>
              <Input id="est-matricula" {...register("matricula")} placeholder="Ej: 2024-001" />
              {errors.matricula && (
                <p className="text-sm text-destructive">{errors.matricula.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-semestre">Semestre Actual</Label>
              <Input
                id="est-semestre"
                type="number"
                {...register("semestreActual")}
                min={1}
              />
              {errors.semestreActual && (
                <p className="text-sm text-destructive">{errors.semestreActual.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="est-sede">Sede</Label>
            <Select id="est-sede" {...register("sedeId")}>
              <option value="">Seleccionar sede...</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
            {errors.sedeId && (
              <p className="text-sm text-destructive">{errors.sedeId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="est-malla">Malla Curricular</Label>
            <Select id="est-malla" {...register("mallaCurricularId")}>
              <option value="">Seleccionar malla...</option>
              {mallas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.codigo})
                </option>
              ))}
            </Select>
            {errors.mallaCurricularId && (
              <p className="text-sm text-destructive">{errors.mallaCurricularId.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating ? "Guardando..." : editingEstudiante ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
