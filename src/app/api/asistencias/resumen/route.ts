import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asignaturaId = searchParams.get("asignaturaId");

    if (!asignaturaId) {
      return NextResponse.json(
        { error: "asignaturaId es requerido" },
        { status: 400 }
      );
    }

    const inscripciones = await prisma.inscripcion.findMany({
      where: { asignaturaId: parseInt(asignaturaId) },
      select: { id: true, estudianteId: true },
    });

    const inscripcionIds = inscripciones.map((i) => i.id);

    if (inscripcionIds.length === 0) {
      return NextResponse.json({
        fechas: [],
        estudiantes: [],
        totalEstudiantes: 0,
      });
    }

    const asistencias = await prisma.asistencia.findMany({
      where: { inscripcionId: { in: inscripcionIds } },
      include: {
        inscripcion: {
          include: {
            estudiante: {
              include: { usuario: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const fechasMap = new Map<
      string,
      { presentes: number; ausentes: number; total: number }
    >();

    const estudiantesMap = new Map<
      number,
      {
        id: number;
        nombre: string;
        matricula: string;
        presentes: number;
        ausentes: number;
        total: number;
      }
    >();

    for (const a of asistencias) {
      const fechaKey = a.fecha.toISOString().split("T")[0];

      if (!fechasMap.has(fechaKey)) {
        fechasMap.set(fechaKey, { presentes: 0, ausentes: 0, total: 0 });
      }
      const fEntry = fechasMap.get(fechaKey)!;
      fEntry.total++;
      if (a.presente) fEntry.presentes++;
      else fEntry.ausentes++;

      const estId = a.inscripcion.estudianteId;
      if (!estudiantesMap.has(estId)) {
        estudiantesMap.set(estId, {
          id: estId,
          nombre: a.inscripcion.estudiante.usuario?.name ?? "Sin nombre",
          matricula: a.inscripcion.estudiante.matricula,
          presentes: 0,
          ausentes: 0,
          total: 0,
        });
      }
      const eEntry = estudiantesMap.get(estId)!;
      eEntry.total++;
      if (a.presente) eEntry.presentes++;
      else eEntry.ausentes++;
    }

    const fechas = Array.from(fechasMap.entries())
      .map(([fecha, stats]) => ({ fecha, ...stats }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    const estudiantes = Array.from(estudiantesMap.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );

    return NextResponse.json({
      fechas,
      estudiantes,
      totalEstudiantes: inscripciones.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el resumen de asistencias" },
      { status: 500 }
    );
  }
}
