import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Mail, Loader2, Search,
  Pencil, Check, X, ToggleLeft, ToggleRight, AlertTriangle,
  ChevronLeft, ChevronRight, Eye, Layers, ShieldCheck, Link2Off,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { callAction } from '@/api/client'
import { RankedAvatar, getRankByRole, RANKS } from '@/components/RankIcons'
import UserDetailPanel from '@/components/UserDetailPanel'

const fadeInUp = {
  hidden:   { opacity: 0, y: 14 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { staggerChildren: 0.04 } },
}

// Roles de PLATAFORMA (turing.users.role) — no confundir con los roles de
// tenant (turing.roles: terapeuta, padre…), que se asignan vía membresías.
const ROLES = ['user', 'analista', 'developer', 'admin', 'superadmin']

function roleBadgeClass(role) {
  switch (role?.toLowerCase()) {
    case 'superadmin':     return 'badge-gold'
    case 'admin':          return 'badge-violet'
    case 'developer':      return 'badge-teal'
    case 'analista':       return 'badge-teal'
    default:               return 'badge-neutral'
  }
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

const ERROR_MESSAGES = {
  NO_APPLICATION_ACCESS_FOR_USER: 'Este usuario no tiene ningún acceso registrado para esta aplicación.',
}
function friendlyError(message) {
  for (const [code, text] of Object.entries(ERROR_MESSAGES)) {
    if (message?.includes(code)) return text
  }
  return message
}

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

export default function UsersPage() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Catálogo de aplicaciones -> tabs (W12). La tab activa se persiste en
  // el query param `app` (id de la aplicación) para que la vista sea
  // navegable/recargable, siguiendo el mismo patrón de query params que ya
  // usa useAuth.js para el token. Las tabs REEMPLAZAN la vista global de
  // usuarios anterior -- ya no existe una tabla "sin aplicación".
  const [applications, setApplications] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const activeAppId = searchParams.get('app') || ''

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  // Todos los application_memberships (sin filtrar) -- se cruzan client-side
  // por application_id de la tab activa para saber si el acceso de cada
  // usuario del grupo "access" está actualmente activo o no. iam.user.list.in
  // NO trae ese estado precalculado (solo indica que el usuario PERTENECE al
  // grupo "access", activo o no -- ver docstring de UserPostgresRepository.
  // list_all en turing-iam-worker).
  const [appMemberships, setAppMemberships] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')   // all | active | inactive
  const [roleFilter, setRoleFilter] = useState('all')       // all | user | analista | developer | admin | superadmin
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'user' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')          // valor crudo del input (sin debounce)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)                // 0-indexed
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ full_name: '', role: '' })
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)   // usuario abierto en el panel de detalle

  // Catálogo de aplicaciones: se carga una vez. Si la URL no trae `app` (o
  // trae un id que ya no existe en el catálogo), se fija a la primera app
  // disponible -- así siempre hay una tab activa válida.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function loadApplications() {
      try {
        setAppsLoading(true)
        const data = await callAction('iam.application.list.in', {}, token)
        if (cancelled) return
        const apps = data?.applications || []
        setApplications(apps)
        const current = searchParams.get('app')
        if (apps.length > 0 && !apps.some(a => a.id === current)) {
          setSearchParams(prev => {
            const next = new URLSearchParams(prev)
            next.set('app', apps[0].id)
            return next
          }, { replace: true })
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setAppsLoading(false)
      }
    }
    loadApplications()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function selectTab(appId) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('app', appId)
      return next
    })
  }

  // Debounce de la búsqueda: solo dispara la query server-side ~300ms
  // después de que el usuario deja de teclear (evita 1 request por letra
  // contra un dataset de miles de usuarios).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search])

  // Cualquier cambio de filtro/búsqueda/tab regresa a la primera página.
  useEffect(() => { setPage(0) }, [debouncedSearch, statusFilter, roleFilter, activeAppId])

  async function fetchUsers() {
    if (!activeAppId) return
    try {
      setLoading(true)
      const payload = {
        application_id: activeAppId,
        search: debouncedSearch || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }
      const [uData, amData] = await Promise.all([
        callAction('iam.user.list.in', payload, token),
        callAction('iam.application_membership.list.in', {}, token),
      ])
      setUsers(uData?.users || [])
      setTotal(uData?.total ?? (uData?.users || []).length)
      setAppMemberships(amData?.application_memberships || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && activeAppId) fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeAppId, debouncedSearch, statusFilter, roleFilter, page])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSaving(true); setError(null)
      await callAction('iam.user.create.in', form, token)
      setShowForm(false)
      setForm({ email: '', full_name: '', password: '', role: 'user' })
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

  // ── Estado por-aplicación (W12) — DISTINTO del control de cuenta global
  // (login), que vive ahora en UserDetailPanel. Alterna de un jalón TODOS
  // los application_memberships del usuario para la app de la tab activa.
  async function handleToggleAppAccess(u) {
    try {
      setUpdatingId(u.id); setError(null)
      await callAction('iam.user.toggle_application_access.in', {
        user_id: u.id, application_id: activeAppId,
      }, token)
      await fetchUsers()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setUpdatingId(null) }
  }

  // El filtrado (búsqueda, rol, estado, aplicación) ya ocurre server-side
  // (ver fetchUsers) -- "users" que llega del backend YA es la página
  // filtrada. Ver requisito de Henry: la búsqueda debe escalar a miles de
  // usuarios sin traer la tabla completa al navegador.
  const filtered = users
  const activeCount   = users.filter(u => u.is_active).length
  const inactiveCount = users.length - activeCount
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Acceso activo/inactivo de cada usuario PARA LA APP DE LA TAB ACTIVA,
  // derivado cruzando appMemberships (misma semántica any_active que usa el
  // backend en toggle_by_application: activo si AL MENOS uno de sus
  // application_memberships para esta app está activo).
  function appAccessIsActive(userId) {
    const rows = appMemberships.filter(m => m.user_id === userId && m.application_id === activeAppId)
    return rows.some(m => m.is_active)
  }

  return (
    <div className="space-y-7">
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

      {/* ── Tabs de aplicación (W12) — reemplazan la vista global de
          usuarios; cada tab filtra la tabla a los usuarios relevantes para
          esa aplicación (con acceso, o afiliados sin acceso). ── */}
      {appsLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#D4AF37' }} />
          <span className="text-xs font-mono" style={{ color: '#374151' }}>Cargando aplicaciones…</span>
        </div>
      ) : applications.length === 0 ? (
        <p className="text-xs font-mono" style={{ color: '#4b5563' }}>Sin aplicaciones registradas en el catálogo.</p>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}
          className="flex items-center gap-2 flex-wrap">
          {applications.map(app => {
            const isActive = app.id === activeAppId
            return (
              <button key={app.id} onClick={() => selectTab(app.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-all"
                style={isActive
                  ? { color: '#D4AF37', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)' }
                  : { color: '#6b7280', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Layers className="w-3.5 h-3.5" />
                {app.name}
                {!app.is_active && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                    inactiva
                  </span>
                )}
              </button>
            )
          })}
        </motion.div>
      )}

      {/* ── Stats row ── */}
      {!loading && total > 0 && (
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-3 gap-4">
          <motion.div variants={fadeInUp}>
            <StatCard label="Coinciden con el filtro" value={total} sub={`mostrando ${users.length} en esta página`} variant="gold" />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard label="Activos (página)" value={activeCount} sub={`${Math.round(activeCount/users.length*100)||0}% de esta página`} variant="silver" />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard label="Inactivos (página)" value={inactiveCount} sub="acceso deshabilitado" variant="violet" />
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

      {/* ── Search + filtros ──
          Búsqueda server-side con debounce de 300ms (ver useEffect de
          debouncedSearch): cada tecleo NO dispara una query -- solo se
          consulta al backend 300ms después de que el usuario deja de
          escribir, y esa query trae SOLO la página filtrada (25 filas),
          nunca la tabla completa. Esto es lo que permite que la búsqueda
          escale a miles de usuarios (requisito de Henry). */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}
        className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: '#374151' }} />
          <input type="text" placeholder="Buscar por nombre o email…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pl-11 pr-4 py-3 text-sm search-bar" />
          {search !== debouncedSearch && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin"
                     style={{ color: '#374151' }} />
          )}
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          title="Filtrar por rol de plataforma"
          className="rounded-xl px-3 py-3 text-sm input-dark">
          <option value="all">Todos los roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          title="Filtrar por estado de cuenta (login)"
          className="rounded-xl px-3 py-3 text-sm input-dark">
          <option value="all">Todos los estados</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
      </motion.div>

      {/* ── Table ── */}
      {!activeAppId ? null : loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
          <span className="text-xs font-mono" style={{ color: '#374151' }}>Cargando usuarios…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <Users className="w-9 h-9 mx-auto mb-4" style={{ color: '#2a2a2a' }} />
          <p className="text-sm font-medium" style={{ color: '#4b5563' }}>
            {debouncedSearch || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Sin resultados para ese filtro'
              : 'Ningún usuario tiene acceso o afiliación relevante para esta aplicación'}
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
                {['Usuario', 'Email', 'Rango', 'Rol', 'Estado en esta app', ''].map((h, i) => (
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
                const hasAccess = u.app_access_status === 'access'
                const appActive = hasAccess ? appAccessIsActive(u.id) : false

                return (
                  <motion.tr key={u.id} variants={fadeInUp}
                    onClick={() => { if (!isEditing && !isBusy) setSelectedUser(u) }}
                    className="row-hover transition-all duration-200"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      opacity: isBusy ? 0.55 : 1,
                      cursor: isEditing ? 'default' : 'pointer',
                    }}>

                    {/* ── Usuario ── */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <RankedAvatar name={u.full_name} role={u.role} index={idx} isActive={u.is_active} size="md" />
                        {isEditing ? (
                          <input autoFocus value={editForm.full_name}
                            onClick={e => e.stopPropagation()}
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
                            {/* Distintivo visual del grupo (confirmado por Henry:
                                deben verse aparte, no mezclados sin marcar). */}
                            <p className="text-[10px] font-mono mt-1 flex items-center gap-1"
                               style={hasAccess ? { color: '#4ade80' } : { color: '#f59e0b' }}>
                              {hasAccess
                                ? <><ShieldCheck className="w-3 h-3" />Con acceso</>
                                : <><Link2Off className="w-3 h-3" />Afiliado sin acceso</>}
                            </p>
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
                          onClick={e => e.stopPropagation()}
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

                    {/* ── Estado en esta app (W12) — DISTINTO del control de
                        cuenta global (login), que vive en el panel de
                        detalle. Toggle real solo para el grupo "access";
                        deshabilitado con tooltip para "affiliated_no_access"
                        (mismo patrón visual gris + not-allowed + title que
                        `nothingToSuspend` en UserDetailPanel). ── */}
                    <td className="px-5 py-4">
                      {hasAccess ? (
                        <button onClick={e => { e.stopPropagation(); handleToggleAppAccess(u) }}
                          disabled={isBusy || isEditing}
                          className="flex items-center gap-1.5 disabled:cursor-not-allowed"
                          title={appActive ? 'Desactivar acceso a esta aplicación' : 'Reactivar acceso a esta aplicación'}>
                          {appActive ? (
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
                      ) : (
                        <span className="flex items-center gap-1.5 cursor-not-allowed"
                          title="Este usuario está afiliado pero no tiene ningún acceso activo en esta aplicación para desactivar"
                          style={{ color: '#374151' }}>
                          <ToggleLeft className="w-5 h-5" style={{ color: '#374151' }} />
                          <span className="text-xs font-mono">Sin acceso</span>
                        </span>
                      )}
                    </td>

                    {/* ── Acciones ── */}
                    <td className="px-5 py-4 text-right">
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-auto" style={{ color: '#D4AF37' }} />
                      ) : isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={e => { e.stopPropagation(); handleUpdate(u.id) }} title="Guardar"
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,222,128,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,222,128,0.1)'}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); cancelEdit() }} title="Cancelar"
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#e5e7eb'}
                            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={e => { e.stopPropagation(); setSelectedUser(u) }} title="Ver detalle: afiliaciones, accesos, roles y cuenta global"
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#374151' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; e.currentTarget.style.background = 'rgba(56,189,248,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); startEdit(u) }} title="Editar usuario"
                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#374151' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>

          {/* Table footer */}
          <div className="px-6 py-3 flex items-center justify-between flex-wrap gap-3"
               style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.2)' }}>
            <span className="text-[10px] font-mono" style={{ color: '#2a2a2a' }}>
              Página {page + 1} de {totalPages} · {filtered.length} de {total} coinciden
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af' }}
                  title="Página anterior">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1" style={{ color: '#4b5563' }}>
                  {page + 1} / {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#9ca3af' }}
                  title="Página siguiente">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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

      {/* ── Panel de detalle de usuario (requisito de Henry) ── */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailPanel user={selectedUser} token={token} onClose={() => setSelectedUser(null)} onUserUpdated={fetchUsers} />
        )}
      </AnimatePresence>
    </div>
  )
}
