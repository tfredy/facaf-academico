import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const [
      totalEstudiantes,
      totalDocentes,
      totalMallas,
      totalAsignaturas,
      estudiantesPorMalla,
      inscripcionesPorEstado,
      promediosPorAsignatura,
      totalAsistencias,
      asistenciasPresentes,
    ] = await Promise.all([
      prisma.estudiante.count(),
      prisma.docente.count(),
      prisma.mallaCurricular.count(),
      prisma.asignatura.count(),

      prisma.estudiante.groupBy({
        by: ["mallaCurricularId"],
        _count: { id: true },
      }),

      prisma.inscripcion.groupBy({
        by: ["estado"],
        _count: { id: true },
      }),

      prisma.calificacion.groupBy({
        by: ["inscripcionId"],
        _avg: { notaFinal: true },
      }),

      prisma.asistencia.count(),
      prisma.asistencia.count({ where: { presente: true } }),
    ]);

    const mallasMap = await prisma.mallaCurricular.findMany({
      select: { id: true, nombre: true },
    });
    const mallaNameById = new Map(mallasMap.map((m) => [m.id, m.nombre]));

    const estudiantesPorMallaConNombre = estudiantesPorMalla.map((item) => ({
      mallaCurricularId: item.mallaCurricularId,
      nombre: mallaNameById.get(item.mallaCurricularId) ?? "Sin malla",
      cantidad: item._count.id,
    }));

    const inscripcionIds = promediosPorAsignatura.map((p) => p.inscripcionId);
    const inscripciones = await prisma.inscripcion.findMany({
      where: { id: { in: inscripcionIds } },
      select: { id: true, asignaturaId: true, asignatura: { select: { nombre: true } } },
    });

    const inscripcionMap = new Map(inscripciones.map((i) => [i.id, i]));
    const asignaturaPromedios = new Map<number, { nombre: string; total: number; count: number }>();

    for (const item of promediosPorAsignatura) {
      const avg = item._avg.notaFinal;
      if (avg == null) continue;
      const insc = inscripcionMap.get(item.inscripcionId);
      if (!insc) continue;

      const existing = asignaturaPromedios.get(insc.asignaturaId);
      if (existing) {
        existing.total += avg;
        existing.count += 1;
      } else {
        asignaturaPromedios.set(insc.asignaturaId, {
          nombre: insc.asignatura.nombre,
          total: avg,
          count: 1,
        });
      }
    }

    const topAsignaturas = Array.from(asignaturaPromedios.entries())
      .map(([id, data]) => ({
        asignaturaId: id,
        nombre: data.nombre,
        promedio: Math.round((data.total / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 10);

    const tasaAsistencia =
      totalAsistencias > 0
        ? Math.round((asistenciasPresentes / totalAsistencias) * 10000) / 100
        : 0;

    return NextResponse.json({
      totales: {
        estudiantes: totalEstudiantes,
        docentes: totalDocentes,
        mallas: totalMallas,
        asignaturas: totalAsignaturas,
      },
      estudiantesPorMalla: estudiantesPorMallaConNombre,
      inscripcionesPorEstado: inscripcionesPorEstado.map((item) => ({
        estado: item.estado,
        cantidad: item._count.id,
      })),
      topAsignaturas,
      tasaAsistencia,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las estadísticas" },
      { status: 500 }
    );
  }
}
