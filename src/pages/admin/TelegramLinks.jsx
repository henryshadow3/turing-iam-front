import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, RefreshCw, Send, ShieldCheck, ShieldX } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  getTelegramLinks,
  reactivateTelegramLink,
  revokeTelegramLink,
} from '@/api/client'

const fadeInUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function TelegramLinksPage() {
  const { token } = useAuth()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const loadLinks = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const data = await getTelegramLinks(token)
      setLinks(data.links || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadLinks() }, [loadLinks])

  async function changeStatus(link) {
    const active = link.is_active && link.is_current
    const action = active ? 'cancelar' : 'reactivar'
    if (!window.confirm(`¿Deseas ${action} el vínculo de ${link.full_name}?`)) return
    try {
      setBusyId(link.chat_id)
      setError(null)
      if (active) {
        await revokeTelegramLink(link.chat_id, token)
      } else {
        await reactivateTelegramLink(link.chat_id, token)
      }
      await loadLinks()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-7">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center avatar-gold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl shimmer-gold-text tracking-wide">Vínculos Telegram</h1>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#4b5563' }}>
              Cancelación y reactivación de BrilliantBot
            </p>
          </div>
        </div>
        <button onClick={loadLinks} disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
          style={{ border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', background: 'rgba(212,175,55,0.06)' }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </motion.div>

      {error && (
        <p className="text-sm rounded-xl px-4 py-3 flex items-center gap-2 error-banner">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          <span className="text-xs font-mono" style={{ color: '#4b5563' }}>Cargando vínculos…</span>
        </div>
      ) : links.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <Send className="w-9 h-9 mx-auto mb-4" style={{ color: '#2a2a2a' }} />
          <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No hay cuentas vinculadas</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}
          className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider font-mono"
                  style={{ color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="px-5 py-4">Terapeuta</th>
                  <th className="px-5 py-4">Usuario IAM</th>
                  <th className="px-5 py-4">Expira</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {links.map(link => {
                  const active = link.is_active && link.is_current
                  const busy = busyId === link.chat_id
                  return (
                    <tr key={link.chat_id} className="row-hover"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.035)' }}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium" style={{ color: '#d1d5db' }}>{link.full_name}</p>
                        <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>{link.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[11px] font-mono" style={{ color: '#9ca3af' }}>{link.iam_user}</p>
                        <p className="text-[10px] mt-1 uppercase" style={{ color: '#4b5563' }}>{link.platform_role}</p>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#9ca3af' }}>{formatDate(link.expires_at)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          {active ? (
                            <><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-emerald-300">🟢 Activo</span></>
                          ) : (
                            <><ShieldX className="w-4 h-4 text-red-400" /><span className="text-red-300">🔴 Revocado</span></>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => changeStatus(link)} disabled={busy}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          style={active
                            ? { color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)' }
                            : { color: '#86efac', border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.07)' }}>
                          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {active ? 'Cancelar' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
