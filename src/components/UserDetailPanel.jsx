import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Mail, Loader2, Building2, Link2, ShieldCheck, ShieldOff,
  AlertTriangle, Layers, KeyRound,
} from 'lucide-react'
import { callAction } from '@/api/client'
import { RankedAvatar, getRankByRole } from '@/components/RankIcons'

const fadeInUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

/* Distintivo de estado activo/inactivo, reutilizado en ambos bloques */
function StatusPill({ isActive, activeLabel = 'Activo', inactiveLabel = 'Inactivo' }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.28)', color: '#4ade80' }}>
      <ShieldCheck className="w-3 h-3" />{activeLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#f87171' }}>
      <ShieldOff className="w-3 h-3" />{inactiveLabel}
    </span>
  )
}

/**
 * UserDetailPanel — vista de detalle de un usuario (requisito de Henry).
 *
 * Muestra, SEPARADOS y sin ambigüedad:
 *   1. Identidad (reutiliza los mismos campos que Users.jsx)
 *   2. Afiliaciones (turing.user_memberships) — pertenencia organizacional,
 *      NO otorga acceso a ninguna app (ADR 0001 §1 regla 1).
 *   3. Accesos de aplicación (turing.application_memberships) — el acceso
 *      real, agrupado por tenant, dejando explícito el caso "afiliado sin
 *      acceso" cuando un tenant tiene afiliación pero cero accesos.
 *
 * El rol se muestra siempre en su contexto (organizacional vs. de app,
 * por tenant, por tenant+app) para que nunca se confunda un rol con otro
 * aunque el usuario tenga roles distintos en distintos lugares.
 */
export default function UserDetailPanel({ user, token, onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [accesses, setAccesses] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true); setError(null)
        const [mData, aData] = await Promise.all([
          callAction('iam.membership.list.in', { user_id: user.id }, token),
          callAction('iam.application_membership.list.in', { user_id: user.id }, token),
        ])
        if (cancelled) return
        setMemberships(mData?.memberships || [])
        setAccesses(aData?.application_memberships || [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user.id, token])

  // Agrupa accesos de aplicación por tenant, para poder cruzarlos con las
  // afiliaciones y detectar "afiliado sin acceso" tenant por tenant.
  const accessesByTenant = accesses.reduce((acc, a) => {
    const key = a.tenant_id || a.tenant_slug || 'unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const rank = getRankByRole(user.role, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative glass-card rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col z-10"
        style={{ border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 0 50px rgba(212,175,55,0.08)' }}
      >
        <div className="absolute top-0 left-8 right-8 divider-gold opacity-50" />

        {/* ── Header: identidad ── */}
        <div className="px-6 py-5 flex items-start gap-4 shrink-0"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <RankedAvatar name={user.full_name} role={user.role} isActive={user.is_active} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-lg leading-tight" style={{ color: '#e5e7eb' }}>
                {user.full_name}
              </h2>
              <StatusPill isActive={user.is_active} />
            </div>
            <span className="flex items-center gap-1.5 text-xs font-mono mt-1" style={{ color: '#6b7280' }}>
              <Mail className="w-3 h-3 shrink-0" />{user.email}
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rank-badge ${rank.badgeCls}`}>
                <rank.Icon size={11} />{rank.label}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#374151' }}>
                Rol de plataforma: <strong style={{ color: '#9ca3af' }}>{user.role}</strong>
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors shrink-0"
            style={{ color: '#4b5563' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e5e7eb'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <p className="text-sm rounded-xl px-4 py-3 flex items-center gap-2 error-banner">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </p>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
              <span className="text-xs font-mono" style={{ color: '#374151' }}>Cargando membresías y accesos…</span>
            </div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">

              {/* ── Bloque 1: Afiliaciones ── */}
              <motion.section variants={fadeInUp}>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4" style={{ color: '#38bdf8' }} />
                  <h3 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Afiliaciones</h3>
                  <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                    ({memberships.length})
                  </span>
                </div>
                <p className="text-[11px] font-mono mb-3" style={{ color: '#4b5563' }}>
                  Pertenencia organizacional a un tenant. <strong style={{ color: '#6b7280' }}>No otorga
                  acceso a ninguna aplicación por sí sola.</strong>
                </p>

                {memberships.length === 0 ? (
                  <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <span className="text-xs font-mono" style={{ color: '#4b5563' }}>Sin afiliaciones a ningún tenant.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {memberships.map(m => (
                      <div key={m.id} className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                           style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.16)' }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#38bdf8' }} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#e5e7eb' }}>{m.tenant_name}</p>
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4b5563' }}>
                              Rol organizacional: <span style={{ color: '#9ca3af' }}>{m.role_name}</span>
                            </p>
                          </div>
                        </div>
                        <StatusPill isActive={m.is_active} activeLabel="Afiliado" inactiveLabel="Baja" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <div className="divider-silver opacity-25" />

              {/* ── Bloque 2: Accesos de aplicación, agrupados por tenant ── */}
              <motion.section variants={fadeInUp}>
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="w-4 h-4" style={{ color: '#D4AF37' }} />
                  <h3 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Accesos de aplicación</h3>
                  <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                    ({accesses.length})
                  </span>
                </div>
                <p className="text-[11px] font-mono mb-3" style={{ color: '#4b5563' }}>
                  Acceso real a una combinación tenant + aplicación, con su propio rol.
                  <strong style={{ color: '#6b7280' }}> Es lo único que autoriza entrar a una app</strong> —
                  distinto de la afiliación de arriba.
                </p>

                {memberships.length === 0 ? (
                  <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <span className="text-xs font-mono" style={{ color: '#4b5563' }}>
                      Sin tenants afiliados — no puede tener accesos de aplicación.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberships.map(m => {
                      const tenantAccesses = accessesByTenant[m.tenant_id] || []
                      return (
                        <div key={m.id} className="rounded-xl overflow-hidden"
                             style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                          <div className="px-4 py-2 flex items-center gap-2"
                               style={{ background: 'rgba(212,175,55,0.03)', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                            <Building2 className="w-3 h-3" style={{ color: '#4b5563' }} />
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>
                              {m.tenant_name}
                            </span>
                          </div>

                          {tenantAccesses.length === 0 ? (
                            <div className="px-4 py-3 flex items-center gap-2"
                                 style={{ background: 'rgba(239,68,68,0.03)' }}>
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
                              <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>
                                Afiliado sin acceso
                              </span>
                              <span className="text-[10px] font-mono ml-1" style={{ color: '#4b5563' }}>
                                — pertenece a este tenant pero no tiene acceso a ninguna aplicación aquí todavía.
                              </span>
                            </div>
                          ) : (
                            <div className="p-3 space-y-2">
                              {tenantAccesses.map(a => (
                                <div key={a.id} className="rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3"
                                     style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.16)' }}>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Layers className="w-3.5 h-3.5 shrink-0" style={{ color: '#D4AF37' }} />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate" style={{ color: '#e5e7eb' }}>
                                        Acceso a {a.application_slug}
                                      </p>
                                      <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4b5563' }}>
                                        Rol de aplicación: <span style={{ color: '#D4AF37' }}>{a.role_name}</span>
                                      </p>
                                    </div>
                                  </div>
                                  <StatusPill isActive={a.is_active} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.section>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-8 right-8 divider-gold opacity-25" />
      </motion.div>
    </div>
  )
}
