// ════════════════════════════════════════════════════════════
// controllers/live.controller.js
// ════════════════════════════════════════════════════════════
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const liveInclude = {
  host: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } },
  properties: {
    include: { property: { select: { id:true, title:true, city:true, price:true, priceUnit:true, images:true, bedrooms:true, area:true, listingType:true } } },
    orderBy: { order: 'asc' },
  },
  _count: { select: { messages:true, viewers:true, reactions:true } },
}

// ── GET /api/lives ────────────────────────────────────────────
export const getLives = async (req, res, next) => {
  try {
    const { status, visibility = 'PUBLIC', page = 1, limit = 12 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      ...(status && { status }),
      ...(visibility !== 'all' && { visibility }),
    }

    const [lives, total] = await Promise.all([
      prisma.live.findMany({
        where, skip, take: parseInt(limit),
        orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }, { startedAt: 'desc' }],
        include: liveInclude,
      }),
      prisma.live.count({ where }),
    ])

    res.json({ data: lives, total, totalPages: Math.ceil(total / parseInt(limit)) })
  } catch (e) { next(e) }
}

// ── GET /api/lives/:id ────────────────────────────────────────
export const getLive = async (req, res, next) => {
  try {
    const live = await prisma.live.findUnique({
      where: { id: req.params.id },
      include: {
        ...liveInclude,
        messages: {
          where: { isPinned: true },
          include: { author: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
          take: 1,
        },
      },
    })
    if (!live) return res.status(404).json({ message: 'Live introuvable' })
    res.json(live)
  } catch (e) { next(e) }
}

// ── POST /api/lives ───────────────────────────────────────────
export const createLive = async (req, res, next) => {
  try {
    const { title, description, visibility = 'PUBLIC', scheduledAt, propertyIds = [] } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Titre requis' })

    const live = await prisma.live.create({
      data: {
        title: title.trim(), description,
        visibility, hostId: req.user.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        properties: {
          create: propertyIds.map((pid, i) => ({ propertyId: pid, order: i })),
        },
      },
      include: liveInclude,
    })

    res.status(201).json(live)
  } catch (e) { next(e) }
}

// ── PUT /api/lives/:id ────────────────────────────────────────
export const updateLive = async (req, res, next) => {
  try {
    const live = await prisma.live.findUnique({ where: { id: req.params.id } })
    if (!live) return res.status(404).json({ message: 'Live introuvable' })
    if (live.hostId !== req.user.id) return res.status(403).json({ message: 'Non autorisé' })

    const { title, description, visibility, scheduledAt } = req.body
    const updated = await prisma.live.update({
      where: { id: req.params.id },
      data: {
        ...(title       && { title       }),
        ...(description && { description }),
        ...(visibility  && { visibility  }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      },
      include: liveInclude,
    })

    res.json(updated)
  } catch (e) { next(e) }
}

// ── DELETE /api/lives/:id ─────────────────────────────────────
export const deleteLive = async (req, res, next) => {
  try {
    const live = await prisma.live.findUnique({ where: { id: req.params.id } })
    if (!live) return res.status(404).json({ message: 'Live introuvable' })
    if (live.hostId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Non autorisé' })

    await prisma.live.delete({ where: { id: req.params.id } })
    res.json({ message: 'Live supprimé' })
  } catch (e) { next(e) }
}

// ── GET /api/lives/:id/history ────────────────────────────────
// Historique complet : messages, viewers, analytics
export const getLiveHistory = async (req, res, next) => {
  try {
    const live = await prisma.live.findUnique({ where: { id: req.params.id } })
    if (!live) return res.status(404).json({ message: 'Live introuvable' })
    if (live.hostId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Non autorisé' })

    const [messages, viewers, reactions] = await Promise.all([
      prisma.liveMessage.findMany({
        where: { liveId: req.params.id },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id:true, firstName:true, lastName:true } } },
      }),
      prisma.liveViewer.findMany({
        where: { liveId: req.params.id },
        include: { user: { select: { id:true, firstName:true, lastName:true, role:true } } },
        orderBy: { joinedAt: 'asc' },
      }),
      prisma.liveReaction.groupBy({
        by: ['type'],
        where: { liveId: req.params.id },
        _count: { type: true },
      }),
    ])

    // Calcul temps moyen de visionnage
    const watchTimes   = viewers.filter(v => v.leftAt).map(v =>
      Math.floor((v.leftAt - v.joinedAt) / 1000)
    )
    const avgWatchTime = watchTimes.length
      ? Math.floor(watchTimes.reduce((a, b) => a + b, 0) / watchTimes.length)
      : null

    res.json({
      live,
      messages,
      viewers,
      reactionBreakdown: Object.fromEntries(reactions.map(r => [r.type, r._count.type])),
      analytics: {
        totalMessages:  messages.length,
        totalViewers:   viewers.length,
        peakViewers:    live.peakViewers,
        totalLikes:     live.likeCount,
        totalShares:    live.shareCount,
        duration:       live.duration,
        avgWatchTime,
      },
    })
  } catch (e) { next(e) }
}

// ── GET /api/lives/me/history ─────────────────────────────────
// Historique des lives de l'utilisateur connecté
export const getMyLives = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = { hostId: req.user.id, ...(status && { status }) }

    const [lives, total] = await Promise.all([
      prisma.live.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          ...liveInclude,
          _count: { select: { messages:true, viewers:true, reactions:true, shares:true } },
        },
      }),
      prisma.live.count({ where }),
    ])

    res.json({ data: lives, total, totalPages: Math.ceil(total / parseInt(limit)) })
  } catch (e) { next(e) }
}
