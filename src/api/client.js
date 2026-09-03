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

export async function selectApplication(tenantApplicationId, token) {
  // Endpoint nuevo de W6 (turing-api): fija tenant + aplicación + rol de
  // forma explícita cuando el usuario tiene más de un application_membership
  // -- select-tenant solo no basta porque no distingue entre varias apps
  // dentro del mismo tenant, ni resuelve el caso multi-tenant + multi-app
  // sin ambigüedad.
  const res = await fetch(`${API_URL}/auth/select-application`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tenant_application_id: tenantApplicationId }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || 'Error al seleccionar la aplicación')
  }

  return data
}

async function botRequest(path, token, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.detail || 'Error al administrar el vínculo de Telegram')
  }
  return data
}

export function getTelegramLinks(token) {
  return botRequest('/bot/telegram-links', token)
}

export function revokeTelegramLink(chatId, token) {
  return botRequest(`/bot/telegram-links/${encodeURIComponent(chatId)}/revoke`, token, {
    method: 'POST',
  })
}

export function reactivateTelegramLink(chatId, token) {
  return botRequest(`/bot/telegram-links/${encodeURIComponent(chatId)}/reactivate`, token, {
    method: 'POST',
  })
}
