import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/**
 * Convierte URLs relativas de la API (/api/uploads/...) a absolutas.
 * Necesario en produccion donde el frontend (Vercel) y el backend (Render)
 * estan en dominios diferentes.
 */
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/api/")) {
    return `${import.meta.env.VITE_API_BASE_URL ?? ""}${url}`;
  }
  return url;
}
