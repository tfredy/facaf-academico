import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { usuarioId: session.user.id },
      include: {
        usuario: { select: { id: true, name: true, email: true } },
        mallaCurricular: {
          include: {
            asignaturas: {
              orderBy: [{ semestre: "asc" }, { codigo: "asc" }],
            },
          },
        },
        inscripciones: {
          include: {
            calificaciones: true,
            asignatura: true,
          },
        },
      },
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 401 },
      );
    }

    return NextResponse.json(estudiante);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener datos del estudiante" },
      { status: 500 },
    );
  }
}
