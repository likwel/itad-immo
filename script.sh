#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║         itad-immo — Script de setup complet                ║
# ║  Usage : chmod +x setup-itad-immo.sh && ./setup-itad-immo.sh ║
# ╚══════════════════════════════════════════════════════════╝

set -e  # arrêt immédiat si une commande échoue

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${GREEN}✔ $1${NC}"; }
info() { echo -e "${BLUE}▶ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
err()  { echo -e "${RED}✖ $1${NC}"; exit 1; }

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║         🏠  itad-immo Setup Script             ║"
echo "║         React + Node.js + Prisma + PG        ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

ROOT="itad-immo"
mkdir -p "$ROOT" && cd "$ROOT"
log "Dossier racine créé : $ROOT"

# ══════════════════════════════════════════════════
# 1. ARBORESCENCE
# ══════════════════════════════════════════════════
info "Création de l'arborescence..."

# Backend
mkdir -p backend/{prisma,src/{controllers,routes,middlewares,services,utils}}

# Frontend
mkdir -p frontend/src/{pages,dashboards,components/{layout,property,booking,review,admin,ui},hooks,store,services}
mkdir -p frontend/public

log "Arborescence créée"

# ══════════════════════════════════════════════════
# 2. BACKEND — package.json
# ══════════════════════════════════════════════════
info "Génération backend/package.json..."
cat > backend/package.json << 'EOF'
{
  "name": "itad-immo-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "db:push": "npx prisma db push",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "node prisma/seed.js",
    "db:studio": "npx prisma studio",
    "db:reset": "npx prisma migrate reset"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cloudinary": "^2.5.1",
    "cors": "^2.8.5",
    "express": "^4.21.1",
    "helmet": "^7.2.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.16",
    "slugify": "^1.6.6",
    "stripe": "^17.3.1",
    "pdfkit": "^0.15.0",
    "socket.io": "^4.8.1",
    "express-rate-limit": "^7.4.1",
    "express-validator": "^7.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.7",
    "prisma": "^5.22.0"
  }
}
EOF
log "backend/package.json"

# ══════════════════════════════════════════════════
# 3. BACKEND — .env
# ══════════════════════════════════════════════════
cat > backend/.env << 'EOF'
# Base de données
DATABASE_URL="postgresql://postgres:password@localhost:5432/itad-immo"

# JWT
JWT_SECRET="itad-immo-super-secret-jwt-key-change-in-production-2024"
JWT_EXPIRES_IN="7d"

# Serveur
PORT=4000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"

# Cloudinary (upload images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (paiements)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (SendGrid ou SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_email_password
FROM_EMAIL="itad-immo <noreply@itad-immo.mg>"
EOF
log "backend/.env"

# ══════════════════════════════════════════════════
# 4. PRISMA SCHEMA
# ══════════════════════════════════════════════════
info "Génération du schéma Prisma..."
cat > backend/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  CLIENT
  SELLER
  AGENCY
  ADMIN
}

enum PropertyType {
  HOUSE
  VILLA
  APARTMENT
  LAND
  OFFICE
  WAREHOUSE
}

enum ListingType {
  SALE
  RENT
  VACATION_RENT
}

enum PropertyStatus {
  PENDING
  ACTIVE
  RENTED
  SOLD
  ARCHIVED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum MessageStatus {
  SENT
  READ
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  firstName   String
  lastName    String
  phone       String?
  avatar      String?
  role        Role     @default(CLIENT)
  isVerified  Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  properties       Property[]
  bookings         Booking[]
  reviews          Review[]
  favorites        Favorite[]
  sentMessages     Message[]  @relation("SentMessages")
  receivedMessages Message[]  @relation("ReceivedMessages")
  payments         Payment[]
  agency           Agency?    @relation("AgencyOwner")
  agencyMember     Agency?    @relation("AgencyMembers", fields: [agencyId], references: [id])
  agencyId         String?

  @@map("users")
}

model Agency {
  id          String   @id @default(cuid())
  name        String
  logo        String?
  description String?
  website     String?
  address     String?
  city        String?
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())

  owner       User       @relation("AgencyOwner", fields: [ownerId], references: [id])
  ownerId     String     @unique
  members     User[]     @relation("AgencyMembers")
  properties  Property[]

  @@map("agencies")
}

model Category {
  id         String     @id @default(cuid())
  name       String     @unique
  slug       String     @unique
  icon       String?
  color      String?
  isActive   Boolean    @default(true)
  position   Int        @default(0)
  properties Property[]

  @@map("categories")
}

model Property {
  id           String         @id @default(cuid())
  title        String
  slug         String         @unique
  description  String
  propertyType PropertyType
  listingType  ListingType
  status       PropertyStatus @default(PENDING)
  price        Float
  priceUnit    String         @default("MGA")
  negotiable   Boolean        @default(false)
  area         Float?
  bedrooms     Int?
  bathrooms    Int?
  floors       Int?
  parkingSpots Int?
  furnished    Boolean        @default(false)
  yearBuilt    Int?
  address      String
  city         String
  district     String?
  country      String         @default("MG")
  latitude     Float?
  longitude    Float?
  images       String[]
  videos       String[]
  virtualTour  String?
  amenities    String[]
  metaTitle    String?
  metaDesc     String?
  viewCount    Int            @default(0)
  featured     Boolean        @default(false)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  owner          User           @relation(fields: [ownerId], references: [id])
  ownerId        String
  agency         Agency?        @relation(fields: [agencyId], references: [id])
  agencyId       String?
  category       Category       @relation(fields: [categoryId], references: [id])
  categoryId     String
  bookings       Booking[]
  reviews        Review[]
  favorites      Favorite[]
  availabilities Availability[]

  @@index([latitude, longitude])
  @@index([city, listingType, status])
  @@index([price])
  @@map("properties")
}

model Availability {
  id         String   @id @default(cuid())
  startDate  DateTime
  endDate    DateTime
  isBooked   Boolean  @default(false)
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  propertyId String

  @@map("availabilities")
}

model Booking {
  id         String        @id @default(cuid())
  startDate  DateTime
  endDate    DateTime?
  status     BookingStatus @default(PENDING)
  totalPrice Float
  notes      String?
  isQuote    Boolean       @default(false)
  quoteRef   String?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  client     User     @relation(fields: [clientId], references: [id])
  clientId   String
  property   Property @relation(fields: [propertyId], references: [id])
  propertyId String
  payment    Payment?

  @@map("bookings")
}

model Payment {
  id              String        @id @default(cuid())
  amount          Float
  currency        String        @default("EUR")
  status          PaymentStatus @default(PENDING)
  stripePaymentId String?       @unique
  stripeSessionId String?       @unique
  method          String?
  invoiceUrl      String?
  paidAt          DateTime?
  createdAt       DateTime      @default(now())

  booking   Booking @relation(fields: [bookingId], references: [id])
  bookingId String  @unique
  user      User    @relation(fields: [userId], references: [id])
  userId    String

  @@map("payments")
}

model Review {
  id            String   @id @default(cuid())
  rating        Int
  title         String?
  comment       String
  isVerified    Boolean  @default(false)
  adminApproved Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  author     User     @relation(fields: [authorId], references: [id])
  authorId   String
  property   Property @relation(fields: [propertyId], references: [id])
  propertyId String

  @@unique([authorId, propertyId])
  @@map("reviews")
}

model Favorite {
  id         String   @id @default(cuid())
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  property   Property @relation(fields: [propertyId], references: [id])
  propertyId String

  @@unique([userId, propertyId])
  @@map("favorites")
}

model Message {
  id         String        @id @default(cuid())
  content    String
  status     MessageStatus @default(SENT)
  subject    String?
  propertyId String?
  createdAt  DateTime      @default(now())

  sender     User @relation("SentMessages",    fields: [senderId],   references: [id])
  senderId   String
  receiver   User @relation("ReceivedMessages", fields: [receiverId], references: [id])
  receiverId String

  @@index([senderId, receiverId])
  @@map("messages")
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  body      String
  type      String
  isRead    Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@map("notifications")
}
EOF
log "backend/prisma/schema.prisma"

# ══════════════════════════════════════════════════
# 5. PRISMA SEED
# ══════════════════════════════════════════════════
cat > backend/prisma/seed.js << 'EOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@itad-immo.mg' },
    update: {},
    create: {
      email: 'admin@itad-immo.mg',
      password: await bcrypt.hash('Admin1234!', 12),
      firstName: 'Admin',
      lastName: 'itad-immo',
      role: 'ADMIN',
      isVerified: true,
    }
  })

  // Vendeur demo
  const seller = await prisma.user.upsert({
    where: { email: 'vendeur@itad-immo.mg' },
    update: {},
    create: {
      email: 'vendeur@itad-immo.mg',
      password: await bcrypt.hash('Seller123!', 12),
      firstName: 'Jean',
      lastName: 'Rakoto',
      role: 'SELLER',
      phone: '+261 34 00 000 00',
      isVerified: true,
    }
  })

  // Client demo
  await prisma.user.upsert({
    where: { email: 'client@itad-immo.mg' },
    update: {},
    create: {
      email: 'client@itad-immo.mg',
      password: await bcrypt.hash('Client123!', 12),
      firstName: 'Marie',
      lastName: 'Rasoa',
      role: 'CLIENT',
      isVerified: true,
    }
  })

  // Catégories
  const categories = [
    { name: 'Location',   slug: 'location',   icon: '🏠', color: '#3b82f6', position: 1 },
    { name: 'Vente',      slug: 'vente',       icon: '🏡', color: '#22c55e', position: 2 },
    { name: 'Vacances',   slug: 'vacances',    icon: '🏖️', color: '#f59e0b', position: 3 },
    { name: 'Bureaux',    slug: 'bureaux',     icon: '🏢', color: '#8b5cf6', position: 4 },
    { name: 'Terrain',    slug: 'terrain',     icon: '🌿', color: '#10b981', position: 5 },
    { name: 'Colocation', slug: 'colocation',  icon: '👥', color: '#ec4899', position: 6 },
  ]

  let cat
  for (const c of categories) {
    cat = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }

  // Biens demo
  const locationCat = await prisma.category.findUnique({ where: { slug: 'location' } })
  const venteCat    = await prisma.category.findUnique({ where: { slug: 'vente' } })

  await prisma.property.upsert({
    where: { slug: 'belle-villa-antananarivo-demo' },
    update: {},
    create: {
      title: 'Belle villa à Antananarivo',
      slug: 'belle-villa-antananarivo-demo',
      description: 'Magnifique villa moderne avec jardin, piscine et vue panoramique sur la ville.',
      propertyType: 'VILLA',
      listingType: 'SALE',
      status: 'ACTIVE',
      price: 450000000,
      priceUnit: 'MGA',
      area: 350,
      bedrooms: 4,
      bathrooms: 3,
      parkingSpots: 2,
      furnished: true,
      address: 'Lot IVR 45, Ivandry',
      city: 'Antananarivo',
      district: 'Ivandry',
      latitude: -18.8792,
      longitude: 47.5079,
      images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'],
      amenities: ['pool', 'garden', 'security', 'wifi', 'garage'],
      featured: true,
      ownerId: seller.id,
      categoryId: venteCat.id,
    }
  })

  await prisma.property.upsert({
    where: { slug: 'appartement-moderne-tana-demo' },
    update: {},
    create: {
      title: 'Appartement moderne centre-ville',
      slug: 'appartement-moderne-tana-demo',
      description: 'Bel appartement refait à neuf, idéalement situé en centre-ville.',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      status: 'ACTIVE',
      price: 1500000,
      priceUnit: 'MGA',
      area: 80,
      bedrooms: 2,
      bathrooms: 1,
      furnished: true,
      address: 'Avenue de l\'Indépendance',
      city: 'Antananarivo',
      district: 'Analakely',
      latitude: -18.9112,
      longitude: 47.5362,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      amenities: ['wifi', 'elevator', 'security'],
      featured: true,
      ownerId: seller.id,
      categoryId: locationCat.id,
    }
  })

  console.log('✅ Seed terminé!')
  console.log('📧 Admin:   admin@itad-immo.mg  / Admin1234!')
  console.log('📧 Vendeur: vendeur@itad-immo.mg / Seller123!')
  console.log('📧 Client:  client@itad-immo.mg  / Client123!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
EOF
log "backend/prisma/seed.js"

# ══════════════════════════════════════════════════
# 6. BACKEND — src/server.js
# ══════════════════════════════════════════════════
cat > backend/src/server.js << 'EOF'
import { createServer } from 'http'
import { Server }       from 'socket.io'
import app from './app.js'

const PORT     = process.env.PORT || 4000
const httpServer = createServer(app)

// Socket.io pour messagerie temps réel
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET','POST'] }
})

io.on('connection', socket => {
  console.log('🔌 Client connecté:', socket.id)
  socket.on('join_room', userId => socket.join(userId))
  socket.on('send_message', data => {
    io.to(data.receiverId).emit('receive_message', data)
  })
  socket.on('disconnect', () => console.log('Client déconnecté:', socket.id))
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`)
  console.log(`📦 Environnement: ${process.env.NODE_ENV}`)
})
EOF
log "backend/src/server.js"

# ══════════════════════════════════════════════════
# 7. BACKEND — app.js
# ══════════════════════════════════════════════════
cat > backend/src/app.js << 'EOF'
import express        from 'express'
import cors           from 'cors'
import helmet         from 'helmet'
import morgan         from 'morgan'
import rateLimit      from 'express-rate-limit'
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

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use('/api/', limiter)

// Stripe webhook AVANT json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth',       authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/bookings',   bookingRoutes)
app.use('/api/reviews',    reviewRoutes)
app.use('/api/payments',   paymentRoutes)
app.use('/api/messages',   messageRoutes)
app.use('/api/admin',      adminRoutes)
app.use('/api/categories', categoryRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use(errorMiddleware)
export default app
EOF
log "backend/src/app.js"

# ══════════════════════════════════════════════════
# 8. MIDDLEWARES
# ══════════════════════════════════════════════════
cat > backend/src/middlewares/auth.middleware.js << 'EOF'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Non autorisé — token manquant' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true }
    })
    if (!req.user?.isActive) return res.status(401).json({ message: 'Compte désactivé' })
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré' })
  }
}

export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next()
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
    })
  } catch {}
  next()
}
EOF

cat > backend/src/middlewares/role.middleware.js << 'EOF'
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' })
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: `Accès réservé aux rôles: ${roles.join(', ')}` })
  next()
}
EOF

cat > backend/src/middlewares/upload.middleware.js << 'EOF'
import multer from 'multer'

const storage = multer.memoryStorage()
const fileFilter = (_, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Format non supporté (jpg/png/webp uniquement)'), false)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 } // 5MB max par fichier
})
EOF

cat > backend/src/middlewares/error.middleware.js << 'EOF'
export const errorMiddleware = (err, req, res, next) => {
  console.error('❌ Erreur:', err.message)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
EOF
log "Middlewares créés"

# ══════════════════════════════════════════════════
# 9. UTILS
# ══════════════════════════════════════════════════
cat > backend/src/utils/jwt.util.js << 'EOF'
import jwt from 'jsonwebtoken'
export const signToken  = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
export const verifyToken = token => jwt.verify(token, process.env.JWT_SECRET)
EOF

cat > backend/src/utils/response.util.js << 'EOF'
export const ok      = (res, data, status = 200) => res.status(status).json(data)
export const created = (res, data) => res.status(201).json(data)
export const noContent = res => res.status(204).send()
export const paginate = (data, total, page, limit) => ({
  data, total, page: +page,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1
})
EOF

cat > backend/src/utils/geo.util.js << 'EOF'
const deg2rad = d => d * (Math.PI / 180)
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
EOF
log "Utils créés"

# ══════════════════════════════════════════════════
# 10. SERVICES
# ══════════════════════════════════════════════════
cat > backend/src/services/cloudinary.service.js << 'EOF'
import { v2 as cloudinary } from 'cloudinary'
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
export const uploadToCloudinary = (buffer, folder = 'properties') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result.secure_url))
    stream.end(buffer)
  })

export const deleteFromCloudinary = publicId =>
  cloudinary.uploader.destroy(publicId)
EOF

cat > backend/src/services/stripe.service.js << 'EOF'
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
EOF

cat > backend/src/services/email.service.js << 'EOF'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: +process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
})

export const sendEmail = ({ to, subject, html }) =>
  transporter.sendMail({ from: process.env.FROM_EMAIL, to, subject, html })

export const sendBookingConfirmation = (to, booking) =>
  sendEmail({
    to,
    subject: '✅ Réservation confirmée — itad-immo',
    html: `<h2>Votre réservation est confirmée!</h2>
           <p>Bien: <strong>${booking.property.title}</strong></p>
           <p>Date: ${new Date(booking.startDate).toLocaleDateString('fr-FR')}</p>
           <p>Montant: <strong>${booking.totalPrice.toLocaleString()} MGA</strong></p>`
  })
EOF
log "Services créés"

# ══════════════════════════════════════════════════
# 11. CONTROLLERS
# ══════════════════════════════════════════════════
cat > backend/src/controllers/auth.controller.js << 'EOF'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { signToken } from '../utils/jwt.util.js'
const prisma = new PrismaClient()

const safeUser = u => {
  const { password, ...rest } = u
  return rest
}

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body
    if (!email || !password || !firstName || !lastName)
      return res.status(400).json({ message: 'Champs requis manquants' })
    if (await prisma.user.findUnique({ where: { email } }))
      return res.status(409).json({ message: 'Email déjà utilisé' })
    const allowedRoles = ['CLIENT', 'SELLER', 'AGENCY']
    const safeRole = allowedRoles.includes(role) ? role : 'CLIENT'
    const user = await prisma.user.create({
      data: { email, password: await bcrypt.hash(password, 12), firstName, lastName, phone, role: safeRole }
    })
    res.status(201).json({ token: signToken(user.id), user: safeUser(user) })
  } catch (e) { next(e) }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ message: 'Identifiants incorrects' })
    if (!user.isActive)
      return res.status(403).json({ message: 'Compte désactivé, contactez le support' })
    res.json({ token: signToken(user.id), user: safeUser(user) })
  } catch (e) { next(e) }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id:true, email:true, firstName:true, lastName:true, phone:true, avatar:true, role:true, createdAt:true,
                _count: { select: { properties:true, bookings:true, favorites:true } } }
    })
    res.json(user)
  } catch (e) { next(e) }
}

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone },
      select: { id:true, firstName:true, lastName:true, phone:true, avatar:true }
    })
    res.json(user)
  } catch (e) { next(e) }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!await bcrypt.compare(currentPassword, user.password))
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' })
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: await bcrypt.hash(newPassword, 12) }
    })
    res.json({ message: 'Mot de passe mis à jour' })
  } catch (e) { next(e) }
}
EOF

cat > backend/src/controllers/property.controller.js << 'EOF'
import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'
import { uploadToCloudinary } from '../services/cloudinary.service.js'
import { getDistanceKm } from '../utils/geo.util.js'
import { paginate } from '../utils/response.util.js'
const prisma = new PrismaClient()

const propertyIncludes = {
  owner:    { select: { id:true, firstName:true, lastName:true, avatar:true, phone:true } },
  agency:   { select: { id:true, name:true, logo:true } },
  category: { select: { id:true, name:true, slug:true, icon:true, color:true } },
  reviews:  { select: { rating:true } },
  _count:   { select: { favorites:true, reviews:true } }
}

export const getProperties = async (req, res, next) => {
  try {
    const { page=1, limit=12, lat, lng, radius=10, listingType, propertyType,
            categoryId, categorySlug, minPrice, maxPrice, minArea, maxArea,
            bedrooms, city, search, sortBy='createdAt', sortDir='desc', featured } = req.query
    const where = { status: 'ACTIVE' }
    if (listingType)   where.listingType   = listingType
    if (propertyType)  where.propertyType  = propertyType
    if (categoryId)    where.categoryId    = categoryId
    if (categorySlug)  where.category      = { slug: categorySlug }
    if (featured === 'true') where.featured = true
    if (city)   where.city = { contains: city, mode: 'insensitive' }
    if (search) where.OR = [
      { title: { contains: search, mode:'insensitive' } },
      { description: { contains: search, mode:'insensitive' } },
      { address: { contains: search, mode:'insensitive' } },
      { city: { contains: search, mode:'insensitive' } }
    ]
    if (minPrice || maxPrice) where.price = {
      ...(minPrice && { gte: +minPrice }), ...(maxPrice && { lte: +maxPrice })
    }
    if (minArea || maxArea) where.area = {
      ...(minArea && { gte: +minArea }), ...(maxArea && { lte: +maxArea })
    }
    if (bedrooms) where.bedrooms = { gte: +bedrooms }

    const skip = (+page - 1) * +limit
    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({ where, skip, take: +limit, orderBy: { [sortBy]: sortDir }, include: propertyIncludes })
    ])

    const result = properties.map(p => ({
      ...p,
      avgRating: p.reviews.length ? +(p.reviews.reduce((s, r) => s+r.rating, 0) / p.reviews.length).toFixed(1) : null,
      distance: (lat && lng && p.latitude && p.longitude)
        ? +getDistanceKm(+lat, +lng, p.latitude, p.longitude).toFixed(2) : null
    }))

    const filtered = (lat && lng)
      ? result.filter(p => p.distance <= +radius).sort((a,b) => a.distance - b.distance)
      : result

    res.json(paginate(filtered, total, page, limit))
  } catch (e) { next(e) }
}

export const getProperty = async (req, res, next) => {
  try {
    const p = await prisma.property.findUnique({
      where: { slug: req.params.slug },
      include: { ...propertyIncludes,
        reviews: { include: { author: { select: { firstName:true, lastName:true, avatar:true } } }, orderBy: { createdAt:'desc' } },
        availabilities: { where: { startDate: { gte: new Date() } } }
      }
    })
    if (!p) return res.status(404).json({ message: 'Bien introuvable' })
    await prisma.property.update({ where: { id: p.id }, data: { viewCount: { increment: 1 } } })
    const avgRating = p.reviews.length
      ? +(p.reviews.reduce((s,r) => s+r.rating, 0) / p.reviews.length).toFixed(1) : null
    res.json({ ...p, avgRating })
  } catch (e) { next(e) }
}

export const createProperty = async (req, res, next) => {
  try {
    const data = req.body
    const slug = slugify(`${data.title}-${Date.now()}`, { lower:true, strict:true })
    let images = data.images || []
    if (req.files?.length)
      images = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer, 'properties')))
    const property = await prisma.property.create({
      data: { ...data, slug, images,
              ownerId: req.user.id,
              price: +data.price,
              area: data.area ? +data.area : null,
              bedrooms: data.bedrooms ? +data.bedrooms : null,
              bathrooms: data.bathrooms ? +data.bathrooms : null,
              amenities: data.amenities || [] }
    })
    res.status(201).json(property)
  } catch (e) { next(e) }
}

export const updateProperty = async (req, res, next) => {
  try {
    const prop = await prisma.property.findUnique({ where: { id: req.params.id } })
    if (!prop) return res.status(404).json({ message: 'Bien introuvable' })
    if (prop.ownerId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Accès refusé' })
    const updated = await prisma.property.update({ where: { id: req.params.id }, data: req.body })
    res.json(updated)
  } catch (e) { next(e) }
}

export const deleteProperty = async (req, res, next) => {
  try {
    const prop = await prisma.property.findUnique({ where: { id: req.params.id } })
    if (!prop) return res.status(404).json({ message: 'Bien introuvable' })
    if (prop.ownerId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Accès refusé' })
    await prisma.property.update({ where: { id: req.params.id }, data: { status: 'ARCHIVED' } })
    res.json({ message: 'Bien archivé avec succès' })
  } catch (e) { next(e) }
}

export const toggleFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params
    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: req.user.id, propertyId } }
    })
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      return res.json({ favorited: false })
    }
    await prisma.favorite.create({ data: { userId: req.user.id, propertyId } })
    res.json({ favorited: true })
  } catch (e) { next(e) }
}

export const getMyProperties = async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      include: { category:true, _count: { select: { bookings:true, reviews:true, favorites:true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(properties)
  } catch (e) { next(e) }
}
EOF

cat > backend/src/controllers/booking.controller.js << 'EOF'
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
EOF

cat > backend/src/controllers/review.controller.js << 'EOF'
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
EOF

cat > backend/src/controllers/payment.controller.js << 'EOF'
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
EOF

cat > backend/src/controllers/message.controller.js << 'EOF'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, subject, propertyId } = req.body
    const msg = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, content, subject, propertyId },
      include: { sender: { select: { firstName:true, lastName:true, avatar:true } } }
    })
    // Notification
    await prisma.notification.create({
      data: { userId: receiverId, title: 'Nouveau message', body: `De: ${msg.sender.firstName}`,
              type: 'message', link: `/messages/${req.user.id}` }
    })
    res.status(201).json(msg)
  } catch (e) { next(e) }
}

export const getConversations = async (req, res, next) => {
  try {
    const msgs = await prisma.message.findMany({
      where: { OR: [{ senderId: req.user.id }, { receiverId: req.user.id }] },
      include: {
        sender:   { select: { id:true, firstName:true, lastName:true, avatar:true } },
        receiver: { select: { id:true, firstName:true, lastName:true, avatar:true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    // Grouper par interlocuteur
    const convMap = {}
    for (const m of msgs) {
      const otherId = m.senderId === req.user.id ? m.receiverId : m.senderId
      if (!convMap[otherId]) convMap[otherId] = { messages: [], other: m.senderId === req.user.id ? m.receiver : m.sender }
      convMap[otherId].messages.push(m)
    }
    res.json(Object.values(convMap))
  } catch (e) { next(e) }
}

export const getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params
    const messages = await prisma.message.findMany({
      where: { OR: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ]},
      include: { sender: { select: { firstName:true, lastName:true, avatar:true } } },
      orderBy: { createdAt: 'asc' }
    })
    // Marquer comme lus
    await prisma.message.updateMany({
      where: { senderId: userId, receiverId: req.user.id, status: 'SENT' },
      data: { status: 'READ' }
    })
    res.json(messages)
  } catch (e) { next(e) }
}
EOF

cat > backend/src/controllers/admin.controller.js << 'EOF'
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
EOF
log "Controllers créés"

# ══════════════════════════════════════════════════
# 12. ROUTES
# ══════════════════════════════════════════════════
cat > backend/src/routes/auth.routes.js << 'EOF'
import { Router } from 'express'
import { register, login, getMe, updateProfile, changePassword } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/register', register)
r.post('/login',    login)
r.get('/me',        authenticate, getMe)
r.put('/me',        authenticate, updateProfile)
r.put('/me/password', authenticate, changePassword)
export default r
EOF

cat > backend/src/routes/property.routes.js << 'EOF'
import { Router } from 'express'
import { getProperties, getProperty, createProperty, updateProperty,
         deleteProperty, toggleFavorite, getMyProperties } from '../controllers/property.controller.js'
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/role.middleware.js'
import { upload } from '../middlewares/upload.middleware.js'
const r = Router()
r.get('/',           optionalAuth, getProperties)
r.get('/my',         authenticate, getMyProperties)
r.get('/:slug',      optionalAuth, getProperty)
r.post('/',          authenticate, requireRole('SELLER','AGENCY','ADMIN'), upload.array('images', 10), createProperty)
r.put('/:id',        authenticate, updateProperty)
r.delete('/:id',     authenticate, deleteProperty)
r.post('/:propertyId/favorite', authenticate, toggleFavorite)
export default r
EOF

cat > backend/src/routes/booking.routes.js << 'EOF'
import { Router } from 'express'
import { createBooking, getMyBookings, getPropertyBookings, updateBookingStatus } from '../controllers/booking.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/',                    authenticate, createBooking)
r.get('/my',                   authenticate, getMyBookings)
r.get('/property/:propertyId', authenticate, getPropertyBookings)
r.put('/:id/status',           authenticate, updateBookingStatus)
export default r
EOF

cat > backend/src/routes/review.routes.js << 'EOF'
import { Router } from 'express'
import { createReview, getPropertyReviews, deleteReview } from '../controllers/review.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/',                     authenticate, createReview)
r.get('/property/:propertyId',  getPropertyReviews)
r.delete('/:id',                authenticate, deleteReview)
export default r
EOF

cat > backend/src/routes/payment.routes.js << 'EOF'
import { Router } from 'express'
import { createPaymentSession, stripeWebhook } from '../controllers/payment.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/create-session', authenticate, createPaymentSession)
r.post('/webhook',        stripeWebhook)
export default r
EOF

cat > backend/src/routes/message.routes.js << 'EOF'
import { Router } from 'express'
import { sendMessage, getConversations, getConversation } from '../controllers/message.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/',               authenticate, sendMessage)
r.get('/conversations',   authenticate, getConversations)
r.get('/:userId',         authenticate, getConversation)
export default r
EOF

cat > backend/src/routes/admin.routes.js << 'EOF'
import { Router } from 'express'
import { getDashboardStats, getAllProperties, moderateProperty,
         getAllUsers, toggleUserStatus, approveReview } from '../controllers/admin.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/role.middleware.js'
const guard = [authenticate, requireRole('ADMIN')]
const r = Router()
r.get('/stats',                    ...guard, getDashboardStats)
r.get('/properties',               ...guard, getAllProperties)
r.put('/properties/:id/moderate',  ...guard, moderateProperty)
r.get('/users',                    ...guard, getAllUsers)
r.put('/users/:id/toggle',         ...guard, toggleUserStatus)
r.put('/reviews/:id/approve',      ...guard, approveReview)
export default r
EOF

cat > backend/src/routes/category.routes.js << 'EOF'
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/role.middleware.js'
const prisma = new PrismaClient()
const r = Router()
r.get('/',     async (_, res) => res.json(await prisma.category.findMany({ where: { isActive:true }, orderBy: { position:'asc' } })))
r.post('/',    authenticate, requireRole('ADMIN'), async (req, res) => res.status(201).json(await prisma.category.create({ data: req.body })))
r.put('/:id',  authenticate, requireRole('ADMIN'), async (req, res) => res.json(await prisma.category.update({ where: { id: req.params.id }, data: req.body })))
r.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } })
  res.json({ message: 'Catégorie désactivée' })
})
export default r
EOF
log "Routes créées"

# ══════════════════════════════════════════════════
# 13. FRONTEND — package.json & config
# ══════════════════════════════════════════════════
info "Génération frontend..."

cat > frontend/package.json << 'EOF'
{
  "name": "itad-immo-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@reduxjs/toolkit": "^2.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-redux": "^9.1.2",
    "react-router-dom": "^6.28.0",
    "react-calendar": "^5.1.0",
    "react-image-gallery": "^1.3.0",
    "socket.io-client": "^4.8.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "vite": "^6.0.1"
  }
}
EOF

cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
EOF

cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6',
          600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a'
        }
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    }
  },
  plugins: []
}
EOF

cat > frontend/postcss.config.js << 'EOF'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
EOF

cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000' } }
})
EOF

cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>itad-immo — L'immobilier à Madagascar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOF
log "Config frontend"

# ══════════════════════════════════════════════════
# 14. FRONTEND — main.jsx & App.jsx
# ══════════════════════════════════════════════════
cat > frontend/src/main.jsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
)
EOF

cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; @apply text-slate-800 bg-slate-50; }
  a { @apply no-underline; }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md;
  }
  .btn-secondary {
    @apply bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-6 py-2.5 rounded-xl font-semibold transition-all;
  }
  .card {
    @apply bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden;
  }
  .input {
    @apply w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all;
  }
  .label {
    @apply block text-sm font-medium text-slate-700 mb-1.5;
  }
}
EOF

cat > frontend/src/App.jsx << 'EOF'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home           from './pages/Home'
import Listings       from './pages/Listings'
import PropertyDetail from './pages/PropertyDetail'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Booking        from './pages/Booking'
import Payment        from './pages/Payment'
import ClientDashboard  from './dashboards/ClientDashboard'
import SellerDashboard  from './dashboards/SellerDashboard'
import AdminDashboard   from './dashboards/AdminDashboard'
import NotFound         from './pages/NotFound'

const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/"               element={<Home />} />
            <Route path="/annonces"       element={<Listings />} />
            <Route path="/annonces/:slug" element={<PropertyDetail />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/espace-client"  element={<PrivateRoute><ClientDashboard /></PrivateRoute>} />
            <Route path="/espace-vendeur" element={<PrivateRoute roles={['SELLER','AGENCY','ADMIN']}><SellerDashboard /></PrivateRoute>} />
            <Route path="/admin/*"        element={<PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/reservation/:propertyId" element={<PrivateRoute><Booking /></PrivateRoute>} />
            <Route path="/paiement/:bookingId"     element={<PrivateRoute><Payment /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
EOF
log "App.jsx & main.jsx"

# ══════════════════════════════════════════════════
# 15. STORE
# ══════════════════════════════════════════════════
cat > frontend/src/store/store.js << 'EOF'
import { configureStore } from '@reduxjs/toolkit'
import authReducer     from './authSlice'
import propertyReducer from './propertySlice'
export const store = configureStore({ reducer: { auth: authReducer, properties: propertyReducer } })
EOF

cat > frontend/src/store/authSlice.js << 'EOF'
import { createSlice } from '@reduxjs/toolkit'
const initialState = {
  user:  JSON.parse(localStorage.getItem('immo_user') || 'null'),
  token: localStorage.getItem('immo_token') || null
}
const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    setCredentials: (s, { payload: { user, token } }) => {
      s.user = user; s.token = token
      localStorage.setItem('immo_user', JSON.stringify(user))
      localStorage.setItem('immo_token', token)
    },
    logout: s => {
      s.user = null; s.token = null
      localStorage.removeItem('immo_user'); localStorage.removeItem('immo_token')
    }
  }
})
export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
EOF

cat > frontend/src/store/propertySlice.js << 'EOF'
import { createSlice } from '@reduxjs/toolkit'
const propertySlice = createSlice({
  name: 'properties',
  initialState: { filters: {}, list: [], total: 0 },
  reducers: {
    setFilters:   (s, { payload }) => { s.filters = { ...s.filters, ...payload } },
    clearFilters: s => { s.filters = {} }
  }
})
export const { setFilters, clearFilters } = propertySlice.actions
export default propertySlice.reducer
EOF
log "Store Redux"

# ══════════════════════════════════════════════════
# 16. SERVICES & HOOKS
# ══════════════════════════════════════════════════
cat > frontend/src/services/api.js << 'EOF'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
export const api = async (path, options = {}) => {
  const token = localStorage.getItem('immo_token')
  const isFormData = options.body instanceof FormData
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Erreur ${res.status}`)
  }
  return res.json()
}
EOF

cat > frontend/src/services/auth.service.js << 'EOF'
import { api } from './api'
export const loginUser    = (email, password) => api('/auth/login',    { method:'POST', body: JSON.stringify({ email, password }) })
export const registerUser = payload           => api('/auth/register', { method:'POST', body: JSON.stringify(payload) })
export const getMe        = ()                => api('/auth/me')
export const updateMe     = data              => api('/auth/me',       { method:'PUT',  body: JSON.stringify(data) })
export const changePassword = data            => api('/auth/me/password', { method:'PUT', body: JSON.stringify(data) })
EOF

cat > frontend/src/services/property.service.js << 'EOF'
import { api } from './api'
export const getProperties   = q      => api(`/properties?${q}`)
export const getProperty     = slug   => api(`/properties/${slug}`)
export const getMyProperties = ()     => api('/properties/my')
export const createProperty  = data   => {
  const fd = new FormData()
  Object.entries(data).forEach(([k,v]) => {
    if (Array.isArray(v) && k === 'files') v.forEach(f => fd.append('images', f))
    else if (Array.isArray(v)) fd.append(k, JSON.stringify(v))
    else if (v != null) fd.append(k, v)
  })
  return api('/properties', { method:'POST', body: fd })
}
export const updateProperty = (id, data) => api(`/properties/${id}`, { method:'PUT',    body: JSON.stringify(data) })
export const deleteProperty = id         => api(`/properties/${id}`, { method:'DELETE' })
export const toggleFav      = id         => api(`/properties/${id}/favorite`, { method:'POST' })
export const getCategories  = ()         => api('/categories')
EOF

cat > frontend/src/services/booking.service.js << 'EOF'
import { api } from './api'
export const createBooking     = data => api('/bookings', { method:'POST', body: JSON.stringify(data) })
export const getMyBookings     = ()   => api('/bookings/my')
export const createPaySession  = bookingId => api('/payments/create-session', { method:'POST', body: JSON.stringify({ bookingId }) })
EOF

cat > frontend/src/hooks/useAuth.js << 'EOF'
import { useSelector, useDispatch } from 'react-redux'
import { setCredentials, logout as logoutAction } from '../store/authSlice'
import { loginUser, registerUser } from '../services/auth.service'
export function useAuth() {
  const dispatch = useDispatch()
  const { user, token } = useSelector(s => s.auth)
  const login    = async (email, password) => { const d = await loginUser(email, password); dispatch(setCredentials(d)); return d }
  const register = async (payload)         => { const d = await registerUser(payload);      dispatch(setCredentials(d)); return d }
  const logout   = ()                      => dispatch(logoutAction())
  return { user, token, login, register, logout, isAuthenticated: !!user }
}
EOF

cat > frontend/src/hooks/useProperties.js << 'EOF'
import { useState, useEffect } from 'react'
import { getProperties } from '../services/property.service'
export function useProperties(filters = {}) {
  const [state, setState] = useState({ properties: [], total: 0, totalPages: 1, loading: true, error: null })
  useEffect(() => {
    setState(s => ({ ...s, loading: true }))
    const q = new URLSearchParams(Object.entries(filters).filter(([,v]) => v != null && v !== '')).toString()
    getProperties(q)
      .then(d => setState({ properties: d.data, total: d.total, totalPages: d.totalPages, loading: false, error: null }))
      .catch(e => setState(s => ({ ...s, loading: false, error: e.message })))
  }, [JSON.stringify(filters)])
  return state
}
EOF

cat > frontend/src/hooks/useGeolocation.js << 'EOF'
import { useState, useEffect } from 'react'
export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError]       = useState(null)
  useEffect(() => {
    if (!navigator.geolocation) return setError('Géolocalisation non supportée')
    navigator.geolocation.getCurrentPosition(
      p => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      e => setError(e.message)
    )
  }, [])
  return { location, error }
}
EOF
log "Services & hooks"

# ══════════════════════════════════════════════════
# 17. COMPOSANTS UI
# ══════════════════════════════════════════════════
cat > frontend/src/components/ui/Spinner.jsx << 'EOF'
export default function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className="flex justify-center items-center py-12">
      <div className={`${s} border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin`}/>
    </div>
  )
}
EOF

cat > frontend/src/components/ui/Badge.jsx << 'EOF'
const variants = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  gray:   'bg-slate-100 text-slate-600',
}
export default function Badge({ children, variant = 'gray', className = '' }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>{children}</span>
}
EOF

cat > frontend/src/components/ui/Button.jsx << 'EOF'
export default function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-6 py-2.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    ghost:     'text-slate-600 hover:bg-slate-100',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>}
      {children}
    </button>
  )
}
EOF

cat > frontend/src/components/ui/Modal.jsx << 'EOF'
import { useEffect } from 'react'
export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handler = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
EOF
log "Composants UI"

# ══════════════════════════════════════════════════
# 18. LAYOUT
# ══════════════════════════════════════════════════
cat > frontend/src/components/layout/Navbar.jsx << 'EOF'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const roleLinks = {
  CLIENT:  { label: 'Mon espace', to: '/espace-client' },
  SELLER:  { label: 'Mes annonces', to: '/espace-vendeur' },
  AGENCY:  { label: 'Mon agence', to: '/espace-vendeur' },
  ADMIN:   { label: 'Administration', to: '/admin' },
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">🏠 itad-immo</Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/annonces" className="hover:text-blue-600 transition-colors">Annonces</Link>
          <Link to="/annonces?listingType=SALE"           className="hover:text-blue-600 transition-colors">Vente</Link>
          <Link to="/annonces?listingType=RENT"           className="hover:text-blue-600 transition-colors">Location</Link>
          <Link to="/annonces?listingType=VACATION_RENT"  className="hover:text-blue-600 transition-colors">Vacances</Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {user.firstName?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.firstName}</span>
                <span className="text-slate-400 text-xs">▾</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-lg py-2 z-50">
                  {roleLinks[user.role] && (
                    <Link to={roleLinks[user.role].to} onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                      {roleLinks[user.role].label}
                    </Link>
                  )}
                  <hr className="my-1 border-slate-100"/>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 transition-colors">Connexion</Link>
              <Link to="/register" className="btn-primary text-sm">Inscription</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
EOF

cat > frontend/src/components/layout/Footer.jsx << 'EOF'
import { Link } from 'react-router-dom'
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-3">🏠 itad-immo</h3>
          <p className="text-sm leading-relaxed">La plateforme immobilière de référence à Madagascar. Vente, location, vacances.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Explorer</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/annonces?listingType=SALE" className="hover:text-white transition-colors">Biens à vendre</Link>
            <Link to="/annonces?listingType=RENT" className="hover:text-white transition-colors">Locations</Link>
            <Link to="/annonces?listingType=VACATION_RENT" className="hover:text-white transition-colors">Vacances</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Mon compte</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/register" className="hover:text-white transition-colors">S'inscrire</Link>
            <Link to="/login"    className="hover:text-white transition-colors">Se connecter</Link>
            <Link to="/espace-vendeur" className="hover:text-white transition-colors">Déposer une annonce</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <div className="text-sm flex flex-col gap-1">
            <span>📧 contact@itad-immo.mg</span>
            <span>📞 +261 34 00 000 00</span>
            <span>📍 Antananarivo, Madagascar</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800 text-sm text-center">
        © {new Date().getFullYear()} itad-immo. Tous droits réservés.
      </div>
    </footer>
  )
}
EOF
log "Layout"

# ══════════════════════════════════════════════════
# 19. COMPOSANTS PROPERTY
# ══════════════════════════════════════════════════
cat > frontend/src/components/property/PropertyCard.jsx << 'EOF'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { toggleFav } from '../../services/property.service'

const TYPE_LABELS = { SALE:'Vente', RENT:'Location', VACATION_RENT:'Vacances' }
const TYPE_COLORS = { SALE:'bg-green-100 text-green-700', RENT:'bg-blue-100 text-blue-700', VACATION_RENT:'bg-yellow-100 text-yellow-700' }

export default function PropertyCard({ property: p }) {
  const { user } = useAuth()
  const [fav, setFav] = useState(false)

  const handleFav = async e => {
    e.preventDefault(); e.stopPropagation()
    if (!user) return
    try { const r = await toggleFav(p.id); setFav(r.favorited) } catch {}
  }

  return (
    <Link to={`/annonces/${p.slug}`} className="group block card hover:shadow-lg transition-all duration-200">
      <div className="relative h-52 bg-slate-200 overflow-hidden">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          : <div className="w-full h-full flex items-center justify-center text-5xl">🏠</div>
        }
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${TYPE_COLORS[p.listingType]}`}>{TYPE_LABELS[p.listingType]}</span>
          {p.featured && <span className="bg-amber-400 text-amber-900 px-2 py-1 rounded-lg text-xs font-semibold">⭐</span>}
        </div>
        <button onClick={handleFav} className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow">
          <span className={fav ? 'text-red-500 text-lg' : 'text-slate-400 text-lg'}>{fav ? '♥' : '♡'}</span>
        </button>
        {p.distance != null && (
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
            📍 {p.distance < 1 ? `${(p.distance*1000).toFixed(0)}m` : `${p.distance.toFixed(1)}km`}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{p.title}</h3>
        <p className="text-slate-500 text-sm mt-1">📍 {p.city}{p.district ? `, ${p.district}` : ''}</p>
        <div className="flex gap-4 my-3 text-sm text-slate-600">
          {p.bedrooms  && <span>🛏 {p.bedrooms}</span>}
          {p.bathrooms && <span>🚿 {p.bathrooms}</span>}
          {p.area      && <span>📐 {p.area}m²</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-blue-600">{p.price?.toLocaleString()} {p.priceUnit}</span>
            {p.listingType === 'RENT' && <span className="text-slate-400 text-sm">/mois</span>}
          </div>
          {p.avgRating && (
            <span className="text-sm font-medium text-slate-700">⭐ {p.avgRating}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
EOF

cat > frontend/src/components/property/PropertyFilters.jsx << 'EOF'
export default function PropertyFilters({ filters, onChange }) {
  const update = (k, v) => onChange({ ...filters, [k]: v })
  return (
    <div className="card p-5 space-y-5">
      <h3 className="font-semibold text-slate-800">Filtres</h3>

      <div>
        <label className="label">Type d'annonce</label>
        <select className="input text-sm" value={filters.listingType || ''} onChange={e => update('listingType', e.target.value)}>
          <option value="">Tous</option>
          <option value="SALE">Vente</option>
          <option value="RENT">Location</option>
          <option value="VACATION_RENT">Vacances</option>
        </select>
      </div>

      <div>
        <label className="label">Type de bien</label>
        <select className="input text-sm" value={filters.propertyType || ''} onChange={e => update('propertyType', e.target.value)}>
          <option value="">Tous</option>
          <option value="HOUSE">Maison</option>
          <option value="VILLA">Villa</option>
          <option value="APARTMENT">Appartement</option>
          <option value="LAND">Terrain</option>
          <option value="OFFICE">Bureau</option>
        </select>
      </div>

      <div>
        <label className="label">Ville</label>
        <input className="input text-sm" placeholder="Ex: Antananarivo" value={filters.city || ''}
          onChange={e => update('city', e.target.value)}/>
      </div>

      <div>
        <label className="label">Prix max (MGA)</label>
        <input type="number" className="input text-sm" placeholder="Ex: 5000000" value={filters.maxPrice || ''}
          onChange={e => update('maxPrice', e.target.value)}/>
      </div>

      <div>
        <label className="label">Surface min (m²)</label>
        <input type="number" className="input text-sm" placeholder="Ex: 50" value={filters.minArea || ''}
          onChange={e => update('minArea', e.target.value)}/>
      </div>

      <div>
        <label className="label">Chambres min</label>
        <select className="input text-sm" value={filters.bedrooms || ''} onChange={e => update('bedrooms', e.target.value)}>
          <option value="">Indifférent</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
        </select>
      </div>

      <button onClick={() => onChange({})} className="w-full btn-secondary text-sm">
        Réinitialiser
      </button>
    </div>
  )
}
EOF
log "Composants property"

# ══════════════════════════════════════════════════
# 20. PAGES
# ══════════════════════════════════════════════════
cat > frontend/src/pages/Home.jsx << 'EOF'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setFilters } from '../store/propertySlice'
import PropertyCard from '../components/property/PropertyCard'
import { useProperties } from '../hooks/useProperties'
import Spinner from '../components/ui/Spinner'

const CATEGORIES = [
  { slug:'location',   label:'Location',   icon:'🏠', bg:'bg-blue-50   text-blue-700'   },
  { slug:'vente',      label:'Vente',       icon:'🏡', bg:'bg-green-50  text-green-700'  },
  { slug:'vacances',   label:'Vacances',    icon:'🏖️', bg:'bg-yellow-50 text-yellow-700' },
  { slug:'bureaux',    label:'Bureaux',     icon:'🏢', bg:'bg-purple-50 text-purple-700' },
  { slug:'terrain',    label:'Terrain',     icon:'🌿', bg:'bg-emerald-50 text-emerald-700'},
  { slug:'colocation', label:'Colocation',  icon:'👥', bg:'bg-pink-50   text-pink-700'   },
]

export default function Home() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [search, setSearch]    = useState('')
  const [type,   setType]      = useState('')
  const { properties: featured, loading } = useProperties({ featured: true, limit: 6, status:'ACTIVE' })

  const handleSearch = () => {
    dispatch(setFilters({ search, listingType: type }))
    navigate('/annonces')
  }

  return (
    <div>
      {/* HERO */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight">
            Trouvez le bien <span className="text-blue-400">idéal</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10">
            Location, vente, vacances — des milliers de biens à Madagascar
          </p>
          <div className="bg-white rounded-2xl p-3 flex flex-wrap gap-3 shadow-2xl max-w-3xl mx-auto">
            <select value={type} onChange={e => setType(e.target.value)}
              className="text-slate-700 px-4 py-3 rounded-xl bg-slate-50 focus:outline-none font-medium flex-shrink-0">
              <option value="">Tout type</option>
              <option value="SALE">Vente</option>
              <option value="RENT">Location</option>
              <option value="VACATION_RENT">Vacances</option>
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ville, quartier, adresse..."
              className="flex-1 text-slate-700 px-4 py-3 rounded-xl focus:outline-none bg-slate-50 min-w-[180px]"/>
            <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
              Rechercher
            </button>
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-14 grid grid-cols-3 gap-6 text-center">
          {[['2 400+','Biens disponibles'],['1 200+','Vendeurs vérifiés'],['98%','Clients satisfaits']].map(([n,l]) => (
            <div key={l}><div className="text-3xl font-bold text-blue-400">{n}</div><div className="text-slate-400 text-sm mt-1">{l}</div></div>
          ))}
        </div>
      </section>

      {/* CATÉGORIES */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Parcourir par catégorie</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {CATEGORIES.map(c => (
            <button key={c.slug} onClick={() => { dispatch(setFilters({ categorySlug: c.slug })); navigate('/annonces') }}
              className={`${c.bg} rounded-2xl p-5 text-center hover:scale-105 transition-transform cursor-pointer`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="font-semibold text-sm">{c.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* VEDETTE */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Biens en vedette</h2>
          <button onClick={() => navigate('/annonces')} className="text-blue-600 font-medium hover:underline">Voir tout →</button>
        </div>
        {loading ? <Spinner /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured?.map(p => <PropertyCard key={p.id} property={p}/>)}
          </div>
        )}
      </section>
    </div>
  )
}
EOF

cat > frontend/src/pages/Listings.jsx << 'EOF'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import PropertyCard from '../components/property/PropertyCard'
import PropertyFilters from '../components/property/PropertyFilters'
import { useProperties } from '../hooks/useProperties'
import { useGeolocation } from '../hooks/useGeolocation'
import Spinner from '../components/ui/Spinner'

export default function Listings() {
  const savedFilters = useSelector(s => s.properties.filters)
  const [filters, setFilters] = useState({ page: 1, limit: 12, ...savedFilters })
  const { location } = useGeolocation()
  const activeFilters = location ? { ...filters, lat: location.lat, lng: location.lng } : filters
  const { properties, total, totalPages, loading } = useProperties(activeFilters)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
      <aside className="w-72 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24">
          <PropertyFilters filters={filters} onChange={f => setFilters({ ...f, page: 1 })}/>
        </div>
      </aside>
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600">
            <span className="font-bold text-slate-900">{total}</span> biens trouvés
            {location && <span className="text-xs text-blue-600 ml-2">· triés par proximité</span>}
          </p>
          <select value={`${filters.sortBy||'createdAt'}_${filters.sortDir||'desc'}`}
            onChange={e => { const [s,d] = e.target.value.split('_'); setFilters(f => ({ ...f, sortBy:s, sortDir:d })) }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="createdAt_desc">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="viewCount_desc">Plus vus</option>
          </select>
        </div>
        {loading ? <Spinner /> : properties.length === 0
          ? <div className="text-center py-20 text-slate-500"><div className="text-6xl mb-4">🔍</div><p>Aucun bien trouvé avec ces critères</p></div>
          : <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map(p => <PropertyCard key={p.id} property={p}/>)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10 flex-wrap">
                  {Array.from({ length: totalPages }, (_,i) => i+1).map(p => (
                    <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${filters.page === p ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-slate-50'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
        }
      </main>
    </div>
  )
}
EOF

cat > frontend/src/pages/PropertyDetail.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProperty } from '../services/property.service'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

export default function PropertyDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [imgIdx,   setImgIdx]   = useState(0)

  useEffect(() => {
    getProperty(slug).then(setProperty).catch(console.error).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <Spinner />
  if (!property) return <div className="text-center py-20">Bien introuvable</div>

  const p = property
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Colonne principale */}
      <div className="lg:col-span-2 space-y-8">
        {/* Galerie */}
        <div className="rounded-2xl overflow-hidden bg-slate-100">
          {p.images?.length > 0
            ? <img src={p.images[imgIdx]} alt={p.title} className="w-full h-96 object-cover"/>
            : <div className="w-full h-96 flex items-center justify-center text-8xl">🏠</div>
          }
          {p.images?.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {p.images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setImgIdx(i)}
                  className={`h-16 w-24 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${i === imgIdx ? 'ring-2 ring-blue-600' : 'opacity-60 hover:opacity-100'}`}/>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant={p.listingType === 'SALE' ? 'green' : p.listingType === 'RENT' ? 'blue' : 'yellow'}>
              {p.listingType === 'SALE' ? 'Vente' : p.listingType === 'RENT' ? 'Location' : 'Vacances'}
            </Badge>
            {p.featured && <Badge variant="yellow">⭐ En vedette</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{p.title}</h1>
          <p className="text-slate-500 mb-4">📍 {p.address}, {p.city}{p.district ? ` - ${p.district}` : ''}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
            {p.area      && <div className="text-center"><div className="text-2xl">📐</div><div className="font-semibold">{p.area}m²</div><div className="text-xs text-slate-500">Surface</div></div>}
            {p.bedrooms  && <div className="text-center"><div className="text-2xl">🛏</div><div className="font-semibold">{p.bedrooms}</div><div className="text-xs text-slate-500">Chambres</div></div>}
            {p.bathrooms && <div className="text-center"><div className="text-2xl">🚿</div><div className="font-semibold">{p.bathrooms}</div><div className="text-xs text-slate-500">SDB</div></div>}
            {p.parkingSpots && <div className="text-center"><div className="text-2xl">🚗</div><div className="font-semibold">{p.parkingSpots}</div><div className="text-xs text-slate-500">Parking</div></div>}
          </div>

          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-slate-600 leading-relaxed">{p.description}</p>

          {p.amenities?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">Équipements</h2>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map(a => <Badge key={a} variant="gray">{a}</Badge>)}
              </div>
            </div>
          )}
        </div>

        {/* Avis */}
        {p.reviews?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Avis ({p.reviews.length}) — ⭐ {p.avgRating}</h2>
            <div className="space-y-4">
              {p.reviews.map(r => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                      {r.author.firstName?.[0]}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{r.author.firstName} {r.author.lastName}</div>
                      <div className="text-yellow-400 text-xs">{'⭐'.repeat(r.rating)}</div>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Prix & CTA */}
        <div className="card p-6 sticky top-24">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {p.price?.toLocaleString()} {p.priceUnit}
          </div>
          {p.listingType === 'RENT' && <div className="text-slate-500 text-sm">/mois</div>}
          {p.negotiable && <div className="text-green-600 text-sm mt-1">✓ Prix négociable</div>}

          <div className="space-y-3 mt-6">
            {user ? (
              <button onClick={() => navigate(`/reservation/${p.id}`)}
                className="w-full btn-primary">
                {p.listingType === 'SALE' ? '📋 Faire une offre' : '📅 Réserver'}
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="w-full btn-primary">
                Se connecter pour réserver
              </button>
            )}
          </div>

          {/* Vendeur */}
          {p.owner && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  {p.owner.firstName?.[0]}
                </div>
                <div>
                  <div className="font-semibold">{p.owner.firstName} {p.owner.lastName}</div>
                  {p.agency && <div className="text-sm text-slate-500">{p.agency.name}</div>}
                </div>
              </div>
              {p.owner.phone && (
                <a href={`tel:${p.owner.phone}`} className="mt-3 w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                  📞 {p.owner.phone}
                </a>
              )}
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400 text-center">{p.viewCount} vues</div>
        </div>
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/Login.jsx << 'EOF'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { user } = await login(form.email, form.password)
      const routes = { ADMIN:'/admin', SELLER:'/espace-vendeur', AGENCY:'/espace-vendeur', CLIENT:'/espace-client' }
      navigate(routes[user.role] || '/')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-slate-800">Connexion</h1>
          <p className="text-slate-500 mt-1">Bon retour sur itad-immo</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required/>
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input type="password" className="input" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required/>
          </div>
          <Button type="submit" loading={loading} className="w-full mt-2">Se connecter</Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Pas de compte ? <Link to="/register" className="text-blue-600 font-medium hover:underline">S'inscrire</Link>
        </p>
        <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
          <p className="font-medium mb-1">Comptes démo :</p>
          <p>👑 admin@itad-immo.mg / Admin1234!</p>
          <p>🏠 vendeur@itad-immo.mg / Seller123!</p>
          <p>👤 client@itad-immo.mg / Client123!</p>
        </div>
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/Register.jsx << 'EOF'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'

export default function Register() {
  const [form, setForm]   = useState({ firstName:'', lastName:'', email:'', password:'', phone:'', role:'CLIENT' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await register(form); navigate('/') }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="text-slate-500 mt-1">Rejoignez itad-immo aujourd'hui</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom</label>
              <input className="input" value={form.firstName} onChange={e => setForm(f=>({...f,firstName:e.target.value}))} required/>
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input" value={form.lastName} onChange={e => setForm(f=>({...f,lastName:e.target.value}))} required/>
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required/>
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+261 34 00 000 00"/>
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required minLength={8}/>
          </div>
          <div>
            <label className="label">Je suis</label>
            <select className="input" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
              <option value="CLIENT">Chercheur de bien</option>
              <option value="SELLER">Propriétaire / Vendeur</option>
              <option value="AGENCY">Agence immobilière</option>
            </select>
          </div>
          <Button type="submit" loading={loading} className="w-full">Créer mon compte</Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Déjà un compte ? <Link to="/login" className="text-blue-600 font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/Booking.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProperty } from '../services/property.service'
import { createBooking, createPaySession } from '../services/booking.service'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function Booking() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [form, setForm] = useState({ startDate:'', endDate:'', notes:'', isQuote: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // On charge via id — adapter si besoin selon votre routing
    fetch(`${import.meta.env.VITE_API_URL}/properties?limit=1`)
      .then(() => {}) // placeholder, adapter pour charger par id
    getProperty(propertyId).catch(() => {
      // Cherche par id (si le slug n'est pas l'id, adapter le service)
    })
  }, [propertyId])

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const booking = await createBooking({ propertyId, ...form })
      if (!form.isQuote) {
        const session = await createPaySession(booking.id)
        window.location.href = session.url
      } else {
        navigate('/espace-client')
      }
    } catch (e) { alert(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="card p-8">
        <h1 className="text-2xl font-bold mb-6">Réservation / Demande</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Date de début *</label>
            <input type="date" className="input" value={form.startDate} required
              onChange={e => setForm(f=>({...f,startDate:e.target.value}))}
              min={new Date().toISOString().split('T')[0]}/>
          </div>
          <div>
            <label className="label">Date de fin (optionnel)</label>
            <input type="date" className="input" value={form.endDate}
              onChange={e => setForm(f=>({...f,endDate:e.target.value}))}
              min={form.startDate}/>
          </div>
          <div>
            <label className="label">Notes / Message</label>
            <textarea className="input resize-none" rows={3} value={form.notes}
              placeholder="Informations complémentaires..."
              onChange={e => setForm(f=>({...f,notes:e.target.value}))}/>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isQuote}
              onChange={e => setForm(f=>({...f,isQuote:e.target.checked}))}
              className="w-4 h-4 rounded"/>
            <span className="text-sm text-slate-700">Demande de devis uniquement (sans paiement)</span>
          </label>
          <Button type="submit" loading={loading} className="w-full">
            {form.isQuote ? '📋 Envoyer la demande' : '💳 Passer au paiement'}
          </Button>
        </form>
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/Payment.jsx << 'EOF'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
export default function Payment() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const success = window.location.pathname.includes('success')
  useEffect(() => { if (success) setTimeout(() => navigate('/espace-client'), 4000) }, [])
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md w-full">
        <div className="text-6xl mb-4">{success ? '✅' : '❌'}</div>
        <h1 className="text-2xl font-bold mb-2">{success ? 'Paiement réussi !' : 'Paiement annulé'}</h1>
        <p className="text-slate-500">{success ? 'Votre réservation est confirmée. Redirection...' : 'Votre paiement a été annulé.'}</p>
        {!success && <button onClick={() => navigate('/espace-client')} className="btn-primary mt-6">Retour</button>}
      </div>
    </div>
  )
}
EOF

cat > frontend/src/pages/NotFound.jsx << 'EOF'
import { useNavigate } from 'react-router-dom'
export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🏚️</div>
        <h1 className="text-4xl font-bold text-slate-800 mb-3">404 — Page introuvable</h1>
        <p className="text-slate-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Retour à l'accueil</button>
      </div>
    </div>
  )
}
EOF
log "Pages créées"

# ══════════════════════════════════════════════════
# 21. DASHBOARDS
# ══════════════════════════════════════════════════
cat > frontend/src/dashboards/ClientDashboard.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMyBookings } from '../services/booking.service'
import { getMe } from '../services/auth.service'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

const STATUS_COLORS = { PENDING:'yellow', CONFIRMED:'green', CANCELLED:'red', COMPLETED:'blue' }
const STATUS_LABELS = { PENDING:'En attente', CONFIRMED:'Confirmé', CANCELLED:'Annulé', COMPLETED:'Terminé' }

export default function ClientDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab, setTab] = useState('bookings')

  useEffect(() => {
    getMyBookings().then(setBookings).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
          {user?.firstName?.[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bonjour, {user?.firstName} 👋</h1>
          <p className="text-slate-500 text-sm">Bienvenue dans votre espace personnel</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {[['bookings','Mes réservations'],['favorites','Mes favoris'],['profile','Mon profil']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        loading ? <Spinner /> :
        bookings.length === 0
          ? <div className="text-center py-16 text-slate-400"><div className="text-6xl mb-4">📅</div><p>Aucune réservation pour l'instant</p></div>
          : <div className="space-y-4">
              {bookings.map(b => (
                <div key={b.id} className="card p-5 flex items-center gap-4">
                  <div className="w-20 h-16 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                    {b.property.images?.[0] && <img src={b.property.images[0]} className="w-full h-full object-cover"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{b.property.title}</h3>
                    <p className="text-sm text-slate-500">{b.property.city}</p>
                    <p className="text-sm text-slate-500">📅 {new Date(b.startDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                    <p className="text-sm font-semibold text-blue-600 mt-1">{b.totalPrice?.toLocaleString()} MGA</p>
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab === 'profile' && (
        <div className="card p-6 max-w-md">
          <h2 className="font-semibold mb-4">Informations personnelles</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-slate-500">Prénom:</span> <span className="font-medium ml-2">{user?.firstName}</span></div>
            <div><span className="text-slate-500">Nom:</span> <span className="font-medium ml-2">{user?.lastName}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="font-medium ml-2">{user?.email}</span></div>
            <div><span className="text-slate-500">Rôle:</span> <Badge variant="blue" className="ml-2">{user?.role}</Badge></div>
          </div>
        </div>
      )}
    </div>
  )
}
EOF

cat > frontend/src/dashboards/SellerDashboard.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyProperties, deleteProperty } from '../services/property.service'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const STATUS_COLORS = { PENDING:'yellow', ACTIVE:'green', ARCHIVED:'gray', SOLD:'blue', RENTED:'purple' }
const STATUS_LABELS = { PENDING:'En attente', ACTIVE:'Actif', ARCHIVED:'Archivé', SOLD:'Vendu', RENTED:'Loué' }

export default function SellerDashboard() {
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab, setTab] = useState('list')

  const load = () => {
    setLoading(true)
    getMyProperties().then(setProperties).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async id => {
    if (!confirm('Archiver ce bien ?')) return
    await deleteProperty(id)
    load()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mes annonces</h1>
        <Button onClick={() => setTab('create')}>+ Nouvelle annonce</Button>
      </div>

      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {[['list','Mes biens'],['bookings','Réservations reçues']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        loading ? <Spinner /> :
        properties.length === 0
          ? <div className="text-center py-16 text-slate-400"><div className="text-6xl mb-4">🏠</div><p>Aucune annonce — créez votre première!</p></div>
          : <div className="grid gap-4">
              {properties.map(p => (
                <div key={p.id} className="card p-5 flex items-center gap-4">
                  <div className="w-24 h-16 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                    {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/annonces/${p.slug}`} className="font-semibold hover:text-blue-600 truncate block">{p.title}</Link>
                    <p className="text-sm text-slate-500">{p.city} · {p.price?.toLocaleString()} MGA</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-400">
                      <span>👁 {p.viewCount} vues</span>
                      <span>📅 {p._count?.bookings} résa</span>
                      <span>⭐ {p._count?.reviews} avis</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge variant={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="text-xs py-1 px-3">Modifier</Button>
                      <Button variant="danger" onClick={() => handleDelete(p.id)} className="text-xs py-1 px-3">Archiver</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab === 'create' && (
        <div className="card p-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Nouvelle annonce</h2>
          <p className="text-slate-500">Formulaire de création (PropertyForm component — à implémenter)</p>
          <Button variant="secondary" className="mt-4" onClick={() => setTab('list')}>← Retour</Button>
        </div>
      )}
    </div>
  )
}
EOF

cat > frontend/src/dashboards/AdminDashboard.jsx << 'EOF'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [users, setUsers]   = useState([])
  const [props, setProps]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    Promise.all([
      api('/admin/stats'),
      api('/admin/users?limit=20'),
      api('/admin/properties?limit=20')
    ]).then(([s, u, p]) => { setStats(s); setUsers(u.data); setProps(p.data) })
    .catch(console.error).finally(() => setLoading(false))
  }, [])

  const toggleUser = async id => {
    await api(`/admin/users/${id}/toggle`, { method:'PUT' })
    setUsers(u => u.map(user => user.id === id ? { ...user, isActive: !user.isActive } : user))
  }

  const moderate = async (id, status) => {
    await api(`/admin/properties/${id}/moderate`, { method:'PUT', body: JSON.stringify({ status }) })
    setProps(p => p.map(prop => prop.id === id ? { ...prop, status } : prop))
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">Administration</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
        {[['dashboard','Tableau de bord'],['users','Utilisateurs'],['properties','Biens'],['reviews','Avis']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {[
              ['👥', 'Utilisateurs', stats.users, 'blue'],
              ['🏠', 'Biens actifs', stats.properties, 'green'],
              ['📅', 'Réservations', stats.bookings, 'yellow'],
              ['💰', 'Revenus', `${stats.revenue?.toLocaleString()} €`, 'purple'],
            ].map(([icon, label, value, color]) => (
              <div key={label} className={`card p-5 border-l-4 ${color === 'blue' ? 'border-blue-500' : color === 'green' ? 'border-green-500' : color === 'yellow' ? 'border-yellow-500' : 'border-purple-500'}`}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          {stats.pendingProps > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <span className="text-yellow-800 font-medium">{stats.pendingProps} bien(s) en attente de modération</span>
              <Button variant="secondary" className="ml-auto text-sm py-1.5" onClick={() => setTab('properties')}>Voir</Button>
            </div>
          )}
        </>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Nom','Email','Rôle','Biens','Résa','Statut','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant={u.role === 'ADMIN' ? 'red' : u.role === 'SELLER' ? 'green' : 'blue'}>{u.role}</Badge></td>
                    <td className="px-4 py-3">{u._count?.properties}</td>
                    <td className="px-4 py-3">{u._count?.bookings}</td>
                    <td className="px-4 py-3"><Badge variant={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Actif' : 'Inactif'}</Badge></td>
                    <td className="px-4 py-3">
                      <Button variant={u.isActive ? 'danger' : 'secondary'} onClick={() => toggleUser(u.id)} className="text-xs py-1 px-3">
                        {u.isActive ? 'Désactiver' : 'Réactiver'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'properties' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Titre','Ville','Type','Prix','Statut','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {props.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50 ${p.status === 'PENDING' ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{p.title}</td>
                    <td className="px-4 py-3 text-slate-500">{p.city}</td>
                    <td className="px-4 py-3"><Badge variant="gray">{p.listingType}</Badge></td>
                    <td className="px-4 py-3">{p.price?.toLocaleString()} MGA</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'ACTIVE' ? 'green' : p.status === 'PENDING' ? 'yellow' : 'gray'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {p.status === 'PENDING' && (
                        <Button variant="secondary" onClick={() => moderate(p.id, 'ACTIVE')} className="text-xs py-1 px-2">✓ Valider</Button>
                      )}
                      {p.status !== 'ARCHIVED' && (
                        <Button variant="danger" onClick={() => moderate(p.id, 'ARCHIVED')} className="text-xs py-1 px-2">Archiver</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
EOF
log "Dashboards créés"

# ══════════════════════════════════════════════════
# 22. README
# ══════════════════════════════════════════════════
cat > README.md << 'EOF'
# 🏠 itad-immo — Plateforme Immobilière

Application web immobilière complète : React + Tailwind + Node.js + Express + PostgreSQL + Prisma

## Stack Technique

**Frontend:** React 18, Tailwind CSS, Redux Toolkit, React Router v6, Vite
**Backend:** Node.js, Express, Prisma ORM, JWT, Socket.io
**Base de données:** PostgreSQL
**Services:** Cloudinary (images), Stripe (paiements), Nodemailer (emails)

## Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+

### 1. Backend
```bash
cd backend
npm install
# Configurer .env (DATABASE_URL, JWT_SECRET, etc.)
npx prisma db push
node prisma/seed.js
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
# Configurer .env (VITE_API_URL)
npm run dev
```

## Comptes démo (après seed)

| Rôle    | Email                   | Mot de passe |
|---------|-------------------------|--------------|
| Admin   | admin@itad-immo.mg        | Admin1234!   |
| Vendeur | vendeur@itad-immo.mg      | Seller123!   |
| Client  | client@itad-immo.mg       | Client123!   |

## Fonctionnalités

- 🔍 Recherche géolocalisée (proximité, prix, type)
- 🏠 Catégories personnalisables (Location, Vente, Vacances...)
- 👤 4 rôles : Client, Vendeur, Agence, Admin
- 📅 Système de réservation + devis
- 💳 Paiement Stripe
- ⭐ Avis et notations
- 💬 Messagerie interne (Socket.io)
- 📊 Dashboard admin complet
- 🖼️ Upload photos Cloudinary

## Structure
```
itad-immo/
├── backend/   (Node.js + Express + Prisma)
└── frontend/  (React + Tailwind + Redux)
```
EOF
log "README.md"

# ══════════════════════════════════════════════════
# 23. GITIGNORE
# ══════════════════════════════════════════════════
cat > .gitignore << 'EOF'
node_modules/
.env
dist/
build/
.DS_Store
*.log
EOF
cat > backend/.gitignore << 'EOF'
node_modules/
.env
dist/
EOF
cat > frontend/.gitignore << 'EOF'
node_modules/
.env
dist/
EOF
log ".gitignore"

# ══════════════════════════════════════════════════
# FIN
# ══════════════════════════════════════════════════
cd ..

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅  itad-immo généré avec succès!                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📁 Dossier créé : ${GREEN}$(pwd)/itad-immo${NC}"
echo ""
echo -e "${YELLOW}➡  Étapes suivantes :${NC}"
echo ""
echo -e "  ${BLUE}1.${NC} Configurer la base de données dans ${GREEN}backend/.env${NC}"
echo -e "  ${BLUE}2.${NC} Lancer le backend :"
echo -e "     ${GREEN}cd itad-immo/backend && npm install${NC}"
echo -e "     ${GREEN}npx prisma db push && node prisma/seed.js${NC}"
echo -e "     ${GREEN}npm run dev${NC}"
echo ""
echo -e "  ${BLUE}3.${NC} Lancer le frontend :"
echo -e "     ${GREEN}cd itad-immo/frontend && npm install${NC}"
echo -e "     ${GREEN}npm run dev${NC}"
echo ""
echo -e "  ${BLUE}4.${NC} Ouvrir ${GREEN}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}🔑 Comptes démo (après seed) :${NC}"
echo -e "  👑 Admin   : ${GREEN}admin@itad-immo.mg${NC}   / Admin1234!"
echo -e "  🏠 Vendeur : ${GREEN}vendeur@itad-immo.mg${NC} / Seller123!"
echo -e "  👤 Client  : ${GREEN}client@itad-immo.mg${NC}  / Client123!"
echo ""