import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash, compare } from "bcryptjs";
import { registrarActividad } from "@/lib/actividad";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { passwordActual, passwordNueva } = body;

    if (!passwordNueva || passwordNueva.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (user.password) {
      if (!passwordActual) {
        return NextResponse.json(
          { error: "Debe ingresar la contraseña actual" },
          { status: 400 }
        );
      }
      const valid = await compare(passwordActual, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        );
      }
    }

    const hashed = await hash(passwordNueva, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    registrarActividad({
      usuarioId: session.user.id,
      accion: "cambiar_password",
      entidad: "perfil",
      detalle: "Contraseña actualizada",
    }).catch(() => {});

    return NextResponse.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch {
    return NextResponse.json({ error: "Error al cambiar contraseña" }, { status: 500 });
  }
}
