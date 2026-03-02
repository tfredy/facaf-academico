import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mallaSchema } from "@/lib/validators/malla";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sedeId = searchParams.get("sedeId");

    const where: Record<string, unknown> = {};
    if (sedeId) where.sedeId = parseInt(sedeId);

    const mallas = await prisma.mallaCurricular.findMany({
      where,
      include: {
        _count: { select: { asignaturas: true } },
        sede: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(mallas);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las mallas curriculares" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = mallaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const malla = await prisma.mallaCurricular.create({
      data: result.data,
    });

    return NextResponse.json(malla, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear la malla curricular" },
      { status: 500 },
    );
  }
}
