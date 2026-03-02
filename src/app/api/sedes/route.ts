import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sedes = await prisma.sede.findMany({
      include: {
        _count: {
          select: { mallaCurriculares: true, estudiantes: true, docenteAsignaturas: true },
        },
      },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(sedes);
  } catch {
    return NextResponse.json({ error: "Error al obtener sedes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, codigo, direccion, telefono } = body as {
      nombre: string; codigo: string; direccion?: string; telefono?: string;
    };
    if (!nombre || !codigo) {
      return NextResponse.json({ error: "Nombre y código son requeridos" }, { status: 400 });
    }
    const sede = await prisma.sede.create({
      data: { nombre, codigo, direccion, telefono },
    });
    return NextResponse.json(sede, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear sede" }, { status: 500 });
  }
}
