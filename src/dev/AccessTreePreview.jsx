import UserDetailPanel from '@/components/UserDetailPanel'
import * as mock from '@/dev/mockData'

/**
 * Harness dev-only para verificación visual de W10 (UserAccessTree) sin
 * depender del stack Docker completo (turing-api / iam-worker). Monta
 * UserDetailPanel real -- ninguna lógica de datos se duplica aquí. El
 * módulo `@/api/client` se sustituye por `@/dev/mockClient.js` vía alias
 * de Vite (ver vite.config.preview.mjs), que responde con el mismo shape
 * que devuelve turing-iam-worker (ver mockData.js, calcado de los
 * repositorios reales). El escenario se elige con ?scenario=zero|one|multi
 * en la URL -- cubre los 3 casos pedidos en el Work Item W10:
 *   - zero  -> 0 aplicaciones (afiliado a un tenant, sin ningún acceso)
 *   - one   -> 1 aplicación (un solo acceso)
 *   - multi -> varias aplicaciones / multi-tenant
 *
 * Solo se sirve desde preview.html (npm run dev:preview) -- NO se importa
 * desde App.jsx ni desde ninguna ruta de producción.
 */
const USERS = {
  zero:  mock.USER_ZERO_APPS,
  one:   mock.USER_ONE_APP,
  multi: mock.USER_MULTI,
  empty: mock.USER_EMPTY,
}

export default function AccessTreePreview() {
  const params = new URLSearchParams(window.location.search)
  const scenarioKey = params.get('scenario') || 'zero'
  const user = USERS[scenarioKey] || USERS.zero

  function setScenario(key) {
    const url = new URL(window.location.href)
    url.searchParams.set('scenario', key)
    window.location.href = url.toString()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto 24px', display: 'flex', gap: 8 }}>
        {Object.entries(USERS).map(([key]) => (
          <button key={key}
            onClick={() => setScenario(key)}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace',
              background: scenarioKey === key ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.05)',
              color: scenarioKey === key ? '#D4AF37' : '#9ca3af',
              border: `1px solid ${scenarioKey === key ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer',
            }}>
            {key}
          </button>
        ))}
      </div>
      <UserDetailPanel
        key={scenarioKey}
        user={user}
        token="fake-token-for-preview"
        onClose={() => {}}
      />
    </div>
  )
}
