import { z } from "zod";

export const calificacionSchema = z.object({
  inscripcionId: z.preprocess((v) => Number(v), z.number().int()),
  trabajoPractico: z.preprocess((v) => (v === "" || v === null || v === undefined) ? null : Number(v), z.number().min(0).max(100).nullable()).optional(),
  examenParcial: z.preprocess((v) => (v === "" || v === null || v === undefined) ? null : Number(v), z.number().min(0).max(100).nullable()).optional(),
  examenFinal: z.preprocess((v) => (v === "" || v === null || v === undefined) ? null : Number(v), z.number().min(0).max(100).nullable()).optional(),
  tipoExamen: z.enum(["NORMAL", "EXTRAORDINARIO", "TERCERA_OPORTUNIDAD"]).default("NORMAL"),
  observacion: z.string().optional(),
});

export const calificacionesBulkSchema = z.object({
  calificaciones: z.array(calificacionSchema),
  tipoExamen: z.enum(["NORMAL", "EXTRAORDINARIO", "TERCERA_OPORTUNIDAD"]),
});

export type CalificacionFormData = z.infer<typeof calificacionSchema>;
