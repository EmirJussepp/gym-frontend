import api from '@/lib/axios'

export interface Recuperacion {
  recuperacionId: number
  socioId: number
  fechaClaseOriginal: string
  tipoActividad: string
  estado: string
  fechaVencimiento: string
  fechaRecuperacion?: string
}

export const recuperacionesService = {
  getBySocio: async (socioId: number, estado?: string): Promise<Recuperacion[]> => {
    const params = estado ? `?estado=${estado}` : ''
    const res = await api.get(`/socios/${socioId}/recuperaciones${params}`)
    return res.data
  },

  create: async (socioId: number, fechaClaseOriginal: string, tipoActividad: string, fechaVencimiento: string) => {
    const res = await api.post(`/socios/${socioId}/recuperaciones`, {
      fechaClaseOriginal,
      tipoActividad,
      fechaVencimiento,
    })
    return res.data
  },

  delete: async (socioId: number, recuperacionId: number): Promise<void> => {
    await api.delete(`/socios/${socioId}/recuperaciones/${recuperacionId}`)
  },
}
