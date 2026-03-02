import { z } from "zod";

export const docenteSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  especialidad: z.string().optional(),
  titulo: z.string().optional(),
  telefono: z.string().optional(),
});

export type DocenteFormData = z.infer<typeof docenteSchema>;
