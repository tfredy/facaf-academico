"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Upload, ArrowLeft, AlertTriangle, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface MateriaDocente {
  id: number;
  asignatura: {
    id: number;
    nombre: string;
    codigo: string;
    semestre: number;
  };
  gestion: number;
  periodo: string;
}
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const TIPO_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "EXTRAORDINARIO", label: "Extraordinario" },
  { value: "TERCERA_OPORTUNIDAD", label: "Tercera Oportunidad" },
] as const;

interface Inscripcion {
  id: number;
  estudianteId: number;
  estudiante: {
    id: number;
    matricula: string;
    usuario: { name: string; email: string };
  };
}

interface Calificacion {
  id: number;
  estudianteId: number;
  trabajoPractico: number | null;
  examenParcial: number | null;
  examenFinal: number | null;
  notaFinal: number | null;
}

interface PeriodoExamen {
  id: number;
  tipo: string;
  gestion: number;
  periodo: string;
  habilitado: boolean;
}

interface GradeRecord {
  estudianteId: number;
  trabajoPractico: string;
  examenParcial: string;
  examenFinal: string;
}

function calcularNotaFinal(record: GradeRecord): number | null {
  const tp = parseFloat(record.trabajoPractico);
  const ep = parseFloat(record.examenParcial);
  const ef = parseFloat(record.examenFinal);
  if (isNaN(tp) && isNaN(ep) && isNaN(ef)) return null;
  const tpVal = isNaN(tp) ? 0 : tp;
  const epVal = isNaN(ep) ? 0 : ep;
  const efVal = isNaN(ef) ? 0 : ef;
  return Math.round((tpVal * 0.3 + epVal * 0.3 + efVal * 0.4) * 100) / 100;
}

function CalificacionesContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const asignaturaId = searchParams.get("asignaturaId");

  const [tipoExamen, setTipoExamen] = useState("NORMAL");
  const [gradesMap, setGradesMap] = useState<Record<number, GradeRecord>>({});
  const [file, setFile] = useState<File | null>(null);

  const { data: inscripciones = [], isLoading } = useQuery<Inscripcion[]>({
    queryKey: ["inscripciones", asignaturaId],
    queryFn: async () => {
      const res = await fetch(
        `/api/inscripciones?asignaturaId=${asignaturaId}`
      );
      if (!res.ok) throw new Error("Error al cargar inscripciones");
      return res.json();
    },
    enabled: !!asignaturaId,
  });

  const { data: calificaciones } = useQuery<Calificacion[]>({
    queryKey: ["calificaciones", asignaturaId, tipoExamen],
    queryFn: async () => {
      const res = await fetch(
        `/api/calificaciones?asignaturaId=${asignaturaId}&tipoExamen=${tipoExamen}`
      );
      if (!res.ok) throw new Error("Error al cargar calificaciones");
      return res.json();
    },
    enabled: !!asignaturaId,
  });

  const { data: periodos = [] } = useQuery<PeriodoExamen[]>({
    queryKey: ["periodos-examen"],
    queryFn: async () => {
      const res = await fetch("/api/periodos-examen");
      if (!res.ok) throw new Error("Error al cargar periodos");
      return res.json();
    },
  });

  const periodoActual = periodos.find((p) => p.tipo === tipoExamen);
  const periodoHabilitado = periodoActual?.habilitado ?? false;

  const initializeGrades = useCallback(() => {
    const map: Record<number, GradeRecord> = {};
    inscripciones.forEach((insc) => {
      const existing = calificaciones?.find(
        (c) => c.estudianteId === insc.estudianteId
      );
      map[insc.estudianteId] = {
        estudianteId: insc.estudianteId,
        trabajoPractico: existing?.trabajoPractico?.toString() ?? "",
        examenParcial: existing?.examenParcial?.toString() ?? "",
        examenFinal: existing?.examenFinal?.toString() ?? "",
      };
    });
    setGradesMap(map);
  }, [inscripciones, calificaciones]);

  useEffect(() => {
    if (inscripciones.length > 0) {
      initializeGrades();
    }
  }, [inscripciones, calificaciones, initializeGrades]);

  const saveMutation = useMutation({
    mutationFn: async (records: GradeRecord[]) => {
      const payload = records.map((r) => ({
        estudianteId: r.estudianteId,
        trabajoPractico: r.trabajoPractico ? parseFloat(r.trabajoPractico) : null,
        examenParcial: r.examenParcial ? parseFloat(r.examenParcial) : null,
        examenFinal: r.examenFinal ? parseFloat(r.examenFinal) : null,
        notaFinal: calcularNotaFinal(r),
      }));
      const res = await fetch("/api/calificaciones/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asignaturaId: Number(asignaturaId),
          tipoExamen,
          calificaciones: payload,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar calificaciones");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calificaciones", asignaturaId, tipoExamen],
      });
      toast.success("Calificaciones guardadas exitosamente");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      const formData = new FormData();
      formData.append("archivo", uploadFile);
      formData.append("asignaturaId", asignaturaId!);
      formData.append("tipoExamen", tipoExamen);
      const res = await fetch("/api/archivos-examen", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al subir archivo");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Archivo subido exitosamente");
      setFile(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function updateGrade(
    estudianteId: number,
    field: "trabajoPractico" | "examenParcial" | "examenFinal",
    value: string
  ) {
    setGradesMap((prev) => ({
      ...prev,
      [estudianteId]: { ...prev[estudianteId], [field]: value },
    }));
  }

  function handleSave() {
    saveMutation.mutate(Object.values(gradesMap));
  }

  function handleUpload() {
    if (!file) return;
    uploadMutation.mutate(file);
  }

  const { data: materias = [], isLoading: loadingMaterias } = useQuery<MateriaDocente[]>({
    queryKey: ["mis-materias-calificaciones"],
    queryFn: async () => {
      const res = await fetch("/api/docente/mis-materias");
      if (!res.ok) throw new Error("Error al cargar materias");
      const data = await res.json();
      return data.asignaturas ?? [];
    },
    enabled: !asignaturaId,
  });

  if (!asignaturaId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seleccione una asignatura para gestionar calificaciones
          </p>
        </div>

        {loadingMaterias ? (
          <p className="text-muted-foreground py-8 text-center">Cargando materias...</p>
        ) : materias.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">No tiene materias asignadas.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materias.map((m) => (
              <Link
                key={m.id}
                href={`/dashboard/docente/calificaciones?asignaturaId=${m.asignatura.id}`}
              >
                <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {m.asignatura.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {m.asignatura.codigo}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Sem. {m.asignatura.semestre}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Gestión {m.gestion} - Periodo {m.periodo}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/docente/mis-materias">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Calificaciones</h1>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="tipo-examen" className="whitespace-nowrap">
            Tipo de Examen:
          </Label>
          <Select
            id="tipo-examen"
            value={tipoExamen}
            onChange={(e) => setTipoExamen(e.target.value)}
            className="w-48"
          >
            {TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {periodoActual && (
        <div className="flex items-center gap-2">
          <span className="text-sm">Estado del periodo:</span>
          {periodoHabilitado ? (
            <Badge variant="success">Habilitado</Badge>
          ) : (
            <Badge variant="destructive">Deshabilitado</Badge>
          )}
          {!periodoHabilitado && (
            <span className="flex items-center gap-1 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              El periodo no está habilitado, no se pueden guardar calificaciones
            </span>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      ) : inscripciones.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No hay estudiantes inscritos en esta asignatura.
        </p>
      ) : (
        <>
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !periodoHabilitado}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending
                ? "Guardando..."
                : "Guardar Calificaciones"}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nombre Estudiante</TableHead>
                  <TableHead className="text-center">Trabajo Práctico</TableHead>
                  <TableHead className="text-center">Examen Parcial</TableHead>
                  <TableHead className="text-center">Examen Final</TableHead>
                  <TableHead className="text-center">Nota Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscripciones.map((insc) => {
                  const record = gradesMap[insc.estudianteId];
                  const notaFinal = record
                    ? calcularNotaFinal(record)
                    : null;
                  return (
                    <TableRow key={insc.id}>
                      <TableCell className="font-mono">
                        {insc.estudiante.matricula}
                      </TableCell>
                      <TableCell className="font-medium">
                        {insc.estudiante.usuario?.name ?? "Sin nombre"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={record?.trabajoPractico ?? ""}
                          onChange={(e) =>
                            updateGrade(
                              insc.estudianteId,
                              "trabajoPractico",
                              e.target.value
                            )
                          }
                          className="h-8 w-20 mx-auto text-center text-sm"
                          disabled={!periodoHabilitado}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={record?.examenParcial ?? ""}
                          onChange={(e) =>
                            updateGrade(
                              insc.estudianteId,
                              "examenParcial",
                              e.target.value
                            )
                          }
                          className="h-8 w-20 mx-auto text-center text-sm"
                          disabled={!periodoHabilitado}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={record?.examenFinal ?? ""}
                          onChange={(e) =>
                            updateGrade(
                              insc.estudianteId,
                              "examenFinal",
                              e.target.value
                            )
                          }
                          className="h-8 w-20 mx-auto text-center text-sm"
                          disabled={!periodoHabilitado}
                        />
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {notaFinal !== null ? notaFinal : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subir Examen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="archivo-examen">Archivo</Label>
              <Input
                id="archivo-examen"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || uploadMutation.isPending}
              variant="secondary"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadMutation.isPending ? "Subiendo..." : "Subir Archivo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CalificacionesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Calificaciones</h1>
          <p className="text-muted-foreground py-8 text-center">Cargando...</p>
        </div>
      }
    >
      <CalificacionesContent />
    </Suspense>
  );
}
