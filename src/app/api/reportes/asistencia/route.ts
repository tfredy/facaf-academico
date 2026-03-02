import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asignaturaId = searchParams.get("asignaturaId");
    const gestion = searchParams.get("gestion");

    if (!asignaturaId) {
      return NextResponse.json(
        { error: "El parámetro asignaturaId es requerido" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      asignaturaId: parseInt(asignaturaId),
    };
    if (gestion) where.gestion = gestion;

    const inscripciones = await prisma.inscripcion.findMany({
      where,
      include: {
        estudiante: {
          include: {
            usuario: { select: { name: true, email: true } },
          },
        },
        asistencias: {
          orderBy: { fecha: "asc" },
        },
        asignatura: { select: { id: true, nombre: true, codigo: true } },
      },
      orderBy: { estudiante: { matricula: "asc" } },
    });

    return NextResponse.json(inscripciones);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el reporte de asistencia" },
      { status: 500 }
    );
  }
}
