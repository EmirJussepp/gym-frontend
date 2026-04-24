import { create } from 'zustand'
import { cuotasService } from '@/services/cuotas.service'

interface NotificacionesStore {
  cuotasVencidas: number
  cargar: () => Promise<void>
}

export const useNotificacionesStore = create<NotificacionesStore>((set) => ({
  cuotasVencidas: 0,
  cargar: async () => {
    try {
      const now = new Date()
      const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const cuotas = await cuotasService.getByPeriodo(periodo)
      const vencidas = cuotas.filter(c => c.estado !== 'PAGADA').length
      set({ cuotasVencidas: vencidas })
    } catch {
      // silencioso
    }
  },
}))