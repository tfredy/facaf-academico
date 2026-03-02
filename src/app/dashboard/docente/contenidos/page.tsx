"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  MapPin,
  FileText,
  ClipboardCheck,
  ChevronRight,
  GraduationCap,
  Search,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { FormClase } from "./form-clase";
import { FormEvaluacion } from "./form-evaluacion";

interface Materia {
  id: number;
  asignatura: {
    id: number;
    nombre: string;
    codigo: string;
    semestre: number;
    mallaCurricular?: { nombre: string };
  };
  sede?: { id: number; nombre: string };
  gestion: number;
  periodo: string;
}

function ContenidosInner() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("docenteAsignaturaId");
  const [selectedMateria, setSelectedMateria] = useState<string>(
    preselected ?? ""
  );
  const [search, setSearch] = useState("");

  const { data: materias = [], isLoading } = useQuery<Materia[]>({
    queryKey: ["mis-materias-all"],
    queryFn: async () => {
      const res = await fetch("/api/docente/mis-materias");
      if (!res.ok) return [];
      const data = await res.json();
      return data.asignaturas ?? [];
    },
  });

  const selectedMateriaData = useMemo(
    () => materias.find((m) => String(m.id) === selectedMateria),
    [materias, selectedMateria]
  );

  // Group by sede
  const groupedBySede = useMemo(() => {
    const map = new Map<
      string,
      { sedeId: number; sedeName: string; materias: Materia[] }
    >();
    for (const m of materias) {
      const key = m.sede?.nombre ?? "Sin sede";
      if (!map.has(key)) {
        map.set(key, {
          sedeId: m.sede?.id ?? 0,
          sedeName: key,
          materias: [],
        });
      }
      map.get(key)!.materias.push(m);
    }
    // Sort materias within each group by semestre then name
    for (const group of map.values()) {
      group.materias.sort(
        (a, b) =>
          a.asignatura.semestre - b.asignatura.semestre ||
          a.asignatura.nombre.localeCompare(b.asignatura.nombre)
      );
    }
    return [...map.values()];
  }, [materias]);

  // Filter
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groupedBySede;
    const q = search.toLowerCase();
    return groupedBySede
      .map((g) => ({
        ...g,
        materias: g.materias.filter(
          (m) =>
            m.asignatura.nombre.toLowerCase().includes(q) ||
            m.asignatura.codigo.toLowerCase().includes(q) ||
            g.sedeName.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.materias.length > 0);
  }, [groupedBySede, search]);

  function handleSelectMateria(id: number) {
    setSelectedMateria(String(id));
  }

  function handleBack() {
    setSelectedMateria("");
    setSearch("");
  }

  // ── Vista: Selección de materia ──
  if (!selectedMateria) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Contenidos y Evaluaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seleccioná una asignatura para registrar clases y evaluaciones
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar asignatura o sede..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            Cargando asignaturas...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">
              {search
                ? "No se encontraron asignaturas"
                : "No tenés asignaturas asignadas"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <div key={group.sedeName}>
                {/* Sede header */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    {group.sedeName}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {group.materias.length} materia
                    {group.materias.length !== 1 && "s"}
                  </Badge>
                </div>

                {/* Materia cards grid */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.materias.map((m) => {
                    const semColor =
                      m.asignatura.semestre <= 2
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : m.asignatura.semestre <= 4
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-violet-50 text-violet-700 border-violet-200";

                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectMateria(m.id)}
                        className="group w-full text-left rounded-lg border border-gray-200 bg-white p-3.5 transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                              {m.asignatura.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {m.asignatura.codigo}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                        </div>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${semColor}`}
                          >
                            Sem. {m.asignatura.semestre}
                          </span>
                          {m.asignatura.mallaCurricular && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {m.asignatura.mallaCurricular.nombre}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Vista: Materia seleccionada (Contenidos / Evaluaciones) ──
  return (
    <div className="space-y-5">
      {/* Back button + header */}
      <div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer font-medium mb-3 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a mis asignaturas
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedMateriaData?.asignatura.nombre ?? "Asignatura"}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {selectedMateriaData?.asignatura.codigo && (
                <Badge variant="outline" className="text-xs">
                  {selectedMateriaData.asignatura.codigo}
                </Badge>
              )}
              {selectedMateriaData?.sede && (
                <Badge variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {selectedMateriaData.sede.nombre}
                </Badge>
              )}
              {selectedMateriaData?.asignatura.semestre && (
                <Badge variant="secondary" className="text-xs">
                  Semestre {selectedMateriaData.asignatura.semestre}
                </Badge>
              )}
              {selectedMateriaData?.asignatura.mallaCurricular && (
                <span className="text-xs text-muted-foreground">
                  {selectedMateriaData.asignatura.mallaCurricular.nombre}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            Cambiar asignatura
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="clases">
        <TabsList>
          <TabsTrigger value="clases">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Contenido de Clases
          </TabsTrigger>
          <TabsTrigger value="evaluaciones">
            <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
            Evaluaciones
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clases">
          <FormClase docenteAsignaturaId={Number(selectedMateria)} />
        </TabsContent>
        <TabsContent value="evaluaciones">
          <FormEvaluacion docenteAsignaturaId={Number(selectedMateria)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ContenidosPage() {
  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      }
    >
      <ContenidosInner />
    </Suspense>
  );
}
