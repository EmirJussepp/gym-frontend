import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Convierte una ruta de imagen guardada en la DB a una URL usable en <img>.
 * - Rutas locales (/uploads/...): agrega el prefijo /api para pasar por el proxy de Vite
 * - URLs externas (http/https): las devuelve tal cual
 */
export function getImagenUrl(imagenUrl: string | undefined | null): string | undefined {
  if (!imagenUrl) return undefined
  if (imagenUrl.startsWith('/uploads/')) return `/api${imagenUrl}`
  return imagenUrl
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}
