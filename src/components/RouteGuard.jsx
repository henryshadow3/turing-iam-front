import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function RouteGuard({ children, requireAdmin = false }) {
  const { token, user, loading } = useAuth()

  if (loading) return null

  if (!token || !user) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requireAdmin && user.role !== 'admin' && user.role !== 'administrador' && user.role !== 'superadmin') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
