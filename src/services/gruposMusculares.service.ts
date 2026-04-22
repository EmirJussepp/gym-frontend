import api from '@/lib/axios'
import type { GrupoMuscular } from '@/types'

export const gruposMuscularesService = {
  getAll: async (): Promise<GrupoMuscular[]> => {
    const res = await api.get('/grupos-musculares')
    return res.data
  },

  getById: async (id: number): Promise<GrupoMuscular> => {
    const res = await api.get(`/grupos-musculares/${id}`)
    return res.data
  },

  create: async (nombre: string): Promise<GrupoMuscular> => {
    const res = await api.post('/grupos-musculares', { nombre })
    return res.data
  },

  update: async (id: number, nombre: string): Promise<GrupoMuscular> => {
    const res = await api.put(`/grupos-musculares/${id}`, { nombre })
    return res.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/grupos-musculares/${id}`)
  },
}
