import { useEffect, useState } from 'react'

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function useAuth() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Read token from URL param first, then localStorage
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')

    if (urlToken) {
      localStorage.setItem('turing_token', urlToken)
      // Clean token from URL without reload
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
      setToken(urlToken)
      setUser(decodeJwt(urlToken))
    } else {
      const stored = localStorage.getItem('turing_token')
      if (stored) {
        setToken(stored)
        setUser(decodeJwt(stored))
      }
    }
  }, [])

  function logout() {
    localStorage.removeItem('turing_token')
    setToken(null)
    setUser(null)
  }

  return { token, user, logout }
}
