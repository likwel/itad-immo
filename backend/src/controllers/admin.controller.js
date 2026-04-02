import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const getDashboardStats = async (req, res, next) => {
  try {
    const [users, properties, bookings, revenue, pendingProps, recentBookings] = await Promise.all([
      prisma.user.count(),
      prisma.property.count({ where: { status: 'ACTIVE' } }),
      prisma.booking.count(),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.property.count({ where: { status: 'PENDING' } }),
      prisma.booking.findMany({
        take: 10, orderBy: { createdAt: 'desc' },
        include: {
          client:   { select: { firstName:true, lastName:true, email:true } },
          property: { select: { title:true, city:true } }
        }
      })
    ])
    const byListingType = await prisma.property.groupBy({
      by: ['listingType'], _count: true, where: { status: 'ACTIVE' }
    })
    const byCity = await prisma.property.groupBy({
      by: ['city'], _count: true, where: { status: 'ACTIVE' }, orderBy: { _count: { city: 'desc' } }, take: 5
    })
    res.json({ users, properties, bookings, revenue: revenue._sum.amount || 0,
               pendingProps, recentBookings, byListingType, byCity })
  } catch (e) { next(e) }
}

export const getAllProperties = async (req, res, next) => {
  try {
    const { page=1, limit=20, status, search } = req.query
    const where = {}
    if (status) where.status = status
    if (search) where.OR = [
      { title: { contains: search, mode:'insensitive' } },
      { city:  { contains: search, mode:'insensitive' } }
    ]
    const [total, data] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where, skip: (+page-1)*+limit, take: +limit,
        include: { owner: { select: { firstName:true, lastName:true, email:true } }, category:true },
        orderBy: { createdAt: 'desc' }
      })
    ])
    res.json({ data, total })
  } catch (e) { next(e) }
}

export const moderateProperty = async (req, res, next) => {
  try {
    const prop = await prisma.property.update({
      where: { id: req.params.id }, data: { status: req.body.status }
    })
    res.json(prop)
  } catch (e) { next(e) }
}

export const getAllUsers = async (req, res, next) => {
  try {
    const { page=1, limit=20, role, search } = req.query
    const where = {}
    if (role) where.role = role
    if (search) where.OR = [
      { email:     { contains: search, mode:'insensitive' } },
      { firstName: { contains: search, mode:'insensitive' } },
      { lastName:  { contains: search, mode:'insensitive' } }
    ]
    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where, skip: (+page-1)*+limit, take: +limit,
        select: { id:true, email:true, firstName:true, lastName:true, role:true,
                  isActive:true, createdAt:true,
                  _count: { select: { properties:true, bookings:true } } }
      })
    ])
    res.json({ data, total })
  } catch (e) { next(e) }
}

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })
    if (user.role === 'ADMIN') return res.status(400).json({ message: 'Impossible de désactiver un admin' })
    const updated = await prisma.user.update({
      where: { id: req.params.id }, data: { isActive: !user.isActive }
    })
    res.json({ isActive: updated.isActive })
  } catch (e) { next(e) }
}

export const approveReview = async (req, res, next) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id }, data: { adminApproved: true }
    })
    res.json(review)
  } catch (e) { next(e) }
}
