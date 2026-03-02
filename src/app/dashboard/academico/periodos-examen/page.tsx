"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { periodoExamenSchema, type PeriodoExamenFormData } from "@/lib/validators/periodo-examen";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

const TIPO_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  EXTRAORDINARIO: "Extraordinario",
  TERCERA_OPORTUNIDAD: "Tercera Oportunidad",
};

const TIPO_VARIANTS: Record<string, "default" | "warning" | "destructive"> = {
  NORMAL: "default",
  EXTRAORDINARIO: "warning",
  TERCERA_OPORTUNIDAD: "destructive",
};

interface Sede {
  id: number;
  nombre: string;
}

interface PeriodoExamen {
  id: number;
  tipo: string;
  gestion: number;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  habilitado: boolean;
  sede?: Sede | null;
}

export default function PeriodosExamenPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sedeFilter, setSedeFilter] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: sedes = [] } = useQuery<Sede[]>({
    queryKey: ["sedes"],
    queryFn: async () => {
      const res = await fetch("/api/sedes");
      if (!res.ok) throw new Error("Error al cargar sedes");
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PeriodoExamenFormData>({
    resolver: zodResolver(periodoExamenSchema) as never,
    defaultValues: {
      gestion: new Date().getFullYear(),
      habilitado: false,
    },
  });

  const { data: periodos = [], isLoading } = useQuery<PeriodoExamen[]>({
    queryKey: ["periodos-examen"],
    queryFn: async () => {
      const res = await fetch("/api/periodos-examen");
      if (!res.ok) throw new Error("Error al cargar periodos");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PeriodoExamenFormData) => {
      const res = await fetch("/api/periodos-examen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear periodo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodos-examen"] });
      toast.success("Periodo de examen creado exitosamente");
      setDialogOpen(false);
      reset({ gestion: new Date().getFullYear(), habilitado: false });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, habilitado }: { id: number; habilitado: boolean }) => {
      const res = await fetch(`/api/periodos-examen/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habilitado }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar estado");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periodos-examen"] });
      toast.success("Estado actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    reset({
      tipo: "NORMAL" as const,
      gestion: new Date().getFullYear(),
      periodo: "",
      fechaInicio: undefined as unknown as Date,
      fechaFin: undefined as unknown as Date,
      habilitado: false,
    });
    setSedeId("");
    setDialogOpen(true);
  }

  function onSubmit(data: PeriodoExamenFormData) {
    createMutation.mutate({
      ...data,
      ...(sedeId ? { sedeId: Number(sedeId) } : {}),
    } as PeriodoExamenFormData);
  }

  function formatDate(dateStr: string) {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  }

  const filtered = periodos.filter((p) => {
    const matchesSearch =
      TIPO_LABELS[p.tipo]?.toLowerCase().includes(search.toLowerCase()) ||
      p.periodo.toLowerCase().includes(search.toLowerCase()) ||
      String(p.gestion).includes(search);
    const matchesSede =
      !sedeFilter ||
      (p.sede ? String(p.sede.id) === sedeFilter : false);
    return matchesSearch && matchesSede;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Periodos de Examen</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Periodo
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por tipo, gestión o periodo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sede-filter" className="text-sm font-medium whitespace-nowrap">
            Sede:
          </label>
          <Select
            id="sede-filter"
            value={sedeFilter}
            onChange={(e) => setSedeFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todas</option>
            {sedes.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Gestión</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Cargando periodos...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {search ? "No se encontraron resultados" : "No hay periodos registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((periodo) => (
                <TableRow key={periodo.id}>
                  <TableCell>
                    <Badge variant={TIPO_VARIANTS[periodo.tipo] ?? "default"}>
                      {TIPO_LABELS[periodo.tipo] ?? periodo.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{periodo.sede?.nombre ?? "Todas"}</TableCell>
                  <TableCell>{periodo.gestion}</TableCell>
                  <TableCell>{periodo.periodo}</TableCell>
                  <TableCell>{formatDate(periodo.fechaInicio)}</TableCell>
                  <TableCell>{formatDate(periodo.fechaFin)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={periodo.habilitado}
                        onCheckedChange={(val) =>
                          toggleMutation.mutate({ id: periodo.id, habilitado: val })
                        }
                        disabled={toggleMutation.isPending}
                      />
                      <span className="text-sm text-muted-foreground">
                        {periodo.habilitado ? "Habilitado" : "Deshabilitado"}
                      </span>
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
          <DialogTitle>Nuevo Periodo de Examen</DialogTitle>
          <DialogDescription>
            Configura un nuevo periodo de examen para la gestión académica.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pe-tipo">Tipo de Examen</Label>
            <Select id="pe-tipo" {...register("tipo")}>
              <option value="NORMAL">Normal</option>
              <option value="EXTRAORDINARIO">Extraordinario</option>
              <option value="TERCERA_OPORTUNIDAD">Tercera Oportunidad</option>
            </Select>
            {errors.tipo && (
              <p className="text-sm text-destructive">{errors.tipo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pe-sede">Sede</Label>
            <Select
              id="pe-sede"
              value={sedeId}
              onChange={(e) => setSedeId(e.target.value)}
            >
              <option value="">Todas las sedes</option>
              {sedes.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pe-gestion">Gestión</Label>
              <Input
                id="pe-gestion"
                type="number"
                {...register("gestion")}
                min={2020}
                placeholder="Ej: 2026"
              />
              {errors.gestion && (
                <p className="text-sm text-destructive">{errors.gestion.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-periodo">Periodo</Label>
              <Input id="pe-periodo" {...register("periodo")} placeholder="Ej: I-2026" />
              {errors.periodo && (
                <p className="text-sm text-destructive">{errors.periodo.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pe-inicio">Fecha Inicio</Label>
              <Input id="pe-inicio" type="date" {...register("fechaInicio")} />
              {errors.fechaInicio && (
                <p className="text-sm text-destructive">{errors.fechaInicio.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pe-fin">Fecha Fin</Label>
              <Input id="pe-fin" type="date" {...register("fechaFin")} />
              {errors.fechaFin && (
                <p className="text-sm text-destructive">{errors.fechaFin.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creando..." : "Crear Periodo"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
