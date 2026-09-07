// Mock de `@/api/client` usado SOLO por el harness de preview de W10
// (vite.config.preview.mjs alias `@/api/client` -> este archivo cuando se
// corre `npm run dev:preview`). Nunca se incluye en el build de producción
// real (vite.config.js, el de siempre, no lo referencia).
import * as mock from '@/dev/mockData'

// El escenario activo se lee de un query param (?scenario=zero|one|multi)
// para poder cambiarlo recargando, sin estado de React adicional.
function currentScenarioKey() {
  const params = new URLSearchParams(window.location.search)
  return params.get('scenario') || 'zero'
}

const SCENARIOS = {
  zero:  { memberships: mock.MEMBERSHIPS_ZERO,  accesses: mock.ACCESSES_ZERO },
  one:   { memberships: mock.MEMBERSHIPS_ONE,   accesses: mock.ACCESSES_ONE },
  multi: { memberships: mock.MEMBERSHIPS_MULTI, accesses: mock.ACCESSES_MULTI },
  empty: { memberships: mock.MEMBERSHIPS_EMPTY, accesses: mock.ACCESSES_EMPTY },
}

// Estado mutable en memoria SOLO para el interruptor de membresía global
// (W11) -- a diferencia del resto de mutaciones del harness (que no
// persisten nada porque no hace falta para verificar el árbol), este botón
// SÍ necesita alternar visualmente entre "Suspender"/"Restaurar" para poder
// verificarlo sin backend real. Se reinicia con cada recarga de página.
// El query param ?suspended=1 permite arrancar ya en estado suspendido.
let membershipSuspendedMock = new URLSearchParams(window.location.search).get('suspended') === '1'

export async function callAction(event) {
  const scenario = SCENARIOS[currentScenarioKey()] || SCENARIOS.zero
  // Pequeño delay artificial para poder ver el estado "Cargando…" también.
  await new Promise(r => setTimeout(r, 150))
  switch (event) {
    case 'iam.membership.list.in':
      return { memberships: scenario.memberships }
    case 'iam.application_membership.list.in':
      return { application_memberships: scenario.accesses }
    case 'iam.tenant.list.in':
      return { tenants: mock.TENANTS }
    case 'iam.role.list.in':
      return { roles: mock.ROLES }
    case 'iam.application.list.in':
      return { applications: mock.APPLICATIONS }
    case 'iam.tenant_application.list.in':
      return { tenant_applications: mock.TENANT_APPLICATIONS }
    // Mutaciones -- el harness es de solo lectura visual, así que devuelven
    // éxito sin persistir nada (recargar cambia de escenario, no hace falta
    // simular estado mutable para verificar la interacción del árbol).
    case 'iam.application_membership.toggle.in':
    case 'iam.application_membership.create.in':
    case 'iam.application_membership.update.in':
    case 'iam.membership.toggle.in':
    case 'iam.membership.create.in':
      return {}
    // Interruptor de membresía global (W11) -- mock simple en memoria, sin
    // snapshot real de filas afectadas (eso vive en membership_suspensions,
    // solo probado contra Postgres efímero, no en este harness de solo UI).
    case 'iam.user.membership_suspension_status.in':
      return { suspended: membershipSuspendedMock }
    case 'iam.user.suspend_membership.in':
      if (membershipSuspendedMock) throw new Error('MEMBERSHIP_ALREADY_SUSPENDED')
      membershipSuspendedMock = true
      return {}
    case 'iam.user.restore_membership.in':
      if (!membershipSuspendedMock) throw new Error('NO_ACTIVE_SUSPENSION')
      membershipSuspendedMock = false
      return {}
    default:
      console.warn('[mockClient] evento no mockeado:', event)
      return {}
  }
}

export async function selectTenant() { return {} }
export async function selectApplication() { return {} }
export function getTelegramLinks() { return Promise.resolve({ links: [] }) }
export function revokeTelegramLink() { return Promise.resolve({}) }
export function reactivateTelegramLink() { return Promise.resolve({}) }
