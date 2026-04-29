import api from '@/lib/axios'

export interface MetodoPago {
  id: number
  nombre: string
}

export const metodosPagoService = {
  getAll: async (): Promise<MetodoPago[]> => {
    const res = await api.get('/metodos-pago')
    // backend returns metodoPagoId, map to id for frontend
    return res.data.map((m: { metodoPagoId: number; nombre: string }) => ({
      id: m.metodoPagoId,
      nombre: m.nombre,
    }))
  },

  create: async (nombre: string): Promise<MetodoPago> => {
    const res = await api.post('/metodos-pago', { nombre })
    return res.data
  },

  update: async (id: number, nombre: string): Promise<MetodoPago> => {
    const res = await api.put(`/metodos-pago/${id}`, { nombre })
    return res.data
  },

  desactivar: async (id: number): Promise<void> => {
    await api.delete(`/metodos-pago/${id}`)
  },
}