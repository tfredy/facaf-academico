"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Calificacion {
  id: number;
  trabajoPractico: number | null;
  examenParcial: number | null;
  examenFinal: number | null;
  notaFinal: number | null;
  tipoExamen: string;
}

interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
  semestre: number;
  creditos: number;
}

interface Inscripcion {
  id: number;
  asignaturaId: number;
  semestre: number;
  estado: "CURSANDO" | "APROBADO" | "REPROBADO" | "RETIRADO";
  calificaciones: Calificacion[];
  asignatura: Asignatura;
}

interface EstudianteData {
  id: number;
  matricula: string;
  semestreActual: number;
  usuario: { id: string; name: string | null; email: string | null };
  mallaCurricular: {
    id: number;
    nombre: string;
    codigo: string;
    totalSemestres: number;
    asignaturas: Asignatura[];
  };
  inscripciones: Inscripcion[];
}

const estadoBadge: Record<string, { label: string; variant: "success" | "destructive" | "default" | "warning" | "secondary" }> = {
  APROBADO: { label: "Aprobado", variant: "success" },
  REPROBADO: { label: "Reprobado", variant: "destructive" },
  CURSANDO: { label: "Cursando", variant: "default" },
  RETIRADO: { label: "Retirado", variant: "warning" },
};

export default function MisSemestresPage() {
  const [selectedSemestre, setSelectedSemestre] = useState(1);

  const { data, isLoading } = useQuery<EstudianteData>({
    queryKey: ["estudiante-semestres"],
    queryFn: async () => {
      const res = await fetch("/api/estudiante/mis-semestres");
      if (!res.ok) throw new Error("Error al cargar datos");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Mis Semestres</h1>
        <p className="text-muted-foreground">Cargando información académica...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Mis Semestres</h1>
        <p className="text-muted-foreground">No se encontró información del estudiante.</p>
      </div>
    );
  }

  const totalSemestres = data.mallaCurricular.totalSemestres;
  const inscripcionMap = new Map<number, Inscripcion>();
  for (const insc of data.inscripciones) {
    inscripcionMap.set(insc.asignaturaId, insc);
  }

  const asignaturasSemestre = data.mallaCurricular.asignaturas.filter(
    (a) => a.semestre === selectedSemestre,
  );

  function getNotaFinal(insc: Inscripcion | undefined): string {
    if (!insc || insc.calificaciones.length === 0) return "—";
    const cal = insc.calificaciones[insc.calificaciones.length - 1];
    return cal.notaFinal != null ? cal.notaFinal.toString() : "—";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mis Semestres</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estudiante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{data.usuario.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matrícula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold font-mono">{data.matricula}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Malla Curricular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{data.mallaCurricular.nombre}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Semestre Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {data.semestreActual} de {totalSemestres}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Progreso Académico</h2>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: totalSemestres }, (_, i) => i + 1).map(
            (sem) => {
              const asigs = data.mallaCurricular.asignaturas.filter(
                (a) => a.semestre === sem,
              );
              const allAprobadas = asigs.length > 0 && asigs.every(
                (a) => inscripcionMap.get(a.id)?.estado === "APROBADO",
              );
              const isActive = sem === selectedSemestre;

              return (
                <button
                  key={sem}
                  onClick={() => setSelectedSemestre(sem)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : allAprobadas
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  {sem}
                </button>
              );
            },
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Semestre {selectedSemestre}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {asignaturasSemestre.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              No hay asignaturas registradas para este semestre.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Nota Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asignaturasSemestre.map((asig) => {
                    const insc = inscripcionMap.get(asig.id);
                    const badge = insc
                      ? estadoBadge[insc.estado]
                      : { label: "Pendiente", variant: "secondary" as const };

                    return (
                      <TableRow key={asig.id}>
                        <TableCell className="font-mono">{asig.codigo}</TableCell>
                        <TableCell className="font-medium">{asig.nombre}</TableCell>
                        <TableCell>{asig.creditos}</TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {getNotaFinal(insc)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
