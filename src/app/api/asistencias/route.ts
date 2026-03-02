import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inscripcionId = searchParams.get("inscripcionId");
    const docenteId = searchParams.get("docenteId");
    const asignaturaId = searchParams.get("asignaturaId");
    const fecha = searchParams.get("fecha");

    const where: Record<string, unknown> = {};

    if (fecha) {
      where.fecha = new Date(fecha);
    }

    if (inscripcionId) {
      where.inscripcionId = parseInt(inscripcionId);
    } else if (docenteId) {
      const inscripciones = await prisma.inscripcion.findMany({
        where: {
          docenteId: parseInt(docenteId),
          ...(asignaturaId ? { asignaturaId: parseInt(asignaturaId) } : {}),
        },
        select: { id: true },
      });
      where.inscripcionId = { in: inscripciones.map((i) => i.id) };
    } else if (asignaturaId) {
      const inscripciones = await prisma.inscripcion.findMany({
        where: { asignaturaId: parseInt(asignaturaId) },
        select: { id: true },
      });
      where.inscripcionId = { in: inscripciones.map((i) => i.id) };
    }

    const asistencias = await prisma.asistencia.findMany({
      where,
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
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(asistencias);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las asistencias" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inscripcionId, fecha, presente, observacion } = body as {
      inscripcionId: number;
      fecha: string;
      presente: boolean;
      observacion?: string;
    };

    if (!inscripcionId || !fecha || presente === undefined) {
      return NextResponse.json(
        { error: "inscripcionId, fecha y presente son requeridos" },
        { status: 400 },
      );
    }

    const asistencia = await prisma.asistencia.create({
      data: {
        inscripcionId,
        fecha: new Date(fecha),
        presente,
        observacion,
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

    return NextResponse.json(asistencia, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al registrar la asistencia" },
      { status: 500 },
    );
  }
}
