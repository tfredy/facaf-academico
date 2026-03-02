import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calificacionesBulkSchema } from "@/lib/validators/calificacion";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = calificacionesBulkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { calificaciones, tipoExamen } = result.data;

    const periodoActivo = await prisma.periodoExamen.findFirst({
      where: { tipo: tipoExamen, habilitado: true },
    });

    if (!periodoActivo) {
      return NextResponse.json(
        { error: "El periodo de examen no está habilitado" },
        { status: 403 },
      );
    }

    const resultados = await prisma.$transaction(
      calificaciones.map((cal) => {
        const { inscripcionId, trabajoPractico, examenParcial, examenFinal, observacion } = cal;

        let notaFinal: number | null = null;
        if (trabajoPractico != null && examenParcial != null && examenFinal != null) {
          notaFinal = trabajoPractico + examenParcial + examenFinal;
        }

        return prisma.calificacion.upsert({
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
        });
      }),
    );

    return NextResponse.json(resultados, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al guardar las calificaciones" },
      { status: 500 },
    );
  }
}
