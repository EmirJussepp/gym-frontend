import api from '@/lib/axios'
import type { Socio, SocioRequest, PaginadoResponse } from '@/types'

export const sociosService = {
  getAll: async (pagina = 1, porPagina = 10): Promise<PaginadoResponse<Socio>> => {
    const res = await api.get(`/socios?pagina=${pagina}&porPagina=${porPagina}`)
    return res.data
  },

  getById: async (id: number): Promise<Socio> => {
    const res = await api.get(`/socios/${id}`)
    return res.data
  },

  create: async (data: SocioRequest): Promise<Socio> => {
    const res = await api.post('/socios', data)
    return res.data
  },

  update: async (id: number, data: SocioRequest): Promise<void> => {
    await api.put(`/socios/${id}`, data)
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/socios/${id}`)
  },

  getHistorial: async (id: number) => {
    const res = await api.get(`/socios/${id}/historial`)
    return res.data
  },
}
