import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Users, Building2, Shield, Link2, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import GlimmerBackground from './GlimmerBackground'

const navItems = [
  { to: '/admin/users',       label: 'Usuarios',    icon: Users },
  { to: '/admin/tenants',     label: 'Tenants',     icon: Building2 },
  { to: '/admin/roles',       label: 'Roles',       icon: Shield },
  { to: '/admin/memberships', label: 'Membresías',  icon: Link2 },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/unauthorized')
  }

  return (
    <div className="relative min-h-screen bg-black text-gray-200 font-sans flex overflow-x-hidden">
      <GlimmerBackground />

      {/* Ambient glows */}
      <div className="fixed top-1/3 left-1/4 w-[40vw] h-[40vw] bg-violet-dark/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed bottom-1/4 right-1/4 w-[35vw] h-[35vw] bg-teal-pool-dark/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Sidebar */}
      <aside className="relative z-10 flex flex-col w-64 min-h-screen glass-card border-r border-gold-medium/10 shrink-0">
        {/* Logo */}
        <div className="px-6 py-8 border-b border-gold-medium/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-medium" />
            <span className="font-serif text-lg text-gold-medium text-glow-gold tracking-wide">Turing IAM</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 font-sans">Panel de administración</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ` +
                (isActive
                  ? 'bg-gold-medium/10 text-gold-medium border border-gold-medium/25 text-glow-gold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5')
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-5 border-t border-gold-medium/10">
          <p className="text-xs text-gray-500 mb-1">Conectado como</p>
          <p className="text-sm text-gray-300 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
