import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sede = await prisma.sede.findUnique({
      where: { id: parseInt(id) },
      include: {
        mallaCurriculares: { include: { _count: { select: { asignaturas: true } } } },
        docenteAsignaturas: {
          include: {
            asignatura: { select: { id: true, nombre: true, codigo: true } },
            docente: { include: { usuario: { select: { name: true } } } },
          },
        },
        _count: { select: { estudiantes: true, docenteAsignaturas: true } },
      },
    });
    if (!sede) return NextResponse.json({ error: "Sede no encontrada" }, { status: 404 });
    return NextResponse.json(sede);
  } catch {
    return NextResponse.json({ error: "Error al obtener sede" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.nombre !== undefined) data.nombre = body.nombre;
    if (body.codigo !== undefined) data.codigo = body.codigo;
    if (body.direccion !== undefined) data.direccion = body.direccion;
    if (body.telefono !== undefined) data.telefono = body.telefono;
    if (body.activa !== undefined) data.activa = body.activa;

    const sede = await prisma.sede.update({
      where: { id: parseInt(id) },
      data,
    });
    return NextResponse.json(sede);
  } catch {
    return NextResponse.json({ error: "Error al actualizar sede" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.sede.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: "Sede eliminada" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar sede" }, { status: 500 });
  }
}
