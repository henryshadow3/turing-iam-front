import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Mail, Loader2, Building2, ShieldCheck, ShieldOff,
  AlertTriangle, KeyRound, Plus, ToggleLeft, ToggleRight,
  PauseCircle, PlayCircle,
} from 'lucide-react'
import { callAction } from '@/api/client'
import { RankedAvatar, getRankByRole } from '@/components/RankIcons'
import UserAccessTree from '@/components/UserAccessTree'

const fadeInUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ERROR_MESSAGES = {
  USER_NOT_AFFILIATED_TO_TENANT: 'Ese usuario no está afiliado al tenant dueño de esta aplicación. Primero crea la afiliación arriba.',
  ROLE_APPLICATION_MISMATCH: 'El rol elegido no pertenece a esta aplicación.',
  ROLE_TENANT_MISMATCH: 'El rol elegido es exclusivo de otro tenant.',
  TENANT_APPLICATION_INACTIVE: 'Esa aplicación está deshabilitada para este tenant.',
  APPLICATION_MEMBERSHIP_ALREADY_EXISTS: 'Ese usuario ya tiene acceso a esta combinación tenant + aplicación.',
  ROLE_INACTIVE: 'Ese rol está desactivado y no puede asignarse.',
  ROLE_NOT_FOUND: 'El rol seleccionado ya no existe.',
  CANNOT_DISABLE_ADMIN_ROLE: 'El rol admin no puede desactivarse: dejaría a la organización sin administradores.',
  MEMBERSHIP_ALREADY_SUSPENDED: 'Este usuario ya tiene una suspensión de membresía vigente.',
  NO_ACTIVE_SUSPENSION: 'Este usuario no tiene ninguna suspensión de membresía vigente que restaurar.',
}

function friendlyError(message) {
  for (const [code, text] of Object.entries(ERROR_MESSAGES)) {
    if (message?.includes(code)) return text
  }
  return message
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

function ToggleControl({ isActive, isBusy, onToggle, activeLabel = 'Activo', inactiveLabel = 'Inactivo' }) {
  if (isBusy) return <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#D4AF37' }} />
  return (
    <button onClick={onToggle} type="button"
      className="flex items-center gap-1.5 disabled:cursor-not-allowed"
      title={isActive ? 'Desactivar' : 'Activar'}>
      {isActive ? (
        <><ToggleRight className="w-5 h-5 toggle-on" /><span className="text-[10px] toggle-on font-mono">{activeLabel}</span></>
      ) : (
        <><ToggleLeft className="w-5 h-5 toggle-off" /><span className="text-[10px] toggle-off font-mono">{inactiveLabel}</span></>
      )}
    </button>
  )
}

/**
 * UserDetailPanel — vista de detalle Y edición de un usuario (requisito de
 * Henry, ampliado en W7b para ser completamente editable desde aquí, y en
 * W10 para presentar los accesos de aplicación como un árbol colapsable
 * por aplicación en vez de tarjetas lineales por tenant -- ver
 * UserAccessTree.jsx y Notion T-SP4-T2-I1-W10).
 *
 * Muestra y permite gestionar, SEPARADOS y sin ambigüedad:
 *   1. Identidad (reutiliza los mismos campos que Users.jsx) — solo lectura.
 *   2. Afiliaciones (turing.user_memberships) — pertenencia organizacional,
 *      NO otorga acceso a ninguna app (ADR 0001 §1 regla 1). Se puede
 *      agregar una nueva afiliación y activar/desactivar las existentes.
 *      Se conserva como sección aparte, con su propio acento celeste
 *      (#38bdf8) -- nunca se mezcla con el árbol de aplicaciones de abajo.
 *   3. Accesos de aplicación (turing.application_memberships) — el acceso
 *      real. Delegado a <UserAccessTree>, que lo presenta como una fila
 *      colapsable por aplicación (SIEMPRE las 3 del catálogo) con los
 *      tenants anidados dentro al expandir. Toda la lógica de fetch/
 *      mutación (toggle, alta, edición de rol) vive aquí y se pasa como
 *      props -- UserAccessTree es solo presentación + estado de qué fila
 *      está abierta.
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

  // Catálogos auxiliares para los formularios embebidos (se cargan una vez).
  const [tenants, setTenants] = useState([])
  const [roles, setRoles] = useState([])
  const [applications, setApplications] = useState([])
  const [tenantApplications, setTenantApplications] = useState([])

  const [busyId, setBusyId] = useState(null)

  const [showMembershipForm, setShowMembershipForm] = useState(false)
  const [membershipForm, setMembershipForm] = useState({ tenant_id: '', role_id: '' })
  const [savingMembership, setSavingMembership] = useState(false)

  // `_appId` fija la aplicación de la fila del árbol que el usuario expandió
  // y desde la que abrió "Agregar tenant" -- el formulario ya NO pide elegir
  // aplicación (W10, ver UserAccessTree): solo tenant + rol. Se resuelve
  // `tenant_application_id` automáticamente combinando `_appId` + tenant_id.
  const [showAccessForm, setShowAccessForm] = useState(false)
  const [accessForm, setAccessForm] = useState({ tenant_id: '', tenant_application_id: '', role_id: '', _appId: null })
  const [savingAccess, setSavingAccess] = useState(false)

  const [editingAccessId, setEditingAccessId] = useState(null)
  const [editingRoleId, setEditingRoleId] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Interruptor global de membresía (W11) — suspende/restaura de un jalón
  // TODAS las afiliaciones y accesos activos del usuario, SIN tocar
  // turing.users.is_active (ese es el mecanismo YA EXISTENTE que impide el
  // login por completo; este es distinto: deja loguear pero sin ninguna
  // afiliación/acceso de negocio activo). Ver membership_suspensions en
  // db-turing y los 3 eventos nuevos en iam-worker.
  const [suspensionLoading, setSuspensionLoading] = useState(true)
  const [membershipSuspended, setMembershipSuspended] = useState(false)
  const [suspensionBusy, setSuspensionBusy] = useState(false)

  async function loadDetail() {
    const [mData, aData] = await Promise.all([
      callAction('iam.membership.list.in', { user_id: user.id }, token),
      callAction('iam.application_membership.list.in', { user_id: user.id }, token),
    ])
    setMemberships(mData?.memberships || [])
    setAccesses(aData?.application_memberships || [])
  }

  async function loadSuspensionStatus() {
    const sData = await callAction('iam.user.membership_suspension_status.in', { user_id: user.id }, token)
    setMembershipSuspended(Boolean(sData?.suspended))
  }

  async function loadCatalogs() {
    const [tData, rData, appData, taData] = await Promise.all([
      callAction('iam.tenant.list.in', {}, token),
      callAction('iam.role.list.in', {}, token),
      callAction('iam.application.list.in', {}, token),
      callAction('iam.tenant_application.list.in', {}, token),
    ])
    setTenants(tData?.tenants || [])
    setRoles(rData?.roles || [])
    setApplications(appData?.applications || [])
    setTenantApplications(taData?.tenant_applications || [])
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true); setSuspensionLoading(true); setError(null)
        await Promise.all([loadDetail(), loadCatalogs()])
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
      // Independiente del resto: si este evento nuevo falla (p.ej. gateway
      // sin desplegar aún), no debe tumbar la carga del resto del panel.
      try {
        await loadSuspensionStatus()
      } catch (e) {
        if (!cancelled) setError(prev => prev || friendlyError(e.message))
      } finally {
        if (!cancelled) setSuspensionLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, token])

  async function refresh() {
    try {
      await loadDetail()
    } catch (e) {
      setError(e.message)
    }
  }

  const rank = getRankByRole(user.role, 0)

  // ── Afiliaciones: toggle ──
  async function handleMembershipToggle(membershipId) {
    try {
      setBusyId(membershipId); setError(null)
      await callAction('iam.membership.toggle.in', { membership_id: membershipId }, token)
      await refresh()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setBusyId(null) }
  }

  // ── Afiliaciones: crear ──
  const membershipRoleOptions = roles.filter(r =>
    r.tenant_id === membershipForm.tenant_id && r.is_active
  )
  const membershipFormComplete = Boolean(membershipForm.tenant_id && membershipForm.role_id)

  async function handleMembershipCreate(e) {
    e.preventDefault()
    if (!membershipFormComplete) return
    try {
      setSavingMembership(true); setError(null)
      await callAction('iam.membership.create.in', {
        user_id: user.id,
        tenant_id: membershipForm.tenant_id,
        role_id: membershipForm.role_id,
      }, token)
      setShowMembershipForm(false)
      setMembershipForm({ tenant_id: '', role_id: '' })
      await refresh()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setSavingMembership(false) }
  }

  // Tenants a los que el usuario está afiliado pero aún no tiene membresía
  // creada más de una vez -- no hay restricción de "una sola membresía"
  // explícita aquí, pero sí tiene sentido excluir tenants ya afiliados para
  // no ofrecer una afiliación duplicada por accidente.
  const affiliatedTenantIds = new Set(memberships.map(m => m.tenant_id))
  const tenantsForNewMembership = tenants.filter(t => !affiliatedTenantIds.has(t.id))

  // ── Accesos de aplicación: toggle ──
  async function handleAccessToggle(accessId) {
    try {
      setBusyId(accessId); setError(null)
      await callAction('iam.application_membership.toggle.in', { application_membership_id: accessId }, token)
      await refresh()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setBusyId(null) }
  }

  // ── Accesos de aplicación: crear ──
  // Regla dura: solo se pueden elegir tenants a los que el usuario YA esté
  // afiliado (usa las afiliaciones ya cargadas en el propio panel, no todos
  // los tenants del sistema).
  const affiliatedTenants = tenants.filter(t => affiliatedTenantIds.has(t.id))

  // La aplicación queda fija (`_appId`, la fila del árbol que se expandió) —
  // el formulario solo pide tenant + rol (W10). Se filtra tenantApplications
  // por esa app fija Y por el tenant elegido, para resolver automáticamente
  // el `tenant_application_id` sin pedírselo al usuario.
  const availableTenantAppsForAccess = tenantApplications.filter(ta =>
    ta.is_active &&
    (!accessForm._appId || ta.application_id === accessForm._appId) &&
    (!accessForm.tenant_id || ta.tenant_id === accessForm.tenant_id)
  )

  // Bug W11-1: el selector de "Tenant" del formulario de alta debe ofrecer
  // SOLO tenants afiliados que además tengan la aplicación de la fila
  // expandida habilitada ahí (fila activa en tenant_applications) -- antes
  // ofrecía TODOS los tenants afiliados sin importar la app, lo que dejaba
  // elegir p.ej. "Brilliant Therapy" desde la fila de FinFlow y solo
  // fallaba después con TENANT_APPLICATION_INACTIVE/no habilitada. Se
  // calcula independiente del tenant ya elegido en el form (a diferencia de
  // `availableTenantAppsForAccess` de arriba, que sí depende de
  // accessForm.tenant_id) para poder poblar el <select> completo.
  const tenantAppsForCurrentApp = tenantApplications.filter(ta =>
    ta.is_active && (!accessForm._appId || ta.application_id === accessForm._appId)
  )
  const tenantIdsWithCurrentAppEnabled = new Set(tenantAppsForCurrentApp.map(ta => ta.tenant_id))
  const affiliatedTenantsForCurrentApp = affiliatedTenants.filter(t =>
    tenantIdsWithCurrentAppEnabled.has(t.id)
  )
  const resolvedTenantApplicationId = accessForm.tenant_id && accessForm._appId
    ? availableTenantAppsForAccess.find(ta => ta.tenant_id === accessForm.tenant_id)?.id || ''
    : ''
  const selectedTenantAppForAccess = tenantApplications.find(ta => ta.id === resolvedTenantApplicationId)
  const availableRolesForAccess = roles.filter(r => {
    if (!selectedTenantAppForAccess) return false
    if (r.application_id !== selectedTenantAppForAccess.application_id) return false
    if (r.tenant_id && r.tenant_id !== selectedTenantAppForAccess.tenant_id) return false
    return r.is_active
  })
  const accessFormComplete = Boolean(accessForm.tenant_id && resolvedTenantApplicationId && accessForm.role_id)

  // Abre el formulario de alta ya contextualizado a la aplicación de la fila
  // que el usuario expandió en el árbol -- no hace falta volver a elegirla.
  function openAccessFormForApp(app) {
    setAccessForm({ tenant_id: '', tenant_application_id: '', role_id: '', _appId: app.id })
    setShowAccessForm(true)
    setError(null)
  }
  function closeAccessForm() {
    setShowAccessForm(false)
    setAccessForm({ tenant_id: '', tenant_application_id: '', role_id: '', _appId: null })
  }

  async function handleAccessCreate(e) {
    e.preventDefault()
    if (!accessFormComplete) return
    try {
      setSavingAccess(true); setError(null)
      await callAction('iam.application_membership.create.in', {
        user_id: user.id,
        tenant_application_id: resolvedTenantApplicationId,
        role_id: accessForm.role_id,
      }, token)
      closeAccessForm()
      await refresh()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setSavingAccess(false) }
  }

  // ── Accesos de aplicación: editar rol inline ──
  function startEditAccess(access) {
    setEditingAccessId(access.id)
    setEditingRoleId(access.role_id)
    setError(null)
  }
  function cancelEditAccess() {
    setEditingAccessId(null)
    setEditingRoleId('')
  }
  function rolesForAccess(access) {
    // El nuevo rol debe seguir perteneciendo a la misma aplicación que la
    // tenant_application del acceso (ROLE_APPLICATION_MISMATCH en backend).
    return roles.filter(r => {
      if (r.application_id !== access.application_id) return false
      if (r.tenant_id && r.tenant_id !== access.tenant_id) return false
      return r.is_active || r.id === access.role_id
    })
  }
  async function handleAccessRoleUpdate(access) {
    if (!editingRoleId || editingRoleId === access.role_id) { cancelEditAccess(); return }
    try {
      setSavingEdit(true); setError(null)
      await callAction('iam.application_membership.update.in', {
        application_membership_id: access.id,
        role_id: editingRoleId,
      }, token)
      cancelEditAccess()
      await refresh()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setSavingEdit(false) }
  }

  // ── Interruptor global de membresía ──
  async function handleSuspendMembership() {
    try {
      setSuspensionBusy(true); setError(null)
      await callAction('iam.user.suspend_membership.in', { user_id: user.id }, token)
      setMembershipSuspended(true)
      // Refleja de inmediato en las secciones de arriba que todo quedó
      // inactivo (afiliaciones + accesos), sin esperar a que el usuario
      // cierre y reabra el panel.
      await refresh()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setSuspensionBusy(false) }
  }
  async function handleRestoreMembership() {
    try {
      setSuspensionBusy(true); setError(null)
      await callAction('iam.user.restore_membership.in', { user_id: user.id }, token)
      setMembershipSuspended(false)
      // Restaura EXACTAMENTE el snapshot previo -- puede dejar algunas filas
      // inactivas si ya lo estaban antes del apagón global (comportamiento
      // esperado, ver membership_suspensions).
      await refresh()
    } catch (e) { setError(friendlyError(e.message)) }
    finally { setSuspensionBusy(false) }
  }

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
              {membershipSuspended && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                  <PauseCircle className="w-3 h-3" />Membresía suspendida
                </span>
              )}
              {suspensionLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#4b5563' }} />
              ) : (
                <button type="button" onClick={membershipSuspended ? handleRestoreMembership : handleSuspendMembership}
                  disabled={suspensionBusy}
                  title={membershipSuspended
                    ? 'Reactiva exactamente las afiliaciones y accesos que estaban activos antes del apagón global'
                    : 'Desactiva TODAS las afiliaciones y accesos activos de este usuario (no impide el login)'}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={membershipSuspended
                    ? { color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.08)' }
                    : { color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
                  {suspensionBusy
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : membershipSuspended ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                  {membershipSuspended ? 'Restaurar membresía' : 'Suspender membresía'}
                </button>
              )}
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
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: '#38bdf8' }} />
                    <h3 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Afiliaciones</h3>
                    <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                      ({memberships.length})
                    </span>
                  </div>
                  <button type="button" onClick={() => setShowMembershipForm(v => !v)}
                    className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg transition-colors"
                    style={{ color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.06)' }}>
                    <Plus className="w-3 h-3" />Afiliar a tenant
                  </button>
                </div>
                <p className="text-[11px] font-mono mb-3" style={{ color: '#4b5563' }}>
                  Pertenencia organizacional a un tenant. <strong style={{ color: '#6b7280' }}>No otorga
                  acceso a ninguna aplicación por sí sola.</strong>
                </p>

                <AnimatePresence>
                  {showMembershipForm && (
                    <motion.form
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      onSubmit={handleMembershipCreate}
                      className="rounded-xl p-4 mb-3 space-y-3"
                      style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.18)' }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono mb-1 uppercase tracking-wider" style={{ color: '#4b5563' }}>Tenant</label>
                          <select required value={membershipForm.tenant_id}
                            onChange={e => setMembershipForm({ tenant_id: e.target.value, role_id: '' })}
                            className="w-full rounded-lg px-2.5 py-1.5 text-xs input-dark">
                            <option value="">Seleccionar…</option>
                            {tenantsForNewMembership.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono mb-1 uppercase tracking-wider" style={{ color: '#4b5563' }}>Rol organizacional</label>
                          <select required value={membershipForm.role_id} disabled={!membershipForm.tenant_id}
                            onChange={e => setMembershipForm(f => ({ ...f, role_id: e.target.value }))}
                            className="w-full rounded-lg px-2.5 py-1.5 text-xs input-dark disabled:opacity-50">
                            <option value="">
                              {!membershipForm.tenant_id
                                ? 'Elige un tenant primero'
                                : membershipRoleOptions.length > 0
                                  ? 'Seleccionar…'
                                  // Bug W11-3: mismo criterio que el select de rol de
                                  // acceso en UserAccessTree -- distingue "sin roles
                                  // organizacionales para este tenant" de un control mudo.
                                  : 'Sin roles organizacionales disponibles para este tenant'}
                            </option>
                            {membershipRoleOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setShowMembershipForm(false)}
                          className="px-3 py-1.5 text-xs font-medium" style={{ color: '#4b5563' }}>
                          Cancelar
                        </button>
                        <button type="submit" disabled={savingMembership || !membershipFormComplete}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium"
                          style={{ color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.1)' }}>
                          {savingMembership && <Loader2 className="w-3 h-3 animate-spin" />}Afiliar
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {memberships.length === 0 ? (
                  <div className="rounded-xl px-4 py-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <span className="text-xs font-mono" style={{ color: '#4b5563' }}>Sin afiliaciones a ningún tenant.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {memberships.map(m => (
                      <div key={m.id} className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                           style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.16)', opacity: busyId === m.id ? 0.6 : 1 }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#38bdf8' }} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#e5e7eb' }}>{m.tenant_name}</p>
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#4b5563' }}>
                              Rol organizacional: <span style={{ color: '#9ca3af' }}>{m.role_name}</span>
                            </p>
                          </div>
                        </div>
                        <ToggleControl isActive={m.is_active} isBusy={busyId === m.id}
                          onToggle={() => handleMembershipToggle(m.id)}
                          activeLabel="Afiliado" inactiveLabel="Baja" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>

              <div className="divider-silver opacity-25" />

              {/* ── Bloque 2: Accesos de aplicación, árbol colapsable por app (W10) ── */}
              <motion.section variants={fadeInUp}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" style={{ color: '#D4AF37' }} />
                    <h3 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>Accesos de aplicación</h3>
                    <span className="text-[10px] font-mono" style={{ color: '#374151' }}>
                      ({accesses.length})
                    </span>
                  </div>
                </div>
                <p className="text-[11px] font-mono mb-3" style={{ color: '#4b5563' }}>
                  Acceso real a una combinación tenant + aplicación, con su propio rol.
                  <strong style={{ color: '#6b7280' }}> Es lo único que autoriza entrar a una app</strong> —
                  distinto de la afiliación de arriba. Expande una aplicación para ver sus tenants.
                </p>

                {affiliatedTenants.length === 0 && (
                  <div className="rounded-xl px-4 py-3 mb-3 flex items-center gap-2"
                       style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
                    <span className="text-xs font-mono" style={{ color: '#4b5563' }}>
                      Sin tenants afiliados — afilia primero para poder otorgar accesos.
                    </span>
                  </div>
                )}

                <UserAccessTree
                  applications={applications}
                  accesses={accesses}
                  affiliatedTenants={affiliatedTenants}
                  affiliatedTenantsForApp={affiliatedTenantsForCurrentApp}
                  busyId={busyId}
                  showAccessForm={showAccessForm}
                  accessForm={accessForm}
                  setAccessForm={setAccessForm}
                  onOpenAccessForm={openAccessFormForApp}
                  onCloseAccessForm={closeAccessForm}
                  onSubmitAccessForm={handleAccessCreate}
                  savingAccess={savingAccess}
                  availableTenantAppsForAccess={availableTenantAppsForAccess}
                  availableRolesForAccess={availableRolesForAccess}
                  accessFormComplete={accessFormComplete}
                  onToggleAccess={handleAccessToggle}
                  editingAccessId={editingAccessId}
                  editingRoleId={editingRoleId}
                  setEditingRoleId={setEditingRoleId}
                  onStartEditAccess={startEditAccess}
                  onCancelEditAccess={cancelEditAccess}
                  onConfirmEditAccess={handleAccessRoleUpdate}
                  savingEdit={savingEdit}
                  rolesForAccess={rolesForAccess}
                />
              </motion.section>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-8 right-8 divider-gold opacity-25" />
      </motion.div>
    </div>
  )
}
