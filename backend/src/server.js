import { createServer } from 'http'
import { Server }       from 'socket.io'
import app from './app.js'

const PORT     = process.env.PORT || 4000
const httpServer = createServer(app)

// Socket.io pour messagerie temps réel
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET','POST'] }
})

io.on('connection', socket => {
  console.log('🔌 Client connecté:', socket.id)
  socket.on('join_room', userId => socket.join(userId))
  socket.on('send_message', data => {
    io.to(data.receiverId).emit('receive_message', data)
  })
  socket.on('disconnect', () => console.log('Client déconnecté:', socket.id))
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
  console.log(`📦 Environnement: ${process.env.NODE_ENV}`)
})
