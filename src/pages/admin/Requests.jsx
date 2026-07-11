import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, Check, X, Loader2, AlertTriangle, Building2, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { callAction } from '@/api/client'
import { RankedAvatar } from '@/components/RankIcons'

const fadeInUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

export default function RequestsPage() {
  const { token } = useAuth()
  const [requests, setRequests] = useState([])
  const [roles,    setRoles]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [busyId,   setBusyId]   = useState(null)
  // rol elegido por solicitud (default: el sugerido). { [request_id]: role_id }
  const [roleChoice, setRoleChoice] = useState({})

  async function fetchAll() {
    try {
      setLoading(true)
      const [rqData, rlData] = await Promise.all([
        callAction('iam.request.list.in', { status: 'pending' }, token),
        callAction('iam.role.list.in',     {}, token),
      ])
      const reqs = rqData?.requests || []
      setRequests(reqs)
      setRoles(rlData?.roles || [])
      setRoleChoice(Object.fromEntries(
        reqs.map(r => [r.id, r.requested_role_id || ''])
      ))
      // Notifica al layout para que refresque el badge
      window.dispatchEvent(new CustomEvent('requests-updated'))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) fetchAll() }, [token])

  async function handleApprove(req) {
    const roleId = roleChoice[req.id] || req.requested_role_id
    if (!roleId) { setError('Selecciona un rol para aprobar la solicitud.'); return }
    try {
      setBusyId(req.id); setError(null)
      await callAction('iam.request.approve.in', { request_id: req.id, role_id: roleId }, token)
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }

  async function handleReject(req) {
    try {
      setBusyId(req.id); setError(null)
      await callAction('iam.request.reject.in', { request_id: req.id }, token)
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setBusyId(null) }
  }

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}
        className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center avatar-gold">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl shimmer-gold-text tracking-wide">Solicitudes de acceso</h1>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#374151' }}>
              {requests.length} pendiente{requests.length !== 1 ? 's' : ''} de aprobación
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Error ── */}
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm rounded-xl px-4 py-3 flex items-center gap-2 error-banner">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </motion.p>
      )}

      {/* ── Lista ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          <span className="text-xs font-mono" style={{ color: '#374151' }}>Cargando solicitudes…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <Inbox className="w-9 h-9 mx-auto mb-4" style={{ color: '#2a2a2a' }} />
          <p className="text-sm font-medium" style={{ color: '#4b5563' }}>No hay solicitudes pendientes</p>
          <p className="text-xs mt-1 font-mono" style={{ color: '#2a2a2a' }}>
            Los registros nuevos aparecerán aquí para su aprobación.
          </p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
          <AnimatePresence>
            {requests.map((req, idx) => {
              const tenantRoles = roles.filter(r => r.tenant_id === req.tenant_id)
              const isBusy = busyId === req.id
              return (
                <motion.div key={req.id} variants={fadeInUp} exit={{ opacity: 0, x: -12 }}
                  className="glass-card rounded-2xl p-5"
                  style={{ border: '1px solid rgba(212,175,55,0.12)', opacity: isBusy ? 0.55 : 1 }}>
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Usuario */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <RankedAvatar name={req.full_name || req.email} role={req.requested_role_name} index={idx} isActive size="md" />
                      <div className="min-w-0">
                        <p className="font-medium leading-tight truncate" style={{ color: '#e5e7eb' }}>
                          {req.full_name || '—'}
                        </p>
                        <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: '#4b5563' }}>{req.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: '#4b5563' }}>
                            <Building2 className="w-3 h-3" />{req.tenant_name}
                          </span>
                          {req.created_at && (
                            <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: '#2a2a2a' }}>
                              <Clock className="w-3 h-3" />{new Date(req.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rol a asignar */}
                    <div className="shrink-0">
                      <label className="block text-[9px] font-mono mb-1 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                        Rol a asignar
                      </label>
                      <select
                        value={roleChoice[req.id] || ''}
                        disabled={isBusy}
                        onChange={e => setRoleChoice(c => ({ ...c, [req.id]: e.target.value }))}
                        className="rounded-lg px-3 py-1.5 text-sm input-dark">
                        <option value="">Seleccionar…</option>
                        {tenantRoles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isBusy ? (
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#D4AF37' }} />
                      ) : (
                        <>
                          <button onClick={() => handleApprove(req)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl btn-gold font-medium">
                            <Check className="w-4 h-4" />Aprobar
                          </button>
                          <button onClick={() => handleReject(req)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl font-medium transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#6b7280' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                            <X className="w-4 h-4" />Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
