const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
export const api = async (path, options = {}) => {
  const token = localStorage.getItem('immo_token')
  const isFormData = options.body instanceof FormData
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Erreur ${res.status}`)
  }
  return res.json()
}
