import { Navigate } from 'react-router-dom'
import { useIsAdmin } from '@/hooks/useRole'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const esAdmin = useIsAdmin()
  if (!esAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
