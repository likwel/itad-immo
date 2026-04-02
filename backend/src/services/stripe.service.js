import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const createCheckoutSession = async ({ bookingId, amount, currency = 'eur', successUrl, cancelUrl }) => {
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: { currency, product_data: { name: 'Réservation itad-immo' }, unit_amount: Math.round(amount * 100) },
      quantity: 1
    }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { bookingId }
  })
}

export const constructWebhookEvent = (payload, sig) =>
  stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET)
