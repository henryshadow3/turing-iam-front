import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function RouteGuard({ children, requireAdmin = false }) {
  const { token, user, loading } = useAuth()

  if (loading) return null

  if (!token || !user) {
    return <Navigate to="/unauthorized" replace />
  }

  // El IAM es de plataforma: solo entra el superadmin de TURING.
  // user.role ahora es el rol del tenant activo — ser admin de un tenant
  // NO da acceso al IAM.
  if (requireAdmin && user.platform_role !== 'superadmin') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
