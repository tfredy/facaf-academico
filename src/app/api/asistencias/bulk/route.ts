import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asistencias } = body as {
      asistencias: {
        inscripcionId: number;
        fecha: string;
        presente: boolean;
        observacion?: string;
      }[];
    };

    if (!asistencias || !Array.isArray(asistencias) || asistencias.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de asistencias" },
        { status: 400 },
      );
    }

    const resultados = await prisma.$transaction(
      asistencias.map((a) =>
        prisma.asistencia.upsert({
          where: {
            inscripcionId_fecha: {
              inscripcionId: a.inscripcionId,
              fecha: new Date(a.fecha),
            },
          },
          update: {
            presente: a.presente,
            observacion: a.observacion,
          },
          create: {
            inscripcionId: a.inscripcionId,
            fecha: new Date(a.fecha),
            presente: a.presente,
            observacion: a.observacion,
          },
        }),
      ),
    );

    return NextResponse.json(resultados, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al registrar las asistencias" },
      { status: 500 },
    );
  }
}
