import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { docenteSchema } from "@/lib/validators/docente";

export async function GET() {
  try {
    const docentes = await prisma.docente.findMany({
      include: {
        usuario: { select: { id: true, name: true, email: true, rol: true, activo: true } },
        docenteAsignaturas: {
          include: {
            asignatura: { select: { nombre: true } },
            sede: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(docentes);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener los docentes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = docenteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { nombre, email, especialidad, titulo, telefono } = result.data;

    const docente = await prisma.$transaction(async (tx) => {
      const usuario = await tx.user.create({
        data: {
          name: nombre,
          email,
          rol: "DOCENTE",
        },
      });

      return tx.docente.create({
        data: {
          usuarioId: usuario.id,
          especialidad,
          titulo,
          telefono,
        },
        include: { usuario: true },
      });
    });

    return NextResponse.json(docente, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear el docente" },
      { status: 500 },
    );
  }
}
