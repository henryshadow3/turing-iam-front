import { MemoryRouter } from 'react-router-dom'
import UsersPage from '@/pages/admin/Users'

/**
 * Harness dev-only para verificación visual de W12 (tabs de aplicación en
 * Users.jsx + control de cuenta global movido a UserDetailPanel), sin
 * depender del stack Docker completo. Monta la página real UsersPage --
 * ninguna lógica de datos se duplica aquí. `@/api/client` se sustituye por
 * `@/dev/mockClient.js` vía alias de Vite (ver vite.config.preview.mjs).
 *
 * UsersPage usa useSearchParams (react-router-dom) para persistir la tab
 * activa (?app=) -- se envuelve en MemoryRouter para que funcione fuera de
 * App.jsx. También usa useAuth(), que lee el token de localStorage/URL; se
 * inyecta un token fake una sola vez antes del primer render.
 *
 * Solo se sirve desde preview-users.html (npm run dev:w12-preview) -- NO se
 * importa desde App.jsx ni desde ninguna ruta de producción.
 */
if (!localStorage.getItem('turing_token')) {
  // Token JWT fake con payload decodificable (header.payload.signature) --
  // useAuth solo decodifica el payload, no valida firma.
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: 'preview-admin', role: 'superadmin' }))
  localStorage.setItem('turing_token', `${header}.${payload}.fake`)
}

export default function UsersTabsPreview() {
  // UsersPage persiste la tab activa en el query param `app` vía
  // useSearchParams (react-router-dom), que opera sobre el historial del
  // propio Router -- NO sobre window.location.search. Para poder abrir el
  // harness directamente en una tab específica (?app=app-integrarse) o con
  // un escenario de mock (?scenario=one), se reenvía el search real del
  // navegador como entrada inicial del MemoryRouter.
  const initialEntry = `/admin/users${window.location.search}`
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '24px' }}>
        <UsersPage />
      </div>
    </MemoryRouter>
  )
}
