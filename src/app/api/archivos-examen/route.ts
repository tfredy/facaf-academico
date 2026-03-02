import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const asignaturaId = searchParams.get("asignaturaId");
    const docenteId = searchParams.get("docenteId");
    const gestion = searchParams.get("gestion");

    const where: Record<string, unknown> = {};
    if (asignaturaId) where.asignaturaId = parseInt(asignaturaId);
    if (docenteId) where.docenteId = parseInt(docenteId);
    if (gestion) where.gestion = parseInt(gestion);

    const archivos = await prisma.archivoExamen.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(archivos);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener los archivos de examen" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const nombre = formData.get("nombre") as string | null;
    const tipoExamen = formData.get("tipoExamen") as string | null;
    const asignaturaId = formData.get("asignaturaId") as string | null;
    const docenteId = formData.get("docenteId") as string | null;
    const gestion = formData.get("gestion") as string | null;
    const periodo = formData.get("periodo") as string | null;

    if (!file || !nombre || !tipoExamen || !asignaturaId || !docenteId || !gestion || !periodo) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos (file, nombre, tipoExamen, asignaturaId, docenteId, gestion, periodo)" },
        { status: 400 },
      );
    }

    if (!["NORMAL", "EXTRAORDINARIO", "TERCERA_OPORTUNIDAD"].includes(tipoExamen)) {
      return NextResponse.json(
        { error: "tipoExamen debe ser NORMAL, EXTRAORDINARIO o TERCERA_OPORTUNIDAD" },
        { status: 400 },
      );
    }

    const uploadDir = path.join(process.cwd(), "uploads", "examenes");
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const filename = `${timestamp}-${nombre.replace(/\s+/g, "_")}${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const rutaArchivo = `uploads/examenes/${filename}`;

    const archivo = await prisma.archivoExamen.create({
      data: {
        nombre,
        rutaArchivo,
        tipoExamen: tipoExamen as "NORMAL" | "EXTRAORDINARIO" | "TERCERA_OPORTUNIDAD",
        asignaturaId: parseInt(asignaturaId),
        docenteId: parseInt(docenteId),
        gestion: parseInt(gestion),
        periodo,
      },
    });

    return NextResponse.json(archivo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al subir el archivo de examen" },
      { status: 500 },
    );
  }
}
