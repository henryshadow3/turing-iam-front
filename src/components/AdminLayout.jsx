import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Users, Building2, Shield, Link2, LogOut, ChevronRight, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import GlimmerBackground from './GlimmerBackground'
import { getRankByRole, RankedAvatar } from './RankIcons'
import { useState } from 'react'

const navItems = [
  { to: '/admin/users',       label: 'Usuarios',       icon: Users,     description: 'Gestión de cuentas' },
  { to: '/admin/tenants',     label: 'Organizaciones', icon: Building2, description: 'Tenants del sistema' },
  { to: '/admin/roles',       label: 'Roles',          icon: Shield,    description: 'Permisos y accesos' },
  { to: '/admin/memberships', label: 'Membresías',     icon: Link2,     description: 'Asignación de roles' },
]

const BREADCRUMBS = {
  '/admin/users':       'Usuarios',
  '/admin/tenants':     'Organizaciones',
  '/admin/roles':       'Roles',
  '/admin/memberships': 'Membresías',
}

/* Logo SVG mark */
function TuringMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="tm-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A67C1E"/>
          <stop offset="40%"  stopColor="#D4AF37"/>
          <stop offset="65%"  stopColor="#F0D060"/>
          <stop offset="85%"  stopColor="#C0C0C0"/>
          <stop offset="100%" stopColor="#D4AF37"/>
        </linearGradient>
        <linearGradient id="tm-s" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(212,175,55,0.4)"/>
          <stop offset="100%" stopColor="rgba(192,192,192,0.2)"/>
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="16" cy="16" r="14" stroke="url(#tm-g)" strokeWidth="1.2" fill="none"/>
      {/* T letter */}
      <path d="M9 10h14M16 10v12" stroke="url(#tm-g)" strokeWidth="2.2" strokeLinecap="round"/>
      {/* Inner glow */}
      <circle cx="16" cy="16" r="10" stroke="url(#tm-s)" strokeWidth="0.5" fill="none"/>
    </svg>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function handleLogout() {
    logout()
    navigate('/unauthorized')
  }

  const currentSection = BREADCRUMBS[location.pathname] ?? 'Panel'
  const adminRank = getRankByRole(user?.role ?? 'admin', 0)

  return (
    <div className="relative min-h-screen bg-black text-gray-200 font-sans flex overflow-x-hidden">
      <GlimmerBackground />

      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-[45vw] h-[45vw] rounded-full pointer-events-none -z-10 animate-pulse-slow"
           style={{ background: 'rgba(76,29,149,0.055)', filter: 'blur(150px)' }} />
      <div className="fixed bottom-0 right-0 w-[35vw] h-[35vw] rounded-full pointer-events-none -z-10"
           style={{ background: 'rgba(192,192,192,0.025)', filter: 'blur(130px)' }} />
      <div className="fixed top-1/2 left-0 w-[20vw] h-[20vw] rounded-full pointer-events-none -z-10 animate-pulse-slow"
           style={{ background: 'rgba(212,175,55,0.03)', filter: 'blur(100px)', animationDelay: '-4s' }} />

      {/* Sidebar */}
      <aside className="relative z-10 flex flex-col w-64 min-h-screen shrink-0 border-r sidebar-bg"
             style={{ borderRightColor: 'rgba(212,175,55,0.12)' }}>

        {/* Top gold line */}
        <div className="absolute top-0 left-6 right-6 divider-gold opacity-60" />

        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <TuringMark size={34} />
              <div className="absolute inset-0 rounded-full blur-lg opacity-30"
                   style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.6) 0%, transparent 70%)' }} />
            </div>
            <div>
              <div className="font-serif text-sm leading-none tracking-wider" style={{ color: '#D4AF37' }}>
                <span className="text-glow-gold">Turing</span>{' '}
                <span style={{ color: '#C0C0C0', textShadow: '0 0 12px rgba(192,192,192,0.4)' }}>IAM</span>
              </div>
              <p className="text-[10px] mt-1 font-mono leading-none" style={{ color: '#374151' }}>
                Identity &amp; Access Management
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5">
          <p className="px-3 pb-3 text-[9px] font-mono font-semibold uppercase tracking-[0.15em]"
             style={{ color: '#2a2a2a' }}>
            Administración
          </p>
          {navItems.map(({ to, label, icon: Icon, description }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-all duration-200 ` +
                (isActive ? 'nav-item-active' : 'nav-item-inactive border-transparent')
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? 'nav-icon-active' : 'nav-icon-inactive'}`}>
                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? '#D4AF37' : undefined }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    <p className="text-[10px] mt-0.5 leading-none truncate font-mono"
                       style={{ color: isActive ? 'rgba(212,175,55,0.55)' : '#374151' }}>
                      {description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-0.5 h-5 rounded-full shrink-0"
                         style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.9), rgba(192,192,192,0.5))' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Silver divider */}
        <div className="mx-4 divider-silver opacity-40" />

        {/* User card */}
        <div className="px-3 py-4">
          <div className="px-4 py-4 rounded-2xl user-card-bg"
               style={{ border: '1px solid rgba(212,175,55,0.09)' }}>
            <div className="flex items-center gap-3">
              <RankedAvatar
                name={user?.email}
                role={user?.role ?? 'admin'}
                isActive={true}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#a1a1aa' }}>{user?.email}</p>
                <div className="mt-1">
                  <span className={`rank-badge ${adminRank.badgeCls} text-[9px]`}>
                    <adminRank.Icon size={10} />
                    {adminRank.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3.5 w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 group"
              style={{ color: '#4b5563' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Bottom gold line */}
        <div className="absolute bottom-0 left-6 right-6 divider-gold opacity-30" />
      </aside>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="shrink-0 h-14 px-8 flex items-center gap-2 topbar-bg">
          {/* Breadcrumb */}
          <span className="text-[10px] font-mono" style={{ color: '#374151' }}>IAM</span>
          <ChevronRight className="w-3 h-3" style={{ color: '#2a2a2a' }} />
          <span className="text-[10px] font-mono font-medium" style={{ color: '#D4AF37' }}>{currentSection}</span>

          {/* Right side decorations */}
          <div className="ml-auto flex items-center gap-4">
            {/* Status dot */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                   style={{ boxShadow: '0 0 6px rgba(74,222,128,0.6)', animation: 'pulse-slow 3s ease-in-out infinite' }} />
              <span className="text-[10px] font-mono" style={{ color: '#374151' }}>Sistema activo</span>
            </div>
            {/* Version tag */}
            <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                  style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.15)', color: 'rgba(212,175,55,0.5)' }}>
              v2.0
            </span>
          </div>
        </header>

        {/* Gold top line under header */}
        <div className="divider-gold opacity-20" />

        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
