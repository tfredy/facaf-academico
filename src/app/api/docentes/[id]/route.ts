import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { docenteSchema } from "@/lib/validators/docente";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const docente = await prisma.docente.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: { select: { id: true, name: true, email: true, rol: true, activo: true } },
        docenteAsignaturas: { include: { asignatura: true } },
      },
    });

    if (!docente) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(docente);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el docente" },
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
    const result = docenteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { nombre, email, especialidad, titulo, telefono } = result.data;

    const docente = await prisma.$transaction(async (tx) => {
      const existing = await tx.docente.findUnique({
        where: { id: parseInt(id) },
        select: { usuarioId: true },
      });

      if (!existing) throw new Error("NOT_FOUND");

      await tx.user.update({
        where: { id: existing.usuarioId },
        data: { name: nombre, email },
      });

      return tx.docente.update({
        where: { id: parseInt(id) },
        data: { especialidad, titulo, telefono },
        include: { usuario: true },
      });
    });

    return NextResponse.json(docente);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Error al actualizar el docente" },
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
    const docente = await prisma.docente.findUnique({
      where: { id: parseInt(id) },
      select: { usuarioId: true },
    });

    if (!docente) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 },
      );
    }

    await prisma.user.delete({
      where: { id: docente.usuarioId },
    });

    return NextResponse.json({ message: "Docente eliminado" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar el docente" },
      { status: 500 },
    );
  }
}
