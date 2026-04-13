// ════════════════════════════════════════════════════════════
// hooks/useLiveSocket.js  — connexion Socket.io
// ════════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
const getToken   = () => localStorage.getItem('immo_token')

let _socket = null
export const getSocket = () => {
  if (!_socket || _socket.disconnected) {
    _socket = io(SOCKET_URL, {
      auth:                { token: getToken() },
      transports:          ['websocket', 'polling'],
      reconnection:        true,
      reconnectionAttempts:10,
      reconnectionDelay:   1000,
      timeout:             10000,
    })
    _socket.on('connect',      () => console.log('🔌 Socket connecté:', _socket.id))
    _socket.on('disconnect',   r  => console.log('❌ Socket déconnecté:', r))
    _socket.on('connect_error',e  => console.warn('⚠️ Socket erreur:', e.message))
  }
  return _socket
}

export function useLiveSocket() {
  const socketRef = useRef(null)

  useEffect(() => {
    socketRef.current = getSocket()
    return () => {}
  }, [])

  const emit = useCallback((event, data) => {
    const s = socketRef.current ?? getSocket()
    if (s.connected) {
      s.emit(event, data)
    } else {
      // Attendre la connexion puis émettre
      s.once('connect', () => s.emit(event, data))
    }
  }, [])

  const on = useCallback((event, handler) => {
    const s = socketRef.current ?? getSocket()
    s.on(event, handler)
    return () => s.off(event, handler)
  }, [])

  return { socket: socketRef, emit, on }
}
