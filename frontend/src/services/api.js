const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('immo_token')
}

export const api = async (path, options = {}) => {
  const token = getToken()  // ← getToken() pas localStorage directement
  const isFormData = options.body instanceof FormData
  const { headers: optHeaders, ...restOptions } = options

  const res = await fetch(`${BASE}${path}`, {
    ...restOptions,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...optHeaders,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Erreur ${res.status}`)
  }
  return res.json()
}