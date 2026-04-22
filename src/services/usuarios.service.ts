import api from '@/lib/axios'
import type { Usuario } from '@/types'

export const usuariosService = {
  getById: async (id: number): Promise<Usuario> => {
    const res = await api.get(`/auth/users/${id}`)
    return res.data
  },

  desactivar: async (id: number): Promise<void> => {
    await api.delete(`/auth/users/${id}`)
  },
}
