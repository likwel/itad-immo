import { PrismaClient } from '@prisma/client'
// import { propertyIncludes } from './property.controller.js'

const prisma = new PrismaClient()

const propertyIncludes = {
  owner:    { select: { id:true, firstName:true, lastName:true, avatar:true, role:true } },
  agency:   { select: { id:true, name:true, logo:true } },
  category: { select: { id:true, name:true, slug:true } },
  reviews:  { select: { rating:true } },
  _count:   { select: { favorites:true } },
}

// ── GET /users/agencies ───────────────────────────────────────
export const getAgencies = async (req, res, next) => {
  try {
    const { search } = req.query

    const [agencies, sellers] = await Promise.all([

      // Agences immobilières
      prisma.agency.findMany({
        where: search ? {
          OR: [
            { name:    { contains: search, mode: 'insensitive' } },
            { city:    { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        } : undefined,
        select: {
          id:          true,
          name:        true,
          logo:        true,
          description: true,
          city:        true,
          address:     true,
          website:     true,
          verified:    true,
          createdAt:   true,
          owner: {
            select: {
              id:        true,
              firstName: true,
              lastName:  true,
              avatar:    true,
              role:      true,
            },
          },
          _count: {
            select: {
              properties: true,
              members:    true,
            },
          },
        },
        orderBy: [
          { verified:  'desc' },
          { createdAt: 'desc' },
        ],
      }),

      // Vendeurs particuliers sans agence
      prisma.user.findMany({
        where: {
          role:     'SELLER',
          agencyId: null,
          isActive: true,
          ...(search && {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName:  { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        select: {
          id:        true,
          firstName: true,
          lastName:  true,
          avatar:    true,
          role:      true,
          createdAt: true,
          _count: {
            select: { properties: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    res.json({
      agencies,
      sellers,
      total: agencies.length + sellers.length,
    })
  } catch (e) { next(e) }
}

// ── GET /users/agencies/:id ───────────────────────────────────
export const getAgencyDetail = async (req, res, next) => {
  try {
    const agency = await prisma.agency.findFirst({
      where: {
        OR: [
          { id:      req.params.id },
          { ownerId: req.params.id },
        ],
      },
      include: {
        owner: {
          select: {
            id:        true,
            firstName: true,
            lastName:  true,
            avatar:    true,
            email:     true,
            phone:     true,
            role:      true,
          },
        },
        members: {
          select: {
            id:        true,
            firstName: true,
            lastName:  true,
            avatar:    true,
            role:      true,
          },
        },
        properties: {
          where:   { status: 'ACTIVE' },
          include: propertyIncludes,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            properties: true,
            members:    true,
          },
        },
      },
    })

    if (!agency) return res.status(404).json({ message: 'Agence introuvable' })

    // Calcul note moyenne sur toutes les propriétés
    const allReviews = agency.properties.flatMap(p => p.reviews ?? [])
    const avgRating  = allReviews.length
      ? +(allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
      : null

    res.json({ ...agency, avgRating })
  } catch (e) { next(e) }
}

// ── GET /users/agencies/seller/:id ───────────────────────────
export const getSellerDetail = async (req, res, next) => {
  try {
    const seller = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        avatar:    true,
        email:     true,
        phone:     true,
        role:      true,
        isActive:  true,
        createdAt: true,
        properties: {
          where:   { status: 'ACTIVE' },
          include: propertyIncludes,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { properties: true },
        },
      },
    })

    if (!seller || !['SELLER','AGENCY'].includes(seller.role)) {
      return res.status(404).json({ message: 'Vendeur introuvable' })
    }

    const allReviews = seller.properties.flatMap(p => p.reviews ?? [])
    const avgRating  = allReviews.length
      ? +(allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
      : null

    res.json({ ...seller, avgRating })
  } catch (e) { next(e) }
}

// ── GET /users/me ─────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id:         true,
        firstName:  true,
        lastName:   true,
        email:      true,
        phone:      true,
        avatar:     true,
        role:       true,
        isVerified: true,
        isActive:   true,
        createdAt:  true,
        agency:     {
          select: {
            id:   true,
            name: true,
            logo: true,
            city: true,
          },
        },
        _count: {
          select: {
            properties: true,
            favorites:  true,
            bookings:   true,
          },
        },
      },
    })

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })
    res.json(user)
  } catch (e) { next(e) }
}

// ── PUT /users/me ─────────────────────────────────────────────
export const updateMe = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName  && { lastName  }),
        ...(phone     && { phone     }),
        ...(avatar    && { avatar    }),
      },
      select: {
        id:        true,
        firstName: true,
        lastName:  true,
        email:     true,
        phone:     true,
        avatar:    true,
        role:      true,
      },
    })

    res.json(user)
  } catch (e) { next(e) }
}

// ── GET /api/stats ────────────────────────────────────────────
export const getStats = async (req, res, next) => {
  try {
    const [properties, sellers, satisfaction] = await Promise.all([

      // Nombre de biens actifs
      prisma.property.count({
        where: { status: 'ACTIVE' },
      }),

      // Nombre de vendeurs vérifiés (agences + particuliers)
      prisma.user.count({
        where: {
          role:       { in: ['SELLER', 'AGENCY'] },
          isActive:   true,
          isVerified: true,
        },
      }),

      // Note moyenne globale de tous les avis
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
    ])

    const avgRating     = satisfaction._avg.rating ?? 5
    const satisfactionPct = Math.round((avgRating / 5) * 100)

    res.json({
      properties,
      sellers,
      satisfaction: satisfactionPct,
    })
  } catch (e) { next(e) }
}