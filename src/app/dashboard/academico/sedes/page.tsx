"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Users,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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

interface Sede {
  id: number;
  nombre: string;
  codigo: string;
  direccion: string | null;
  telefono: string | null;
  activa: boolean;
  _count: {
    mallaCurriculares: number;
    estudiantes: number;
    docenteAsignaturas: number;
  };
}

interface SedeFormState {
  nombre: string;
  codigo: string;
  direccion: string;
  telefono: string;
  activa: boolean;
}

const emptyForm: SedeFormState = {
  nombre: "",
  codigo: "",
  direccion: "",
  telefono: "",
  activa: true,
};

export default function SedesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [form, setForm] = useState<SedeFormState>(emptyForm);

  const { data: sedes = [], isLoading } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: async () => {
      const res = await fetch("/api/sedes");
      if (!res.ok) throw new Error("Error al cargar sedes");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SedeFormState) => {
      const res = await fetch("/api/sedes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre,
          codigo: data.codigo,
          direccion: data.direccion || undefined,
          telefono: data.telefono || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear sede");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
      toast.success("Sede creada exitosamente");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SedeFormState }) => {
      const res = await fetch(`/api/sedes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre,
          codigo: data.codigo,
          direccion: data.direccion || undefined,
          telefono: data.telefono || undefined,
          activa: data.activa,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar sede");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
      toast.success("Sede actualizada exitosamente");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/sedes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al eliminar sede");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
      toast.success("Sede eliminada exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditingSede(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(sede: Sede) {
    setEditingSede(sede);
    setForm({
      nombre: sede.nombre,
      codigo: sede.codigo,
      direccion: sede.direccion ?? "",
      telefono: sede.telefono ?? "",
      activa: sede.activa,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingSede(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.codigo.trim()) {
      toast.error("Nombre y código son requeridos");
      return;
    }
    if (editingSede) {
      updateMutation.mutate({ id: editingSede.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function handleDelete(sede: Sede) {
    if (
      confirm(
        `¿Eliminar la sede "${sede.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      deleteMutation.mutate(sede.id);
    }
  }

  function updateField<K extends keyof SedeFormState>(
    key: K,
    value: SedeFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const filtered = sedes.filter((s) =>
    s.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const totalEstudiantes = sedes.reduce(
    (acc, s) => acc + s._count.estudiantes,
    0
  );
  const totalMallas = sedes.reduce(
    (acc, s) => acc + s._count.mallaCurriculares,
    0
  );
  const sedesActivas = sedes.filter((s) => s.activa).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Sedes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de sedes y campus de la institución
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sede
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedes Activas</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sedesActivas}</div>
            <p className="text-xs text-muted-foreground">
              de {sedes.length} sedes registradas
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Estudiantes
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstudiantes}</div>
            <p className="text-xs text-muted-foreground">
              en todas las sedes
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mallas</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMallas}</div>
            <p className="text-xs text-muted-foreground">
              mallas curriculares asignadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
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
              <TableHead>Código</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Mallas</TableHead>
              <TableHead>Estudiantes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Cargando sedes...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  {search
                    ? "No se encontraron resultados"
                    : "No hay sedes registradas"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((sede) => (
                <TableRow key={sede.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {sede.nombre}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{sede.codigo}</TableCell>
                  <TableCell>
                    {sede.direccion ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {sede.direccion}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {sede.telefono ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {sede.telefono}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sede.activa ? "success" : "secondary"}>
                      {sede.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      {sede._count.mallaCurriculares}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {sede._count.estudiantes}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(sede)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sede)}
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
            {editingSede ? "Editar Sede" : "Nueva Sede"}
          </DialogTitle>
          <DialogDescription>
            {editingSede
              ? "Modifica los datos de la sede."
              : "Completa los datos para registrar una nueva sede."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sede-nombre">Nombre</Label>
            <Input
              id="sede-nombre"
              value={form.nombre}
              onChange={(e) => updateField("nombre", e.target.value)}
              placeholder="Ej: Sede Central"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sede-codigo">Código</Label>
            <Input
              id="sede-codigo"
              value={form.codigo}
              onChange={(e) => updateField("codigo", e.target.value)}
              placeholder="Ej: SC-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sede-direccion">Dirección</Label>
            <Input
              id="sede-direccion"
              value={form.direccion}
              onChange={(e) => updateField("direccion", e.target.value)}
              placeholder="Ej: Av. Principal #123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sede-telefono">Teléfono</Label>
            <Input
              id="sede-telefono"
              value={form.telefono}
              onChange={(e) => updateField("telefono", e.target.value)}
              placeholder="Ej: +591 70000000"
            />
          </div>
          {editingSede && (
            <div className="flex items-center gap-3">
              <Switch
                checked={form.activa}
                onCheckedChange={(val) => updateField("activa", val)}
              />
              <Label>Activa</Label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating
                ? "Guardando..."
                : editingSede
                  ? "Actualizar"
                  : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
