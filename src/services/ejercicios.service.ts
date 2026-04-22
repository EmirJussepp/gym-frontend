import api from '@/lib/axios'
import type { Ejercicio, EjercicioRequest, GrupoMuscular, PaginadoResponse } from '@/types'

export const ejerciciosService = {
  getAll: async (pagina = 1, porPagina = 50): Promise<PaginadoResponse<Ejercicio>> => {
    const res = await api.get(`/ejercicios?pagina=${pagina}&porPagina=${porPagina}`)
    return res.data
  },

  getById: async (id: number): Promise<Ejercicio> => {
    const res = await api.get(`/ejercicios/${id}`)
    return res.data
  },

  create: async (data: EjercicioRequest): Promise<Ejercicio> => {
    const res = await api.post('/ejercicios', data)
    return res.data
  },

  update: async (id: number, data: EjercicioRequest): Promise<void> => {
    await api.put(`/ejercicios/${id}`, data)
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ejercicios/${id}`)
  },

  getGruposMusculares: async (): Promise<GrupoMuscular[]> => {
    const res = await api.get('/grupos-musculares')
    return res.data
  },
}
