import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { periodoExamenSchema } from "@/lib/validators/periodo-examen";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const periodo = await prisma.periodoExamen.findUnique({
      where: { id: parseInt(id) },
    });

    if (!periodo) {
      return NextResponse.json(
        { error: "Periodo de examen no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el periodo de examen" },
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
    const result = periodoExamenSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const periodo = await prisma.periodoExamen.update({
      where: { id: parseInt(id) },
      data: result.data,
    });

    return NextResponse.json(periodo);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar el periodo de examen" },
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
    await prisma.periodoExamen.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Periodo de examen eliminado" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar el periodo de examen" },
      { status: 500 },
    );
  }
}
