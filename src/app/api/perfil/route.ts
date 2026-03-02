import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { registrarActividad } from "@/lib/actividad";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        rol: true,
        telefono: true,
        prefNotificaciones: true,
        createdAt: true,
        docente: {
          select: { especialidad: true, titulo: true, telefono: true },
        },
        estudiante: {
          select: {
            matricula: true,
            semestreActual: true,
            mallaCurricular: { select: { nombre: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    let prefNotif = {
      periodo_examen: true,
      calificacion: true,
      asistencia: true,
      contenido_clase: true,
      evaluacion: true,
      inscripcion: true,
      academico: true,
      sistema: true,
    };
    if (user.prefNotificaciones) {
      try { prefNotif = { ...prefNotif, ...JSON.parse(user.prefNotificaciones) }; } catch { /* keep defaults */ }
    }

    return NextResponse.json({ ...user, prefNotificaciones: prefNotif });
  } catch {
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, telefono, prefNotificaciones, especialidad, titulo } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (prefNotificaciones !== undefined) {
      updateData.prefNotificaciones = JSON.stringify(prefNotificaciones);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    if (especialidad !== undefined || titulo !== undefined) {
      const docente = await prisma.docente.findUnique({
        where: { usuarioId: session.user.id },
      });
      if (docente) {
        const docenteUpdate: Record<string, unknown> = {};
        if (especialidad !== undefined) docenteUpdate.especialidad = especialidad;
        if (titulo !== undefined) docenteUpdate.titulo = titulo;
        if (telefono !== undefined) docenteUpdate.telefono = telefono;
        await prisma.docente.update({
          where: { id: docente.id },
          data: docenteUpdate,
        });
      }
    }

    registrarActividad({
      usuarioId: session.user.id,
      accion: "actualizar",
      entidad: "perfil",
      detalle: "Perfil actualizado",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}
