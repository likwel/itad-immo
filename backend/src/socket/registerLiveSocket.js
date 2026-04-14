import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import jwt from 'jsonwebtoken'

const rooms = new Map() // liveId → { hostSocketId, viewerCount, viewers: Set }

const auth = socket => {
  try { return jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET) }
  catch { return null }
}

export default function registerLiveSocket(io) {
  io.on('connection', socket => {
    const user = auth(socket)
    console.log(`🔌 ${socket.id} | user:${user?.id ?? 'anon'}`)

    // ── HOST : enregistrer ────────────────────────────────
    socket.on('live:start', async ({ liveId }) => {
      if (!user) return
      const live = await prisma.live.findUnique({ where: { id: liveId } }).catch(() => null)
      if (!live || live.hostId !== user.id) return

      socket.join(`live:${liveId}`)
      socket.data = { ...socket.data, liveId, isHost: true }

      if (live.status !== 'LIVE') {
        await prisma.live.update({
          where: { id: liveId },
          data:  { status: 'LIVE', startedAt: new Date() },
        }).catch(() => {})
      }

      if (!rooms.has(liveId)) {
        rooms.set(liveId, { hostSocketId: socket.id, viewerCount: 0, viewers: new Set() })
      } else {
        rooms.get(liveId).hostSocketId = socket.id
      }

      socket.emit('live:started', { liveId })
      socket.to(`live:${liveId}`).emit('live:host-ready')

      const room = rooms.get(liveId)
      room.viewers.forEach(sid => {
        // ✅ viewerSocketId au lieu de from
        socket.emit('live:viewer-joined', { viewerSocketId: sid, viewerCount: room.viewerCount })
      })
    })

    // ── VIEWER : rejoindre ────────────────────────────────
    socket.on('live:join', async ({ liveId }, cb) => {
      try {
        const live = await prisma.live.findUnique({ where: { id: liveId } })
        if (!live)                  return cb({ error: 'Live introuvable' })
        if (live.status !== 'LIVE') return cb({ error: `Live non disponible (status: ${live.status})` })

        socket.join(`live:${liveId}`)
        socket.data = { ...socket.data, liveId }

        const viewer = await prisma.liveViewer.create({
          data: { liveId, userId: user?.id ?? null, socketId: socket.id },
        }).catch(() => null)
        if (viewer) socket.data.viewerId = viewer.id

        await prisma.live.update({
          where: { id: liveId },
          data:  { totalViews: { increment: 1 } },
        }).catch(() => {})

        const msgs = await prisma.liveMessage.findMany({
          where:   { liveId },
          orderBy: { createdAt: 'asc' },
          take:    50,
          include: { author: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
        }).catch(() => [])

        let room = rooms.get(liveId)
        if (!room) {
          const sockets  = await io.in(`live:${liveId}`).fetchSockets()
          const hostSock = sockets.find(s => s.data?.isHost)
          if (hostSock) {
            room = { hostSocketId: hostSock.id, viewerCount: 0, viewers: new Set() }
            rooms.set(liveId, room)
          }
        }

        if (room) {
          room.viewerCount++
          room.viewers.add(socket.id)
          cb({ ok: true, waiting: false, viewerCount: room.viewerCount, messages: msgs })

          // ✅ viewerSocketId au lieu de from
          io.to(room.hostSocketId).emit('live:viewer-joined', {
            viewerSocketId: socket.id,
            viewerCount:    room.viewerCount,
          })
          _broadcastViewers(io, liveId, room)
        } else {
          cb({ ok: true, waiting: true, messages: msgs, viewerCount: 0 })
        }
      } catch (e) {
        console.error('[live:join] erreur:', e)
        cb({ error: e.message })
      }
    })

    // ── WebRTC signaling ──────────────────────────────────
    // ✅ { targetSocketId } côté client, { fromSocketId } côté émission
    // ✅ webrtc:ice-candidate (plus webrtc:ice)
    socket.on('webrtc:offer', ({ targetSocketId, offer }) =>
      io.to(targetSocketId).emit('webrtc:offer', { fromSocketId: socket.id, offer }))

    socket.on('webrtc:answer', ({ targetSocketId, answer }) =>
      io.to(targetSocketId).emit('webrtc:answer', { fromSocketId: socket.id, answer }))

    socket.on('webrtc:ice-candidate', ({ targetSocketId, candidate }) =>
      io.to(targetSocketId).emit('webrtc:ice-candidate', { fromSocketId: socket.id, candidate }))

    // ── Chat ──────────────────────────────────────────────
    socket.on('live:message', async ({ liveId, content }) => {
      if (!content?.trim() || !user) return
      const live = await prisma.live.findUnique({ where: { id: liveId } }).catch(() => null)
      if (!live) return
      const msg = await prisma.liveMessage.create({
        data:    { liveId, content: content.trim(), authorId: user.id, isHost: live.hostId === user.id },
        include: { author: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
      })
      io.to(`live:${liveId}`).emit('live:message', msg)
    })

    // ── Réaction ──────────────────────────────────────────
    socket.on('live:react', async ({ liveId, type = 'LIKE' }) => {
      if (!user) return
      await prisma.liveReaction.create({ data: { liveId, userId: user.id, type } }).catch(() => {})
      await prisma.live.update({ where: { id: liveId }, data: { likeCount: { increment: 1 } } }).catch(() => {})
      io.to(`live:${liveId}`).emit('live:reaction', { type, userId: user.id, userName: user.firstName })
    })

    // ── Share ─────────────────────────────────────────────
    socket.on('live:share', async ({ liveId, platform }) => {
      await prisma.liveShare.create({ data: { liveId, userId: user?.id, platform } }).catch(() => {})
      await prisma.live.update({ where: { id: liveId }, data: { shareCount: { increment: 1 } } }).catch(() => {})
    })

    // ── Bien actif ────────────────────────────────────────
    socket.on('live:set-property', async ({ liveId, propertyId }) => {
      if (!socket.data?.isHost) return
      await prisma.liveProperty.updateMany({ where: { liveId },             data: { isActive: false } }).catch(() => {})
      await prisma.liveProperty.updateMany({ where: { liveId, propertyId }, data: { isActive: true, shownAt: new Date() } }).catch(() => {})
      io.to(`live:${liveId}`).emit('live:property-changed', { propertyId })
    })

    // ── Terminer ──────────────────────────────────────────
    socket.on('live:end', async ({ liveId }) => {
      if (!socket.data?.isHost) return
      const live = await prisma.live.findUnique({ where: { id: liveId } }).catch(() => null)
      if (!live) return
      const duration = live.startedAt
        ? Math.floor((Date.now() - new Date(live.startedAt)) / 1000) : null
      await prisma.live.update({
        where: { id: liveId },
        data:  { status: 'ENDED', endedAt: new Date(), duration },
      }).catch(() => {})
      io.to(`live:${liveId}`).emit('live:ended', { liveId, duration })
      rooms.delete(liveId)
    })

    // ── Disconnect ────────────────────────────────────────
    socket.on('disconnect', async () => {
      const { liveId, isHost, viewerId } = socket.data ?? {}
      if (!liveId) return

      if (isHost) {
        const live = await prisma.live.findUnique({ where: { id: liveId } }).catch(() => null)
        if (live?.status === 'LIVE') {
          const duration = live.startedAt
            ? Math.floor((Date.now() - new Date(live.startedAt)) / 1000) : null
          await prisma.live.update({
            where: { id: liveId },
            data:  { status: 'ENDED', endedAt: new Date(), duration },
          }).catch(() => {})
          io.to(`live:${liveId}`).emit('live:ended', { liveId })
          rooms.delete(liveId)
        }
      } else {
        const room = rooms.get(liveId)
        if (room) {
          room.viewerCount = Math.max(0, room.viewerCount - 1)
          room.viewers.delete(socket.id)
          // ✅ viewerSocketId au lieu de from
          io.to(room.hostSocketId).emit('live:viewer-left', { viewerSocketId: socket.id })
          _broadcastViewers(io, liveId, room)
        }
        if (viewerId) {
          await prisma.liveViewer.update({
            where: { id: viewerId },
            data:  { leftAt: new Date() },
          }).catch(() => {})
        }
      }
    })
  })
}

async function _broadcastViewers(io, liveId, room) {
  const list = await prisma.liveViewer.findMany({
    where:   { liveId, leftAt: null },
    include: { user: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
    take:    50,
  }).catch(() => [])
  io.to(`live:${liveId}`).emit('live:viewers-update', {
    count:   room.viewerCount,
    viewers: list.map(v => v.user).filter(Boolean),
  })
}