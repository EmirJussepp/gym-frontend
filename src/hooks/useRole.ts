import { useAuthStore } from '@/store/authStore'

/**
 * Returns true if the logged-in user is an administrator.
 * Rules match the backend RoleGuard:
 *   - roleId == null / 0 → bootstrap user (first setup)
 *   - rolNombre == 'ADMIN' (case-insensitive)
 */
export function useIsAdmin(): boolean {
  const usuario = useAuthStore(s => s.usuario)
  if (!usuario) return false
  if (!usuario.roleId || usuario.roleId === 0) return true
  return (usuario.rolNombre ?? '').toUpperCase() === 'ADMIN'
}
