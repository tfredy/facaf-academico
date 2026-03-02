"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Pencil,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface FechaResumen {
  fecha: string;
  presentes: number;
  ausentes: number;
  total: number;
}

interface EstudianteResumen {
  id: number;
  nombre: string;
  matricula: string;
  presentes: number;
  ausentes: number;
  total: number;
}

interface ResumenData {
  fechas: FechaResumen[];
  estudiantes: EstudianteResumen[];
  totalEstudiantes: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function HistorialContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const asignaturaId = searchParams.get("asignaturaId");

  const { data, isLoading } = useQuery<ResumenData>({
    queryKey: ["asistencias-resumen", asignaturaId],
    queryFn: async () => {
      const res = await fetch(
        `/api/asistencias/resumen?asignaturaId=${asignaturaId}`
      );
      if (!res.ok) throw new Error("Error al cargar resumen");
      return res.json();
    },
    enabled: !!asignaturaId,
  });

  if (!asignaturaId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Historial de Asistencia
        </h1>
        <p className="text-muted-foreground">
          No se especificó una asignatura. Seleccione una desde{" "}
          <Link
            href="/dashboard/docente/mis-materias"
            className="text-primary underline"
          >
            Mis Materias
          </Link>
          .
        </p>
      </div>
    );
  }

  const totalClases = data?.fechas.length ?? 0;
  const totalPresencias =
    data?.fechas.reduce((acc, f) => acc + f.presentes, 0) ?? 0;
  const totalAusencias =
    data?.fechas.reduce((acc, f) => acc + f.ausentes, 0) ?? 0;
  const totalRegistros = totalPresencias + totalAusencias;
  const porcentajeGeneral =
    totalRegistros > 0 ? Math.round((totalPresencias / totalRegistros) * 100) : 0;

  const estudiantesEnRiesgo =
    data?.estudiantes.filter(
      (e) => e.total > 0 && (e.presentes / e.total) * 100 < 70
    ) ?? [];

  function goToDate(fecha: string) {
    router.push(
      `/dashboard/docente/asistencia?asignaturaId=${asignaturaId}&fecha=${fecha}`
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
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Historial de Asistencia
            </h1>
            <p className="text-sm text-muted-foreground">
              Resumen y seguimiento de asistencia por asignatura
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/docente/asistencia?asignaturaId=${asignaturaId}`}
        >
          <Button>
            <CalendarDays className="mr-2 h-4 w-4" />
            Tomar Asistencia Hoy
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">
          Cargando historial...
        </p>
      ) : !data || data.fechas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium text-muted-foreground">
            Aún no se registró asistencia
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Comience tomando asistencia desde el botón superior.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalClases}</p>
                    <p className="text-xs text-muted-foreground">
                      Clases registradas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2.5">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{porcentajeGeneral}%</p>
                    <p className="text-xs text-muted-foreground">
                      Asistencia general
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-50 p-2.5">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {data.totalEstudiantes}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estudiantes inscritos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2.5 ${
                      estudiantesEnRiesgo.length > 0
                        ? "bg-amber-50"
                        : "bg-emerald-50"
                    }`}
                  >
                    {estudiantesEnRiesgo.length > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {estudiantesEnRiesgo.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      En riesgo (&lt;70%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="por-fecha">
            <TabsList>
              <TabsTrigger value="por-fecha">
                <CalendarDays className="mr-1.5 h-4 w-4" />
                Por Fecha
              </TabsTrigger>
              <TabsTrigger value="por-estudiante">
                <Users className="mr-1.5 h-4 w-4" />
                Por Estudiante
              </TabsTrigger>
              {estudiantesEnRiesgo.length > 0 && (
                <TabsTrigger value="riesgo">
                  <AlertTriangle className="mr-1.5 h-4 w-4" />
                  En Riesgo
                </TabsTrigger>
              )}
            </TabsList>

            {/* Tab: Por Fecha */}
            <TabsContent value="por-fecha">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Registro por Fecha
                  </CardTitle>
                  <CardDescription>
                    Haga clic en una fecha para ver o editar la asistencia de ese
                    día.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-center w-28">
                            Presentes
                          </TableHead>
                          <TableHead className="text-center w-28">
                            Ausentes
                          </TableHead>
                          <TableHead className="w-40">% Asistencia</TableHead>
                          <TableHead className="w-20 text-center">
                            Acción
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.fechas.map((f) => {
                          const pct =
                            f.total > 0
                              ? Math.round((f.presentes / f.total) * 100)
                              : 0;
                          return (
                            <TableRow
                              key={f.fecha}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => goToDate(f.fecha)}
                            >
                              <TableCell className="font-medium">
                                {formatDate(f.fecha)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {f.presentes}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center gap-1.5 text-red-600">
                                  <XCircle className="h-3.5 w-3.5" />
                                  {f.ausentes}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <ProgressBar
                                    value={pct}
                                    color={
                                      pct >= 80
                                        ? "bg-emerald-500"
                                        : pct >= 60
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }
                                  />
                                  <span
                                    className={`text-xs font-medium min-w-[36px] text-right ${
                                      pct >= 80
                                        ? "text-emerald-700"
                                        : pct >= 60
                                        ? "text-amber-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToDate(f.fecha);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Por Estudiante */}
            <TabsContent value="por-estudiante">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Resumen por Estudiante
                  </CardTitle>
                  <CardDescription>
                    Porcentaje de asistencia acumulado de cada estudiante.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 text-center">
                            #
                          </TableHead>
                          <TableHead className="w-36">Matrícula</TableHead>
                          <TableHead>Estudiante</TableHead>
                          <TableHead className="text-center w-24">
                            Presentes
                          </TableHead>
                          <TableHead className="text-center w-24">
                            Ausentes
                          </TableHead>
                          <TableHead className="w-44">% Asistencia</TableHead>
                          <TableHead className="w-24 text-center">
                            Estado
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.estudiantes.map((est, idx) => {
                          const pct =
                            est.total > 0
                              ? Math.round(
                                  (est.presentes / est.total) * 100
                                )
                              : 0;
                          const enRiesgo = pct < 70 && est.total > 0;
                          return (
                            <TableRow
                              key={est.id}
                              className={enRiesgo ? "bg-red-50/40" : ""}
                            >
                              <TableCell className="text-center text-muted-foreground text-sm">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {est.matricula}
                              </TableCell>
                              <TableCell className="font-medium">
                                {est.nombre}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-emerald-700 font-medium">
                                  {est.presentes}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-red-600 font-medium">
                                  {est.ausentes}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <ProgressBar
                                    value={pct}
                                    color={
                                      pct >= 80
                                        ? "bg-emerald-500"
                                        : pct >= 60
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }
                                  />
                                  <span
                                    className={`text-xs font-medium min-w-[36px] text-right ${
                                      pct >= 80
                                        ? "text-emerald-700"
                                        : pct >= 60
                                        ? "text-amber-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                {est.total === 0 ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Sin datos
                                  </Badge>
                                ) : enRiesgo ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    <TrendingDown className="mr-1 h-3 w-3" />
                                    Riesgo
                                  </Badge>
                                ) : (
                                  <Badge className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                    Regular
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: En Riesgo */}
            {estudiantesEnRiesgo.length > 0 && (
              <TabsContent value="riesgo">
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      Estudiantes en Riesgo por Inasistencia
                    </CardTitle>
                    <CardDescription>
                      Estudiantes con menos del 70% de asistencia. Considere
                      tomar acción preventiva.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {estudiantesEnRiesgo.map((est) => {
                        const pct = Math.round(
                          (est.presentes / est.total) * 100
                        );
                        return (
                          <div
                            key={est.id}
                            className="flex items-center gap-4 rounded-lg border border-amber-100 bg-amber-50/50 p-4"
                          >
                            <div className="rounded-full bg-amber-100 p-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {est.nombre}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {est.matricula}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-lg font-bold ${
                                  pct < 50 ? "text-red-600" : "text-amber-600"
                                }`}
                              >
                                {pct}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {est.presentes}/{est.total} clases
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}

export default function HistorialAsistenciaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Historial de Asistencia
          </h1>
          <p className="text-muted-foreground py-8 text-center">Cargando...</p>
        </div>
      }
    >
      <HistorialContent />
    </Suspense>
  );
}
