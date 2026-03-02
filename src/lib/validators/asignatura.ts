import { z } from "zod";

export const asignaturaSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  codigo: z.string().min(2, "El código es requerido"),
  semestre: z.preprocess((v) => Number(v), z.number().int().min(1)),
  creditos: z.preprocess((v) => Number(v), z.number().int().min(0)).default(0),
  horasTeoricas: z.preprocess((v) => Number(v), z.number().int().min(0)).default(0),
  horasPracticas: z.preprocess((v) => Number(v), z.number().int().min(0)).default(0),
  mallaCurricularId: z.preprocess((v) => Number(v), z.number().int()),
});

export type AsignaturaFormData = z.infer<typeof asignaturaSchema>;
