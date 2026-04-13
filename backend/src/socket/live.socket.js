import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Map liveId → { hostSocketId, viewerCount, viewerSockets: Set }
const liveRooms = new Map()

// ── Auth middleware socket ────────────────────────────────────
const authSocket = (socket) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return null
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch { return null }
}

export default function registerLiveSocket(io) {

  io.on('connection', (socket) => {
    const user = authSocket(socket)

    // ── HOST : démarre le live ──────────────────────────────
    socket.on('live:start', async ({ liveId }) => {
      if (!user) return socket.emit('error', { message: 'Non authentifié' })

      const live = await prisma.live.findUnique({ where: { id: liveId } })
      if (!live || live.hostId !== user.id) return socket.emit('error', { message: 'Non autorisé' })

      // Mettre à jour seulement si pas encore LIVE
      if (live.status !== 'LIVE') {
        await prisma.live.update({
          where: { id: liveId },
          data: { status: 'LIVE', startedAt: new Date() },
        })
      }

      socket.join(`live:${liveId}`)
      socket.data.liveId  = liveId
      socket.data.isHost  = true
      socket.data.userId  = user.id

      liveRooms.set(liveId, { hostSocketId: socket.id, viewerCount: 0, viewerSockets: new Set() })

      socket.emit('live:started', { liveId })
      console.log(`🔴 Live démarré: ${liveId} par ${user.id}`)
    })

    // ── VIEWER : rejoint le live ────────────────────────────
    socket.on('live:join', async ({ liveId }) => {
      console.log(`[live:join] user=${user?.id ?? 'anonyme'} liveId=${liveId}`)
      const live = await prisma.live.findUnique({ where: { id: liveId } })
      console.log(`[live:join] live trouvé=${!!live} status=${live?.status}`)
      if (!live || live.status !== 'LIVE') {
        console.log('[live:join] ❌ Live non disponible')
        return socket.emit('error', { message: 'Live non disponible' })
      }

      socket.join(`live:${liveId}`)
      socket.data.liveId = liveId
      socket.data.userId = user?.id ?? null

      // Enregistrer le viewer en DB
      const viewer = await prisma.liveViewer.create({
        data: { liveId, userId: user?.id ?? null, socketId: socket.id },
      })
      socket.data.viewerId = viewer.id

      // Mettre à jour le compteur en mémoire
      const room = liveRooms.get(liveId)
      console.log(`[live:join] room trouvée=${!!room} hostSocketId=${room?.hostSocketId}`)
      if (room) {
        room.viewerCount++
        room.viewerSockets.add(socket.id)

        // Notifier l'hôte qu'un viewer arrive → déclenche WebRTC offer
        io.to(room.hostSocketId).emit('live:viewer-joined', {
          viewerSocketId: socket.id,
          viewerCount: room.viewerCount,
        })

    // Diffuser le nouveau compteur + liste à tout le monde
    const viewerUsers = await prisma.liveViewer.findMany({
      where: { liveId, leftAt: null },
      include: { user: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
      take: 50,
    })
    const viewerList = viewerUsers.map(v => v.user).filter(Boolean)
    io.to(`live:${liveId}`).emit('live:viewers-update', {
      count: room.viewerCount,
      viewers: viewerList,
    })

        // Mettre à jour le peak en DB si nécessaire
        if (room.viewerCount > live.peakViewers) {
          await prisma.live.update({ where: { id: liveId }, data: { peakViewers: room.viewerCount } })
        }
      }

      // Incrémenter totalViews
      await prisma.live.update({ where: { id: liveId }, data: { totalViews: { increment: 1 } } })

      // Envoyer les derniers messages au nouvel arrivant
      const recentMessages = await prisma.liveMessage.findMany({
        where: { liveId },
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: { author: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
      })
      socket.emit('live:history', { messages: recentMessages })
      socket.emit('live:joined', { liveId, viewerCount: room?.viewerCount ?? 1 })
    })

    // ── WebRTC : HOST envoie une offre à un viewer ──────────
    socket.on('webrtc:offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('webrtc:offer', {
        fromSocketId: socket.id,
        offer,
      })
    })

    // ── WebRTC : VIEWER répond à l'offre ───────────────────
    socket.on('webrtc:answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        answer,
      })
    })

    // ── WebRTC : ICE candidate ──────────────────────────────
    socket.on('webrtc:ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('webrtc:ice-candidate', {
        fromSocketId: socket.id,
        candidate,
      })
    })

    // ── CHAT : envoyer un message ───────────────────────────
    socket.on('live:message', async ({ liveId, content }) => {
      if (!content?.trim() || !user) return
      if (content.length > 300) return socket.emit('error', { message: 'Message trop long' })

      const live = await prisma.live.findUnique({ where: { id: liveId } })
      if (!live || live.status !== 'LIVE') return

      const msg = await prisma.liveMessage.create({
        data: { liveId, content: content.trim(), authorId: user.id, isHost: live.hostId === user.id },
        include: { author: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
      })

      io.to(`live:${liveId}`).emit('live:message', msg)
    })

    // ── REACTION : j'aime ───────────────────────────────────
    socket.on('live:react', async ({ liveId, type = 'LIKE' }) => {
      if (!user) return

      await prisma.liveReaction.create({ data: { liveId, userId: user.id, type } })
      await prisma.live.update({ where: { id: liveId }, data: { likeCount: { increment: 1 } } })

      // Diffuser la réaction animée à tout le monde
      io.to(`live:${liveId}`).emit('live:reaction', {
        type, userId: user.id,
        userName: `${user.firstName}`,
      })
    })

    // ── SHARE ───────────────────────────────────────────────
    socket.on('live:share', async ({ liveId, platform }) => {
      await prisma.liveShare.create({ data: { liveId, userId: user?.id, platform } })
      await prisma.live.update({ where: { id: liveId }, data: { shareCount: { increment: 1 } } })
    })

    // ── HOST : changer le bien actif ────────────────────────
    socket.on('live:set-property', async ({ liveId, propertyId }) => {
      if (!user || socket.data.isHost !== true) return

      await prisma.liveProperty.updateMany({ where: { liveId }, data: { isActive: false } })
      await prisma.liveProperty.updateMany({
        where: { liveId, propertyId },
        data: { isActive: true, shownAt: new Date() },
      })

      io.to(`live:${liveId}`).emit('live:property-changed', { propertyId })
    })

    // ── HOST : épingler un message ──────────────────────────
    socket.on('live:pin-message', async ({ liveId, messageId }) => {
      if (!user || socket.data.isHost !== true) return
      await prisma.liveMessage.updateMany({ where: { liveId }, data: { isPinned: false } })
      await prisma.liveMessage.update({ where: { id: messageId }, data: { isPinned: true } })
      io.to(`live:${liveId}`).emit('live:message-pinned', { messageId })
    })

    // ── HOST : terminer le live ─────────────────────────────
    socket.on('live:end', async ({ liveId }) => {
      if (!user || socket.data.isHost !== true) return

      const live = await prisma.live.findUnique({ where: { id: liveId } })
      if (!live) return

      const duration = live.startedAt
        ? Math.floor((Date.now() - live.startedAt.getTime()) / 1000)
        : null

      await prisma.live.update({
        where: { id: liveId },
        data: { status: 'ENDED', endedAt: new Date(), duration },
      })

      io.to(`live:${liveId}`).emit('live:ended', { liveId, duration })
      liveRooms.delete(liveId)
    })

    // ── DISCONNECT ──────────────────────────────────────────
    socket.on('disconnect', async () => {
      const { liveId, viewerId, isHost } = socket.data

      if (isHost && liveId) {
        // L'hôte se déconnecte → terminer le live
        const live = await prisma.live.findUnique({ where: { id: liveId } })
        if (live?.status === 'LIVE') {
          const duration = live.startedAt
            ? Math.floor((Date.now() - live.startedAt.getTime()) / 1000)
            : null
          await prisma.live.update({
            where: { id: liveId },
            data: { status: 'ENDED', endedAt: new Date(), duration },
          })
          io.to(`live:${liveId}`).emit('live:ended', { liveId, duration, reason: 'host_disconnected' })
          liveRooms.delete(liveId)
        }
      } else if (liveId) {
        // Viewer se déconnecte
        const room = liveRooms.get(liveId)
        if (room) {
          room.viewerCount = Math.max(0, room.viewerCount - 1)
          room.viewerSockets.delete(socket.id)
          io.to(`live:${liveId}`).emit('live:viewers-update', { count: room.viewerCount })
          // Notifier l'hôte pour fermer la connexion WebRTC
          io.to(room.hostSocketId).emit('live:viewer-left', { viewerSocketId: socket.id })
        }

        // Enregistrer le temps de visionnage
        if (viewerId) {
          await prisma.liveViewer.update({
            where: { id: viewerId },
            data: { leftAt: new Date() },
          }).catch(() => {})
        }
      }
    })
  })
}