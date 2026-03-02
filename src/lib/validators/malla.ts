import { z } from "zod";

export const mallaSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  codigo: z.string().min(2, "El código es requerido"),
  descripcion: z.string().optional(),
  totalSemestres: z.preprocess((v) => Number(v), z.number().int().min(1).max(20)),
  activa: z.boolean().default(true),
  sedeId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive("La sede es requerida").optional()),
});

export type MallaFormData = z.infer<typeof mallaSchema>;
