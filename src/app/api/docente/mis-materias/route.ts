import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    const docente = await prisma.docente.findUnique({
      where: { usuarioId: session.user.id },
    });

    if (!docente) {
      return NextResponse.json(
        { error: "Perfil de docente no encontrado" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const gestion = searchParams.get("gestion");

    const where: Record<string, unknown> = { docenteId: docente.id };
    if (gestion) {
      where.gestion = parseInt(gestion);
    } else {
      where.gestion = new Date().getFullYear();
    }

    const docenteAsignaturas = await prisma.docenteAsignatura.findMany({
      where,
      include: {
        asignatura: {
          include: {
            mallaCurricular: true,
          },
        },
        sede: { select: { id: true, nombre: true } },
      },
      orderBy: [{ gestion: "desc" }, { periodo: "asc" }],
    });

    return NextResponse.json({
      docente,
      asignaturas: docenteAsignaturas,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las materias del docente" },
      { status: 500 },
    );
  }
}
