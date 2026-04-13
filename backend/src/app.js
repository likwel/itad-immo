import express            from 'express'
import cors               from 'cors'
import helmet             from 'helmet'
import morgan             from 'morgan'
import rateLimit          from 'express-rate-limit'
import path               from 'path'
import { createServer }   from 'http'
import { fileURLToPath }  from 'url'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { createSocketServer } from './socket/index.js'

import authRoutes      from './routes/auth.routes.js'
import propertyRoutes  from './routes/property.routes.js'
import bookingRoutes   from './routes/booking.routes.js'
import reviewRoutes    from './routes/review.routes.js'
import paymentRoutes   from './routes/payment.routes.js'
import messageRoutes   from './routes/message.routes.js'
import adminRoutes     from './routes/admin.routes.js'
import categoryRoutes  from './routes/category.routes.js'
import uploadRoutes    from './routes/upload.routes.js'
import userRoutes      from './routes/user.routes.js'
import communityRoutes from './routes/community.routes.js'
import liveRoutes      from './routes/live.routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev     = process.env.NODE_ENV !== 'production'

const app        = express()
const httpServer = createServer(app)           // ← HTTP server pour Socket.io
const io         = createSocketServer(httpServer)

app.set('io', io)                              // ← accessible dans les controllers

// ── Sécurité ─────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan(isDev ? 'dev' : 'combined'))

// ── Fichiers statiques ────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ── No-cache API ──────────────────────────────────────────────
app.use('/api', (_, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  next()
})

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            100,
  skip:           () => isDev,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { message: 'Trop de requêtes, réessayez dans quelques minutes.' },
})
app.use('/api/', limiter)

// ── Body parsers ──────────────────────────────────────────────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/bookings',   bookingRoutes)
app.use('/api/reviews',    reviewRoutes)
app.use('/api/payments',   paymentRoutes)
app.use('/api/messages',   messageRoutes)
app.use('/api/admin',      adminRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/upload',     uploadRoutes)
app.use('/api/users',      userRoutes)
app.use('/api/community',  communityRoutes)
app.use('/api/lives',      liveRoutes)

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date() })
)

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.path} introuvable` })
)

// ── Erreurs ───────────────────────────────────────────────────
app.use(errorMiddleware)

export { httpServer }   // ← exporter httpServer, pas app
export default app