import { useState, useEffect, useRef, useMemo } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export function useProperties(filters = {}) {
  const [state, setState] = useState({
    properties: [], total: 0, totalPages: 1, loading: true, error: null
  })

  // Sérialiser UNE seule fois, stable entre renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const serialized = useMemo(() => JSON.stringify(filters), [JSON.stringify(filters)])

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))

    const params = new URLSearchParams(
      Object.entries(JSON.parse(serialized)).filter(([, v]) => v != null && v !== '')
    ).toString()

    fetch(`${BASE}/properties?${params}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('immo_token') && {
          Authorization: `Bearer ${localStorage.getItem('immo_token')}`
        })
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
          properties: d?.data       ?? [],
          total:      d?.total      ?? 0,
          totalPages: d?.totalPages ?? 1,
          loading:    false,
          error:      null
        })
      })
      .catch(e => {
        if (!cancelled) setState({
          properties: [], total: 0, totalPages: 1,
          loading: false,
          error:   e.message
        })
      })

    return () => { cancelled = true }
  }, [serialized]) // stable — ne change que si les filtres changent vraiment

  return state
}