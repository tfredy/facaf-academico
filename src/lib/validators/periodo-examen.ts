import { z } from "zod";

export const periodoExamenSchema = z.object({
  tipo: z.enum(["NORMAL", "EXTRAORDINARIO", "TERCERA_OPORTUNIDAD"]),
  gestion: z.preprocess((v) => Number(v), z.number().int().min(2020)),
  periodo: z.string().min(1, "El periodo es requerido"),
  fechaInicio: z.preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date()),
  fechaFin: z.preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date()),
  habilitado: z.boolean().default(false),
});

export type PeriodoExamenFormData = z.infer<typeof periodoExamenSchema>;
