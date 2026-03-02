import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const docenteAsignaturaId = searchParams.get("docenteAsignaturaId");

    const docenteAsignaturas = await prisma.docenteAsignatura.findMany({
      where: { docenteId: docente.id },
      select: { id: true },
    });
    const ids = docenteAsignaturas.map((da) => da.id);

    const filterIds = docenteAsignaturaId
      ? (() => {
          const parsedId = parseInt(docenteAsignaturaId);
          return ids.includes(parsedId) ? [parsedId] : [];
        })()
      : ids;

    if (filterIds.length === 0) {
      return NextResponse.json([]);
    }

    const [contenidos, evaluaciones] = await Promise.all([
      prisma.contenidoClase.findMany({
        where: { docenteAsignaturaId: { in: filterIds } },
        include: {
          docenteAsignatura: {
            include: { asignatura: true },
          },
        },
      }),
      prisma.registroEvaluacion.findMany({
        where: { docenteAsignaturaId: { in: filterIds } },
        include: {
          docenteAsignatura: {
            include: { asignatura: true },
          },
        },
      }),
    ]);

    const eventos = [
      ...contenidos.map((c) => ({
        id: c.id,
        tipo: "clase" as const,
        fecha: c.fecha,
        titulo: c.tipoClase,
        subtitulo: c.docenteAsignatura.asignatura.nombre,
        modalidad: c.modalidad,
        contenido: c.contenido,
        metodologias: c.metodologias,
        docenteAsignaturaId: c.docenteAsignaturaId,
      })),
      ...evaluaciones.map((e) => ({
        id: e.id,
        tipo: "evaluacion" as const,
        fecha: e.fecha,
        titulo: "Evaluación",
        subtitulo: e.docenteAsignatura.asignatura.nombre,
        puntosAsignados: e.puntosAsignados,
        instrumentos: e.instrumentos,
        descripcion: e.descripcion,
        docenteAsignaturaId: e.docenteAsignaturaId,
      })),
    ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return NextResponse.json(eventos);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el calendario" },
      { status: 500 },
    );
  }
}
