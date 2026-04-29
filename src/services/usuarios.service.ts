import api from '@/lib/axios'
import type { Usuario } from '@/types'

export interface UsuarioConRol extends Usuario {
  rolNombre?: string
}

export const usuariosService = {
  getAll: async (): Promise<UsuarioConRol[]> => {
    const res = await api.get('/auth/users')
    return res.data
  },

  getById: async (id: number): Promise<Usuario> => {
    const res = await api.get(`/auth/users/${id}`)
    return res.data
  },

  crear: async (data: {
    nombre: string
    email: string
    password: string
    roleId?: number
  }): Promise<Usuario> => {
    const res = await api.post('/auth/register', data)
    return res.data
  },

  update: async (id: number, data: { nombre: string; email: string; roleId?: number; activo: boolean; password?: string }): Promise<Usuario> => {
    const res = await api.put(`/auth/users/${id}`, data)
    return res.data
  },

  desactivar: async (id: number): Promise<void> => {
    await api.delete(`/auth/users/${id}`)
  },
}