import api from '@/lib/axios'
import type { Rutina, RutinaRequest, PaginadoResponse } from '@/types'

export const rutinasService = {
  getAll: async (pagina = 1, porPagina = 50): Promise<PaginadoResponse<Rutina>> => {
    const res = await api.get(`/rutinas?pagina=${pagina}&porPagina=${porPagina}`)
    return res.data
  },

  getById: async (id: number): Promise<Rutina> => {
    const res = await api.get(`/rutinas/${id}`)
    return res.data
  },

  create: async (data: RutinaRequest): Promise<Rutina> => {
    const res = await api.post('/rutinas', data)
    return res.data
  },

  update: async (id: number, data: RutinaRequest): Promise<void> => {
    await api.put(`/rutinas/${id}`, data)
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rutinas/${id}`)
  },
    // ✅ NUEVO: descargar PDF
  descargarPdf: async (socioId: number): Promise<Blob> => {
    const res = await api.get(`rutinas/socios/${socioId}/rutina/pdf`, {
      responseType: 'blob', // 🔥 CLAVE
    })
    return res.data
  },
}
