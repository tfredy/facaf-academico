import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calificacionSchema } from "@/lib/validators/calificacion";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inscripcionId = searchParams.get("inscripcionId");
    const docenteId = searchParams.get("docenteId");
    const asignaturaId = searchParams.get("asignaturaId");
    const tipoExamen = searchParams.get("tipoExamen");

    const where: Record<string, unknown> = {};

    if (tipoExamen) {
      where.tipoExamen = tipoExamen;
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

    const calificaciones = await prisma.calificacion.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(calificaciones);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las calificaciones" },
      { status: 500 },
    );
  }
}

function calcularNotaFinal(
  trabajoPractico: number | null | undefined,
  examenParcial: number | null | undefined,
  examenFinal: number | null | undefined,
): number | null {
  if (trabajoPractico != null && examenParcial != null && examenFinal != null) {
    return trabajoPractico + examenParcial + examenFinal;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = calificacionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { inscripcionId, tipoExamen, trabajoPractico, examenParcial, examenFinal, observacion } =
      result.data;

    const periodoActivo = await prisma.periodoExamen.findFirst({
      where: { tipo: tipoExamen, habilitado: true },
    });

    if (!periodoActivo) {
      return NextResponse.json(
        { error: "El periodo de examen no está habilitado" },
        { status: 403 },
      );
    }

    const notaFinal = calcularNotaFinal(trabajoPractico, examenParcial, examenFinal);

    const calificacion = await prisma.calificacion.upsert({
      where: {
        inscripcionId_tipoExamen: {
          inscripcionId,
          tipoExamen,
        },
      },
      update: {
        trabajoPractico: trabajoPractico ?? undefined,
        examenParcial: examenParcial ?? undefined,
        examenFinal: examenFinal ?? undefined,
        notaFinal,
        observacion,
      },
      create: {
        inscripcionId,
        tipoExamen,
        trabajoPractico: trabajoPractico ?? null,
        examenParcial: examenParcial ?? null,
        examenFinal: examenFinal ?? null,
        notaFinal,
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

    return NextResponse.json(calificacion, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al guardar la calificación" },
      { status: 500 },
    );
  }
}
