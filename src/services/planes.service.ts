import api from '@/lib/axios'
import type { Plan, PlanRequest, PaginadoResponse } from '@/types'

export const planesService = {
  getAll: async (pagina = 1, porPagina = 50): Promise<PaginadoResponse<Plan>> => {
    const res = await api.get(`/planes?pagina=${pagina}&porPagina=${porPagina}`)
    return res.data
  },

  getById: async (id: number): Promise<Plan> => {
    const res = await api.get(`/planes/${id}`)
    return res.data
  },

  create: async (data: PlanRequest): Promise<Plan> => {
    const res = await api.post('/planes', data)
    return res.data
  },

  update: async (id: number, data: PlanRequest): Promise<void> => {
    await api.put(`/planes/${id}`, data)
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/planes/${id}`)
  },
}
