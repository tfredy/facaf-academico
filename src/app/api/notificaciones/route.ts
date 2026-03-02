import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const soloNoLeidas = searchParams.get("soloNoLeidas") === "true";

    const where: Record<string, unknown> = { usuarioId: session.user.id };
    if (soloNoLeidas) where.leida = false;

    const [notificaciones, totalNoLeidas] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notificacion.count({
        where: { usuarioId: session.user.id, leida: false },
      }),
    ]);

    return NextResponse.json({ notificaciones, totalNoLeidas });
  } catch {
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { accion, id } = body;

    if (accion === "marcar_leida" && id) {
      await prisma.notificacion.updateMany({
        where: { id: Number(id), usuarioId: session.user.id },
        data: { leida: true },
      });
    } else if (accion === "marcar_todas") {
      await prisma.notificacion.updateMany({
        where: { usuarioId: session.user.id, leida: false },
        data: { leida: true },
      });
    } else if (accion === "eliminar" && id) {
      await prisma.notificacion.deleteMany({
        where: { id: Number(id), usuarioId: session.user.id },
      });
    }

    const totalNoLeidas = await prisma.notificacion.count({
      where: { usuarioId: session.user.id, leida: false },
    });

    return NextResponse.json({ ok: true, totalNoLeidas });
  } catch {
    return NextResponse.json({ error: "Error al actualizar notificaciones" }, { status: 500 });
  }
}
