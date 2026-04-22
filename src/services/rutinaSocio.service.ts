import api from '@/lib/axios'

export interface RutinaSocioResponse {
  id: number
  rutinaId: number
  rutinaNombre: string
  fechaAsignacion: string
  fechaFin: string | null
}

export const rutinaSocioService = {
  getActiva: async (socioId: number): Promise<RutinaSocioResponse | null> => {
    try {
      const res = await api.get(`/rutina-socio/socio/${socioId}/activa`)
      return res.data
    } catch {
      return null
    }
  },

  getHistorial: async (socioId: number): Promise<RutinaSocioResponse[]> => {
    const res = await api.get(`/rutina-socio/socio/${socioId}/historial`)
    return res.data
  },

  asignar: async (socioId: number, rutinaId: number, userId?: number): Promise<RutinaSocioResponse> => {
    const hoy = new Date().toISOString().split('T')[0]
    const res = await api.post('/rutina-socio', {
      socioId,
      rutinaId,
      fechaAsignacion: hoy,
      userId: userId ?? null,
    })
    return res.data
  },

  finalizar: async (id: number): Promise<void> => {
    const hoy = new Date().toISOString().split('T')[0]
    await api.put('/rutina-socio/finalizar', { id, fechaFin: hoy })
  },
}
