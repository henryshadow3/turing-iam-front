// Datos mockeados para el harness de verificación visual de W10
// (UserAccessTree). Shape calcado del backend real:
//   - application.list.in            -> ApplicationPostgresRepository
//   - application_membership.list.in -> ApplicationMembershipPostgresRepository._enrich
//   - membership.list.in             -> UserMembershipPostgresRepository
// (ver turing-iam-worker/src/infrastructure/repositories/*)
// Solo para verificación local, no se importa desde App.jsx / producción.

export const APPLICATIONS = [
  { id: 'app-brilliant',  slug: 'brilliant',  name: 'Brilliant Therapy', is_active: true },
  { id: 'app-integrarse', slug: 'integrarse', name: 'Integrarse',        is_active: true },
  { id: 'app-finflow',    slug: 'finflow',    name: 'FinFlow',           is_active: true },
]

export const TENANTS = [
  { id: 'tenant-bt',  slug: 'brilliant-therapy', name: 'Brilliant Therapy' },
  { id: 'tenant-int', slug: 'integrarse',        name: 'Integrarse' },
  { id: 'tenant-ff',  slug: 'finflow',           name: 'FinFlow' },
  { id: 'tenant-nx',  slug: 'nexus-clinic',      name: 'Nexus Clinic' }, // 2do tenant con acceso a "brilliant" (caso multi-tenant en una app)
]

export const ROLES = [
  { id: 'role-bt-terapeuta', tenant_id: 'tenant-bt',  application_id: 'app-brilliant',  name: 'terapeuta', is_active: true },
  { id: 'role-bt-admin',     tenant_id: 'tenant-bt',  application_id: 'app-brilliant',  name: 'admin',     is_active: true },
  { id: 'role-nx-terapeuta', tenant_id: 'tenant-nx',  application_id: 'app-brilliant',  name: 'terapeuta', is_active: true },
  { id: 'role-int-alumno',   tenant_id: 'tenant-int', application_id: 'app-integrarse', name: 'alumno',    is_active: true },
  { id: 'role-int-mentor',   tenant_id: 'tenant-int', application_id: 'app-integrarse', name: 'mentor',    is_active: true },
  { id: 'role-ff-analista',  tenant_id: 'tenant-ff',  application_id: 'app-finflow',    name: 'analista',  is_active: true },
]

export const TENANT_APPLICATIONS = [
  { id: 'ta-bt-brilliant',  tenant_id: 'tenant-bt',  application_id: 'app-brilliant',  is_active: true },
  { id: 'ta-nx-brilliant',  tenant_id: 'tenant-nx',  application_id: 'app-brilliant',  is_active: true },
  { id: 'ta-int-integrarse', tenant_id: 'tenant-int', application_id: 'app-integrarse', is_active: true },
  { id: 'ta-ff-finflow',    tenant_id: 'tenant-ff',  application_id: 'app-finflow',    is_active: true },
]

/** Caso A: usuario con 0 accesos de aplicación (pero afiliado a 1 tenant) */
export const USER_ZERO_APPS = {
  id: 'user-zero',
  full_name: 'Ana Cero (0 apps)',
  email: 'ana.cero@example.com',
  role: 'user',
  is_active: true,
}
export const MEMBERSHIPS_ZERO = [
  { id: 'm-1', user_id: 'user-zero', tenant_id: 'tenant-bt', tenant_name: 'Brilliant Therapy', role_id: 'role-bt-terapeuta', role_name: 'terapeuta', is_active: true },
]
export const ACCESSES_ZERO = []

/** Caso W11.1: usuario sin NINGUNA afiliación ni acceso (0 y 0) — el que
 * expuso el bug real de "Suspender membresía" quedando en estado sin
 * sentido para un usuario totalmente vacío. */
export const USER_EMPTY = {
  id: 'user-empty',
  full_name: 'SP2 Fixture Admin (vacío)',
  email: 'sp2-fixture-admin@brilliant.local',
  role: 'admin',
  is_active: true,
}
export const MEMBERSHIPS_EMPTY = []
export const ACCESSES_EMPTY = []

/** Caso B: usuario con exactamente 1 acceso (1 app, 1 tenant) */
export const USER_ONE_APP = {
  id: 'user-one',
  full_name: 'Beto Uno (1 app)',
  email: 'beto.uno@example.com',
  role: 'user',
  is_active: true,
}
export const MEMBERSHIPS_ONE = [
  { id: 'm-2', user_id: 'user-one', tenant_id: 'tenant-bt', tenant_name: 'Brilliant Therapy', role_id: 'role-bt-terapeuta', role_name: 'terapeuta', is_active: true },
]
export const ACCESSES_ONE = [
  {
    id: 'am-1', user_id: 'user-one', tenant_application_id: 'ta-bt-brilliant',
    tenant_id: 'tenant-bt', tenant_slug: 'brilliant-therapy', tenant_name: 'Brilliant Therapy',
    application_id: 'app-brilliant', application_slug: 'brilliant',
    role_id: 'role-bt-terapeuta', role_name: 'terapeuta', is_active: true,
  },
]

// ── Usuarios + escenarios para las tabs de aplicación de Users.jsx (W12) ──
// Shape calcado de iam.user.list.in con application_id: cada usuario trae
// app_access_status ("access" | "affiliated_no_access") cuando se filtra
// por aplicación -- ver UserPostgresRepository.list_all en turing-iam-worker.
// IMPORTANTE: esa respuesta NO trae si el acceso está activo/inactivo (solo
// si existe alguno) -- el estado real del toggle se deriva cruzando
// application_memberships (igual que hace el componente real), no viene
// precalculado del backend. Ver APP_MEMBERSHIPS_W12 abajo.
export const USERS_BY_APP = {
  'app-brilliant': [
    { id: 'user-w12-1', full_name: 'Diana Acceso',       email: 'diana.acceso@example.com',     role: 'user', is_active: true, app_access_status: 'access' },
    { id: 'user-w12-2', full_name: 'Eduardo Suspendido', email: 'eduardo.susp@example.com',     role: 'user', is_active: true, app_access_status: 'access' },
    { id: 'user-w12-3', full_name: 'Fabiola Afiliada',   email: 'fabiola.afiliada@example.com', role: 'user', is_active: true, app_access_status: 'affiliated_no_access' },
  ],
  'app-integrarse': [
    { id: 'user-w12-4', full_name: 'Gerardo Integra', email: 'gerardo.integra@example.com', role: 'user', is_active: true, app_access_status: 'access' },
  ],
  'app-finflow': [], // caso: aplicación sin ningún usuario relevante todavía
}

// application_memberships mutable en memoria (shape de
// iam.application_membership.list.in / _enrich) -- Diana con acceso activo,
// Eduardo con acceso YA inactivo (para ver el toggle en ambos estados desde
// el primer render, sin necesidad de hacer clic primero).
export let APP_MEMBERSHIPS_W12 = [
  {
    id: 'am-w12-1', user_id: 'user-w12-1', tenant_application_id: 'ta-bt-brilliant',
    tenant_id: 'tenant-bt', tenant_slug: 'brilliant-therapy',
    application_id: 'app-brilliant', application_slug: 'brilliant',
    role_id: 'role-bt-terapeuta', role_name: 'terapeuta', is_active: true,
  },
  {
    id: 'am-w12-2', user_id: 'user-w12-2', tenant_application_id: 'ta-bt-brilliant',
    tenant_id: 'tenant-bt', tenant_slug: 'brilliant-therapy',
    application_id: 'app-brilliant', application_slug: 'brilliant',
    role_id: 'role-bt-terapeuta', role_name: 'terapeuta', is_active: false,
  },
  {
    id: 'am-w12-3', user_id: 'user-w12-4', tenant_application_id: 'ta-int-integrarse',
    tenant_id: 'tenant-int', tenant_slug: 'integrarse',
    application_id: 'app-integrarse', application_slug: 'integrarse',
    role_id: 'role-int-alumno', role_name: 'alumno', is_active: true,
  },
]

// Alterna, EN MEMORIA, todos los application_memberships de un usuario para
// una aplicación -- misma semántica any_active que
// ApplicationMembershipPostgresRepository.toggle_by_application (real).
export function toggleAppAccessMock(userId, applicationId) {
  const rows = APP_MEMBERSHIPS_W12.filter(r => r.user_id === userId && r.application_id === applicationId)
  if (rows.length === 0) return null
  const anyActive = rows.some(r => r.is_active)
  const nextState = !anyActive
  APP_MEMBERSHIPS_W12 = APP_MEMBERSHIPS_W12.map(r =>
    (r.user_id === userId && r.application_id === applicationId) ? { ...r, is_active: nextState } : r
  )
  return { is_active: nextState, affected_count: rows.length }
}

/** Caso C: usuario multi-tenant en al menos una app (varias apps, varios tenants) */
export const USER_MULTI = {
  id: 'user-multi',
  full_name: 'Carla Multi (varias apps)',
  email: 'carla.multi@example.com',
  role: 'admin',
  is_active: true,
}
export const MEMBERSHIPS_MULTI = [
  { id: 'm-3', user_id: 'user-multi', tenant_id: 'tenant-bt',  tenant_name: 'Brilliant Therapy', role_id: 'role-bt-admin',    role_name: 'admin',    is_active: true },
  { id: 'm-6', user_id: 'user-multi', tenant_id: 'tenant-nx',  tenant_name: 'Nexus Clinic',      role_id: 'role-nx-terapeuta', role_name: 'terapeuta', is_active: true },
  { id: 'm-4', user_id: 'user-multi', tenant_id: 'tenant-int', tenant_name: 'Integrarse',        role_id: 'role-int-mentor',  role_name: 'mentor',   is_active: true },
  { id: 'm-5', user_id: 'user-multi', tenant_id: 'tenant-ff',  tenant_name: 'FinFlow',           role_id: 'role-ff-analista', role_name: 'analista', is_active: true },
]
export const ACCESSES_MULTI = [
  // brilliant: DOS tenants distintos con acceso -- caso real de
  // "multi-tenant en la misma app" pedido en el brief (Brilliant Therapy +
  // Nexus Clinic, cada uno con su propio rol).
  {
    id: 'am-2', user_id: 'user-multi', tenant_application_id: 'ta-bt-brilliant',
    tenant_id: 'tenant-bt', tenant_slug: 'brilliant-therapy', tenant_name: 'Brilliant Therapy',
    application_id: 'app-brilliant', application_slug: 'brilliant',
    role_id: 'role-bt-admin', role_name: 'admin', is_active: true,
  },
  {
    id: 'am-5', user_id: 'user-multi', tenant_application_id: 'ta-nx-brilliant',
    tenant_id: 'tenant-nx', tenant_slug: 'nexus-clinic', tenant_name: 'Nexus Clinic',
    application_id: 'app-brilliant', application_slug: 'brilliant',
    role_id: 'role-nx-terapeuta', role_name: 'terapeuta', is_active: true,
  },
  {
    id: 'am-3', user_id: 'user-multi', tenant_application_id: 'ta-int-integrarse',
    tenant_id: 'tenant-int', tenant_slug: 'integrarse', tenant_name: 'Integrarse',
    application_id: 'app-integrarse', application_slug: 'integrarse',
    role_id: 'role-int-mentor', role_name: 'mentor', is_active: true,
  },
  {
    id: 'am-4', user_id: 'user-multi', tenant_application_id: 'ta-ff-finflow',
    tenant_id: 'tenant-ff', tenant_slug: 'finflow', tenant_name: 'FinFlow',
    application_id: 'app-finflow', application_slug: 'finflow',
    role_id: 'role-ff-analista', role_name: 'analista', is_active: false, // uno inactivo, para ver el toggle en rojo
  },
]
