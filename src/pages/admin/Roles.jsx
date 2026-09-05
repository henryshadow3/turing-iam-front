import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ShieldOff, Plus, Loader2, AlertTriangle, Layers, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { callAction } from '@/api/client'

const SCOPE_OPTIONS = [
  { value: 'legacy',  label: 'Legacy (organizacional)', hint: 'Rol de afiliación pura a un tenant — el modelo de siempre.' },
  { value: 'catalog', label: 'Catálogo (por aplicación)', hint: 'Compartido por todos los tenants que tengan esa aplicación habilitada.' },
  { value: 'custom',  label: 'Custom (tenant + aplicación)', hint: 'Exclusivo de un tenant para una aplicación específica.' },
]

const CREATE_ERRORS = {
  MISSING_FIELD_NAME: 'El nombre del rol es obligatorio.',
  MISSING_FIELD_TENANT_ID: 'Selecciona un tenant o una aplicación para definir el alcance del rol.',
  INVALID_ROLE_SCOPE: 'Combinación de alcance inválida para este rol.',
}

function friendlyCreateError(message) {
  for (const [code, text] of Object.entries(CREATE_ERRORS)) {
    if (message?.includes(code)) return text
  }
  return message
}

function scopeBadge(role) {
  if (role.scope === 'catalog' || (!role.tenant_id && role.application_id)) {
    return { label: `Catálogo: ${role.application_name || role.application_slug || '—'}`, cls: 'badge-gold', Icon: Layers }
  }
  if (role.scope === 'custom' || (role.tenant_id && role.application_id)) {
    return { label: `Custom: ${role.tenant_name || role.tenant_id} / ${role.application_name || role.application_slug || '—'}`, cls: 'badge-violet', Icon: Layers }
  }
  return { label: 'Legacy', cls: 'badge-neutral', Icon: Building2 }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const TOGGLE_ERRORS = {
  CANNOT_DISABLE_ADMIN_ROLE: 'El rol admin no puede desactivarse: dejaría a la organización sin administradores.',
  ROLE_NOT_FOUND: 'El rol ya no existe.',
}

function friendlyError(message) {
  for (const [code, text] of Object.entries(TOGGLE_ERRORS)) {
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
        style={{ border: '1px solid rgba(212,175,55,0.18)' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#D4AF37' }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{message}</p>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onCancel}
            className="px-4 py-1.5 text-sm rounded-lg transition-colors font-medium text-gray-500 hover:text-gray-200">
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

const emptyForm = { scope: 'legacy', tenant_id: '', application_id: '', name: '' }

export default function RolesPage() {
  const { token } = useAuth()
  const [roles, setRoles] = useState([])
  const [tenants, setTenants] = useState([])
  const [applications, setApplications] = useState([])
  const [tenantApplications, setTenantApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [confirm, setConfirm] = useState(null)

  async function fetchAll() {
    try {
      setLoading(true)
      const [rolesData, tenantsData, appsData, tappsData] = await Promise.all([
        callAction('iam.role.list.in', {}, token),
        callAction('iam.tenant.list.in', {}, token),
        callAction('iam.application.list.in', {}, token),
        callAction('iam.tenant_application.list.in', {}, token),
      ])
      setRoles(rolesData?.roles || [])
      setTenants(tenantsData?.tenants || [])
      setApplications(appsData?.applications || [])
      setTenantApplications(tappsData?.tenant_applications || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) fetchAll() }, [token])

  // Aplicaciones habilitadas y activas para el tenant elegido, usadas en el
  // alcance "custom" — mismo patrón que ApplicationAccesses.jsx: nunca se
  // ofrece una tenant_application inactiva ni de otro tenant.
  const availableApplicationsForTenant = tenantApplications
    .filter(ta => ta.is_active && (!form.tenant_id || ta.tenant_id === form.tenant_id))
    .map(ta => applications.find(a => a.id === ta.application_id))
    .filter(Boolean)

  function handleScopeChange(scope) {
    setForm(f => ({ ...emptyForm, scope, name: f.name }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      setSaving(true); setError(null)
      const payload = { name: form.name }
      if (form.scope === 'legacy') {
        payload.tenant_id = form.tenant_id
      } else if (form.scope === 'catalog') {
        payload.application_id = form.application_id
      } else if (form.scope === 'custom') {
        payload.tenant_id = form.tenant_id
        payload.application_id = form.application_id
      }
      await callAction('iam.role.create.in', payload, token)
      setShowForm(false)
      setForm(emptyForm)
      await fetchAll()
    } catch (e) {
      setError(friendlyCreateError(e.message))
    } finally {
      setSaving(false)
    }
  }

  const formComplete = Boolean(
    form.name && (
      (form.scope === 'legacy' && form.tenant_id) ||
      (form.scope === 'catalog' && form.application_id) ||
      (form.scope === 'custom' && form.tenant_id && form.application_id)
    )
  )

  async function handleToggle(role) {
    try {
      setTogglingId(role.id); setError(null)
      await callAction('iam.role.toggle.in', { role_id: role.id }, token)
      await fetchAll()
    } catch (e) {
      setError(friendlyError(e.message))
    } finally {
      setTogglingId(null)
    }
  }

  function confirmToggle(role) {
    if (role.is_active) {
      setConfirm({
        message: `¿Desactivar el rol "${role.name}"? Los usuarios con este rol perderán el acceso al tenant en su siguiente inicio de sesión.`,
        onConfirm: async () => { setConfirm(null); await handleToggle(role) },
      })
    } else {
      handleToggle(role)
    }
  }

  // Agrupa por alcance real: los roles legacy/custom se agrupan por tenant
  // (como antes); los roles de catálogo (sin tenant) se agrupan por
  // aplicación, ya que son compartidos por todos los tenants con esa app.
  const grouped = roles.reduce((acc, r) => {
    let key
    if (!r.tenant_id && r.application_id) {
      key = `Catálogo · ${r.application_name || r.application_slug || r.application_id}`
    } else {
      const t = tenants.find(t => t.id === r.tenant_id)
      key = t?.name || r.tenant_id
    }
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      </AnimatePresence>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-medium/10 border border-gold-medium/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gold-medium" />
          </div>
          <div>
            <h1 className="font-serif text-xl text-white">Roles</h1>
            <p className="text-xs text-gray-500">{roles.length} registrados</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo rol
        </button>
      </motion.div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <h2 className="text-sm font-medium text-gray-300">Nuevo rol</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Alcance del rol</label>
            <div className="grid grid-cols-3 gap-2">
              {SCOPE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" title={opt.hint}
                  onClick={() => handleScopeChange(opt.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    form.scope === opt.value
                      ? 'bg-gold-medium/15 border-gold-medium/40 text-gold-medium'
                      : 'bg-white/[0.02] border-white/10 text-gray-500 hover:text-gray-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] font-mono mt-1.5" style={{ color: '#4b5563' }}>
              {SCOPE_OPTIONS.find(o => o.value === form.scope)?.hint}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(form.scope === 'legacy' || form.scope === 'custom') && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tenant</label>
                <select required value={form.tenant_id}
                  onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value, application_id: '' }))}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50">
                  <option value="">Seleccionar...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {form.scope === 'catalog' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Aplicación</label>
                <select required value={form.application_id}
                  onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50">
                  <option value="">Seleccionar...</option>
                  {applications.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {form.scope === 'custom' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Aplicación habilitada para ese tenant</label>
                <select required value={form.application_id} disabled={!form.tenant_id}
                  onChange={e => setForm(f => ({ ...f, application_id: e.target.value }))}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50 disabled:opacity-50">
                  <option value="">{form.tenant_id ? 'Seleccionar...' : 'Elige un tenant primero'}</option>
                  {availableApplicationsForTenant.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                {form.tenant_id && availableApplicationsForTenant.length === 0 && (
                  <p className="text-[10px] font-mono mt-1" style={{ color: '#f59e0b' }}>
                    Este tenant no tiene ninguna aplicación habilitada todavía.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre del rol</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="terapeuta"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gold-medium/50" />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm) }} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving || !formComplete}
              title={!formComplete ? 'Completa el alcance y el nombre del rol' : undefined}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gold-medium/10 border border-gold-medium/25 text-gold-medium rounded-lg hover:bg-gold-medium/20 transition-colors disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Crear
            </button>
          </div>
        </motion.form>
      )}

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-gold-medium animate-spin" /></div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          {Object.entries(grouped).map(([tenantName, tenantRoles]) => (
            <motion.div key={tenantName} variants={fadeInUp} className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{tenantName}</p>
              </div>
              <div className="flex flex-wrap gap-2 p-5">
                {tenantRoles.map(r => {
                  const isBusy = togglingId === r.id
                  const isAdminRole = ['admin', 'administrador'].includes(r.name?.toLowerCase())
                  const badge = scopeBadge(r)
                  return (
                    <span key={r.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-all ${
                        r.is_active
                          ? 'bg-violet/10 border-violet/20 text-violet-light'
                          : 'bg-white/[0.02] border-white/10 text-gray-600 line-through'
                      }`}>
                      {r.is_active
                        ? <Shield className="w-3.5 h-3.5" />
                        : <ShieldOff className="w-3.5 h-3.5" />
                      }
                      {r.name}
                      <span className={`rank-badge ${badge.cls} no-underline`}>
                        <badge.Icon size={10} />{badge.label}
                      </span>
                      {!r.is_active && (
                        <span className="text-[9px] font-mono uppercase tracking-wider no-underline" style={{ color: '#4b5563' }}>
                          inactivo
                        </span>
                      )}
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" style={{ color: '#D4AF37' }} />
                      ) : isAdminRole ? (
                        <span className="ml-1 text-[9px] font-mono uppercase tracking-wider"
                              title="El rol admin no puede desactivarse"
                              style={{ color: '#D4AF37', opacity: 0.6 }}>
                          protegido
                        </span>
                      ) : (
                        <button onClick={() => confirmToggle(r)}
                          title={r.is_active ? 'Desactivar rol' : 'Reactivar rol'}
                          className="ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors hover:bg-white/10"
                          style={{ color: r.is_active ? '#f87171' : '#4ade80' }}>
                          {r.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
