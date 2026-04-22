import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types'

interface AuthState {
  token: string | null
  usuario: Usuario | null
  isAuthenticated: boolean
  login: (token: string, usuario: Usuario) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,

      login: (token, usuario) =>
        set({ token, usuario, isAuthenticated: true }),

      logout: () =>
        set({ token: null, usuario: null, isAuthenticated: false }),
    }),
    {
      name: 'gym-auth', // se guarda en localStorage
    }
  )
)
