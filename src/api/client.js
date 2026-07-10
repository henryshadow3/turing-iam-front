const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function callAction(event, payload, token) {
  const res = await fetch(`${API_URL}/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ event, payload }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || 'Error en la solicitud')
  }

  return data.data
}

export async function selectTenant(tenantId, token) {
  // Fija el contexto activo (tenant + rol) y devuelve un JWT re-emitido.
  const res = await fetch(`${API_URL}/auth/select-tenant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tenant_id: tenantId }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || 'Error al seleccionar el espacio')
  }

  return data
}
