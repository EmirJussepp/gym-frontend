import api from '@/lib/axios'
import type { LoginResponse } from '@/types'

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password })
    return res.data
  },

  register: async (nombre: string, email: string, password: string, roleId?: number) => {
    const res = await api.post('/auth/register', { nombre, email, password, roleId })
    return res.data
  },
}
