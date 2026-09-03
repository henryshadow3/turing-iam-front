import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, ArrowRight, ShieldCheck, Layers, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { selectTenant, selectApplication } from '@/api/client'
import GlimmerBackground from '@/components/GlimmerBackground'
import { getRankByRole } from '@/components/RankIcons'

const fadeInUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
}

/* Logo mark */
function TuringLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="tl-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A67C1E"/>
          <stop offset="40%"  stopColor="#D4AF37"/>
          <stop offset="65%"  stopColor="#F0D060"/>
          <stop offset="85%"  stopColor="#C0C0C0"/>
          <stop offset="100%" stopColor="#D4AF37"/>
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" stroke="url(#tl-g)" strokeWidth="1.2" fill="none"/>
      <path d="M9 10h14M16 10v12" stroke="url(#tl-g)" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

export default function SelectTenant() {
  const { token, user } = useAuth()
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-500 font-mono text-sm">Token inválido o expirado.</p>
      </div>
    )
  }

  const memberships = user.memberships || []
  // Claim nuevo de W6: accesos REALES de aplicación (turing.application_memberships),
  // distintos de las afiliaciones de arriba (ADR 0001 §1). Puede venir vacío
  // en tokens legacy -- se trata igual que "sin accesos".
  const applicationAccesses = user.application_memberships || []

  // Accesos agrupados por tenant, para poder mostrar "afiliado sin acceso"
  // tenant por tenant cuando aplique (mismo criterio que UserDetailPanel).
  const accessesByTenant = applicationAccesses.reduce((acc, a) => {
    const key = a.tenant_id
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  async function handleSelectTenant(membership) {
    try {
      // El token de login multi-membresía NO trae contexto activo: hay que
      // re-emitirlo con el tenant elegido para que el backend autorice con
      // el rol correcto (active_role) y filtre por tenant_id. Si el tenant
      // elegido tiene más de un acceso de aplicación, turing-api deja el
      // contexto de aplicación sin resolver y el usuario debe elegir con
      // handleSelectApplication en su lugar (ver accesos listados abajo).
      const data = await selectTenant(membership.tenant_id, token)
      localStorage.setItem('turing_token', data.access_token)
      const userParam = encodeURIComponent(JSON.stringify(data.user))
      window.location.href = `${data.redirect_to}?token=${data.access_token}&user=${userParam}`
    } catch (err) {
      setError(err.message || 'No se pudo seleccionar el espacio.')
    }
  }

  async function handleSelectApplication(access) {
    try {
      // Selección explícita de tenant + aplicación + rol -- necesaria
      // cuando el usuario tiene más de un application_membership y
      // select-tenant por sí solo no puede decidir de forma inequívoca
      // (ver ADR 0001 §7, endpoint /auth/select-application de W6).
      const data = await selectApplication(access.tenant_application_id, token)
      localStorage.setItem('turing_token', data.access_token)
      const userParam = encodeURIComponent(JSON.stringify(data.user))
      window.location.href = `${data.redirect_to}?token=${data.access_token}&user=${userParam}`
    } catch (err) {
      setError(err.message || 'No se pudo seleccionar la aplicación.')
    }
  }

  // Si el usuario tiene accesos de aplicación en más de una combinación
  // (multi-tenant o multi-app dentro del mismo tenant), se ofrece el
  // selector explícito de aplicación en vez de solo el de tenant --
  // select-tenant por sí solo no distingue entre dos apps del mismo tenant.
  const needsApplicationSelector = applicationAccesses.length > 1

  return (
    <div className="relative min-h-screen bg-black text-gray-200 font-sans overflow-x-hidden flex items-center justify-center px-4 py-12">
      <GlimmerBackground />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full pointer-events-none -z-0 animate-pulse-slow"
           style={{ background: 'rgba(76,29,149,0.05)', filter: 'blur(160px)' }} />
      <div className="absolute bottom-0 right-1/4 w-[40vw] h-[40vw] rounded-full pointer-events-none -z-0"
           style={{ background: 'rgba(192,192,192,0.03)', filter: 'blur(140px)' }} />

      <div className="relative z-10 w-full max-w-md">

        {/* ── Header ── */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="text-center mb-10">

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <TuringLogo />
              <div className="absolute inset-0 rounded-full blur-xl opacity-40"
                   style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.5) 0%, transparent 70%)' }} />
            </div>
          </div>

          <div className="mb-3">
            <span className="font-serif text-xs tracking-[0.2em] uppercase"
                  style={{ color: '#D4AF37', textShadow: '0 0 12px rgba(212,175,55,0.4)' }}>
              Turing
            </span>
            {' '}
            <span className="font-serif text-xs tracking-[0.2em] uppercase"
                  style={{ color: '#C0C0C0', textShadow: '0 0 10px rgba(192,192,192,0.35)' }}>
              IAM
            </span>
          </div>

          <h1 className="font-serif text-3xl font-bold text-white mb-3">
            Selecciona tu espacio
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
            Hola,{' '}
            <span className="font-medium" style={{ color: '#9ca3af' }}>{user.email}</span>.
            {' '}Elige un workspace para continuar.
          </p>
        </motion.div>

        {/* Error al seleccionar tenant */}
        {error && (
          <p className="text-center text-xs font-mono mb-4" style={{ color: '#f87171' }}>
            {error}
          </p>
        )}

        {/* Divider */}
        <div className="divider-gold opacity-30 mb-8" />

        {/* ── Tenant cards ── */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
          {user.platform_role === 'superadmin' && (
            <motion.button
              variants={fadeInUp}
              onClick={() => navigate('/admin/users')}
              className="group w-full rounded-2xl p-5 text-left transition-all duration-300"
              style={{
                background: 'rgba(8,8,8,0.8)',
                border: '1px solid #D4AF3735',
                boxShadow: '0 0 0 1px #D4AF3715',
              }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#D4AF3760'
                e.currentTarget.style.boxShadow   = '0 0 20px #D4AF3730'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#D4AF3735'
                e.currentTarget.style.boxShadow   = '0 0 0 1px #D4AF3715'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: '#D4AF3712', border: '1px solid #D4AF3725', boxShadow: '0 0 12px #D4AF3730' }}>
                    <ShieldCheck className="w-5 h-5" style={{ color: '#D4AF37' }} />
                  </div>
                  <div>
                    <p className="font-medium font-sans text-sm" style={{ color: '#e5e7eb' }}>
                      IAM Turing
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                        Panel de plataforma · superadmin
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-1"
                  style={{ color: '#374151' }}
                />
              </div>
            </motion.button>
          )}
          {memberships.length === 0 && user.platform_role !== 'superadmin' ? (
            <motion.div variants={fadeInUp}
              className="glass-card rounded-2xl p-8 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: '#2a2a2a' }} />
              <p className="text-sm font-medium" style={{ color: '#4b5563' }}>No tienes espacios asignados</p>
              <p className="text-xs mt-1 font-mono" style={{ color: '#2a2a2a' }}>Contacta a tu administrador.</p>
            </motion.div>
          ) : needsApplicationSelector ? (
            // Más de un acceso de aplicación (multi-tenant o multi-app en el
            // mismo tenant): se listan los ACCESOS explícitos, no los
            // tenants -- select-tenant por sí solo no puede resolver cuál
            // aplicación/rol activar sin ambigüedad (ADR 0001 §7).
            applicationAccesses.map((a, idx) => {
              const rank = getRankByRole(a.role_name, idx)
              return (
                <motion.button
                  key={a.tenant_application_id}
                  variants={fadeInUp}
                  onClick={() => handleSelectApplication(a)}
                  className="group w-full rounded-2xl p-5 text-left transition-all duration-300"
                  style={{
                    background: 'rgba(8,8,8,0.8)',
                    border: `1px solid ${rank.color}18`,
                    boxShadow: `0 0 0 1px ${rank.color}08`,
                  }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${rank.color}35`
                    e.currentTarget.style.boxShadow   = `0 0 20px ${rank.glow}30`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${rank.color}18`
                    e.currentTarget.style.boxShadow   = `0 0 0 1px ${rank.color}08`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: `${rank.color}12`, border: `1px solid ${rank.color}25`, boxShadow: `0 0 12px ${rank.glow}` }}>
                        <Layers className="w-5 h-5" style={{ color: rank.color }} />
                      </div>

                      <div>
                        <p className="font-medium font-sans text-sm" style={{ color: '#e5e7eb' }}>
                          {a.application_slug}
                        </p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4b5563' }}>
                          {a.tenant_slug}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`rank-badge ${rank.badgeCls}`}>
                            <rank.Icon size={11} />
                            {rank.label}
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                            {a.role_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ArrowRight
                      className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-1"
                      style={{ color: '#374151' }}
                    />
                  </div>
                </motion.button>
              )
            })
          ) : (
            memberships.map((m, idx) => {
              const rank = getRankByRole(m.role_name, idx)
              const tenantAccesses = accessesByTenant[m.tenant_id] || []
              // "Afiliado sin acceso" (ADR 0001 §8): la afiliación existe
              // pero no hay ningún application_membership en este tenant.
              // Solo se puede detectar cuando el token trae el claim nuevo
              // (application_memberships) -- en tokens legacy no se marca,
              // para no mostrar un falso positivo por falta de dato.
              const hasAccessClaim = Array.isArray(user.application_memberships)
              const affiliatedWithoutAccess = hasAccessClaim && tenantAccesses.length === 0
              return (
                <motion.button
                  key={m.tenant_id}
                  variants={fadeInUp}
                  onClick={() => handleSelectTenant(m)}
                  className="group w-full rounded-2xl p-5 text-left transition-all duration-300"
                  style={{
                    background: 'rgba(8,8,8,0.8)',
                    border: `1px solid ${rank.color}18`,
                    boxShadow: `0 0 0 1px ${rank.color}08`,
                  }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${rank.color}35`
                    e.currentTarget.style.boxShadow   = `0 0 20px ${rank.glow}30`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${rank.color}18`
                    e.currentTarget.style.boxShadow   = `0 0 0 1px ${rank.color}08`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Tenant icon */}
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: `${rank.color}12`, border: `1px solid ${rank.color}25`, boxShadow: `0 0 12px ${rank.glow}` }}>
                        <Building2 className="w-5 h-5" style={{ color: rank.color }} />
                      </div>

                      <div>
                        <p className="font-medium font-sans text-sm" style={{ color: '#e5e7eb' }}>
                          {m.tenant_name}
                        </p>
                        {/* Rank badge */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`rank-badge ${rank.badgeCls}`}>
                            <rank.Icon size={11} />
                            {rank.label}
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                            {m.role_name}
                          </span>
                        </div>
                        {affiliatedWithoutAccess && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: '#f59e0b' }} />
                            <span className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>
                              Afiliado sin acceso a ninguna aplicación aquí
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ArrowRight
                      className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:translate-x-1"
                      style={{ color: '#374151' }}
                    />
                  </div>
                </motion.button>
              )
            })
          )}
        </motion.div>

        {/* Bottom divider */}
        <div className="divider-silver opacity-20 mt-10 mb-6" />

        <p className="text-center text-[10px] font-mono" style={{ color: '#1e1e1e' }}>
          TURING IAM · Identity &amp; Access Management
        </p>
      </div>
    </div>
  )
}
