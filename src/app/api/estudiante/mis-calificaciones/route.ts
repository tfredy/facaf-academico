import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { usuarioId: session.user.id },
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const semestre = searchParams.get("semestre");

    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        estudianteId: estudiante.id,
        ...(semestre ? { semestre: parseInt(semestre, 10) } : {}),
      },
      include: {
        calificaciones: true,
        asignatura: true,
        docente: {
          include: {
            usuario: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: [{ semestre: "asc" }, { asignatura: { codigo: "asc" } }],
    });

    return NextResponse.json(inscripciones);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las calificaciones" },
      { status: 500 },
    );
  }
}
