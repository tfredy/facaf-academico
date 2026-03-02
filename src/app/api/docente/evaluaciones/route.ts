import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notificarRol, crearNotificacion } from "@/lib/notificaciones";
import { registrarActividad } from "@/lib/actividad";

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

    const where: Record<string, unknown> = {
      docenteAsignaturaId: { in: ids },
    };
    if (docenteAsignaturaId) {
      const parsedId = parseInt(docenteAsignaturaId);
      if (!ids.includes(parsedId)) {
        return NextResponse.json(
          { error: "No autorizado para esta asignatura" },
          { status: 403 },
        );
      }
      where.docenteAsignaturaId = parsedId;
    }

    const evaluaciones = await prisma.registroEvaluacion.findMany({
      where,
      include: {
        docenteAsignatura: {
          include: { asignatura: true },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(evaluaciones);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las evaluaciones" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      docenteAsignaturaId,
      fecha,
      puntosAsignados,
      instrumentos,
      descripcion,
    } = body;

    const docenteAsignatura = await prisma.docenteAsignatura.findUnique({
      where: { id: docenteAsignaturaId },
    });

    if (!docenteAsignatura || docenteAsignatura.docenteId !== docente.id) {
      return NextResponse.json(
        { error: "No autorizado para esta asignatura" },
        { status: 403 },
      );
    }

    const nuevaEvaluacion = await prisma.registroEvaluacion.create({
      data: {
        docenteAsignaturaId,
        fecha: new Date(fecha),
        puntosAsignados,
        instrumentos: JSON.stringify(instrumentos),
        descripcion: descripcion || null,
      },
      include: {
        docenteAsignatura: {
          include: { asignatura: true },
        },
      },
    });

    const nombreAsig = nuevaEvaluacion.docenteAsignatura.asignatura.nombre;
    const fechaCorta = new Date(fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });

    notificarRol(
      "ACADEMICO",
      "evaluacion",
      "Evaluación programada",
      `${session.user.name ?? "Un docente"} programó una evaluación de ${nombreAsig} (${fechaCorta}, ${puntosAsignados} pts).`
    ).catch(() => {});

    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        asignaturaId: docenteAsignatura.asignaturaId,
        docenteId: docente.id,
        estado: "CURSANDO",
      },
      include: { estudiante: true },
    });

    for (const insc of inscripciones) {
      crearNotificacion({
        usuarioId: insc.estudiante.usuarioId,
        tipo: "evaluacion",
        titulo: "Evaluación próxima",
        mensaje: `Tienes una evaluación de ${nombreAsig} programada para el ${fechaCorta} (${puntosAsignados} puntos).`,
        enlace: "/dashboard/estudiante/mis-semestres",
      }).catch(() => {});
    }

    registrarActividad({
      usuarioId: session.user.id,
      accion: "crear",
      entidad: "evaluacion",
      entidadId: String(nuevaEvaluacion.id),
      detalle: "Evaluación creada",
    }).catch(() => {});

    return NextResponse.json(nuevaEvaluacion, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear la evaluación" },
      { status: 500 },
    );
  }
}
