"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { exportToExcel, exportToPDF } from "@/lib/exports";
import { useState } from "react";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"];

interface Estadisticas {
  totales: {
    estudiantes: number;
    docentes: number;
    mallas: number;
    asignaturas: number;
  };
  estudiantesPorMalla: { mallaCurricularId: number; nombre: string; cantidad: number }[];
  inscripcionesPorEstado: { estado: string; cantidad: number }[];
  topAsignaturas: { asignaturaId: number; nombre: string; promedio: number }[];
  tasaAsistencia: number;
}

interface Asignatura {
  id: number;
  nombre: string;
  codigo: string;
}

interface Malla {
  id: number;
  nombre: string;
  codigo: string;
}

interface InscripcionCalificacion {
  id: number;
  estudiante: {
    matricula: string;
    usuario: { name: string; email: string };
  };
  calificaciones: {
    trabajoPractico: number | null;
    examenParcial: number | null;
    examenFinal: number | null;
    notaFinal: number | null;
    tipoExamen: string;
  }[];
  asignatura: { id: number; nombre: string; codigo: string };
}

interface InscripcionAsistencia {
  id: number;
  estudiante: {
    matricula: string;
    usuario: { name: string; email: string };
  };
  asistencias: { presente: boolean }[];
  asignatura: { id: number; nombre: string; codigo: string };
}

interface EstudianteReporte {
  id: number;
  matricula: string;
  semestreActual: number;
  usuario: { name: string; email: string };
  mallaCurricular: { id: number; nombre: string };
}

export default function ReportesPage() {
  const [calAsignaturaId, setCalAsignaturaId] = useState("");
  const [calTipoExamen, setCalTipoExamen] = useState("");
  const [asisAsignaturaId, setAsisAsignaturaId] = useState("");
  const [estMallaId, setEstMallaId] = useState("");
  const [exportingCal, setExportingCal] = useState(false);
  const [exportingAsis, setExportingAsis] = useState(false);
  const [exportingEst, setExportingEst] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<Estadisticas>({
    queryKey: ["reportes-estadisticas"],
    queryFn: async () => {
      const res = await fetch("/api/reportes/estadisticas");
      if (!res.ok) throw new Error("Error al cargar estadísticas");
      return res.json();
    },
  });

  const { data: asignaturas } = useQuery<Asignatura[]>({
    queryKey: ["asignaturas-lista"],
    queryFn: async () => {
      const res = await fetch("/api/asignaturas");
      if (!res.ok) throw new Error("Error al cargar asignaturas");
      return res.json();
    },
  });

  const { data: mallas } = useQuery<Malla[]>({
    queryKey: ["mallas-lista"],
    queryFn: async () => {
      const res = await fetch("/api/mallas");
      if (!res.ok) throw new Error("Error al cargar mallas");
      return res.json();
    },
  });

  const handleExportCalificaciones = async (format: "pdf" | "excel") => {
    if (!calAsignaturaId) {
      toast.error("Seleccione una asignatura");
      return;
    }
    setExportingCal(true);
    try {
      const params = new URLSearchParams({ asignaturaId: calAsignaturaId });
      if (calTipoExamen) params.set("tipoExamen", calTipoExamen);
      const res = await fetch(`/api/reportes/calificaciones?${params}`);
      if (!res.ok) throw new Error("Error al obtener datos");
      const data: InscripcionCalificacion[] = await res.json();

      const asignaturaNombre =
        asignaturas?.find((a) => a.id === parseInt(calAsignaturaId))?.nombre ?? "Asignatura";
      const headers = ["Matrícula", "Nombre", "T. Práctico", "Ex. Parcial", "Ex. Final", "Nota Final"];
      const rows = data.flatMap((insc) =>
        insc.calificaciones.length > 0
          ? insc.calificaciones.map((cal) => [
              insc.estudiante.matricula,
              insc.estudiante.usuario.name,
              cal.trabajoPractico ?? "-",
              cal.examenParcial ?? "-",
              cal.examenFinal ?? "-",
              cal.notaFinal ?? "-",
            ])
          : [[insc.estudiante.matricula, insc.estudiante.usuario.name, "-", "-", "-", "-"]]
      );

      if (format === "pdf") {
        await exportToPDF(
          `Reporte de Calificaciones - ${asignaturaNombre}`,
          headers,
          rows as (string | number)[][],
          `calificaciones_${asignaturaNombre.replace(/\s+/g, "_")}`
        );
      } else {
        const excelData = data.flatMap((insc) =>
          insc.calificaciones.length > 0
            ? insc.calificaciones.map((cal) => ({
                Matrícula: insc.estudiante.matricula,
                Nombre: insc.estudiante.usuario.name,
                "T. Práctico": cal.trabajoPractico ?? "",
                "Ex. Parcial": cal.examenParcial ?? "",
                "Ex. Final": cal.examenFinal ?? "",
                "Nota Final": cal.notaFinal ?? "",
              }))
            : [
                {
                  Matrícula: insc.estudiante.matricula,
                  Nombre: insc.estudiante.usuario.name,
                  "T. Práctico": "",
                  "Ex. Parcial": "",
                  "Ex. Final": "",
                  "Nota Final": "",
                },
              ]
        );
        exportToExcel(excelData, `calificaciones_${asignaturaNombre.replace(/\s+/g, "_")}`);
      }
      toast.success(`Reporte exportado como ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExportingCal(false);
    }
  };

  const handleExportAsistencia = async (format: "pdf" | "excel") => {
    if (!asisAsignaturaId) {
      toast.error("Seleccione una asignatura");
      return;
    }
    setExportingAsis(true);
    try {
      const res = await fetch(`/api/reportes/asistencia?asignaturaId=${asisAsignaturaId}`);
      if (!res.ok) throw new Error("Error al obtener datos");
      const data: InscripcionAsistencia[] = await res.json();

      const asignaturaNombre =
        asignaturas?.find((a) => a.id === parseInt(asisAsignaturaId))?.nombre ?? "Asignatura";
      const headers = ["Matrícula", "Nombre", "Total Clases", "Asistencias", "Inasistencias", "% Asistencia"];
      const rows = data.map((insc) => {
        const total = insc.asistencias.length;
        const presentes = insc.asistencias.filter((a) => a.presente).length;
        const ausentes = total - presentes;
        const porcentaje = total > 0 ? Math.round((presentes / total) * 10000) / 100 : 0;
        return [
          insc.estudiante.matricula,
          insc.estudiante.usuario.name,
          total,
          presentes,
          ausentes,
          `${porcentaje}%`,
        ];
      });

      if (format === "pdf") {
        await exportToPDF(
          `Reporte de Asistencia - ${asignaturaNombre}`,
          headers,
          rows as (string | number)[][],
          `asistencia_${asignaturaNombre.replace(/\s+/g, "_")}`
        );
      } else {
        const excelData = data.map((insc) => {
          const total = insc.asistencias.length;
          const presentes = insc.asistencias.filter((a) => a.presente).length;
          const ausentes = total - presentes;
          const porcentaje = total > 0 ? Math.round((presentes / total) * 10000) / 100 : 0;
          return {
            Matrícula: insc.estudiante.matricula,
            Nombre: insc.estudiante.usuario.name,
            "Total Clases": total,
            Asistencias: presentes,
            Inasistencias: ausentes,
            "% Asistencia": porcentaje,
          };
        });
        exportToExcel(excelData, `asistencia_${asignaturaNombre.replace(/\s+/g, "_")}`);
      }
      toast.success(`Reporte exportado como ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExportingAsis(false);
    }
  };

  const handleExportEstudiantes = async (format: "pdf" | "excel") => {
    setExportingEst(true);
    try {
      const params = new URLSearchParams();
      if (estMallaId) params.set("mallaCurricularId", estMallaId);
      const res = await fetch(`/api/reportes/estudiantes?${params}`);
      if (!res.ok) throw new Error("Error al obtener datos");
      const data: EstudianteReporte[] = await res.json();

      const headers = ["Matrícula", "Nombre", "Email", "Malla", "Semestre"];
      const rows = data.map((est) => [
        est.matricula,
        est.usuario.name,
        est.usuario.email,
        est.mallaCurricular?.nombre ?? "-",
        est.semestreActual,
      ]);

      if (format === "pdf") {
        await exportToPDF("Lista de Estudiantes", headers, rows as (string | number)[][], "estudiantes");
      } else {
        const excelData = data.map((est) => ({
          Matrícula: est.matricula,
          Nombre: est.usuario.name,
          Email: est.usuario.email,
          Malla: est.mallaCurricular?.nombre ?? "-",
          Semestre: est.semestreActual,
        }));
        exportToExcel(excelData, "estudiantes");
      }
      toast.success(`Reporte exportado como ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExportingEst(false);
    }
  };

  const summaryCards = [
    { title: "Total Estudiantes", value: stats?.totales.estudiantes ?? 0, icon: Users, color: "text-blue-600" },
    { title: "Total Docentes", value: stats?.totales.docentes ?? 0, icon: UserCheck, color: "text-green-600" },
    { title: "Total Mallas", value: stats?.totales.mallas ?? 0, icon: BookOpen, color: "text-purple-600" },
    { title: "Total Asignaturas", value: stats?.totales.asignaturas ?? 0, icon: GraduationCap, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h1>
        <p className="text-muted-foreground mt-1">
          Dashboard de estadísticas académicas y exportación de reportes
        </p>
      </div>

      {/* Sección A: Dashboard de Estadísticas */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Dashboard de Estadísticas
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : card.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stats && stats.tasaAsistencia > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tasa de Asistencia General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.tasaAsistencia}%</div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart 1: Estudiantes por Malla */}
          <Card>
            <CardHeader>
              <CardTitle>Estudiantes por Malla Curricular</CardTitle>
              <CardDescription>Distribución de estudiantes inscritos en cada malla</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.estudiantesPorMalla.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.estudiantesPorMalla}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sin datos disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* Chart 2: Inscripciones por Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Inscripciones por Estado</CardTitle>
              <CardDescription>Distribución de estados de inscripciones</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.inscripcionesPorEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.inscripcionesPorEstado}
                      dataKey="cantidad"
                      nameKey="estado"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(props) => `${props.name ?? ""}: ${props.value ?? ""}`}
                    >
                      {stats.inscripcionesPorEstado.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Sin datos disponibles</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart 3: Top 10 Asignaturas por Promedio */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Asignaturas por Promedio de Nota Final</CardTitle>
            <CardDescription>Asignaturas con el mayor promedio de calificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && stats.topAsignaturas.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.topAsignaturas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="promedio" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Sección B: Exportar Reportes */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Reportes
        </h2>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Reporte de Calificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reporte de Calificaciones
              </CardTitle>
              <CardDescription>
                Exportar calificaciones por asignatura y tipo de examen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Asignatura</Label>
                <Select
                  value={calAsignaturaId}
                  onChange={(e) => setCalAsignaturaId(e.target.value)}
                >
                  <option value="">Seleccionar asignatura...</option>
                  {asignaturas?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Examen</Label>
                <Select
                  value={calTipoExamen}
                  onChange={(e) => setCalTipoExamen(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="NORMAL">Normal</option>
                  <option value="EXTRAORDINARIO">Extraordinario</option>
                  <option value="TERCERA_OPORTUNIDAD">Tercera Oportunidad</option>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={exportingCal}
                  onClick={() => handleExportCalificaciones("pdf")}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={exportingCal}
                  onClick={() => handleExportCalificaciones("excel")}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Exportar Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reporte de Asistencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Reporte de Asistencia
              </CardTitle>
              <CardDescription>
                Exportar registro de asistencia por asignatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Asignatura</Label>
                <Select
                  value={asisAsignaturaId}
                  onChange={(e) => setAsisAsignaturaId(e.target.value)}
                >
                  <option value="">Seleccionar asignatura...</option>
                  {asignaturas?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={exportingAsis}
                  onClick={() => handleExportAsistencia("pdf")}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={exportingAsis}
                  onClick={() => handleExportAsistencia("excel")}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Exportar Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Estudiantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Lista de Estudiantes
              </CardTitle>
              <CardDescription>
                Exportar lista de estudiantes por malla curricular
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Malla Curricular</Label>
                <Select
                  value={estMallaId}
                  onChange={(e) => setEstMallaId(e.target.value)}
                >
                  <option value="">Todas las mallas</option>
                  {mallas?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={exportingEst}
                  onClick={() => handleExportEstudiantes("pdf")}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={exportingEst}
                  onClick={() => handleExportEstudiantes("excel")}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Exportar Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
