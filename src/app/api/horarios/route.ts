import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sedeId = searchParams.get("sedeId");

    const where: Record<string, unknown> = {};
    if (sedeId) where.sedeId = parseInt(sedeId);

    const horarios = await prisma.horarioClase.findMany({
      where,
      include: {
        sede: { select: { id: true, nombre: true } },
        docenteAsignatura: {
          include: {
            asignatura: { select: { id: true, nombre: true, codigo: true } },
            docente: { include: { usuario: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    });
    return NextResponse.json(horarios);
  } catch {
    return NextResponse.json({ error: "Error al obtener horarios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sedeId, docenteAsignaturaId, diaSemana, horaInicio, horaFin, aula, fechaInicio, fechaFin } = body as {
      sedeId: number; docenteAsignaturaId: number; diaSemana: number;
      horaInicio: string; horaFin: string; aula?: string;
      fechaInicio?: string; fechaFin?: string;
    };
    if (!sedeId || !docenteAsignaturaId || !diaSemana || !horaInicio || !horaFin) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }
    const horario = await prisma.horarioClase.create({
      data: {
        sedeId, docenteAsignaturaId, diaSemana, horaInicio, horaFin, aula,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
      },
      include: {
        sede: { select: { nombre: true } },
        docenteAsignatura: {
          include: {
            asignatura: { select: { id: true, nombre: true, codigo: true } },
            docente: { include: { usuario: { select: { name: true } } } },
          },
        },
      },
    });
    return NextResponse.json(horario, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear horario" }, { status: 500 });
  }
}
