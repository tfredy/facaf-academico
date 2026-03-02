import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mallaSchema } from "@/lib/validators/malla";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const malla = await prisma.mallaCurricular.findUnique({
      where: { id: parseInt(id) },
      include: {
        asignaturas: { orderBy: { semestre: "asc" } },
        sede: { select: { id: true, nombre: true } },
      },
    });

    if (!malla) {
      return NextResponse.json(
        { error: "Malla curricular no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(malla);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la malla curricular" },
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
    const result = mallaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const malla = await prisma.mallaCurricular.update({
      where: { id: parseInt(id) },
      data: result.data,
    });

    return NextResponse.json(malla);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar la malla curricular" },
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
    await prisma.mallaCurricular.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Malla curricular eliminada" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar la malla curricular" },
      { status: 500 },
    );
  }
}
