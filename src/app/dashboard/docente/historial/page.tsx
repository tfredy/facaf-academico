"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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

interface AsignaturaHistorial {
  id: number;
  nombre: string;
  codigo: string;
  semestre: number;
  gestion: number;
  periodo: string;
  totalEstudiantes: number;
}

interface MallaGroup {
  mallaCurricular: {
    id: number;
    nombre: string;
    codigo: string;
  };
  asignaturas: AsignaturaHistorial[];
}

export default function HistorialPage() {
  const [expandedMallas, setExpandedMallas] = useState<Set<number>>(new Set());

  const { data: groups = [], isLoading } = useQuery<MallaGroup[]>({
    queryKey: ["docente-historial"],
    queryFn: async () => {
      const res = await fetch("/api/docente/historial");
      if (!res.ok) throw new Error("Error al cargar historial");
      const data = await res.json();
      return data.historial ?? [];
    },
  });

  function toggleMalla(mallaId: number) {
    setExpandedMallas((prev) => {
      const next = new Set(prev);
      if (next.has(mallaId)) {
        next.delete(mallaId);
      } else {
        next.add(mallaId);
      }
      return next;
    });
  }

  const totalAsignaturas = groups.reduce((s, g) => s + g.asignaturas.length, 0);
  const totalEstudiantes = groups.reduce(
    (s, g) => s + g.asignaturas.reduce((a, b) => a + b.totalEstudiantes, 0),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Historial de Enseñanza
      </h1>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No hay historial disponible
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>
              Total de asignaturas dictadas:{" "}
              <strong className="text-foreground">{totalAsignaturas}</strong>
            </span>
            <span>
              Total de estudiantes:{" "}
              <strong className="text-foreground">{totalEstudiantes}</strong>
            </span>
          </div>

          <div className="space-y-4">
            {groups.map((group) => {
              const mallaId = group.mallaCurricular.id;
              const isExpanded = expandedMallas.has(mallaId);
              const groupTotal = group.asignaturas.reduce(
                (s, a) => s + a.totalEstudiantes,
                0
              );
              return (
                <Card key={mallaId}>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleMalla(mallaId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {group.mallaCurricular.nombre}
                        </CardTitle>
                        <CardDescription>
                          {group.asignaturas.length} asignatura
                          {group.asignaturas.length !== 1 ? "s" : ""} &middot;{" "}
                          {groupTotal} estudiante
                          {groupTotal !== 1 ? "s" : ""} en total
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Asignatura</TableHead>
                              <TableHead>Gestión</TableHead>
                              <TableHead>Periodo</TableHead>
                              <TableHead className="text-right">
                                Cantidad Estudiantes
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.asignaturas.map((asig, idx) => (
                              <TableRow key={`${asig.id}-${asig.gestion}-${asig.periodo}-${idx}`}>
                                <TableCell className="font-medium">
                                  {asig.nombre}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({asig.codigo})
                                  </span>
                                </TableCell>
                                <TableCell>{asig.gestion}</TableCell>
                                <TableCell>{asig.periodo}</TableCell>
                                <TableCell className="text-right">
                                  {asig.totalEstudiantes}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell colSpan={3}>Subtotal</TableCell>
                              <TableCell className="text-right">
                                {groupTotal}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
