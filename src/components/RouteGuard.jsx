import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function RouteGuard({ children, requireAdmin = false }) {
  const { token, user } = useAuth()

  if (!token || !user) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
