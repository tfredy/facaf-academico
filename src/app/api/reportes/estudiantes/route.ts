import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mallaCurricularId = searchParams.get("mallaCurricularId");
    const semestre = searchParams.get("semestre");

    const where: Record<string, unknown> = {};
    if (mallaCurricularId) where.mallaCurricularId = parseInt(mallaCurricularId);
    if (semestre) where.semestreActual = parseInt(semestre);

    const estudiantes = await prisma.estudiante.findMany({
      where,
      include: {
        usuario: { select: { name: true, email: true } },
        mallaCurricular: { select: { id: true, nombre: true } },
      },
      orderBy: { matricula: "asc" },
    });

    return NextResponse.json(estudiantes);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la lista de estudiantes" },
      { status: 500 }
    );
  }
}
