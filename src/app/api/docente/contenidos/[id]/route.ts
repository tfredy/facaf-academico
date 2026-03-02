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

    const contenido = await prisma.contenidoClase.findUnique({
      where: { id: parseInt(id) },
      include: {
        docenteAsignatura: {
          include: { asignatura: true },
        },
      },
    });

    if (!contenido) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 },
      );
    }

    if (contenido.docenteAsignatura.docenteId !== docente.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 },
      );
    }

    return NextResponse.json(contenido);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el contenido" },
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

    const existente = await prisma.contenidoClase.findUnique({
      where: { id: parseInt(id) },
      include: { docenteAsignatura: true },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
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
      tipoClase,
      fecha,
      modalidad,
      contenido,
      metodologias,
      observaciones,
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

    const actualizado = await prisma.contenidoClase.update({
      where: { id: parseInt(id) },
      data: {
        docenteAsignaturaId,
        tipoClase,
        fecha: new Date(fecha),
        modalidad,
        contenido,
        metodologias: JSON.stringify(metodologias),
        observaciones: observaciones || null,
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
      entidad: "contenido_clase",
      entidadId: id,
      detalle: "Contenido de clase actualizado",
    }).catch(() => {});

    return NextResponse.json(actualizado);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar el contenido" },
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

    const existente = await prisma.contenidoClase.findUnique({
      where: { id: parseInt(id) },
      include: { docenteAsignatura: true },
    });

    if (!existente) {
      return NextResponse.json(
        { error: "Contenido no encontrado" },
        { status: 404 },
      );
    }

    if (existente.docenteAsignatura.docenteId !== docente.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 },
      );
    }

    await prisma.contenidoClase.delete({
      where: { id: parseInt(id) },
    });

    registrarActividad({
      usuarioId: session.user.id,
      accion: "eliminar",
      entidad: "contenido_clase",
      entidadId: id,
      detalle: "Contenido de clase eliminado",
    }).catch(() => {});

    return NextResponse.json({ message: "Contenido eliminado correctamente" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar el contenido" },
      { status: 500 },
    );
  }
}
