import api from '@/lib/axios'

export interface MetodoPago {
  id: number
  nombre: string
}

export const metodosPagoService = {
  getAll: async (): Promise<MetodoPago[]> => {
    const res = await api.get('/metodos-pago')
    return res.data
  },

  create: async (nombre: string): Promise<MetodoPago> => {
    const res = await api.post('/metodos-pago', { nombre })
    return res.data
  },

  desactivar: async (id: number): Promise<void> => {
    await api.delete(`/metodos-pago/${id}`)
  },
}