import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { estudianteSchema } from "@/lib/validators/estudiante";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sedeId = searchParams.get("sedeId");

    const where: Record<string, unknown> = {};
    if (sedeId) where.sedeId = parseInt(sedeId);

    const estudiantes = await prisma.estudiante.findMany({
      where,
      include: {
        usuario: { select: { id: true, name: true, email: true, rol: true, activo: true } },
        mallaCurricular: true,
        sede: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(estudiantes);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener los estudiantes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = estudianteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { nombre, email, matricula, mallaCurricularId, semestreActual, sedeId } =
      result.data;

    const estudiante = await prisma.$transaction(async (tx) => {
      const usuario = await tx.user.create({
        data: {
          name: nombre,
          email,
          rol: "ESTUDIANTE",
        },
      });

      return tx.estudiante.create({
        data: {
          usuarioId: usuario.id,
          matricula,
          mallaCurricularId,
          semestreActual,
          ...(sedeId ? { sedeId } : {}),
        },
        include: { usuario: true, mallaCurricular: true, sede: { select: { id: true, nombre: true } } },
      });
    });

    return NextResponse.json(estudiante, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear el estudiante" },
      { status: 500 },
    );
  }
}
