import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const asistencia = await prisma.asistencia.findUnique({
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

    if (!asistencia) {
      return NextResponse.json(
        { error: "Asistencia no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(asistencia);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la asistencia" },
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

    const data: Record<string, unknown> = {};
    if (body.presente !== undefined) data.presente = body.presente;
    if (body.observacion !== undefined) data.observacion = body.observacion;
    if (body.fecha) data.fecha = new Date(body.fecha);

    const asistencia = await prisma.asistencia.update({
      where: { id: parseInt(id) },
      data,
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

    return NextResponse.json(asistencia);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar la asistencia" },
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

    await prisma.asistencia.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Asistencia eliminada" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar la asistencia" },
      { status: 500 },
    );
  }
}
