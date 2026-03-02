import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const calificacion = await prisma.calificacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        inscripcion: {
          include: {
            estudiante: {
              include: { usuario: { select: { name: true, email: true } } },
            },
            asignatura: true,
          },
        },
      },
    });

    if (!calificacion) {
      return NextResponse.json(
        { error: "Calificación no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(calificacion);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la calificación" },
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

    const existing = await prisma.calificacion.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Calificación no encontrada" },
        { status: 404 },
      );
    }

    const trabajoPractico = body.trabajoPractico ?? existing.trabajoPractico;
    const examenParcial = body.examenParcial ?? existing.examenParcial;
    const examenFinal = body.examenFinal ?? existing.examenFinal;

    let notaFinal: number | null = null;
    if (trabajoPractico != null && examenParcial != null && examenFinal != null) {
      notaFinal = trabajoPractico + examenParcial + examenFinal;
    }

    const calificacion = await prisma.calificacion.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        notaFinal,
      },
      include: {
        inscripcion: {
          include: {
            estudiante: {
              include: { usuario: { select: { name: true, email: true } } },
            },
            asignatura: true,
          },
        },
      },
    });

    return NextResponse.json(calificacion);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar la calificación" },
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

    await prisma.calificacion.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Calificación eliminada" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar la calificación" },
      { status: 500 },
    );
  }
}
