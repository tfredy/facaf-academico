import { prisma } from "@/lib/prisma";

type TipoNotificacion =
  | "periodo_examen"
  | "calificacion"
  | "asistencia"
  | "contenido_clase"
  | "evaluacion"
  | "inscripcion"
  | "sistema"
  | "academico";

interface CrearNotificacionParams {
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  enlace?: string;
}

export async function crearNotificacion(params: CrearNotificacionParams) {
  return prisma.notificacion.create({
    data: {
      usuarioId: params.usuarioId,
      tipo: params.tipo,
      titulo: params.titulo,
      mensaje: params.mensaje,
      enlace: params.enlace ?? null,
    },
  });
}

export async function notificarRol(rol: string, tipo: TipoNotificacion, titulo: string, mensaje: string, enlace?: string) {
  const usuarios = await prisma.user.findMany({
    where: { rol, activo: true },
    select: { id: true },
  });

  if (usuarios.length === 0) return;

  await prisma.notificacion.createMany({
    data: usuarios.map((u) => ({
      usuarioId: u.id,
      tipo,
      titulo,
      mensaje,
      enlace: enlace ?? null,
    })),
  });
}
