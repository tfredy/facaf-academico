import { prisma } from "@/lib/prisma";

export async function registrarSesionLogin(params: {
  usuarioId: string;
  ip?: string;
  navegador?: string;
  dispositivo?: string;
  exitoso?: boolean;
}) {
  return prisma.sesionLogin.create({
    data: {
      usuarioId: params.usuarioId,
      ip: params.ip ?? null,
      navegador: params.navegador ?? null,
      dispositivo: params.dispositivo ?? null,
      exitoso: params.exitoso ?? true,
    },
  });
}

export async function registrarActividad(params: {
  usuarioId: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle?: string;
  ip?: string;
}) {
  return prisma.actividadUsuario.create({
    data: {
      usuarioId: params.usuarioId,
      accion: params.accion,
      entidad: params.entidad,
      entidadId: params.entidadId ?? null,
      detalle: params.detalle ?? null,
      ip: params.ip ?? null,
    },
  });
}

export function parseUserAgent(ua: string): { navegador: string; dispositivo: string } {
  let navegador = "Desconocido";
  let dispositivo = "Escritorio";

  if (ua.includes("Firefox")) navegador = "Firefox";
  else if (ua.includes("Edg")) navegador = "Edge";
  else if (ua.includes("Chrome")) navegador = "Chrome";
  else if (ua.includes("Safari")) navegador = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) navegador = "Opera";

  if (ua.includes("Mobile") || ua.includes("Android")) dispositivo = "Móvil";
  else if (ua.includes("Tablet") || ua.includes("iPad")) dispositivo = "Tablet";

  return { navegador, dispositivo };
}
