import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const sesiones = await prisma.sesionLogin.findMany({
      where: { usuarioId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json(sesiones);
  } catch {
    return NextResponse.json({ error: "Error al obtener sesiones" }, { status: 500 });
  }
}
