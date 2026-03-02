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
    const asignaturaId = searchParams.get("asignaturaId");
    const gestion = searchParams.get("gestion");

    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        estudianteId: estudiante.id,
        ...(asignaturaId ? { asignaturaId: parseInt(asignaturaId, 10) } : {}),
        ...(gestion ? { gestion: parseInt(gestion, 10) } : {}),
      },
      include: {
        asistencias: { orderBy: { fecha: "asc" } },
        asignatura: true,
      },
      orderBy: [{ gestion: "desc" }, { asignatura: { nombre: "asc" } }],
    });

    return NextResponse.json(inscripciones);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la asistencia" },
      { status: 500 },
    );
  }
}
