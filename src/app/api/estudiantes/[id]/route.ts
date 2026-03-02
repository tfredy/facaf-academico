import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { estudianteSchema } from "@/lib/validators/estudiante";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: { select: { id: true, name: true, email: true, rol: true, activo: true } },
        mallaCurricular: true,
        inscripciones: { include: { asignatura: true, docente: true } },
      },
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(estudiante);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el estudiante" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
      const existing = await tx.estudiante.findUnique({
        where: { id: parseInt(id) },
        select: { usuarioId: true },
      });

      if (!existing) throw new Error("NOT_FOUND");

      await tx.user.update({
        where: { id: existing.usuarioId },
        data: { name: nombre, email },
      });

      return tx.estudiante.update({
        where: { id: parseInt(id) },
        data: { matricula, mallaCurricularId, semestreActual, ...(sedeId ? { sedeId } : {}) },
        include: { usuario: true, mallaCurricular: true, sede: { select: { id: true, nombre: true } } },
      });
    });

    return NextResponse.json(estudiante);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el estudiante" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: parseInt(id) },
      select: { usuarioId: true },
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }

    await prisma.user.delete({
      where: { id: estudiante.usuarioId },
    });

    return NextResponse.json({ message: "Estudiante eliminado" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar el estudiante" },
      { status: 500 },
    );
  }
}
