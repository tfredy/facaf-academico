import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { periodoExamenSchema } from "@/lib/validators/periodo-examen";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sedeId = searchParams.get("sedeId");

    const where: Record<string, unknown> = {};
    if (sedeId) where.sedeId = parseInt(sedeId);

    const periodos = await prisma.periodoExamen.findMany({
      where,
      include: {
        sede: { select: { id: true, nombre: true } },
      },
      orderBy: [{ gestion: "desc" }, { fechaInicio: "desc" }],
    });

    return NextResponse.json(periodos);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener los periodos de examen" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = periodoExamenSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const periodo = await prisma.periodoExamen.create({
      data: result.data,
    });

    return NextResponse.json(periodo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear el periodo de examen" },
      { status: 500 },
    );
  }
}
