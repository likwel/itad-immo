import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const createReview = async (req, res, next) => {
  try {
    const { propertyId, rating, comment, title } = req.body
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Note entre 1 et 5' })
    const review = await prisma.review.create({
      data: { propertyId, authorId: req.user.id, rating: +rating, comment, title },
      include: { author: { select: { firstName:true, lastName:true, avatar:true } } }
    })
    res.status(201).json(review)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'Vous avez déjà laissé un avis' })
    next(e)
  }
}

export const getPropertyReviews = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { propertyId: req.params.propertyId, adminApproved: true },
      include: { author: { select: { firstName:true, lastName:true, avatar:true } } },
      orderBy: { createdAt: 'desc' }
    })
    const avg = reviews.length ? +(reviews.reduce((s,r) => s+r.rating, 0) / reviews.length).toFixed(1) : null
    res.json({ reviews, avgRating: avg, total: reviews.length })
  } catch (e) { next(e) }
}

export const deleteReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } })
    if (!review) return res.status(404).json({ message: 'Avis introuvable' })
    if (review.authorId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Accès refusé' })
    await prisma.review.delete({ where: { id: req.params.id } })
    res.json({ message: 'Avis supprimé' })
  } catch (e) { next(e) }
}
