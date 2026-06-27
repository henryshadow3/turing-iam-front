import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, AlertTriangle, X, Building2 } from 'lucide-react'
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

function roleBadgeClass(name) {
  switch (name?.toLowerCase()) {
    case 'admin':          return 'badge-gold'
    case 'administrador':  return 'badge-gold'
    case 'terapeuta':      return 'badge-violet'
    case 'padre':          return 'badge-teal'
    default:               return 'badge-neutral'
  }
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

export default function MembershipsPage() {
  const { token } = useAuth()
  const [memberships, setMemberships] = useState([])
  const [users,    setUsers]    = useState([])
  const [tenants,  setTenants]  = useState([])
  const [roles,    setRoles]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ user_id: '', tenant_id: '', role_id: '' })
  const [saving,   setSaving]   = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [confirm,  setConfirm]  = useState(null)

  async function fetchAll() {
    try {
      setLoading(true)
      const [mData, uData, tData, rData] = await Promise.all([
        callAction('iam.membership.list.in', {}, token),
        callAction('iam.user.list.in',       {}, token),
        callAction('iam.tenant.list.in',     {}, token),
        callAction('iam.role.list.in',       {}, token),
      ])
      setMemberships(mData?.memberships || [])
      setUsers  (uData?.users   || [])
      setTenants(tData?.tenants || [])
      setRoles  (rData?.roles   || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [token])

  const filteredRoles = roles.filter(r => !form.tenant_id || r.tenant_id === form.tenant_id)

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSaving(true); setError(null)
      await callAction('iam.membership.create.in', form, token)
      setShowForm(false)
      setForm({ user_id: '', tenant_id: '', role_id: '' })
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleRoleChange(membershipId, newRoleId) {
    try {
      setUpdatingId(membershipId); setError(null)
      await callAction('iam.membership.update.in', { membership_id: membershipId, role_id: newRoleId }, token)
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setUpdatingId(null) }
  }

  async function handleToggle(membershipId) {
    try {
      setUpdatingId(membershipId); setError(null)
      await callAction('iam.membership.toggle.in', { membership_id: membershipId }, token)
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setUpdatingId(null) }
  }

  function confirmDelete(membershipId) {
    setConfirm({
      message: '¿Eliminar esta membresía permanentemente?',
      onConfirm: async () => {
        setConfirm(null)
        try {
          setUpdatingId(membershipId)
          await callAction('iam.membership.delete.in', { membership_id: membershipId }, token)
          await fetchAll()
        } catch (e) { setError(e.message) }
        finally { setUpdatingId(null) }
      },
    })
  }

  const activeCount = memberships.filter(m => m.is_active).length

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
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl shimmer-gold-text tracking-wide">Membresías</h1>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#374151' }}>
              {activeCount} activas · {memberships.length} totales
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl btn-gold font-medium">
          <Plus className="w-4 h-4" />
          Asignar membresía
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
                <h2 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Nueva membresía</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                style={{ color: '#4b5563' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e5e7eb'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Usuario',        key: 'user_id',   items: users,   valKey: 'id',    lbl: u => `${u.full_name} · ${u.email}` },
                { label: 'Organización',   key: 'tenant_id', items: tenants, valKey: 'id',    lbl: t => t.name, onChg: (v) => setForm(f => ({ ...f, tenant_id: v, role_id: '' })) },
                { label: 'Rol',            key: 'role_id',   items: filteredRoles, valKey: 'id', lbl: r => r.name, disabled: !form.tenant_id },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase"
                         style={{ color: '#4b5563' }}>{f.label}</label>
                  <select required value={form[f.key]}
                    disabled={f.disabled}
                    onChange={e => f.onChg ? f.onChg(e.target.value) : setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm input-dark">
                    <option value="">Seleccionar…</option>
                    {f.items.map(item => (
                      <option key={item[f.valKey]} value={item[f.valKey]}>{f.lbl(item)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm transition-colors font-medium rounded-lg" style={{ color: '#4b5563' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e5e7eb'}
                onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl btn-gold font-medium">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Asignar
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

      {/* ── Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          <span className="text-xs font-mono" style={{ color: '#374151' }}>Cargando membresías…</span>
        </div>
      ) : memberships.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <Link2 className="w-9 h-9 mx-auto mb-4" style={{ color: '#2a2a2a' }} />
          <p className="text-sm font-medium" style={{ color: '#4b5563' }}>No hay membresías registradas</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="glass-card rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(212,175,55,0.1)' }}>

          <div className="px-6 py-3"
               style={{ borderBottom: '1px solid rgba(212,175,55,0.07)', background: 'rgba(212,175,55,0.015)' }}>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em]"
                  style={{ color: '#374151' }}>
              {memberships.length} membresía{memberships.length !== 1 ? 's' : ''}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Usuario', 'Rango', 'Organización', 'Rol', 'Estado', ''].map((h, i) => (
                  <th key={i}
                    className={`px-5 py-3.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] ${i === 5 ? 'text-right' : 'text-left'}`}
                    style={{ color: '#2a2a2a' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberships.map((m, idx) => {
                const tenantRoles = roles.filter(r => r.tenant_id === m.tenant_id)
                const isBusy = updatingId === m.id
                const rank = getRankByRole(m.role_name, idx)

                return (
                  <motion.tr key={m.id} variants={fadeInUp}
                    className="row-hover transition-all duration-200"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: isBusy ? 0.55 : 1 }}>

                    {/* ── Usuario ── */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <RankedAvatar name={m.full_name} role={m.role_name} index={idx} isActive={m.is_active} size="md" />
                        <div>
                          <p className="font-medium leading-tight" style={{ color: '#e5e7eb' }}>{m.full_name}</p>
                          <p className="text-[11px] font-mono mt-0.5" style={{ color: '#4b5563' }}>{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* ── Rango ── */}
                    <td className="px-5 py-4">
                      {m.is_active ? (
                        <span className={`rank-badge ${rank.badgeCls}`}>
                          <rank.Icon size={12} />
                          {rank.label}
                        </span>
                      ) : (
                        <span className="text-xs font-mono" style={{ color: '#2a2a2a' }}>—</span>
                      )}
                    </td>

                    {/* ── Organización ── */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 shrink-0" style={{ color: '#4b5563' }} />
                        <span className="text-xs font-mono" style={{ color: '#9ca3af' }}>{m.tenant_name}</span>
                      </div>
                    </td>

                    {/* ── Rol ── */}
                    <td className="px-5 py-4">
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#D4AF37' }} />
                      ) : (
                        <select
                          value={m.role_id}
                          onChange={e => handleRoleChange(m.id, e.target.value)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium role-select ${roleBadgeClass(m.role_name)}`}
                        >
                          {tenantRoles.map(r => (
                            <option key={r.id} value={r.id} style={{ background: '#0a0a0a', color: '#e5e7eb' }}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* ── Estado ── */}
                    <td className="px-5 py-4">
                      <button onClick={() => handleToggle(m.id)} disabled={isBusy}
                        className="flex items-center gap-1.5 disabled:cursor-not-allowed"
                        title={m.is_active ? 'Desactivar' : 'Activar'}>
                        {m.is_active ? (
                          <><ToggleRight className="w-5 h-5 toggle-on" /><span className="text-xs toggle-on font-mono">Activo</span></>
                        ) : (
                          <><ToggleLeft className="w-5 h-5 toggle-off" /><span className="text-xs toggle-off font-mono">Inactivo</span></>
                        )}
                      </button>
                    </td>

                    {/* ── Eliminar ── */}
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => confirmDelete(m.id)} disabled={isBusy}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all ml-auto disabled:cursor-not-allowed"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#374151' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                        title="Eliminar membresía">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>

          <div className="px-6 py-3"
               style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-[10px] font-mono" style={{ color: '#2a2a2a' }}>
              {activeCount} activas · {memberships.length - activeCount} inactivas
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
