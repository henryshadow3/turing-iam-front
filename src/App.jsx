import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SelectTenant from '@/pages/SelectTenant'
import Unauthorized from '@/pages/Unauthorized'
import AdminLayout from '@/components/AdminLayout'
import RouteGuard from '@/components/RouteGuard'
import UsersPage from '@/pages/admin/Users'
import TenantsPage from '@/pages/admin/Tenants'
import RolesPage from '@/pages/admin/Roles'
import MembershipsPage from '@/pages/admin/Memberships'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/select-tenant" element={<SelectTenant />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/admin"
          element={
            <RouteGuard requireAdmin>
              <AdminLayout />
            </RouteGuard>
          }
        >
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users"       element={<UsersPage />} />
          <Route path="tenants"     element={<TenantsPage />} />
          <Route path="roles"       element={<RolesPage />} />
          <Route path="memberships" element={<MembershipsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/unauthorized" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
