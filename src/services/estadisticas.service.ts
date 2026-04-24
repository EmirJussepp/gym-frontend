import api from '@/lib/axios'

export interface EstadisticasMes {
  periodo: string
  totalCobrado: number
  totalPendiente: number
  cantidadPagadas: number
  cantidadPendientes: number
  cantidadVencidas: number
  asistencias: number
  sociosNuevos: number
}

export const estadisticasService = {
  getAnio: async (anio: number): Promise<EstadisticasMes[]> => {
    const res = await api.get(`/estadisticas/anio/${anio}`)
    return res.data
  },
}