import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const postIncludes = (userId) => ({
  author: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true, isVerified:true } },
  property: { select: { id:true, title:true, city:true } },
  _count: { select: { comments:true, reactions:true, bookmarks:true, shares:true } },
  reactions: userId ? { where: { userId }, select: { type:true } } : false,
  bookmarks: userId ? { where: { userId }, select: { id:true } } : false,
})

// ── GET /api/community/posts ──────────────────────────────────
export const getPosts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10, sort = 'recent' } = req.query
    const userId = req.user?.id
    const skip   = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      status: 'PUBLISHED',
      ...(category && category !== 'all' && { category: category.toUpperCase() }),
      ...(search && {
        OR: [
          { content: { contains: search, mode:'insensitive' } },
          { tags:    { has: search } },
          { author:  { OR: [
            { firstName: { contains: search, mode:'insensitive' } },
            { lastName:  { contains: search, mode:'insensitive' } },
          ]}},
        ]
      }),
    }

    const orderBy = sort === 'popular'
      ? [{ reactions: { _count:'desc' } }, { createdAt:'desc' }]
      : { createdAt: 'desc' }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where, skip, take: parseInt(limit), orderBy,
        include: {
          author:   { select: { id:true, firstName:true, lastName:true, avatar:true, role:true, isVerified:true } },
          property: { select: { id:true, title:true, city:true } },
          _count:   { select: { comments:true, reactions:true, bookmarks:true, shares:true } },
          ...(userId && {
            reactions: { where: { userId }, select: { type:true } },
            bookmarks: { where: { userId }, select: { id:true } },
          }),
        },
      }),
      prisma.post.count({ where }),
    ])

    res.json({
      data: posts.map(p => ({
        ...p,
        liked:      userId ? p.reactions?.length > 0 : false,
        bookmarked: userId ? p.bookmarks?.length > 0  : false,
        reactions:  undefined,
        bookmarks:  undefined,
      })),
      total, page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    })
  } catch (e) { next(e) }
}

// ── POST /api/community/posts ─────────────────────────────────
export const createPost = async (req, res, next) => {
  try {
    const { content, category, rating, tags, images, propertyId } = req.body

    const post = await prisma.post.create({
      data: {
        content, rating: rating ? parseInt(rating) : null,
        category: category?.toUpperCase() || 'EXPERIENCE',
        tags: tags || [], images: images || [],
        authorId: req.user.id,
        ...(propertyId && { propertyId }),
      },
      include: {
        author:   { select: { id:true, firstName:true, lastName:true, avatar:true, role:true, isVerified:true } },
        _count:   { select: { comments:true, reactions:true, bookmarks:true, shares:true } },
      },
    })

    res.status(201).json(post)
  } catch (e) { next(e) }
}

// ── DELETE /api/community/posts/:id ──────────────────────────
export const deletePost = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post) return res.status(404).json({ message: 'Post introuvable' })
    if (post.authorId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Non autorisé' })

    await prisma.post.update({ where: { id: req.params.id }, data: { status:'ARCHIVED' } })
    res.json({ message: 'Post supprimé' })
  } catch (e) { next(e) }
}

// ── GET /api/community/posts/:id/comments ────────────────────
export const getComments = async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id, parentId: null, status: 'VISIBLE' },
      orderBy: { createdAt: 'asc' },
      include: {
        author:  { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } },
        replies: {
          where:   { status: 'VISIBLE' },
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
        },
        _count: { select: { reactions:true, replies:true } },
      },
    })
    res.json(comments)
  } catch (e) { next(e) }
}

// ── POST /api/community/posts/:id/comments ───────────────────
export const addComment = async (req, res, next) => {
  try {
    const { content, parentId } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Contenu requis' })

    const comment = await prisma.comment.create({
      data: { content: content.trim(), authorId: req.user.id, postId: req.params.id, parentId: parentId || null },
      include: { author: { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } } },
    })
    res.status(201).json(comment)
  } catch (e) { next(e) }
}

// ── POST /api/community/posts/:id/react ──────────────────────
export const reactToPost = async (req, res, next) => {
  try {
    const { type = 'LIKE' } = req.body
    const userId = req.user.id
    const postId = req.params.id

    const existing = await prisma.postReaction.findUnique({
      where: { userId_postId: { userId, postId } }
    })

    if (existing) {
      if (existing.type === type) {
        await prisma.postReaction.delete({ where: { userId_postId: { userId, postId } } })
        return res.json({ liked: false, type: null })
      }
      await prisma.postReaction.update({ where: { userId_postId: { userId, postId } }, data: { type } })
      return res.json({ liked: true, type })
    }

    await prisma.postReaction.create({ data: { userId, postId, type } })
    res.json({ liked: true, type })
  } catch (e) { next(e) }
}

// ── POST /api/community/posts/:id/bookmark ───────────────────
export const bookmarkPost = async (req, res, next) => {
  try {
    const userId = req.user.id
    const postId = req.params.id

    const existing = await prisma.postBookmark.findUnique({
      where: { userId_postId: { userId, postId } }
    })

    if (existing) {
      await prisma.postBookmark.delete({ where: { userId_postId: { userId, postId } } })
      return res.json({ bookmarked: false })
    }

    await prisma.postBookmark.create({ data: { userId, postId } })
    res.json({ bookmarked: true })
  } catch (e) { next(e) }
}

// ── POST /api/community/posts/:id/share ──────────────────────
export const sharePost = async (req, res, next) => {
  try {
    const { platform } = req.body
    await prisma.postShare.create({ data: { userId: req.user.id, postId: req.params.id, platform } })
    res.json({ shared: true })
  } catch (e) { next(e) }
}

// ── POST /api/community/follow/:id ───────────────────────────
export const toggleFollow = async (req, res, next) => {
  try {
    const followerId  = req.user.id
    const followingId = req.params.id
    if (followerId === followingId) return res.status(400).json({ message: 'Impossible de se suivre soi-même' })

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    })

    if (existing) {
      await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } })
      return res.json({ following: false })
    }

    await prisma.follow.create({ data: { followerId, followingId } })
    res.json({ following: true })
  } catch (e) { next(e) }
}

// ── GET /api/community/members ────────────────────────────────
export const getMembers = async (req, res, next) => {
  try {
    const userId = req.user?.id
    const { search, role } = req.query

    const members = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(role  && { role: role.toUpperCase() }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode:'insensitive' } },
            { lastName:  { contains: search, mode:'insensitive' } },
          ]
        }),
      },
      select: {
        id: true, firstName:true, lastName:true, avatar:true,
        role:true, isVerified:true, createdAt:true,
        _count: { select: { followers:true, following:true, posts:true } },
        ...(userId && { followers: { where: { followerId: userId }, select: { id:true } } }),
      },
      orderBy: { followers: { _count:'desc' } },
      take: 20,
    })

    res.json(members.map(m => ({
      ...m,
      following:  userId ? m.followers?.length > 0 : false,
      followers:  undefined,
    })))
  } catch (e) { next(e) }
}

// ── GET /api/community/stats ──────────────────────────────────
export const getCommunityStats = async (req, res, next) => {
  try {
    const [members, posts, avgRating, roleCount] = await Promise.all([
      prisma.user.count({ where: { isActive:true } }),
      prisma.post.count({ where: { status:'PUBLISHED' } }),
      prisma.post.aggregate({ _avg: { rating:true }, where: { rating:{ not:null } } }),
      prisma.user.groupBy({ by:['role'], _count: { role:true } }),
    ])

    res.json({
      members, posts,
      avgRating: +(avgRating._avg.rating ?? 0).toFixed(1),
      roles: Object.fromEntries(roleCount.map(r => [r.role, r._count.role])),
    })
  } catch (e) { next(e) }
}