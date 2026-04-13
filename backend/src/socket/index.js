
// socket/index.js ─────────────────────────────────────────────
import { Server } from 'socket.io'
import registerLiveSocket from './live.socket.js'

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:5173',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  })

  registerLiveSocket(io)
  return io
}