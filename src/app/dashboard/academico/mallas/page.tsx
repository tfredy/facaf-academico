"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mallaSchema, type MallaFormData } from "@/lib/validators/malla";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";

interface SedeOption {
  id: number;
  nombre: string;
}

interface Malla {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  totalSemestres: number;
  activa: boolean;
  sedeId?: number | null;
  sede?: { id: number; nombre: string } | null;
  _count?: { asignaturas: number };
  createdAt: string;
}

export default function MallasPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMalla, setEditingMalla] = useState<Malla | null>(null);
  const [sedeFilter, setSedeFilter] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MallaFormData>({
    resolver: zodResolver(mallaSchema) as never,
    defaultValues: { activa: true, totalSemestres: 10 },
  });

  const activaValue = watch("activa");

  const { data: sedes = [] } = useQuery<SedeOption[]>({
    queryKey: ["sedes"],
    queryFn: async () => {
      const res = await fetch("/api/sedes");
      return res.json();
    },
  });

  const { data: mallas = [], isLoading } = useQuery<Malla[]>({
    queryKey: ["mallas", sedeFilter],
    queryFn: async () => {
      const url = sedeFilter ? `/api/mallas?sedeId=${sedeFilter}` : "/api/mallas";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar mallas");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MallaFormData) => {
      const res = await fetch("/api/mallas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear malla");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mallas"] });
      toast.success("Malla creada exitosamente");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MallaFormData }) => {
      const res = await fetch(`/api/mallas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar malla");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mallas"] });
      toast.success("Malla actualizada exitosamente");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/mallas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al eliminar malla");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mallas"] });
      toast.success("Malla eliminada exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    setEditingMalla(null);
    reset({ nombre: "", codigo: "", descripcion: "", totalSemestres: 10, activa: true, sedeId: undefined as unknown as number });
    setDialogOpen(true);
  }

  function openEdit(malla: Malla) {
    setEditingMalla(malla);
    reset({
      nombre: malla.nombre,
      codigo: malla.codigo,
      descripcion: malla.descripcion ?? "",
      totalSemestres: malla.totalSemestres,
      activa: malla.activa,
      sedeId: malla.sedeId ?? undefined,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingMalla(null);
    reset();
  }

  function onSubmit(data: MallaFormData) {
    if (editingMalla) {
      updateMutation.mutate({ id: editingMalla.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleDelete(malla: Malla) {
    if (confirm(`¿Eliminar la malla "${malla.nombre}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(malla.id);
    }
  }

  const filtered = mallas.filter(
    (m) =>
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mallas Curriculares</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Malla
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
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
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Total Semestres</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asignaturas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Cargando mallas...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {search ? "No se encontraron resultados" : "No hay mallas registradas"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((malla) => (
                <TableRow key={malla.id}>
                  <TableCell className="font-mono">{malla.codigo}</TableCell>
                  <TableCell className="font-medium">{malla.nombre}</TableCell>
                  <TableCell>{malla.sede?.nombre ?? "Sin sede"}</TableCell>
                  <TableCell>{malla.totalSemestres}</TableCell>
                  <TableCell>
                    <Badge variant={malla.activa ? "success" : "secondary"}>
                      {malla.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>{malla._count?.asignaturas ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/academico/mallas/${malla.id}`)}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(malla)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(malla)}
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
          <DialogTitle>{editingMalla ? "Editar Malla" : "Nueva Malla Curricular"}</DialogTitle>
          <DialogDescription>
            {editingMalla
              ? "Modifica los datos de la malla curricular."
              : "Completa los datos para crear una nueva malla curricular."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register("nombre")} placeholder="Ej: Ingeniería de Sistemas" />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" {...register("codigo")} placeholder="Ej: IS-2024" />
            {errors.codigo && (
              <p className="text-sm text-destructive">{errors.codigo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalSemestres">Total de Semestres</Label>
            <Input
              id="totalSemestres"
              type="number"
              {...register("totalSemestres")}
              min={1}
              max={20}
            />
            {errors.totalSemestres && (
              <p className="text-sm text-destructive">{errors.totalSemestres.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sedeId">Sede</Label>
            <Select id="sedeId" {...register("sedeId")}>
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
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register("descripcion")}
              placeholder="Descripción opcional de la malla..."
              rows={3}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={activaValue}
              onCheckedChange={(val) => setValue("activa", val)}
            />
            <Label>Activa</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating ? "Guardando..." : editingMalla ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
