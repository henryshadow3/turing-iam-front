import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, Loader2, AlertTriangle, Layers, Plus, Pencil, Check, X,
} from 'lucide-react'

/**
 * Paleta sutil por aplicación (solo acento visual para distinguir filas del
 * árbol -- NO reemplaza el dorado #D4AF37 que sigue siendo el color "ancla"
 * de todo lo relacionado a accesos de aplicación, ver franja izquierda de
 * cada fila y el ícono de la sección en UserDetailPanel). No existía un
 * patrón de "color por app" reutilizable en Applications.jsx (W7) -- ahí
 * todas las apps comparten el mismo dorado -- así que se define aquí uno
 * nuevo, mínimo, solo para esta vista de árbol.
 */
const APP_ACCENTS = {
  brilliant:  '#38bdf8', // celeste -- ya usado para "afiliación" en el panel, consistente con Brilliant
  integrarse: '#a78bfa', // violeta -- ya usado como badge-violet en el resto del repo
  finflow:    '#4ade80', // verde -- ya usado como estado "activo" (ToggleOn), asociado a finanzas
}
const DEFAULT_ACCENT = '#D4AF37'

function accentFor(slug) {
  return APP_ACCENTS[slug?.toLowerCase()] || DEFAULT_ACCENT
}

function ToggleControl({ isActive, isBusy, onToggle }) {
  if (isBusy) return <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#D4AF37' }} />
  return (
    <button onClick={onToggle} type="button"
      className="flex items-center gap-1.5 disabled:cursor-not-allowed"
      title={isActive ? 'Desactivar' : 'Activar'}>
      {isActive ? (
        <span className="w-4 h-4 rounded-full" style={{ background: 'rgba(74,222,128,0.16)', border: '1px solid rgba(74,222,128,0.4)' }} />
      ) : (
        <span className="w-4 h-4 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }} />
      )}
    </button>
  )
}

/**
 * UserAccessTree — presentación en árbol colapsable de los accesos de
 * aplicación de un usuario (turing.application_memberships), rediseño
 * aprobado por Henry en W10 sobre la versión lineal de W7b (ver Notion
 * T-SP4-T2-I1-W10). Una fila por aplicación del catálogo (SIEMPRE las 3,
 * incluso sin acceso); al expandir una fila se listan los tenants donde el
 * usuario tiene acceso a esa app, con su rol y las mismas acciones de W7b
 * (toggle, editar rol inline, otorgar acceso). Solo una fila expandida a
 * la vez.
 *
 * Este componente es puramente de PRESENTACIÓN + estado de UI local
 * (qué fila está abierta, qué formulario está abierto). Toda la lógica de
 * fetch/mutación (loadDetail, handleAccessToggle, handleAccessCreate,
 * handleAccessRoleUpdate...) vive en UserDetailPanel.jsx y se recibe aquí
 * vía props -- no se duplica.
 */
export default function UserAccessTree({
  applications,
  accesses,
  affiliatedTenants,
  affiliatedTenantsForApp,
  busyId,
  // Formulario de alta de acceso (ya construido en W7b) -- se reutiliza
  // pero pre-contextualizado a la aplicación de la fila expandida.
  showAccessForm,
  accessForm,
  setAccessForm,
  onOpenAccessForm,
  onCloseAccessForm,
  onSubmitAccessForm,
  savingAccess,
  availableTenantAppsForAccess,
  availableRolesForAccess,
  accessFormComplete,
  onToggleAccess,
  // Edición inline de rol
  editingAccessId,
  editingRoleId,
  setEditingRoleId,
  onStartEditAccess,
  onCancelEditAccess,
  onConfirmEditAccess,
  savingEdit,
  rolesForAccess,
}) {
  const [openApplicationId, setOpenApplicationId] = useState(null)

  // Agrupación inversa a accessesByTenant (W7b): por aplicación, con los
  // tenants anidados dentro. `accesses` ya trae application_id/slug y
  // tenant_id/slug planos (mismo shape que consume UserDetailPanel).
  const accessesByApplication = accesses.reduce((acc, a) => {
    const key = a.application_id || a.application_slug
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  function toggleApplication(appId) {
    setOpenApplicationId(prev => (prev === appId ? null : appId))
    onCloseAccessForm()
  }

  return (
    <div className="space-y-2.5">
      {applications.map(app => {
        const appAccesses = accessesByApplication[app.id] || []
        const isOpen = openApplicationId === app.id
        const accent = accentFor(app.slug)
        const isFormOpenHere = showAccessForm && accessForm._appId === app.id
        // Mejora W11-4: una app sin NINGÚN acceso activo (0 accesos, o todos
        // con is_active=false) debe distinguirse de un vistazo, sin leer el
        // texto "sin acceso" de cada fila -- se atenúa el ícono/acento de esa
        // fila. No toca la lógica de datos, solo el tratamiento visual del
        // contenedor del ícono (mismo criterio que el toggle por fila).
        const hasActiveAccess = appAccesses.some(a => a.is_active)

        return (
          <div key={app.id} className="rounded-xl overflow-hidden"
               style={{ border: `1px solid ${isOpen ? `${accent}44` : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.25s ease' }}>

            {/* ── Fila colapsada: header clicable ── */}
            <button type="button" onClick={() => toggleApplication(app.id)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left"
              style={{ background: isOpen ? `${accent}0d` : 'rgba(255,255,255,0.015)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                   style={{
                     background: `${accent}1a`,
                     border: `1px solid ${accent}40`,
                     opacity: hasActiveAccess ? 1 : 0.45,
                     transition: 'opacity 0.25s ease',
                   }}>
                <Layers className="w-3.5 h-3.5" style={{ color: accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: '#e5e7eb' }}>{app.name}</p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4b5563' }}>{app.slug}</p>
              </div>
              <span className="text-[11px] font-mono shrink-0" style={{ color: appAccesses.length > 0 ? accent : '#374151' }}>
                {appAccesses.length > 0
                  ? `${appAccesses.length} tenant${appAccesses.length !== 1 ? 's' : ''}`
                  : 'sin acceso'}
              </span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="shrink-0 flex items-center">
                <ChevronDown className="w-4 h-4" style={{ color: '#4b5563' }} />
              </motion.span>
            </button>

            {/* ── Fila expandida: árbol de tenants ── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-4 py-3 space-y-2.5" style={{ borderTop: `1px solid ${accent}22` }}>

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-mono" style={{ color: '#4b5563' }}>
                        Tenants con acceso a <strong style={{ color: '#9ca3af' }}>{app.name}</strong>
                      </p>
                      <button type="button"
                        onClick={() => onOpenAccessForm(app)}
                        disabled={affiliatedTenants.length === 0}
                        title={affiliatedTenants.length === 0 ? 'Afilia primero al usuario a un tenant' : undefined}
                        className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ color: accent, border: `1px solid ${accent}4d`, background: `${accent}14` }}>
                        <Plus className="w-3 h-3" />Agregar tenant
                      </button>
                    </div>

                    {/* ── Formulario de alta, contextualizado a esta app ── */}
                    <AnimatePresence>
                      {isFormOpenHere && (
                        <motion.form
                          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          onSubmit={onSubmitAccessForm}
                          className="rounded-lg p-3 space-y-2.5"
                          style={{ background: `${accent}0d`, border: `1px solid ${accent}2e` }}>
                          {affiliatedTenantsForApp.length === 0 ? (
                            <div className="rounded-lg px-3 py-2.5 flex items-center gap-2"
                                 style={{ background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.3)' }}>
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
                              <span className="text-[10px] font-mono" style={{ color: '#c9a24a' }}>
                                Ningún tenant afiliado tiene {app.name} habilitada todavía.
                              </span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[9px] font-mono mb-1 uppercase tracking-wider" style={{ color: '#4b5563' }}>Tenant</label>
                                <select required value={accessForm.tenant_id}
                                  onChange={e => setAccessForm(f => ({ ...f, tenant_id: e.target.value, tenant_application_id: '', role_id: '' }))}
                                  className="w-full rounded-lg px-2.5 py-1.5 text-xs input-dark">
                                  <option value="">Seleccionar…</option>
                                  {affiliatedTenantsForApp.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono mb-1 uppercase tracking-wider" style={{ color: '#4b5563' }}>Rol de aplicación</label>
                                <select required value={accessForm.role_id} disabled={availableRolesForAccess.length === 0}
                                  onChange={e => setAccessForm(f => ({ ...f, role_id: e.target.value }))}
                                  className="w-full rounded-lg px-2.5 py-1.5 text-xs input-dark disabled:opacity-50">
                                  <option value="">
                                    {!accessForm.tenant_id
                                      ? 'Elige un tenant primero'
                                      : availableRolesForAccess.length > 0
                                        ? 'Seleccionar…'
                                        // Bug W11-3: distingue "vacío porque no hay datos"
                                        // (ya se eligió tenant, no hay roles de esa app ahí)
                                        // de un control simplemente mudo/roto.
                                        : 'Sin roles disponibles para esta aplicación en ese tenant'}
                                  </option>
                                  {availableRolesForAccess.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}{r.tenant_id ? ' (custom)' : ' (catálogo)'}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                          {accessForm.tenant_id && availableTenantAppsForAccess.length === 0 && (
                            <p className="text-[9px] font-mono" style={{ color: '#f59e0b' }}>
                              {app.name} no está habilitada para ese tenant.
                            </p>
                          )}
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={onCloseAccessForm}
                              className="px-3 py-1.5 text-xs font-medium" style={{ color: '#4b5563' }}>
                              Cancelar
                            </button>
                            <button type="submit" disabled={savingAccess || !accessFormComplete}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium"
                              style={{ color: accent, border: `1px solid ${accent}59`, background: `${accent}1f` }}>
                              {savingAccess && <Loader2 className="w-3 h-3 animate-spin" />}Otorgar acceso
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* ── Tarjetas de tenant ── */}
                    {appAccesses.length === 0 ? (
                      <div className="rounded-lg px-3.5 py-3 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                        <span className="text-xs font-mono" style={{ color: '#4b5563' }}>Sin tenants habilitados todavía.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {appAccesses.map(a => {
                          const isEditing = editingAccessId === a.id
                          const isBusy = busyId === a.id
                          return (
                            <div key={a.id} className="rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3"
                                 style={{ background: `${accent}0d`, border: `1px solid ${accent}29`, opacity: isBusy ? 0.6 : 1 }}>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate" style={{ color: '#e5e7eb' }}>{a.tenant_name || a.tenant_slug}</p>
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <select value={editingRoleId} autoFocus
                                      onChange={e => setEditingRoleId(e.target.value)}
                                      className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs input-dark">
                                      {rolesForAccess(a).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                      ))}
                                    </select>
                                    <button type="button" onClick={() => onConfirmEditAccess(a)} disabled={savingEdit}
                                      className="w-5 h-5 flex items-center justify-center rounded"
                                      style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)' }} title="Confirmar">
                                      {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    </button>
                                    <button type="button" onClick={onCancelEditAccess}
                                      className="w-5 h-5 flex items-center justify-center rounded"
                                      style={{ color: '#6b7280' }} title="Cancelar">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-[10px] font-mono mt-0.5 flex items-center gap-1.5" style={{ color: '#4b5563' }}>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium"
                                          style={{ background: `${accent}1a`, color: accent, border: `1px solid ${accent}40` }}>
                                      {a.role_name}
                                    </span>
                                    <button type="button" onClick={() => onStartEditAccess(a)}
                                      className="w-4 h-4 flex items-center justify-center rounded transition-colors"
                                      style={{ color: '#4b5563' }}
                                      onMouseEnter={e => e.currentTarget.style.color = accent}
                                      onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}
                                      title="Editar rol">
                                      <Pencil className="w-2.5 h-2.5" />
                                    </button>
                                  </p>
                                )}
                              </div>
                              <ToggleControl isActive={a.is_active} isBusy={isBusy}
                                onToggle={() => onToggleAccess(a.id)} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {applications.length === 0 && (
        <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <span className="text-xs font-mono" style={{ color: '#4b5563' }}>No hay aplicaciones en el catálogo.</span>
        </div>
      )}
    </div>
  )
}
