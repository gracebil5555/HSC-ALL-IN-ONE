import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SupportedCurrency = "XAF" | "CAD" | "EUR" | "USD" | string;

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: SupportedCurrency = "XAF"
): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  const code = (currency || "XAF").toUpperCase();

  if (code === "XAF") {
    return `${Math.round(safeValue).toLocaleString("fr-FR")} FCFA`;
  }

  try {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return `${safeValue.toLocaleString("fr-FR")} ${code}`;
  }
}

export function extractPaginatedResults<T>(
  data: T[] | { results?: T[]; count?: number } | null | undefined
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}
