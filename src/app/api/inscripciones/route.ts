import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estudianteId = searchParams.get("estudianteId");
    const asignaturaId = searchParams.get("asignaturaId");

    const where: Record<string, number> = {};
    if (estudianteId) where.estudianteId = parseInt(estudianteId);
    if (asignaturaId) where.asignaturaId = parseInt(asignaturaId);

    const inscripciones = await prisma.inscripcion.findMany({
      where,
      include: {
        estudiante: { include: { usuario: { select: { name: true, email: true } } } },
        asignatura: true,
        docente: { include: { usuario: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inscripciones);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las inscripciones" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { estudianteId, asignaturaId, docenteId, semestre, gestion, periodo } =
      body as {
        estudianteId: number;
        asignaturaId: number;
        docenteId: number;
        semestre: number;
        gestion: number;
        periodo: string;
      };

    if (!estudianteId || !asignaturaId || !docenteId || !semestre || !gestion || !periodo) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 },
      );
    }

    const inscripcion = await prisma.inscripcion.create({
      data: {
        estudianteId,
        asignaturaId,
        docenteId,
        semestre,
        gestion,
        periodo,
      },
      include: {
        estudiante: { include: { usuario: { select: { name: true } } } },
        asignatura: true,
        docente: { include: { usuario: { select: { name: true } } } },
      },
    });

    return NextResponse.json(inscripcion, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear la inscripción" },
      { status: 500 },
    );
  }
}
