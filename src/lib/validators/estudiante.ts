import { z } from "zod";

export const estudianteSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  matricula: z.string().min(3, "La matrícula es requerida"),
  mallaCurricularId: z.preprocess((v) => Number(v), z.number().int()),
  semestreActual: z.preprocess((v) => Number(v), z.number().int().min(1)).default(1),
  sedeId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().positive("La sede es requerida").optional()),
});

export type EstudianteFormData = z.infer<typeof estudianteSchema>;
