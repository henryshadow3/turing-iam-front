import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Plus, Loader2, ToggleLeft, ToggleRight, AlertTriangle, X,
  Building2, Globe, Star, Pencil, Check,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { callAction } from '@/api/client'

const fadeInUp = {
  hidden:   { opacity: 0, y: 14 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { staggerChildren: 0.05 } },
}

// Validación de UX de formulario para host -- NO es la autorización real
// (eso ya está resuelto server-side en turing-api/W6). Solo evita que un
// admin meta basura obvia en el campo host.
const HOST_PATTERN = /^(localhost|(\d{1,3}\.){3}\d{1,3}|[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+)(:\d{1,5})?$/i

function isValidHost(host) {
  return HOST_PATTERN.test((host || '').trim())
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="text-sm rounded-xl px-4 py-3 flex items-center gap-2 error-banner">
      <AlertTriangle className="w-4 h-4 shrink-0" />{message}
    </motion.p>
  )
}

/**
 * Applications — administración de:
 *   1. Applications (catálogo global, solo list/toggle -- los IDs son
 *      UUIDv5 sembrados por migración, ver ADR 0001 §6, no hay "create"
 *      a propósito).
 *   2. TenantApplications (habilitar una app para un tenant: list/create/
 *      toggle).
 *   3. TenantApplicationRoutes (rutas/landings por tenant-aplicación:
 *      list/create/update/toggle), con validación de formato de host --
 *      solo UX, la autorización real de redirect ya la resuelve turing-api.
 *
 * Solo visible/operable para platform_role admin/superadmin (RouteGuard ya
 * exige superadmin para /admin/*, así que cualquiera que llegue aquí ya
 * pasó ese guard; los botones de escritura además dependen de que el
 * backend exija superadmin en los eventos write, doble candado).
 */
export default function ApplicationsPage() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [tenants, setTenants] = useState([])
  const [tenantApplications, setTenantApplications] = useState([])
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const [showEnableForm, setShowEnableForm] = useState(false)
  const [enableForm, setEnableForm] = useState({ tenant_id: '', application_id: '' })
  const [savingEnable, setSavingEnable] = useState(false)

  const [routeFormFor, setRouteFormFor] = useState(null) // tenant_application_id o null
  const [routeForm, setRouteForm] = useState({ host: '', path_prefix: '/', is_default: false })
  const [savingRoute, setSavingRoute] = useState(false)
  const [editingRouteId, setEditingRouteId] = useState(null)

  async function fetchAll() {
    try {
      setLoading(true)
      const [appData, tData, taData, rData] = await Promise.all([
        callAction('iam.application.list.in', {}, token),
        callAction('iam.tenant.list.in', {}, token),
        callAction('iam.tenant_application.list.in', {}, token),
        callAction('iam.tenant_application_route.list.in', {}, token),
      ])
      setApplications(appData?.applications || [])
      setTenants(tData?.tenants || [])
      setTenantApplications(taData?.tenant_applications || [])
      setRoutes(rData?.tenant_application_routes || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) fetchAll() }, [token])

  async function handleToggleApplication(app) {
    try {
      setTogglingId(app.id); setError(null)
      await callAction('iam.application.toggle.in', { application_id: app.id }, token)
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setTogglingId(null) }
  }

  async function handleToggleTenantApp(ta) {
    try {
      setTogglingId(ta.id); setError(null)
      await callAction('iam.tenant_application.toggle.in', { tenant_application_id: ta.id }, token)
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setTogglingId(null) }
  }

  async function handleEnableApp(e) {
    e.preventDefault()
    if (!enableForm.tenant_id || !enableForm.application_id) return
    try {
      setSavingEnable(true); setError(null)
      await callAction('iam.tenant_application.create.in', enableForm, token)
      setShowEnableForm(false)
      setEnableForm({ tenant_id: '', application_id: '' })
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setSavingEnable(false) }
  }

  function openRouteForm(tenantApplicationId, existing = null) {
    setRouteFormFor(tenantApplicationId)
    setEditingRouteId(existing?.id || null)
    setRouteForm(existing
      ? { host: existing.host, path_prefix: existing.path_prefix, is_default: existing.is_default }
      : { host: '', path_prefix: '/', is_default: false })
  }

  async function handleSaveRoute(e) {
    e.preventDefault()
    if (!isValidHost(routeForm.host)) {
      setError('El host no tiene un formato válido (ej. "app.ejemplo.com" o "localhost:3000").')
      return
    }
    try {
      setSavingRoute(true); setError(null)
      if (editingRouteId) {
        await callAction('iam.tenant_application_route.update.in', {
          route_id: editingRouteId,
          host: routeForm.host.trim(),
          path_prefix: routeForm.path_prefix.trim() || '/',
          is_default: routeForm.is_default,
        }, token)
      } else {
        await callAction('iam.tenant_application_route.create.in', {
          tenant_application_id: routeFormFor,
          host: routeForm.host.trim(),
          path_prefix: routeForm.path_prefix.trim() || '/',
          is_default: routeForm.is_default,
        }, token)
      }
      setRouteFormFor(null)
      setEditingRouteId(null)
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setSavingRoute(false) }
  }

  async function handleToggleRoute(route) {
    try {
      setTogglingId(route.id); setError(null)
      await callAction('iam.tenant_application_route.toggle.in', { route_id: route.id }, token)
      await fetchAll()
    } catch (e) { setError(e.message) }
    finally { setTogglingId(null) }
  }

  // Tenants que aún no tienen la app elegida habilitada (evita duplicados
  // obvios en el formulario, aunque el backend ya rechaza
  // TENANT_APPLICATION_ALREADY_EXISTS de todas formas).
  const availableTenantsForApp = tenants.filter(t =>
    !tenantApplications.some(ta => ta.tenant_id === t.id && ta.application_id === enableForm.application_id)
  )

  return (
    <div className="space-y-9">
      {/* ── Header ── */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}
        className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center avatar-gold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl shimmer-gold-text tracking-wide">Aplicaciones</h1>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: '#374151' }}>
              Catálogo, habilitamiento por tenant y rutas
            </p>
          </div>
        </div>
      </motion.div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} /></div>
      ) : (
        <>
          {/* ══════════ Sección 1: Catálogo de aplicaciones ══════════ */}
          <motion.section initial="hidden" animate="visible" variants={fadeInUp} className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Catálogo de aplicaciones</h2>
              <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                ({applications.length}) — sembrado por migración, IDs deterministas
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {applications.map(app => {
                const isBusy = togglingId === app.id
                return (
                  <div key={app.id} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4"
                       style={{ border: '1px solid rgba(212,175,55,0.1)', minWidth: '220px' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                         style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <Layers className="w-4 h-4" style={{ color: '#D4AF37' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#e5e7eb' }}>{app.name}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4b5563' }}>{app.slug}</p>
                    </div>
                    {isBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#D4AF37' }} />
                    ) : (
                      <button onClick={() => handleToggleApplication(app)}
                        title={app.is_active ? 'Desactivar aplicación' : 'Reactivar aplicación'}>
                        {app.is_active
                          ? <ToggleRight className="w-5 h-5 toggle-on" />
                          : <ToggleLeft className="w-5 h-5 toggle-off" />}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.section>

          <div className="divider-gold opacity-20" />

          {/* ══════════ Sección 2: Habilitamiento por tenant ══════════ */}
          <motion.section initial="hidden" animate="visible" variants={fadeInUp} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: '#38bdf8' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Aplicaciones por tenant</h2>
                <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                  ({tenantApplications.length})
                </span>
              </div>
              <button onClick={() => setShowEnableForm(!showEnableForm)}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg btn-gold font-medium">
                <Plus className="w-3.5 h-3.5" />
                Habilitar aplicación
              </button>
            </div>

            <AnimatePresence>
              {showEnableForm && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleEnableApp}
                  className="glass-card rounded-xl p-5 space-y-4"
                  style={{ border: '1px solid rgba(212,175,55,0.16)' }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                        Aplicación
                      </label>
                      <select required value={enableForm.application_id}
                        onChange={e => setEnableForm(f => ({ ...f, application_id: e.target.value, tenant_id: '' }))}
                        className="w-full rounded-lg px-3 py-2 text-sm input-dark">
                        <option value="">Seleccionar…</option>
                        {applications.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono mb-1.5 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                        Tenant
                      </label>
                      <select required value={enableForm.tenant_id} disabled={!enableForm.application_id}
                        onChange={e => setEnableForm(f => ({ ...f, tenant_id: e.target.value }))}
                        className="w-full rounded-lg px-3 py-2 text-sm input-dark">
                        <option value="">{enableForm.application_id ? 'Seleccionar…' : 'Elige una aplicación primero'}</option>
                        {availableTenantsForApp.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowEnableForm(false)}
                      className="px-4 py-2 text-sm font-medium rounded-lg" style={{ color: '#4b5563' }}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={savingEnable || !enableForm.tenant_id || !enableForm.application_id}
                      className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg btn-gold font-medium">
                      {savingEnable && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Habilitar
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {tenantApplications.length === 0 ? (
              <div className="glass-card rounded-2xl py-14 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: '#2a2a2a' }} />
                <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Ninguna aplicación habilitada todavía</p>
              </div>
            ) : (
              <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-3">
                {tenantApplications.map(ta => {
                  const app = applications.find(a => a.id === ta.application_id)
                  const tenant = tenants.find(t => t.id === ta.tenant_id)
                  const tenantAppRoutes = routes.filter(r => r.tenant_application_id === ta.id)
                  const isBusy = togglingId === ta.id
                  const isRouteFormOpen = routeFormFor === ta.id

                  return (
                    <motion.div key={ta.id} variants={fadeInUp} className="glass-card rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                      <div className="px-5 py-3.5 flex items-center justify-between gap-3"
                           style={{ background: 'rgba(255,255,255,0.015)' }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                               style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                            <Layers className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#e5e7eb' }}>
                              {app?.name || ta.application_slug} <span style={{ color: '#4b5563' }}>en</span> {tenant?.name || ta.tenant_slug}
                            </p>
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4b5563' }}>
                              {tenantAppRoutes.length} ruta{tenantAppRoutes.length !== 1 ? 's' : ''} configurada{tenantAppRoutes.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button onClick={() => openRouteForm(ta.id)}
                            className="text-[10px] font-mono px-2.5 py-1 rounded-lg transition-colors"
                            style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
                            + Ruta
                          </button>
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#D4AF37' }} />
                          ) : (
                            <button onClick={() => handleToggleTenantApp(ta)}
                              title={ta.is_active ? 'Deshabilitar para este tenant' : 'Rehabilitar'}>
                              {ta.is_active
                                ? <ToggleRight className="w-5 h-5 toggle-on" />
                                : <ToggleLeft className="w-5 h-5 toggle-off" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Rutas de esta tenant-aplicación */}
                      {tenantAppRoutes.length > 0 && (
                        <div className="px-5 py-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          {tenantAppRoutes.map(r => (
                            <div key={r.id} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Globe className="w-3 h-3 shrink-0" style={{ color: '#4b5563' }} />
                                <span className="font-mono truncate" style={{ color: r.is_active ? '#9ca3af' : '#4b5563' }}>
                                  {r.host}{r.path_prefix}
                                </span>
                                {r.is_default && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                                        style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}>
                                    default
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => openRouteForm(ta.id, r)} title="Editar ruta"
                                  className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                                  style={{ color: '#4b5563' }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
                                  onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                                  <Pencil className="w-3 h-3" />
                                </button>
                                {togglingId === r.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#D4AF37' }} />
                                ) : (
                                  <button onClick={() => handleToggleRoute(r)} title={r.is_active ? 'Desactivar ruta' : 'Reactivar ruta'}>
                                    {r.is_active
                                      ? <ToggleRight className="w-4 h-4 toggle-on" />
                                      : <ToggleLeft className="w-4 h-4 toggle-off" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulario de ruta (crear o editar) */}
                      <AnimatePresence>
                        {isRouteFormOpen && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSaveRoute}
                            className="px-5 py-4 space-y-3"
                            style={{ borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(212,175,55,0.02)' }}>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-mono mb-1 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                                  Host
                                </label>
                                <input required value={routeForm.host}
                                  onChange={e => setRouteForm(f => ({ ...f, host: e.target.value }))}
                                  placeholder="app.ejemplo.com"
                                  className="w-full rounded-lg px-3 py-1.5 text-xs input-dark" />
                                {routeForm.host && !isValidHost(routeForm.host) && (
                                  <p className="text-[9px] font-mono mt-1" style={{ color: '#f87171' }}>
                                    Formato de host inválido.
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono mb-1 tracking-widest uppercase" style={{ color: '#4b5563' }}>
                                  Path prefix
                                </label>
                                <input value={routeForm.path_prefix}
                                  onChange={e => setRouteForm(f => ({ ...f, path_prefix: e.target.value }))}
                                  placeholder="/"
                                  className="w-full rounded-lg px-3 py-1.5 text-xs input-dark" />
                              </div>
                            </div>
                            <label className="flex items-center gap-2 text-[10px] font-mono" style={{ color: '#9ca3af' }}>
                              <input type="checkbox" checked={routeForm.is_default}
                                onChange={e => setRouteForm(f => ({ ...f, is_default: e.target.checked }))} />
                              Ruta por defecto (reemplaza la default anterior de esta tenant-aplicación)
                            </label>
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => { setRouteFormFor(null); setEditingRouteId(null) }}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg" style={{ color: '#4b5563' }}>
                                Cancelar
                              </button>
                              <button type="submit" disabled={savingRoute || !isValidHost(routeForm.host)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg btn-gold font-medium">
                                {savingRoute
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <Check className="w-3 h-3" />}
                                {editingRouteId ? 'Guardar ruta' : 'Crear ruta'}
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </motion.section>
        </>
      )}
    </div>
  )
}
