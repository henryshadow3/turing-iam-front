import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Users, Building2, Shield, Link2, Inbox, LogOut, ChevronRight, Menu, X, PanelLeftClose, PanelLeftOpen, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import GlimmerBackground from './GlimmerBackground'
import { getRankByRole, RankedAvatar } from './RankIcons'
import { useState, useEffect, useCallback } from 'react'
import { callAction } from '@/api/client'

const navItems = [
  { to: '/admin/requests',    label: 'Solicitudes',    icon: Inbox,     description: 'Accesos pendientes' },
  { to: '/admin/users',       label: 'Usuarios',       icon: Users,     description: 'Gestión de cuentas' },
  { to: '/admin/tenants',     label: 'Organizaciones', icon: Building2, description: 'Tenants del sistema' },
  { to: '/admin/roles',       label: 'Roles',          icon: Shield,    description: 'Permisos y accesos' },
  { to: '/admin/memberships', label: 'Membresías',     icon: Link2,     description: 'Asignación de roles' },
  { to: '/admin/telegram-links', label: 'Vínculos Telegram', icon: Send, description: 'Acceso de terapeutas' },
]

const BREADCRUMBS = {
  '/admin/requests':    'Solicitudes',
  '/admin/users':       'Usuarios',
  '/admin/tenants':     'Organizaciones',
  '/admin/roles':       'Roles',
  '/admin/memberships': 'Membresías',
  '/admin/telegram-links': 'Vínculos Telegram',
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
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Desktop: sidebar colapsada a solo iconos (se recuerda entre sesiones).
  // Móvil: drawer off-canvas con backdrop.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('iam_sidebar_collapsed') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  function toggleCollapsed() {
    setCollapsed(prev => {
      localStorage.setItem('iam_sidebar_collapsed', prev ? '0' : '1')
      return !prev
    })
  }

  // Al navegar en móvil, cerrar el drawer
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const fetchPendingCount = useCallback(async () => {
    if (!token) return
    try {
      const data = await callAction('iam.request.list.in', { status: 'pending' }, token)
      setPendingCount(data?.requests?.length ?? 0)
    } catch {}
  }, [token])

  useEffect(() => {
    fetchPendingCount()
    const interval = setInterval(fetchPendingCount, 30000)
    // Refresca inmediatamente cuando Requests.jsx resuelve una solicitud
    window.addEventListener('requests-updated', fetchPendingCount)
    return () => {
      clearInterval(interval)
      window.removeEventListener('requests-updated', fetchPendingCount)
    }
  }, [fetchPendingCount])

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

      {/* Backdrop del drawer en móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: drawer off-canvas en móvil, colapsable en desktop */}
      <aside
        className={
          `z-40 flex flex-col border-r sidebar-bg transition-all duration-300 ` +
          `fixed inset-y-0 left-0 w-64 md:static md:min-h-screen md:shrink-0 md:translate-x-0 ` +
          `${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ` +
          `${collapsed ? 'md:w-[76px]' : 'md:w-64'}`
        }
        style={{ borderRightColor: 'rgba(212,175,55,0.12)' }}
      >

        {/* Top gold line */}
        <div className="absolute top-0 left-6 right-6 divider-gold opacity-60" />

        {/* Logo */}
        <div className={`py-6 ${collapsed ? 'md:px-0 md:flex md:justify-center' : ''} px-5`}
             style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className={`flex items-center gap-3 ${collapsed ? 'md:gap-0 md:justify-center' : ''}`}>
            <div className="relative shrink-0">
              <TuringMark size={34} />
              <div className="absolute inset-0 rounded-full blur-lg opacity-30"
                   style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.6) 0%, transparent 70%)' }} />
            </div>
            <div className={collapsed ? 'md:hidden' : ''}>
              <div className="font-serif text-sm leading-none tracking-wider" style={{ color: '#D4AF37' }}>
                <span className="text-glow-gold">Turing</span>{' '}
                <span style={{ color: '#C0C0C0', textShadow: '0 0 12px rgba(192,192,192,0.4)' }}>IAM</span>
              </div>
              <p className="text-[10px] mt-1 font-mono leading-none" style={{ color: '#374151' }}>
                Identity &amp; Access Management
              </p>
            </div>
            {/* Cerrar drawer (solo móvil) */}
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto md:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: '#4b5563' }}
              aria-label="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-5 space-y-0.5 ${collapsed ? 'md:px-2' : ''} px-3`}>
          <p className={`px-3 pb-3 text-[9px] font-mono font-semibold uppercase tracking-[0.15em] ${collapsed ? 'md:hidden' : ''}`}
             style={{ color: '#2a2a2a' }}>
            Administración
          </p>
          {navItems.map(({ to, label, icon: Icon, description }) => {
            const isRequests = to === '/admin/requests'
            const showBadge  = isRequests && pendingCount > 0
            return (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-all duration-200 ` +
                  `${collapsed ? 'md:justify-center md:px-0' : ''} ` +
                  (isActive ? 'nav-item-active' : 'nav-item-inactive border-transparent')
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Icon with notification badge */}
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? 'nav-icon-active' : 'nav-icon-inactive'}`}>
                        <Icon className="w-3.5 h-3.5" style={{ color: isActive ? '#D4AF37' : undefined }} />
                      </div>
                      {showBadge && (
                        <span
                          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full
                                     flex items-center justify-center text-[10px] font-bold text-white
                                     animate-pulse"
                          style={{
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            boxShadow: '0 0 8px rgba(239,68,68,0.7)',
                            lineHeight: 1,
                          }}
                        >
                          {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                      )}
                    </div>

                    <div className={`flex-1 min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
                      <p className="text-sm font-medium leading-none">{label}</p>
                      <p className="text-[10px] mt-0.5 leading-none truncate font-mono"
                         style={{ color: isActive ? 'rgba(212,175,55,0.55)' : '#374151' }}>
                        {description}
                      </p>
                    </div>
                    {isActive && (
                      <div className={`w-0.5 h-5 rounded-full shrink-0 ${collapsed ? 'md:hidden' : ''}`}
                           style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.9), rgba(192,192,192,0.5))' }} />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Silver divider */}
        <div className="mx-4 divider-silver opacity-40" />

        {/* User card */}
        <div className={`py-4 ${collapsed ? 'md:px-2' : ''} px-3`}>
          <div className={`rounded-2xl user-card-bg ${collapsed ? 'md:px-0 md:py-3 md:flex md:flex-col md:items-center md:gap-2' : 'px-4 py-4'}`}
               style={{ border: '1px solid rgba(212,175,55,0.09)' }}>
            <div className={`flex items-center gap-3 ${collapsed ? 'md:justify-center md:gap-0' : ''}`}>
              <RankedAvatar
                name={user?.email}
                role={user?.role ?? 'admin'}
                isActive={true}
                size="md"
              />
              <div className={`flex-1 min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
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
              title="Cerrar sesión"
              className={`flex items-center gap-2 rounded-lg text-xs transition-all duration-200 group ${
                collapsed ? 'md:mt-0 md:w-8 md:h-8 md:justify-center md:px-0 mt-3.5 w-full px-2.5 py-1.5' : 'mt-3.5 w-full px-2.5 py-1.5'
              }`}
              style={{ color: '#4b5563' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className={collapsed ? 'md:hidden' : ''}>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Bottom gold line */}
        <div className="absolute bottom-0 left-6 right-6 divider-gold opacity-30" />
      </aside>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="shrink-0 h-14 px-4 md:px-8 flex items-center gap-2 topbar-bg">
          {/* Hamburguesa (móvil) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-8 h-8 -ml-1 mr-1 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.06)' }}
            aria-label="Abrir menú"
          >
            <Menu className="w-4 h-4" />
          </button>
          {/* Colapsar sidebar (desktop) */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex w-7 h-7 mr-2 items-center justify-center rounded-lg transition-colors"
            style={{ color: '#4b5563' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.background = 'rgba(212,175,55,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Breadcrumb */}
          <span className="text-[10px] font-mono" style={{ color: '#374151' }}>IAM</span>
          <ChevronRight className="w-3 h-3" style={{ color: '#2a2a2a' }} />
          <span className="text-[10px] font-mono font-medium" style={{ color: '#D4AF37' }}>{currentSection}</span>

          {/* Right side decorations */}
          <div className="ml-auto flex items-center gap-4">
            {/* Status dot */}
            <div className="hidden sm:flex items-center gap-1.5">
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

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
