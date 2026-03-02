import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.diaSemana !== undefined) data.diaSemana = body.diaSemana;
    if (body.horaInicio !== undefined) data.horaInicio = body.horaInicio;
    if (body.horaFin !== undefined) data.horaFin = body.horaFin;
    if (body.aula !== undefined) data.aula = body.aula;
    if (body.docenteAsignaturaId !== undefined) data.docenteAsignaturaId = body.docenteAsignaturaId;
    if (body.fechaInicio !== undefined) data.fechaInicio = body.fechaInicio || null;
    if (body.fechaFin !== undefined) data.fechaFin = body.fechaFin || null;

    const horario = await prisma.horarioClase.update({
      where: { id: parseInt(id) },
      data,
    });
    return NextResponse.json(horario);
  } catch {
    return NextResponse.json({ error: "Error al actualizar horario" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.horarioClase.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: "Horario eliminado" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar horario" }, { status: 500 });
  }
}
