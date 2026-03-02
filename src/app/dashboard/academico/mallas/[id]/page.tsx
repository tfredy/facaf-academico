"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { asignaturaSchema, type AsignaturaFormData } from "@/lib/validators/asignatura";
import { toast } from "sonner";
import { Plus, ArrowLeft, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
  semestre: number;
  creditos: number;
  horasTeoricas: number;
  horasPracticas: number;
  mallaCurricularId: number;
}

interface MallaDetalle {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  totalSemestres: number;
  activa: boolean;
  asignaturas: Asignatura[];
}

export default function MallaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mallaId = Number(params.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSemestre, setActiveSemestre] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AsignaturaFormData>({
    resolver: zodResolver(asignaturaSchema) as never,
    defaultValues: {
      mallaCurricularId: mallaId,
      semestre: 1,
      creditos: 0,
      horasTeoricas: 0,
      horasPracticas: 0,
    },
  });

  const { data: malla, isLoading, error } = useQuery<MallaDetalle>({
    queryKey: ["malla", mallaId],
    queryFn: async () => {
      const res = await fetch(`/api/mallas/${mallaId}`);
      if (!res.ok) throw new Error("Error al cargar malla");
      return res.json();
    },
    enabled: !isNaN(mallaId),
  });

  const createAsignatura = useMutation({
    mutationFn: async (data: AsignaturaFormData) => {
      const res = await fetch("/api/asignaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear asignatura");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["malla", mallaId] });
      toast.success("Asignatura creada exitosamente");
      setDialogOpen(false);
      reset({
        mallaCurricularId: mallaId,
        semestre: activeSemestre,
        creditos: 0,
        horasTeoricas: 0,
        horasPracticas: 0,
        nombre: "",
        codigo: "",
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openCreate() {
    reset({
      mallaCurricularId: mallaId,
      semestre: activeSemestre,
      creditos: 0,
      horasTeoricas: 0,
      horasPracticas: 0,
      nombre: "",
      codigo: "",
    });
    setDialogOpen(true);
  }

  function onSubmit(data: AsignaturaFormData) {
    createAsignatura.mutate({ ...data, mallaCurricularId: mallaId });
  }

  const semestres = malla ? Array.from({ length: malla.totalSemestres }, (_, i) => i + 1) : [];

  const asignaturasPorSemestre = (sem: number) =>
    malla?.asignaturas.filter((a) => a.semestre === sem) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando malla curricular...</p>
      </div>
    );
  }

  if (error || !malla) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <p className="text-center text-muted-foreground py-8">
          No se pudo cargar la malla curricular.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{malla.nombre}</h1>
          <p className="text-muted-foreground">
            Código: {malla.codigo} · {malla.totalSemestres} semestres ·{" "}
            {malla.asignaturas.length} asignaturas
          </p>
        </div>
        <Badge variant={malla.activa ? "success" : "secondary"} className="ml-auto">
          {malla.activa ? "Activa" : "Inactiva"}
        </Badge>
      </div>

      {malla.descripcion && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{malla.descripcion}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Plan de Estudios</h2>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Asignatura
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {semestres.map((sem) => (
          <Button
            key={sem}
            variant={activeSemestre === sem ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSemestre(sem)}
          >
            Semestre {sem}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Semestre {activeSemestre}
          </CardTitle>
          <CardDescription>
            {asignaturasPorSemestre(activeSemestre).length} asignatura(s) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Hrs. Teóricas</TableHead>
                  <TableHead>Hrs. Prácticas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaturasPorSemestre(activeSemestre).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No hay asignaturas en este semestre
                    </TableCell>
                  </TableRow>
                ) : (
                  asignaturasPorSemestre(activeSemestre).map((asig) => (
                    <TableRow key={asig.id}>
                      <TableCell className="font-mono">{asig.codigo}</TableCell>
                      <TableCell className="font-medium">{asig.nombre}</TableCell>
                      <TableCell>{asig.creditos}</TableCell>
                      <TableCell>{asig.horasTeoricas}</TableCell>
                      <TableCell>{asig.horasPracticas}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Nueva Asignatura</DialogTitle>
          <DialogDescription>
            Agrega una asignatura a la malla &quot;{malla.nombre}&quot;.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asig-nombre">Nombre</Label>
              <Input id="asig-nombre" {...register("nombre")} placeholder="Ej: Cálculo I" />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="asig-codigo">Código</Label>
              <Input id="asig-codigo" {...register("codigo")} placeholder="Ej: MAT-101" />
              {errors.codigo && (
                <p className="text-sm text-destructive">{errors.codigo.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asig-semestre">Semestre</Label>
            <Select id="asig-semestre" {...register("semestre")}>
              {semestres.map((s) => (
                <option key={s} value={s}>
                  Semestre {s}
                </option>
              ))}
            </Select>
            {errors.semestre && (
              <p className="text-sm text-destructive">{errors.semestre.message}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asig-creditos">Créditos</Label>
              <Input id="asig-creditos" type="number" {...register("creditos")} min={0} />
              {errors.creditos && (
                <p className="text-sm text-destructive">{errors.creditos.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="asig-ht">Hrs. Teóricas</Label>
              <Input id="asig-ht" type="number" {...register("horasTeoricas")} min={0} />
              {errors.horasTeoricas && (
                <p className="text-sm text-destructive">{errors.horasTeoricas.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="asig-hp">Hrs. Prácticas</Label>
              <Input id="asig-hp" type="number" {...register("horasPracticas")} min={0} />
              {errors.horasPracticas && (
                <p className="text-sm text-destructive">{errors.horasPracticas.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAsignatura.isPending}>
              {createAsignatura.isPending ? "Creando..." : "Crear Asignatura"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
