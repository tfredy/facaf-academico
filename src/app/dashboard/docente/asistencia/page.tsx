"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, ArrowLeft, Users, CalendarDays, CheckCircle2, XCircle, History, BookOpen, ClipboardList } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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

interface InscripcionAPI {
  id: number;
  estudianteId: number;
  estudiante: {
    id: number;
    matricula: string;
    usuario: { name: string; email: string };
  };
}

interface AttendanceEntry {
  inscripcionId: number;
  estudianteId: number;
  presente: boolean;
  observacion: string;
}

interface AsistenciaExistente {
  id: number;
  inscripcionId: number;
  presente: boolean;
  observacion: string | null;
  inscripcion: {
    estudianteId: number;
  };
}

function AsistenciaContent() {
  const searchParams = useSearchParams();
  const asignaturaId = searchParams.get("asignaturaId");
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];
  const fechaParam = searchParams.get("fecha");
  const [fecha, setFecha] = useState(fechaParam || today);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<number, AttendanceEntry>
  >({});

  const { data: inscripciones = [], isLoading } = useQuery<InscripcionAPI[]>({
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

  const { data: existentes } = useQuery<AsistenciaExistente[]>({
    queryKey: ["asistencias", asignaturaId, fecha],
    queryFn: async () => {
      const res = await fetch(
        `/api/asistencias?asignaturaId=${asignaturaId}&fecha=${fecha}`
      );
      if (!res.ok) throw new Error("Error al cargar asistencias");
      return res.json();
    },
    enabled: !!asignaturaId && !!fecha,
  });

  const initializeAttendance = useCallback(() => {
    const map: Record<number, AttendanceEntry> = {};
    inscripciones.forEach((insc) => {
      const existing = existentes?.find(
        (a) => a.inscripcion?.estudianteId === insc.estudianteId || a.inscripcionId === insc.id
      );
      map[insc.id] = {
        inscripcionId: insc.id,
        estudianteId: insc.estudianteId,
        presente: existing?.presente ?? false,
        observacion: existing?.observacion ?? "",
      };
    });
    setAttendanceMap(map);
  }, [inscripciones, existentes]);

  useEffect(() => {
    if (inscripciones.length > 0) {
      initializeAttendance();
    }
  }, [inscripciones, existentes, initializeAttendance]);

  const saveMutation = useMutation({
    mutationFn: async (records: AttendanceEntry[]) => {
      const res = await fetch("/api/asistencias/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asistencias: records.map((r) => ({
            inscripcionId: r.inscripcionId,
            fecha,
            presente: r.presente,
            observacion: r.observacion || undefined,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar asistencia");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Asistencia guardada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["asistencias", asignaturaId, fecha] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function updateAttendance(
    inscripcionId: number,
    field: "presente" | "observacion",
    value: boolean | string
  ) {
    setAttendanceMap((prev) => ({
      ...prev,
      [inscripcionId]: { ...prev[inscripcionId], [field]: value },
    }));
  }

  function handleSave() {
    const records = Object.values(attendanceMap);
    saveMutation.mutate(records);
  }

  function markAll(presente: boolean) {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[Number(key)] = { ...next[Number(key)], presente };
      }
      return next;
    });
  }

  const { data: materias = [], isLoading: loadingMaterias } = useQuery<MateriaDocente[]>({
    queryKey: ["mis-materias-asistencia"],
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
          <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seleccione una asignatura para tomar o revisar asistencia
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
                href={`/dashboard/docente/asistencia?asignaturaId=${m.asignatura.id}`}
              >
                <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors">
                        <ClipboardList className="h-5 w-5 text-primary" />
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

  const presentCount = Object.values(attendanceMap).filter(
    (a) => a.presente
  ).length;
  const totalCount = inscripciones.length;
  const absentCount = totalCount - presentCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/docente/mis-materias">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>
            <p className="text-sm text-muted-foreground">
              Registro de asistencia por fecha
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="fecha-asistencia" className="text-sm font-medium">
            Fecha:
          </label>
          <Input
            id="fecha-asistencia"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-44"
          />
          <Link href={`/dashboard/docente/asistencia/historial?asignaturaId=${asignaturaId}`}>
            <Button variant="outline" size="sm">
              <History className="mr-1.5 h-4 w-4" />
              Historial
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando estudiantes...</p>
      ) : inscripciones.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">
            No hay estudiantes inscritos en esta asignatura.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">
                  Presentes: {presentCount}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-sm">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-600">
                  Ausentes: {absentCount}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Total: {totalCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll(true)}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Todos presentes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll(false)}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Todos ausentes
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending
                  ? "Guardando..."
                  : "Guardar Asistencia"}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-36">Matrícula</TableHead>
                  <TableHead>Nombre del Estudiante</TableHead>
                  <TableHead className="w-28 text-center">Presente</TableHead>
                  <TableHead className="w-64">Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscripciones.map((insc, index) => {
                  const record = attendanceMap[insc.id];
                  return (
                    <TableRow
                      key={insc.id}
                      className={
                        record?.presente
                          ? "bg-emerald-50/40"
                          : ""
                      }
                    >
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {insc.estudiante.matricula}
                      </TableCell>
                      <TableCell className="font-medium">
                        {insc.estudiante.usuario?.name ?? "Sin nombre"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={record?.presente ?? false}
                          onCheckedChange={(val) =>
                            updateAttendance(insc.id, "presente", val)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={record?.observacion ?? ""}
                          onChange={(e) =>
                            updateAttendance(
                              insc.id,
                              "observacion",
                              e.target.value
                            )
                          }
                          placeholder="Observación..."
                          className="h-8 text-sm"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

export default function AsistenciaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>
          <p className="text-muted-foreground py-8 text-center">Cargando...</p>
        </div>
      }
    >
      <AsistenciaContent />
    </Suspense>
  );
}
