import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function calcularNotaFinal(
  trabajoPractico: number | null,
  examenParcial: number | null,
  examenFinal: number | null
): number | null {
  if (trabajoPractico == null || examenParcial == null || examenFinal == null) {
    return null;
  }
  return trabajoPractico + examenParcial + examenFinal;
}
