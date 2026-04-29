import api from '@/lib/axios'
import type { Rol } from '@/types'

export const rolesService = {
  getAll: async (): Promise<Rol[]> => {
    const res = await api.get('/roles')
    return res.data
  },

  getById: async (id: number): Promise<Rol> => {
    const res = await api.get(`/roles/${id}`)
    return res.data
  },

  create: async (nombre: string, descripcion?: string): Promise<Rol> => {
    const res = await api.post('/roles', { nombre, descripcion })
    return res.data
  },

  update: async (id: number, nombre: string, descripcion?: string): Promise<Rol> => {
    const res = await api.put(`/roles/${id}`, { nombre, descripcion })
    return res.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`)
  },
}
