
// ════════════════════════════════════════════════════════════
// hooks/useLiveSocket.js  — connexion Socket.io
// ════════════════════════════════════════════════════════════
import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
const getToken   = () => localStorage.getItem('immo_token')

let _socket = null
const getSocket = () => {
  if (!_socket || _socket.disconnected) {
    _socket = io(SOCKET_URL, {
      auth: { token: getToken() },
      transports: ['websocket'],
      autoConnect: true,
    })
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
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }, [])

  return { socket: socketRef, emit, on }
}