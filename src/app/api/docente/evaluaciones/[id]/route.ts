import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { registrarActividad } from "@/lib/actividad";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const docente = await prisma.docente.findUnique({
      where: { usuarioId: session.user.id },
    });

    if (!docente) {
      return NextResponse.json(
        { error: "Perfil de docente no encontrado" },
        { status: 404 },
      );
    }

    const evaluacion = await prisma.registroEvaluacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        docenteAsignatura: {
          include: { asignatura: true },
        },
      },
    });

    if (!evaluacion) {
      return NextResponse.json(
        { error: "Evaluación no encontrada" },
        { status: 404 },
      );
    }

    if (evaluacion.docenteAsignatura.docenteId !== docente.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 },
      );
    }

    return NextResponse.json(evaluacion);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la evaluación" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const docente = await prisma.docente.findUnique({
      where: { usuarioId: session.user.id },
    });

    if (!docente) {
      return NextResponse.json(
        { error: "Perfil de docente no encontrado" },
        { status: 404 },
      );
    }

    const existente = await prisma.registroEvaluacion.findUnique({
      where: { id: parseInt(id) },
      include: { docenteAsignatura: true },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Evaluación no encontrada" },
        { status: 404 },
      );
    }

    if (existente.docenteAsignatura.docenteId !== docente.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 },
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

    if (docenteAsignaturaId && docenteAsignaturaId !== existente.docenteAsignaturaId) {
      const nuevaAsignatura = await prisma.docenteAsignatura.findUnique({
        where: { id: docenteAsignaturaId },
      });
      if (!nuevaAsignatura || nuevaAsignatura.docenteId !== docente.id) {
        return NextResponse.json(
          { error: "No autorizado para esta asignatura" },
          { status: 403 },
        );
      }
    }

    const actualizada = await prisma.registroEvaluacion.update({
      where: { id: parseInt(id) },
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

    registrarActividad({
      usuarioId: session.user.id,
      accion: "actualizar",
      entidad: "evaluacion",
      entidadId: id,
      detalle: "Evaluación actualizada",
    }).catch(() => {});

    return NextResponse.json(actualizada);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar la evaluación" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const docente = await prisma.docente.findUnique({
      where: { usuarioId: session.user.id },
    });

    if (!docente) {
      return NextResponse.json(
        { error: "Perfil de docente no encontrado" },
        { status: 404 },
      );
    }

    const existente = await prisma.registroEvaluacion.findUnique({
      where: { id: parseInt(id) },
      include: { docenteAsignatura: true },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Evaluación no encontrada" },
        { status: 404 },
      );
    }

    if (existente.docenteAsignatura.docenteId !== docente.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 },
      );
    }

    await prisma.registroEvaluacion.delete({
      where: { id: parseInt(id) },
    });

    registrarActividad({
      usuarioId: session.user.id,
      accion: "eliminar",
      entidad: "evaluacion",
      entidadId: id,
      detalle: "Evaluación eliminada",
    }).catch(() => {});

    return NextResponse.json({ message: "Evaluación eliminada correctamente" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar la evaluación" },
      { status: 500 },
    );
  }
}
