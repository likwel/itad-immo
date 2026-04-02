import { PrismaClient } from '@prisma/client'
import { createCheckoutSession, constructWebhookEvent } from '../services/stripe.service.js'
const prisma = new PrismaClient()

export const createPaymentSession = async (req, res, next) => {
  try {
    const { bookingId } = req.body
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { property:true } })
    if (!booking) return res.status(404).json({ message: 'Réservation introuvable' })
    if (booking.clientId !== req.user.id) return res.status(403).json({ message: 'Accès refusé' })

    const session = await createCheckoutSession({
      bookingId,
      amount: booking.totalPrice,
      successUrl: `${process.env.FRONTEND_URL}/paiement/success?booking=${bookingId}`,
      cancelUrl:  `${process.env.FRONTEND_URL}/paiement/cancel?booking=${bookingId}`
    })

    await prisma.payment.upsert({
      where: { bookingId },
      update: { stripeSessionId: session.id, status: 'PENDING' },
      create: { bookingId, userId: req.user.id, amount: booking.totalPrice,
                stripeSessionId: session.id, status: 'PENDING' }
    })
    res.json({ url: session.url, sessionId: session.id })
  } catch (e) { next(e) }
}

export const stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature']
    const event = constructWebhookEvent(req.body, sig)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: { status: 'PAID', paidAt: new Date(), stripePaymentId: session.payment_intent }
      })
      const payment = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } })
      await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'CONFIRMED' } })
    }
    res.json({ received: true })
  } catch (e) { next(e) }
}
