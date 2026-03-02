"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { docenteSchema, type DocenteFormData } from "@/lib/validators/docente";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Docente {
  id: number;
  usuarioId: string;
  especialidad: string | null;
  titulo: string | null;
  telefono: string | null;
  usuario: {
    id: string;
    name: string | null;
    email: string | null;
  };
  docenteAsignaturas?: {
    id: number;
    asignatura: { nombre: string };
    sede?: { id: number; nombre: string } | null;
  }[];
}

export default function DocentesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocenteFormData>({
    resolver: zodResolver(docenteSchema),
  });

  const { data: docentes = [], isLoading } = useQuery<Docente[]>({
    queryKey: ["docentes"],
    queryFn: async () => {
      const res = await fetch("/api/docentes");
      if (!res.ok) throw new Error("Error al cargar docentes");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DocenteFormData) => {
      const res = await fetch("/api/docentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear docente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      toast.success("Docente creado exitosamente");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DocenteFormData }) => {
      const res = await fetch(`/api/docentes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar docente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      toast.success("Docente actualizado exitosamente");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/docentes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al eliminar docente");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docentes"] });
      toast.success("Docente eliminado exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditingDocente(null);
    reset({ nombre: "", email: "", especialidad: "", titulo: "", telefono: "" });
    setDialogOpen(true);
  }

  function openEdit(docente: Docente) {
    setEditingDocente(docente);
    reset({
      nombre: docente.usuario.name ?? "",
      email: docente.usuario.email ?? "",
      especialidad: docente.especialidad ?? "",
      titulo: docente.titulo ?? "",
      telefono: docente.telefono ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingDocente(null);
    reset();
  }

  function onSubmit(data: DocenteFormData) {
    if (editingDocente) {
      updateMutation.mutate({ id: editingDocente.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleDelete(docente: Docente) {
    if (confirm(`¿Eliminar al docente "${docente.usuario.name}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(docente.id);
    }
  }

  const filtered = docentes.filter((d) => {
    const nombre = (d.usuario.name ?? "").toLowerCase();
    const email = (d.usuario.email ?? "").toLowerCase();
    const esp = (d.especialidad ?? "").toLowerCase();
    const q = search.toLowerCase();
    return nombre.includes(q) || email.includes(q) || esp.includes(q);
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Docentes</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Docente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o especialidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Sedes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Cargando docentes...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? "No se encontraron resultados" : "No hay docentes registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((docente) => (
                <TableRow key={docente.id}>
                  <TableCell className="font-medium">{docente.usuario.name}</TableCell>
                  <TableCell>{docente.usuario.email}</TableCell>
                  <TableCell>{docente.especialidad || "—"}</TableCell>
                  <TableCell>{docente.titulo || "—"}</TableCell>
                  <TableCell>
                    {(() => {
                      const sedes = [
                        ...new Map(
                          (docente.docenteAsignaturas ?? [])
                            .filter((da) => da.sede)
                            .map((da) => [da.sede!.id, da.sede!.nombre])
                        ).values(),
                      ];
                      return sedes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {sedes.map((nombre, i) => (
                            <Badge key={i} variant="secondary">{nombre}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin asignaciones</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(docente)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(docente)}
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
          <DialogTitle>{editingDocente ? "Editar Docente" : "Nuevo Docente"}</DialogTitle>
          <DialogDescription>
            {editingDocente
              ? "Modifica los datos del docente."
              : "Completa los datos para registrar un nuevo docente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-nombre">Nombre</Label>
            <Input id="doc-nombre" {...register("nombre")} placeholder="Nombre completo" />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-email">Email</Label>
            <Input id="doc-email" type="email" {...register("email")} placeholder="correo@ejemplo.com" />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doc-especialidad">Especialidad</Label>
              <Input id="doc-especialidad" {...register("especialidad")} placeholder="Ej: Matemáticas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-titulo">Título</Label>
              <Input id="doc-titulo" {...register("titulo")} placeholder="Ej: Magíster" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-telefono">Teléfono</Label>
            <Input id="doc-telefono" {...register("telefono")} placeholder="Ej: +591 70000000" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating ? "Guardando..." : editingDocente ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
