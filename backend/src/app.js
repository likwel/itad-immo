import express   from 'express'
import cors      from 'cors'
import helmet    from 'helmet'
import morgan    from 'morgan'
import rateLimit from 'express-rate-limit'
import { errorMiddleware } from './middlewares/error.middleware.js'

import authRoutes     from './routes/auth.routes.js'
import propertyRoutes from './routes/property.routes.js'
import bookingRoutes  from './routes/booking.routes.js'
import reviewRoutes   from './routes/review.routes.js'
import paymentRoutes  from './routes/payment.routes.js'
import messageRoutes  from './routes/message.routes.js'
import adminRoutes    from './routes/admin.routes.js'
import categoryRoutes from './routes/category.routes.js'

const app = express()
const isDev = process.env.NODE_ENV !== 'production'

// ── Sécurité ────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// ── Logs ────────────────────────────────────────────────────
app.use(morgan(isDev ? 'dev' : 'combined'))

// ── Désactiver le cache navigateur sur toutes les routes API
// Évite les 304 "Not Modified" qui retournent un body vide
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

// ── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 min
  max: 100,                           // requêtes max en prod
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,                  // désactivé en développement
  message: { message: 'Trop de requêtes, réessayez dans quelques minutes.' },
})
app.use('/api/', limiter)

// ── Body parsers ─────────────────────────────────────────────
// Stripe webhook doit recevoir le body brut AVANT express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',       authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/bookings',   bookingRoutes)
app.use('/api/reviews',    reviewRoutes)
app.use('/api/payments',   paymentRoutes)
app.use('/api/messages',   messageRoutes)
app.use('/api/admin',      adminRoutes)
app.use('/api/categories', categoryRoutes)

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date() })
})

// ── 404 pour les routes inconnues ────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} introuvable` })
})

// ── Gestionnaire d'erreurs global ────────────────────────────
app.use(errorMiddleware)

export default app