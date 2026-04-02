import { PrismaClient } from '@prisma/client'
import { sendBookingConfirmation } from '../services/email.service.js'
const prisma = new PrismaClient()

export const createBooking = async (req, res, next) => {
  try {
    const { propertyId, startDate, endDate, notes, isQuote } = req.body
    const prop = await prisma.property.findUnique({ where: { id: propertyId } })
    if (!prop) return res.status(404).json({ message: 'Bien introuvable' })
    let totalPrice = prop.price
    if (endDate && startDate) {
      const days = (new Date(endDate) - new Date(startDate)) / 86400000
      totalPrice = prop.price * Math.max(days, 1)
    }
    const booking = await prisma.booking.create({
      data: { propertyId, clientId: req.user.id,
              startDate: new Date(startDate),
              endDate: endDate ? new Date(endDate) : null,
              totalPrice, notes, isQuote: !!isQuote },
      include: { property: { select: { title:true, images:true, city:true } } }
    })
    res.status(201).json(booking)
  } catch (e) { next(e) }
}

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { clientId: req.user.id },
      include: { property: { select: { title:true, images:true, city:true, address:true } }, payment:true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(bookings)
  } catch (e) { next(e) }
}

export const getPropertyBookings = async (req, res, next) => {
  try {
    const { propertyId } = req.params
    const prop = await prisma.property.findUnique({ where: { id: propertyId } })
    if (!prop || (prop.ownerId !== req.user.id && req.user.role !== 'ADMIN'))
      return res.status(403).json({ message: 'Accès refusé' })
    const bookings = await prisma.booking.findMany({
      where: { propertyId },
      include: { client: { select: { firstName:true, lastName:true, email:true, phone:true } }, payment:true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(bookings)
  } catch (e) { next(e) }
}

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { property:true, client:true }
    })
    if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
    if (booking.property.ownerId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Accès refusé' })
    const updated = await prisma.booking.update({ where: { id: req.params.id }, data: { status } })
    if (status === 'CONFIRMED')
      await sendBookingConfirmation(booking.client.email, { ...booking, property: booking.property }).catch(console.warn)
    res.json(updated)
  } catch (e) { next(e) }
}
