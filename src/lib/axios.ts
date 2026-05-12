import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token JWT en cada request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el servidor devuelve 401 y hay sesión activa → logout + redirect
let redirecting = false
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const tieneToken = !!useAuthStore.getState().token
    if (error.response?.status === 401 && tieneToken && !redirecting) {
      redirecting = true
      useAuthStore.getState().logout()
      // Resetear la flag tras la navegación para que un re-login funcione
      window.location.href = '/login'
      setTimeout(() => { redirecting = false }, 2000)
    }
    return Promise.reject(error)
  }
)

export default api
