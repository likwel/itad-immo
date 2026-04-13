import { useState, useEffect } from 'react'

const BASE      = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const getToken  = () => localStorage.getItem('immo_token')

export function useStats() {
  const [state, setState] = useState({
    stats: null, loading: true, error: null
  })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))

    const token = getToken()

    fetch(`${BASE}/users/stats`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(
          res.status === 429 ? 'Trop de requêtes' : `Erreur ${res.status}`
        )
        return res.json()
      })
      .then(d => {
        if (!cancelled) setState({
          stats:   d ?? null,
          loading: false,
          error:   null,
        })
      })
      .catch(e => {
        if (!cancelled) setState({
          stats:   null,
          loading: false,
          error:   e.message,
        })
      })

    return () => { cancelled = true }
  }, [])

  return state
}