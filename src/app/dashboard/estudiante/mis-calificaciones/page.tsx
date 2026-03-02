"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";

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

interface Calificacion {
  id: number;
  trabajoPractico: number | null;
  examenParcial: number | null;
  examenFinal: number | null;
  notaFinal: number | null;
  tipoExamen: string;
  observacion: string | null;
}

interface InscripcionCalificacion {
  id: number;
  semestre: number;
  gestion: number;
  periodo: string;
  estado: "CURSANDO" | "APROBADO" | "REPROBADO" | "RETIRADO";
  calificaciones: Calificacion[];
  asignatura: {
    id: number;
    nombre: string;
    codigo: string;
    semestre: number;
  };
  docente: {
    id: number;
    usuario: { id: string; name: string | null; email: string | null };
  };
}

export default function MisCalificacionesPage() {
  const [semestreFiltro, setSemestreFiltro] = useState("");

  const { data: inscripciones = [], isLoading } = useQuery<InscripcionCalificacion[]>({
    queryKey: ["estudiante-calificaciones", semestreFiltro],
    queryFn: async () => {
      const params = semestreFiltro ? `?semestre=${semestreFiltro}` : "";
      const res = await fetch(`/api/estudiante/mis-calificaciones${params}`);
      if (!res.ok) throw new Error("Error al cargar calificaciones");
      return res.json();
    },
  });

  const semestresUnicos = [...new Set(inscripciones.map((i) => i.semestre))].sort(
    (a, b) => a - b,
  );

  const aprobadas = inscripciones.filter((i) => i.estado === "APROBADO").length;
  const reprobadas = inscripciones.filter((i) => i.estado === "REPROBADO").length;

  const notasFinales = inscripciones
    .flatMap((i) => i.calificaciones)
    .map((c) => c.notaFinal)
    .filter((n): n is number => n != null);

  const promedio =
    notasFinales.length > 0
      ? (notasFinales.reduce((a, b) => a + b, 0) / notasFinales.length).toFixed(1)
      : "—";

  function formatTipoExamen(tipo: string): string {
    const map: Record<string, string> = {
      NORMAL: "Normal",
      EXTRAORDINARIO: "Extraordinario",
      TERCERA_OPORTUNIDAD: "3ra Oportunidad",
    };
    return map[tipo] ?? tipo;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mis Calificaciones</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Materias Aprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{aprobadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Materias Reprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{reprobadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promedio General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{promedio}</p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-xs">
        <Select
          value={semestreFiltro}
          onChange={(e) => setSemestreFiltro(e.target.value)}
        >
          <option value="">Todos los semestres</option>
          {semestresUnicos.map((s) => (
            <option key={s} value={s}>
              Semestre {s}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando calificaciones...</p>
      ) : inscripciones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardList className="mx-auto mb-2 h-8 w-8" />
            No se encontraron calificaciones.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asignatura</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead className="text-center">Trabajo Práctico</TableHead>
                <TableHead className="text-center">Examen Parcial</TableHead>
                <TableHead className="text-center">Examen Final</TableHead>
                <TableHead className="text-center">Nota Final</TableHead>
                <TableHead>Tipo Examen</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inscripciones.map((insc) => {
                const cal =
                  insc.calificaciones.length > 0
                    ? insc.calificaciones[insc.calificaciones.length - 1]
                    : null;

                const notaFinal = cal?.notaFinal;
                const estadoVariant =
                  insc.estado === "APROBADO"
                    ? "success"
                    : insc.estado === "REPROBADO"
                      ? "destructive"
                      : insc.estado === "RETIRADO"
                        ? "warning"
                        : "default";

                return (
                  <TableRow key={insc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{insc.asignatura.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {insc.asignatura.codigo}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{insc.docente.usuario.name ?? "—"}</TableCell>
                    <TableCell className="text-center font-mono">
                      {cal?.trabajoPractico ?? "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {cal?.examenParcial ?? "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {cal?.examenFinal ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-mono font-semibold ${
                          notaFinal != null && notaFinal >= 51
                            ? "text-green-600"
                            : notaFinal != null
                              ? "text-red-600"
                              : ""
                        }`}
                      >
                        {notaFinal ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {cal ? formatTipoExamen(cal.tipoExamen) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant}>
                        {insc.estado === "APROBADO"
                          ? "Aprobado"
                          : insc.estado === "REPROBADO"
                            ? "Reprobado"
                            : insc.estado === "CURSANDO"
                              ? "Cursando"
                              : "Retirado"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
