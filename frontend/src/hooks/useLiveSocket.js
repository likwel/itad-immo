import { useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
const getToken   = () => localStorage.getItem('immo_token')

let _viewerSocket = null
let _hostSocket   = null   // ← socket dédié à l'hôte, indépendant du viewer

const createSocket = () => {
  const token = getToken()
  console.log('[Socket] création, token:', !!token)
  const s = io(SOCKET_URL, {
    auth:                 { token },
    transports:           ['websocket', 'polling'],
    reconnection:         true,
    reconnectionAttempts: 10,
    reconnectionDelay:    1000,
    timeout:              10000,
  })
  s.on('connect',       () => console.log('🔌 connecté:', s.id))
  s.on('disconnect',    r  => console.log('❌ déconnecté:', r))
  s.on('connect_error', e  => console.warn('⚠️ erreur:', e.message))
  return s
}

/**
 * freshConnection=true → socket dédié à l'hôte (ne détruit pas le socket viewer)
 */
export const getSocket = (freshConnection = false) => {
  if (freshConnection) {
    if (!_hostSocket || !_hostSocket.connected) {
      _hostSocket?.removeAllListeners()
      _hostSocket?.disconnect()
      _hostSocket = createSocket()
    }
    return _hostSocket
  }
  if (!_viewerSocket) _viewerSocket = createSocket()
  return _viewerSocket
}

export function useLiveSocket({ freshConnection = false } = {}) {
  const socketRef = useRef(null)
  if (!socketRef.current) {
    socketRef.current = getSocket(freshConnection)
  }

  const emit = useCallback((event, data, cb) => {
    const s = socketRef.current
    if (!s) return
    if (s.connected) {
      cb ? s.emit(event, data, cb) : s.emit(event, data)
    } else {
      s.once('connect', () => (cb ? s.emit(event, data, cb) : s.emit(event, data)))
    }
  }, [])

  const on = useCallback((event, handler) => {
    const s = socketRef.current
    if (!s) return () => {}
    s.on(event, handler)
    return () => s.off(event, handler)
  }, [])

  return { socket: socketRef, emit, on }
}