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
