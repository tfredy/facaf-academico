import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { asignaturaSchema } from "@/lib/validators/asignatura";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mallaCurricularId = searchParams.get("mallaCurricularId");

    const where = mallaCurricularId
      ? { mallaCurricularId: parseInt(mallaCurricularId) }
      : {};

    const asignaturas = await prisma.asignatura.findMany({
      where,
      include: { mallaCurricular: true },
      orderBy: [{ semestre: "asc" }, { nombre: "asc" }],
    });

    return NextResponse.json(asignaturas);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las asignaturas" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = asignaturaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const asignatura = await prisma.asignatura.create({
      data: result.data,
    });

    return NextResponse.json(asignatura, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear la asignatura" },
      { status: 500 },
    );
  }
}
