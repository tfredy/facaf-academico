"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, ClipboardList, GraduationCap, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Materia {
  id: number;
  asignatura: {
    id: number;
    nombre: string;
    codigo: string;
    semestre: number;
    mallaCurricular?: {
      id: number;
      nombre: string;
    };
  };
  gestion: number;
  periodo: string;
  sede?: { id: number; nombre: string } | null;
}

export default function MisMateriasPage() {
  const currentYear = new Date().getFullYear();
  const [gestionFilter, setGestionFilter] = useState<string>(String(currentYear));

  const { data: materias = [], isLoading } = useQuery<Materia[]>({
    queryKey: ["mis-materias", gestionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gestionFilter) params.set("gestion", gestionFilter);
      const res = await fetch(`/api/docente/mis-materias?${params}`);
      if (!res.ok) throw new Error("Error al cargar materias");
      const data = await res.json();
      return data.asignaturas ?? [];
    },
  });

  const gestiones = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Mis Materias</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="gestion-filter" className="text-sm font-medium whitespace-nowrap">
            Gestión:
          </label>
          <Select
            id="gestion-filter"
            value={gestionFilter}
            onChange={(e) => setGestionFilter(e.target.value)}
            className="w-32"
          >
            <option value="">Todas</option>
            {gestiones.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      ) : materias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No tiene materias asignadas
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {gestionFilter
              ? `No se encontraron materias para la gestión ${gestionFilter}`
              : "No se encontraron materias asignadas"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materias.map((materia) => (
            <Card key={materia.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">
                    {materia.asignatura.nombre}
                  </CardTitle>
                  <Badge variant="secondary">{materia.asignatura.codigo}</Badge>
                  {materia.sede && <Badge variant="outline">{materia.sede.nombre}</Badge>}
                </div>
                <CardDescription>
                  {materia.asignatura.mallaCurricular?.nombre ?? "Sin malla"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Semestre {materia.asignatura.semestre}</span>
                  <span>Gestión {materia.gestion}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Link href={`/dashboard/docente/asistencia?asignaturaId=${materia.asignatura.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Tomar Asistencia
                      </Button>
                    </Link>
                    <Link href={`/dashboard/docente/calificaciones?asignaturaId=${materia.asignatura.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Calificaciones
                      </Button>
                    </Link>
                  </div>
                  <Link href={`/dashboard/docente/asistencia/historial?asignaturaId=${materia.asignatura.id}`}>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                      <History className="mr-2 h-4 w-4" />
                      Ver Historial de Asistencia
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
