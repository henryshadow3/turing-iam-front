import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, AlertTriangle, X, Building2, Layers } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { callAction } from '@/api/client'
import { RankedAvatar, getRankByRole } from '@/components/RankIcons'

const fadeInUp = {
  hidden:   { opacity: 0, y: 14 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const ERROR_MESSAGES = {
  USER_NOT_AFFILIATED_TO_TENANT: 'Ese usuario no está afiliado al tenant dueño de esta aplicación. Primero debe existir la afiliación (pestaña Membresías) antes de otorgar el acceso.',
  ROLE_APPLICATION_MISMATCH: 'El rol elegido no pertenece a esta aplicación.',
  ROLE_TENANT_MISMATCH: 'El rol elegido es exclusivo de otro tenant.',
  TENANT_APPLICATION_INACTIVE: 'Esa aplicación está deshabilitada para este tenant.',
  APPLICATION_MEMBERSHIP_ALREADY_EXISTS: 'Ese usuario ya tiene acceso a esta combinación tenant + aplicación.',
}

function friendlyError(message) {
  for (const [code, text] of Object.entries(ERROR_MESSAGES)) {
    if (message?.includes(code)) return text
  }
  return message
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative glass-card rounded-2xl p-6 w-80 space-y-4 z-10"
        style={{ border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 0 30px rgba(239,68,68,0.06)' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#f87171' }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{message}</p>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onCancel}
            className="px-4 py-1.5 text-sm rounded-lg transition-colors font-medium"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e5e7eb'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-1.5 text-sm rounded-lg btn-danger font-medium">
            Eliminar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * ApplicationAccesses — panel de "Accesos a aplicaciones"
 * (turing.application_memberships), SEPARADO a propósito de Memberships.jsx
 * (turing.user_memberships, afiliación). Ver ADR 0001 §1: la afiliación NO
 * otorga acceso; este panel es el único lugar donde se otorga acceso real.
 *
 * El formulario de alta exige elegir explícitamente: tenant, aplicación
 * habilitada para ESE tenant (tenant_applications activas) y rol -- nunca
 * se infiere ninguno de los tres (regla dura del Work Item).
 */
export default function ApplicationAccessesPage() {
  const { token } = useAuth()
  const [accesses, setAccesses]           = useState([])
  const [users, setUsers]                 = useState([])
  const [tenants, setTenants]             = useState([])
  const [applications, setApplications]   = useState([])
  const [tenantApplications, setTenantApplications] = useState([])
  const [roles, setRoles]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm] = useState({ user_id: '', tenant_id: '', tenant_application_id: '', role_id: '' })
  const [saving, setSaving]               = useState(false)
  const [updatingId, setUpdatingId]       = useState(null)
  const [confirm, setConfirm]             = useState(null)
  const [statusFilter, setStatusFilter]   = useState('all')  // all | active | inactive

  async function fetchAll() {
    try {
      setLoading(true)
      const [aData, uData, tData, appData, taData, rData] = await Promise.all([
        callAction('iam.application_membership.list.in', {}, token),
        callAction('iam.user.list.in', {}, token),
        callAction('iam.tenant.list.in', {}, token),
        callAction('iam.application.list.in', {}, token),
        callAction('iam.tenant_application.list.in', {}, token),
        callAction('iam.role.list.in', {}, token),
      ])
      setAccesses(aData?.application_memberships || [])
      setUsers(uData?.users || [])
      setTenants(tData?.tenants || [])
      setApplications(appData?.applications || [])
      setTenantApplications(taData?.tenant_applications || [])
      setRoles(rData?.roles || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) fetchAll() }, [token])

  // Aplicaciones habilitadas y ACTIVAS para el tenant elegido en el
  // formulario -- nunca se ofrece una tenant_application inactiva ni de
  // otro tenant (regla dura: elegir aplicación explícitamente entre las
  // habilitadas para ESE tenant, no cualquier aplicación del catálogo).
  const availableTenantApps = tenantApplications.filter(
    ta => ta.is_active && (!form.tenant_id || ta.tenant_id === form.tenant_id)
  )

  // Roles de aplicación asignables para la tenant_application elegida:
  // catálogo (application_id coincide, tenant_id null) o custom (coincide
  // application_id Y tenant_id).
  const selectedTenantApp = tenantApplications.find(ta => ta.id === form.tenant_application_id)
  const availableRoles = roles.filter(r => {
    if (!selectedTenantApp) return false
    if (r.application_id !== selectedTenantApp.application_id) return false
    if (r.tenant_id && r.tenant_id !== selectedTenantApp.tenant_id) return false
    return r.is_active
  })

  const formComplete = Boolean(form.user_id && form.tenant_id && form.tenant_application_id && form.role_id)

  async function handleCreate(e) {
    e.preventDefault()
    if (!formComplete) {
      setError('Selecciona usuario, tenant, aplicación y rol antes de otorgar el acceso.')
      return
    }
    try {
      setSaving(true); setError(null)
      await callAction('iam.application_membership.create.in', {
        user_id: form.user_id,
        tenant_application_id: form.tenant_application_id,
        role_id: form.role_id,
      }, token)
      setShowForm(false)
      setForm({ user_id: '', tenant_id: '', tenant_application_id: '', role_id: '' })
      await fetchAll()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setSaving(false) }
  }

  async function handleToggle(accessId) {
    try {
      setUpdatingId(accessId); setError(null)
      await callAction('iam.application_membership.toggle.in', { application_membership_id: accessId }, token)
      await fetchAll()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setUpdatingId(null) }
  }

  function confirmToggle(access) {
    if (!access.is_active) { handleToggle(access.id); return }
    setConfirm({
      message: `¿Revocar el acceso de ${access.email} a ${access.application_slug} en ${access.tenant_slug}?`,
      onConfirm: async () => { setConfirm(null); await handleToggle(access.id) },
    })
  }

  const activeCount = accesses.filter(a => a.is_active).length
  const filtered = accesses.filter(a =>
    statusFilter === 'all' || (statusFilter === 'active' ? a.is_active : !a.is_active)
  )

  return (
    <div className="space-y-7">
      <AnimatePresence>
        {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}
        className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center avatar-gold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl shimmer-gold-text tracking-wide">Accesos a aplicaciones</h1>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#374151' }}>
              {activeCount} activos · {accesses.length} totales — distinto de la afiliación (ver Membresías)
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl btn-gold font-medium">
          <Plus className="w-4 h-4" />
          Otorgar acceso
        </button>
      </motion.div>

      {/* ── Create form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.form key="form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleCreate}
            className="glass-card rounded-2xl p-6 space-y-5"
            style={{ border: '1px solid rgba(212,175,55,0.16)', boxShadow: '0 0 30px rgba(212,175,55,0.05)' }}>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Nuevo acceso de aplicación</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                style={{ color: '#4b5563' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e5e7eb'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] font-mono" style={{ color: '#4b5563' }}>
              Debes elegir explícitamente los tres campos: el usuario debe estar afiliado al tenant
              elegido, y la aplicación debe estar habilitada (activa) para ese tenant.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                  Usuario
                </label>
                <select required value={form.user_id}
                  onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm input-dark">
                  <option value="">Seleccionar…</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} · {u.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                  Tenant
                </label>
                <select required value={form.tenant_id}
                  onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value, tenant_application_id: '', role_id: '' }))}
                  className="w-full rounded-lg px-3 py-2 text-sm input-dark">
                  <option value="">Seleccionar…</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                  Aplicación habilitada para ese tenant
                </label>
                <select required value={form.tenant_application_id} disabled={!form.tenant_id}
                  onChange={e => setForm(f => ({ ...f, tenant_application_id: e.target.value, role_id: '' }))}
                  className="w-full rounded-lg px-3 py-2 text-sm input-dark">
                  <option value="">{form.tenant_id ? 'Seleccionar…' : 'Elige un tenant primero'}</option>
                  {availableTenantApps.map(ta => {
                    const app = applications.find(a => a.id === ta.application_id)
                    return <option key={ta.id} value={ta.id}>{app?.name || ta.application_slug}</option>
                  })}
                </select>
                {form.tenant_id && availableTenantApps.length === 0 && (
                  <p className="text-[10px] font-mono mt-1" style={{ color: '#f59e0b' }}>
                    Este tenant no tiene ninguna aplicación habilitada todavía.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                  Rol de aplicación
                </label>
                <select required value={form.role_id} disabled={!form.tenant_application_id}
                  onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm input-dark">
                  <option value="">{form.tenant_application_id ? 'Seleccionar…' : 'Elige una aplicación primero'}</option>
                  {availableRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}{r.tenant_id ? ' (custom)' : ' (catálogo)'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm transition-colors font-medium rounded-lg" style={{ color: '#4b5563' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e5e7eb'}
                onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                Cancelar
              </button>
              <button type="submit" disabled={saving || !formComplete}
                title={!formComplete ? 'Completa usuario, tenant, aplicación y rol' : undefined}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl btn-gold font-medium">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Otorgar acceso
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm rounded-xl px-4 py-3 flex items-center gap-2 error-banner">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </motion.p>
      )}

      {/* ── Filtros ── */}
      {!loading && accesses.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}
          className="flex gap-3 items-center flex-wrap justify-end">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            title="Filtrar por estado"
            className="rounded-xl px-3 py-2.5 text-sm input-dark">
            <option value="all">Todos los estados</option>
            <option value="active">Solo activos</option>
            <option value="inactive">Solo inactivos</option>
          </select>
        </motion.div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          <span className="text-xs font-mono" style={{ color: '#374151' }}>Cargando accesos…</span>
        </div>
      ) : accesses.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <KeyRound className="w-9 h-9 mx-auto mb-4" style={{ color: '#2a2a2a' }} />
          <p className="text-sm font-medium" style={{ color: '#4b5563' }}>No hay accesos de aplicación otorgados</p>
          <p className="text-xs mt-1 font-mono" style={{ color: '#2a2a2a' }}>
            Un usuario afiliado a un tenant no tiene acceso a ninguna app hasta que se le otorgue aquí.
          </p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="glass-card rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(212,175,55,0.1)' }}>

          <div className="px-6 py-3"
               style={{ borderBottom: '1px solid rgba(212,175,55,0.07)', background: 'rgba(212,175,55,0.015)' }}>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em]" style={{ color: '#374151' }}>
              {filtered.length} acceso{filtered.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' && ` (de ${accesses.length})`}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Usuario', 'Tenant', 'Aplicación', 'Rol de aplicación', 'Estado', ''].map((h, i) => (
                  <th key={i}
                    className={`px-5 py-3.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] ${i === 5 ? 'text-right' : 'text-left'}`}
                    style={{ color: '#2a2a2a' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, idx) => {
                const isBusy = updatingId === a.id
                const rank = getRankByRole(a.role_name, idx)
                return (
                  <motion.tr key={a.id} variants={fadeInUp}
                    className="row-hover transition-all duration-200"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: isBusy ? 0.55 : 1 }}>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <RankedAvatar name={a.email} role={a.role_name} index={idx} isActive={a.is_active} size="md" />
                        <span className="text-xs font-mono" style={{ color: '#9ca3af' }}>{a.email}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 shrink-0" style={{ color: '#4b5563' }} />
                        <span className="text-xs font-mono" style={{ color: '#9ca3af' }}>{a.tenant_slug}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 shrink-0" style={{ color: '#D4AF37' }} />
                        <span className="text-xs font-medium" style={{ color: '#e5e7eb' }}>{a.application_slug}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rank-badge ${rank.badgeCls}`}>
                        <rank.Icon size={11} />{a.role_name}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button onClick={() => confirmToggle(a)} disabled={isBusy}
                        className="flex items-center gap-1.5 disabled:cursor-not-allowed"
                        title={a.is_active ? 'Revocar acceso' : 'Reactivar acceso'}>
                        {a.is_active ? (
                          <><ToggleRight className="w-5 h-5 toggle-on" /><span className="text-xs toggle-on font-mono">Activo</span></>
                        ) : (
                          <><ToggleLeft className="w-5 h-5 toggle-off" /><span className="text-xs toggle-off font-mono">Inactivo</span></>
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-auto" style={{ color: '#D4AF37' }} />
                      ) : (
                        <button onClick={() => confirmToggle(a)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all ml-auto"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#374151' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                          title="Revocar/reactivar acceso">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-6 py-3"
               style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-[10px] font-mono" style={{ color: '#2a2a2a' }}>
              {activeCount} activos · {accesses.length - activeCount} inactivos
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
