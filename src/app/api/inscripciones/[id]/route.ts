import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: parseInt(id) },
      include: {
        estudiante: { include: { usuario: { select: { name: true, email: true } } } },
        asignatura: true,
        docente: { include: { usuario: { select: { name: true } } } },
        calificaciones: true,
        asistencias: { orderBy: { fecha: "desc" } },
      },
    });

    if (!inscripcion) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(inscripcion);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la inscripción" },
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

    const inscripcion = await prisma.inscripcion.update({
      where: { id: parseInt(id) },
      data: body,
      include: {
        estudiante: { include: { usuario: { select: { name: true } } } },
        asignatura: true,
        docente: { include: { usuario: { select: { name: true } } } },
      },
    });

    return NextResponse.json(inscripcion);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar la inscripción" },
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
    await prisma.inscripcion.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Inscripción eliminada" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar la inscripción" },
      { status: 500 },
    );
  }
}
