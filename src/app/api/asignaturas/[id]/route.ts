import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { asignaturaSchema } from "@/lib/validators/asignatura";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const asignatura = await prisma.asignatura.findUnique({
      where: { id: parseInt(id) },
      include: {
        mallaCurricular: true,
        prerequisitos: { include: { prerequisito: true } },
        esPrerequisitoDe: { include: { asignatura: true } },
      },
    });

    if (!asignatura) {
      return NextResponse.json(
        { error: "Asignatura no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(asignatura);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la asignatura" },
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
    const result = asignaturaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const asignatura = await prisma.asignatura.update({
      where: { id: parseInt(id) },
      data: result.data,
    });

    return NextResponse.json(asignatura);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar la asignatura" },
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
    await prisma.asignatura.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Asignatura eliminada" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar la asignatura" },
      { status: 500 },
    );
  }
}
