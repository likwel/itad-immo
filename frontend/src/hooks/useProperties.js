import { useState, useEffect, useMemo } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const getToken = () => localStorage.getItem('immo_token')

export function useProperties(filters = {}) {
  const [state, setState] = useState({
    properties: [], total: 0, totalPages: 1, loading: true, error: null
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const serialized = useMemo(() => JSON.stringify(filters), [JSON.stringify(filters)])

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))

    const params = new URLSearchParams(
      Object.entries(JSON.parse(serialized)).filter(([, v]) => v != null && v !== '')
    ).toString()

    const token = getToken()

    fetch(`${BASE}/properties?${params}`, {
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
          // isFavorited injecté par le backend si connecté
          properties: (d?.data ?? []).map(p => ({
            ...p,
            isFavorited: p.isFavorited ?? false,
          })),
          total:      d?.total      ?? 0,
          totalPages: d?.totalPages ?? 1,
          loading:    false,
          error:      null,
        })
      })
      .catch(e => {
        if (!cancelled) setState({
          properties: [], total: 0, totalPages: 1,
          loading: false,
          error:   e.message,
        })
      })

    return () => { cancelled = true }
  }, [serialized])

  return state
}