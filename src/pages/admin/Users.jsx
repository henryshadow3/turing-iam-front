import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Mail, Loader2, Search,
  Pencil, Check, X, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { callAction } from '@/api/client'
import { RankedAvatar, getRankByRole, RANKS } from '@/components/RankIcons'

const fadeInUp = {
  hidden:   { opacity: 0, y: 14 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const ROLES = ['terapeuta', 'admin', 'padre', 'alumno']

function roleBadgeClass(role) {
  switch (role?.toLowerCase()) {
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
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.7)' }}
           onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative glass-card rounded-2xl p-6 w-80 space-y-4 z-10"
        style={{ border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 0 40px rgba(212,175,55,0.08)' }}
      >
        {/* Glow top */}
        <div className="absolute top-0 left-0 right-0 divider-gold opacity-50" />

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
               style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#D4AF37' }} />
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
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

/* Stat card */
function StatCard({ label, value, sub, variant = 'gold' }) {
  return (
    <div className={`stat-card-${variant} rounded-2xl p-5 flex items-center gap-4`}>
      <div className="flex-1">
        <div className="text-2xl font-bold font-serif" style={{ color: variant === 'gold' ? '#D4AF37' : variant === 'silver' ? '#C0C0C0' : '#a78bfa' }}>
          {value}
        </div>
        <div className="text-xs font-medium mt-0.5" style={{ color: '#6b7280' }}>{label}</div>
        {sub && <div className="text-[10px] font-mono mt-1" style={{ color: '#374151' }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'terapeuta' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ full_name: '', role: '' })
  const [updatingId, setUpdatingId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  async function fetchUsers() {
    try {
      setLoading(true)
      const data = await callAction('iam.user.list.in', {}, token)
      setUsers(data?.users || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [token])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSaving(true); setError(null)
      await callAction('iam.user.create.in', form, token)
      setShowForm(false)
      setForm({ email: '', full_name: '', password: '', role: 'terapeuta' })
      await fetchUsers()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  function startEdit(u) { setEditingId(u.id); setEditForm({ full_name: u.full_name, role: u.role }) }
  function cancelEdit()  { setEditingId(null); setEditForm({ full_name: '', role: '' }) }

  async function handleUpdate(userId) {
    try {
      setUpdatingId(userId); setError(null)
      await callAction('iam.user.update.in', { user_id: userId, ...editForm }, token)
      setEditingId(null)
      await fetchUsers()
    } catch (e) { setError(e.message) }
    finally { setUpdatingId(null) }
  }

  async function handleToggleStatus(u) {
    try {
      setUpdatingId(u.id); setError(null)
      if (u.is_active) {
        await callAction('iam.user.disable.in', { user_id: u.id }, token)
      } else {
        await callAction('iam.user.update.in', { user_id: u.id, is_active: true }, token)
      }
      await fetchUsers()
    } catch (e) { setError(e.message) }
    finally { setUpdatingId(null) }
  }

  function confirmToggle(u) {
    setConfirm({
      message: u.is_active
        ? `¿Deshabilitar a ${u.full_name}? No podrá acceder al sistema.`
        : `¿Reactivar a ${u.full_name}?`,
      onConfirm: async () => { setConfirm(null); await handleToggleStatus(u) },
    })
  }

  const filtered   = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })
  const activeCount   = users.filter(u => u.is_active).length
  const inactiveCount = users.length - activeCount

  return (
    <div className="space-y-7">
      <AnimatePresence>
        {confirm && (
          <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}
        className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center avatar-gold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl shimmer-gold-text tracking-wide">Usuarios</h1>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#374151' }}>
              Panel de gestión de cuentas
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl btn-gold font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </motion.div>

      {/* ── Stats row ── */}
      {!loading && users.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-3 gap-4">
          <motion.div variants={fadeInUp}>
            <StatCard label="Total de usuarios" value={users.length} sub="registrados en el sistema" variant="gold" />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard label="Usuarios activos" value={activeCount} sub={`${Math.round(activeCount/users.length*100)||0}% del total`} variant="silver" />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard label="Usuarios inactivos" value={inactiveCount} sub="acceso deshabilitado" variant="violet" />
          </motion.div>
        </motion.div>
      )}

      {/* ── Create form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            key="create-form"
            initial={{ opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleCreate}
            className="glass-card rounded-2xl p-6 space-y-5"
            style={{ border: '1px solid rgba(212,175,55,0.16)', boxShadow: '0 0 30px rgba(212,175,55,0.05)' }}
          >
            <div className="absolute top-0 left-8 right-8 divider-gold opacity-40" style={{ position: 'relative', marginBottom: '0', width: 'auto', left: 'auto', right: 'auto' }} />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Nuevo usuario</h2>
              </div>
              <button type="button" onClick={() => setShowForm(false)}
                className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                style={{ color: '#4b5563' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e5e7eb'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Nombre completo', field: 'full_name', type: 'text',     placeholder: 'Ej. Ana García' },
                { label: 'Email',           field: 'email',     type: 'email',    placeholder: 'correo@ejemplo.com' },
                { label: 'Contraseña',      field: 'password',  type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.field}>
                  <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase"
                         style={{ color: '#4b5563' }}>{f.label}</label>
                  <input required type={f.type} placeholder={f.placeholder}
                    value={form[f.field]}
                    onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm input-dark" />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase"
                       style={{ color: '#4b5563' }}>Rol base</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm input-dark">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm transition-colors font-medium rounded-lg"
                style={{ color: '#4b5563' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e5e7eb'}
                onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl btn-gold font-medium">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Crear usuario
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm rounded-xl px-4 py-3 flex items-center gap-2 error-banner">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </motion.p>
      )}

      {/* ── Search ── */}
      {!loading && users.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: '#374151' }} />
          <input type="text" placeholder="Buscar por nombre o email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pl-11 pr-4 py-3 text-sm search-bar" />
        </motion.div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          <span className="text-xs font-mono" style={{ color: '#374151' }}>Cargando usuarios…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <Users className="w-9 h-9 mx-auto mb-4" style={{ color: '#2a2a2a' }} />
          <p className="text-sm font-medium" style={{ color: '#4b5563' }}>
            {search ? 'Sin resultados para esa búsqueda' : 'No hay usuarios registrados'}
          </p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="glass-card rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(212,175,55,0.1)' }}>

          {/* Table header */}
          <div className="px-6 py-3 flex items-center gap-3"
               style={{ borderBottom: '1px solid rgba(212,175,55,0.08)', background: 'rgba(212,175,55,0.02)' }}>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em]"
                  style={{ color: '#374151' }}>
              {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Usuario', 'Email', 'Rango', 'Rol', 'Estado', ''].map((h, i) => (
                  <th key={i}
                    className={`px-5 py-3.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] ${i === 5 ? 'text-right' : 'text-left'}`}
                    style={{ color: '#2a2a2a' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => {
                const isEditing = editingId === u.id
                const isBusy    = updatingId === u.id
                const rank      = getRankByRole(u.role, idx)

                return (
                  <motion.tr key={u.id} variants={fadeInUp}
                    className="row-hover transition-all duration-200"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: isBusy ? 0.55 : 1 }}>

                    {/* ── Usuario ── */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <RankedAvatar name={u.full_name} role={u.role} index={idx} isActive={u.is_active} size="md" />
                        {isEditing ? (
                          <input autoFocus value={editForm.full_name}
                            onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                            className="rounded-lg px-2.5 py-1.5 text-sm w-44 input-dark"
                            style={{ borderColor: 'rgba(212,175,55,0.35)' }} />
                        ) : (
                          <div>
                            <span className="font-medium leading-none" style={{
                              color: u.is_active ? '#e5e7eb' : '#4b5563',
                              textDecoration: u.is_active ? 'none' : 'line-through'
                            }}>
                              {u.full_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ── Email ── */}
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#6b7280' }}>
                        <Mail className="w-3 h-3 shrink-0" />
                        {u.email}
                      </span>
                    </td>

                    {/* ── Rango ── */}
                    <td className="px-5 py-4">
                      {u.is_active ? (
                        <span className={`rank-badge ${rank.badgeCls}`}>
                          <rank.Icon size={12} />
                          {rank.label}
                        </span>
                      ) : (
                        <span className="text-xs font-mono" style={{ color: '#2a2a2a' }}>—</span>
                      )}
                    </td>

                    {/* ── Rol ── */}
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select value={editForm.role}
                          onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                          className="rounded-lg px-2 py-1 text-xs input-dark"
                          style={{ borderColor: 'rgba(212,175,55,0.35)' }}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${roleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                      )}
                    </td>

                    {/* ── Estado ── */}
                    <td className="px-5 py-4">
                      <button onClick={() => confirmToggle(u)}
                        disabled={isBusy || isEditing}
                        className="flex items-center gap-1.5 disabled:cursor-not-allowed"
                        title={u.is_active ? 'Deshabilitar usuario' : 'Reactivar usuario'}>
                        {u.is_active ? (
                          <>
                            <ToggleRight className="w-5 h-5 toggle-on" />
                            <span className="text-xs toggle-on font-mono">Activo</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 toggle-off" />
                            <span className="text-xs toggle-off font-mono">Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* ── Acciones ── */}
                    <td className="px-5 py-4 text-right">
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-auto" style={{ color: '#D4AF37' }} />
                      ) : isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => handleUpdate(u.id)} title="Guardar"
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.1)'}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEdit} title="Cancelar"
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#e5e7eb'}
                            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(u)} title="Editar usuario"
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#374151' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="px-6 py-3 flex items-center justify-between"
               style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-[10px] font-mono" style={{ color: '#2a2a2a' }}>
              Mostrando {filtered.length} de {users.length}
            </span>
            {/* Rank legend mini */}
            <div className="flex items-center gap-3">
              {RANKS.slice(0, 4).map(r => (
                <div key={r.key} className="flex items-center gap-1" title={r.label} style={{ filter: `drop-shadow(0 0 4px ${r.glow})` }}>
                  <r.Icon size={12} />
                  <span className="text-[9px] font-mono" style={{ color: r.color, opacity: 0.6 }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
