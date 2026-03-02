import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notificarRol } from "@/lib/notificaciones";
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

    const contenidos = await prisma.contenidoClase.findMany({
      where,
      include: {
        docenteAsignatura: {
          include: { asignatura: true },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(contenidos);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener los contenidos" },
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
      tipoClase,
      fecha,
      modalidad,
      contenido,
      metodologias,
      observaciones,
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

    const nuevoContenido = await prisma.contenidoClase.create({
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

    const nombreAsig = nuevoContenido.docenteAsignatura.asignatura.nombre;
    const fechaCorta = new Date(fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
    notificarRol(
      "ACADEMICO",
      "contenido_clase",
      "Clase registrada",
      `${session.user.name ?? "Un docente"} registró una clase ${tipoClase.toLowerCase()} de ${nombreAsig} (${fechaCorta}).`
    ).catch(() => {});

    registrarActividad({
      usuarioId: session.user.id,
      accion: "crear",
      entidad: "contenido_clase",
      entidadId: String(nuevoContenido.id),
      detalle: "Contenido de clase creado",
    }).catch(() => {});

    return NextResponse.json(nuevoContenido, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear el contenido" },
      { status: 500 },
    );
  }
}
