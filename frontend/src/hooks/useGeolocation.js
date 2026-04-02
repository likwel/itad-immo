import { useState, useEffect } from 'react'
export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError]       = useState(null)
  useEffect(() => {
    if (!navigator.geolocation) return setError('Géolocalisation non supportée')
    navigator.geolocation.getCurrentPosition(
      p => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      e => setError(e.message)
    )
  }, [])
  return { location, error }
}
