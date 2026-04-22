import api from '@/lib/axios'
import type { Cuota } from '@/types'

export const cuotasService = {
  getBySocio: async (socioId: number, estado?: string): Promise<Cuota[]> => {
    const params = estado ? `?estado=${estado}` : ''
    const res = await api.get(`/socios/${socioId}/cuotas${params}`)
    return res.data
  },

  getById: async (cuotaId: number): Promise<Cuota> => {
    const res = await api.get(`/cuotas/${cuotaId}`)
    return res.data
  },

  getDeudores: async (): Promise<Cuota[]> => {
    const res = await api.get('/cuotas/deudores')
    return res.data
  },

  getByPeriodo: async (periodo: string): Promise<Cuota[]> => {
    const res = await api.get(`/cuotas/periodo/${periodo}`)
    return res.data
  },

  generar: async (anio: number, mes: number, diaVencimiento = 10) => {
    const res = await api.post('/cuotas/generar', { anio, mes, diaVencimiento })
    return res.data
  },

  pagar: async (cuotaId: number, metodoPagoId: number, monto: number) => {
    const res = await api.post(`/cuotas/${cuotaId}/pagar`, { metodoPagoId, monto })
    return res.data
  },

  delete: async (cuotaId: number): Promise<void> => {
    await api.delete(`/cuotas/${cuotaId}`)
  },
}
