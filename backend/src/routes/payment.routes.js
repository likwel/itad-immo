import { Router } from 'express'
import { createPaymentSession, stripeWebhook } from '../controllers/payment.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/create-session', authenticate, createPaymentSession)
r.post('/webhook',        stripeWebhook)
export default r
