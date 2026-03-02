"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, X } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Asistencia {
  id: number;
  fecha: string;
  presente: boolean;
  observacion: string | null;
}

interface InscripcionAsistencia {
  id: number;
  asignaturaId: number;
  semestre: number;
  gestion: number;
  periodo: string;
  asistencias: Asistencia[];
  asignatura: {
    id: number;
    nombre: string;
    codigo: string;
  };
}

export default function MiAsistenciaPage() {
  const [asignaturaFiltro, setAsignaturaFiltro] = useState("");

  const { data: inscripciones = [], isLoading } = useQuery<InscripcionAsistencia[]>({
    queryKey: ["estudiante-asistencia"],
    queryFn: async () => {
      const res = await fetch("/api/estudiante/mi-asistencia");
      if (!res.ok) throw new Error("Error al cargar asistencia");
      return res.json();
    },
  });

  const asignaturasUnicas = inscripciones.map((i) => ({
    id: i.asignaturaId,
    nombre: i.asignatura.nombre,
    codigo: i.asignatura.codigo,
    inscripcionId: i.id,
  }));

  const inscSeleccionada = asignaturaFiltro
    ? inscripciones.find((i) => i.id.toString() === asignaturaFiltro)
    : inscripciones[0];

  const asistencias = inscSeleccionada?.asistencias ?? [];
  const totalClases = asistencias.length;
  const presentes = asistencias.filter((a) => a.presente).length;
  const ausentes = totalClases - presentes;
  const porcentaje = totalClases > 0 ? ((presentes / totalClases) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mi Asistencia</h1>

      <div className="max-w-sm">
        <Select
          value={asignaturaFiltro || (inscripciones[0]?.id.toString() ?? "")}
          onChange={(e) => setAsignaturaFiltro(e.target.value)}
        >
          {asignaturasUnicas.length === 0 && (
            <option value="">Sin asignaturas</option>
          )}
          {asignaturasUnicas.map((a) => (
            <option key={a.inscripcionId} value={a.inscripcionId}>
              {a.nombre} ({a.codigo})
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando asistencia...</p>
      ) : inscripciones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CalendarDays className="mx-auto mb-2 h-8 w-8" />
            No se encontraron registros de asistencia.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Clases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalClases}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Asistencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{presentes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inasistencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{ausentes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Porcentaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${
                  parseFloat(porcentaje) >= 70 ? "text-green-600" : "text-red-600"
                }`}>
                  {porcentaje}%
                </p>
              </CardContent>
            </Card>
          </div>

          {asistencias.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay registros de asistencia para esta asignatura.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Presente</TableHead>
                    <TableHead>Observación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asistencias.map((asist) => (
                    <TableRow key={asist.id}>
                      <TableCell>{formatShortDate(asist.fecha)}</TableCell>
                      <TableCell className="text-center">
                        {asist.presente ? (
                          <Check className="mx-auto h-5 w-5 text-green-600" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {asist.observacion ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
