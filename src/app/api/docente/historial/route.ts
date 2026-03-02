import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    const docente = await prisma.docente.findUnique({
      where: { usuarioId: session.user.id },
    });

    if (!docente) {
      return NextResponse.json(
        { error: "Perfil de docente no encontrado" },
        { status: 404 },
      );
    }

    const asignaciones = await prisma.docenteAsignatura.findMany({
      where: { docenteId: docente.id },
      include: {
        asignatura: {
          include: {
            mallaCurricular: true,
            inscripciones: {
              where: { docenteId: docente.id },
              select: { _count: true },
            },
          },
        },
      },
      orderBy: [{ gestion: "desc" }, { periodo: "desc" }],
    });

    const mallasMap = new Map<
      number,
      {
        mallaCurricular: { id: number; nombre: string; codigo: string };
        asignaturas: {
          id: number;
          nombre: string;
          codigo: string;
          semestre: number;
          gestion: number;
          periodo: string;
          totalEstudiantes: number;
        }[];
      }
    >();

    for (const asig of asignaciones) {
      const malla = asig.asignatura.mallaCurricular;
      if (!mallasMap.has(malla.id)) {
        mallasMap.set(malla.id, {
          mallaCurricular: {
            id: malla.id,
            nombre: malla.nombre,
            codigo: malla.codigo,
          },
          asignaturas: [],
        });
      }

      mallasMap.get(malla.id)!.asignaturas.push({
        id: asig.asignatura.id,
        nombre: asig.asignatura.nombre,
        codigo: asig.asignatura.codigo,
        semestre: asig.asignatura.semestre,
        gestion: asig.gestion,
        periodo: asig.periodo,
        totalEstudiantes: asig.asignatura.inscripciones.length,
      });
    }

    return NextResponse.json({
      docente,
      historial: Array.from(mallasMap.values()),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el historial del docente" },
      { status: 500 },
    );
  }
}
