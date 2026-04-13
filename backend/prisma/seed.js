import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Utilisateurs ─────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: 'admin@itad-immo.mg' },
    update: {},
    create: {
      email: 'admin@itad-immo.mg',
      password: await bcrypt.hash('Admin1234!', 12),
      firstName: 'Admin', lastName: 'itad-immo',
      role: 'ADMIN', isVerified: true,
    }
  })

  const seller = await prisma.user.upsert({
    where: { email: 'vendeur@itad-immo.mg' },
    update: {},
    create: {
      email: 'vendeur@itad-immo.mg',
      password: await bcrypt.hash('Seller123!', 12),
      firstName: 'Jean', lastName: 'Rakoto',
      role: 'SELLER', phone: '+261 34 00 000 00', isVerified: true,
    }
  })

  const client = await prisma.user.upsert({
    where: { email: 'client@itad-immo.mg' },
    update: {},
    create: {
      email: 'client@itad-immo.mg',
      password: await bcrypt.hash('Client123!', 12),
      firstName: 'Marie', lastName: 'Rasoa',
      role: 'CLIENT', isVerified: true,
    }
  })

  // Utilisateurs community supplémentaires
  const vatosoa = await prisma.user.upsert({
    where: { email: 'vatosoa@itad-immo.mg' },
    update: {},
    create: {
      email: 'vatosoa@itad-immo.mg',
      password: await bcrypt.hash('Client123!', 12),
      firstName: 'Vatosoa', lastName: 'Rasolofo',
      role: 'CLIENT', isVerified: true,
    }
  })

  const hery = await prisma.user.upsert({
    where: { email: 'hery@itad-immo.mg' },
    update: {},
    create: {
      email: 'hery@itad-immo.mg',
      password: await bcrypt.hash('Seller123!', 12),
      firstName: 'Hery', lastName: 'Rabemanantsoa',
      role: 'SELLER', isVerified: true,
    }
  })

  const sofia = await prisma.user.upsert({
    where: { email: 'sofia@itad-immo.mg' },
    update: {},
    create: {
      email: 'sofia@itad-immo.mg',
      password: await bcrypt.hash('Seller123!', 12),
      firstName: 'Sofia', lastName: 'Andriamasy',
      role: 'SELLER', isVerified: true,
    }
  })

  // ── Catégories ───────────────────────────────────────────────

  const categories = [
    { name: 'Location',   slug: 'location',   icon: '🏠', color: '#3b82f6', position: 1 },
    { name: 'Vente',      slug: 'vente',       icon: '🏡', color: '#22c55e', position: 2 },
    { name: 'Vacances',   slug: 'vacances',    icon: '🏖️', color: '#f59e0b', position: 3 },
    { name: 'Bureaux',    slug: 'bureaux',     icon: '🏢', color: '#8b5cf6', position: 4 },
    { name: 'Terrain',    slug: 'terrain',     icon: '🌿', color: '#10b981', position: 5 },
    { name: 'Colocation', slug: 'colocation',  icon: '👥', color: '#ec4899', position: 6 },
  ]

  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }

  const locationCat = await prisma.category.findUnique({ where: { slug: 'location' } })
  const venteCat    = await prisma.category.findUnique({ where: { slug: 'vente' } })

  // ── Biens ────────────────────────────────────────────────────

  const villa = await prisma.property.upsert({
    where: { slug: 'belle-villa-antananarivo-demo' },
    update: {},
    create: {
      title: 'Belle villa à Antananarivo',
      slug: 'belle-villa-antananarivo-demo',
      description: 'Magnifique villa moderne avec jardin, piscine et vue panoramique sur la ville.',
      propertyType: 'VILLA', listingType: 'SALE', status: 'ACTIVE',
      price: 450000000, priceUnit: 'MGA',
      area: 350, bedrooms: 4, bathrooms: 3, parkingSpots: 2, furnished: true,
      address: 'Lot IVR 45, Ivandry', city: 'Antananarivo', district: 'Ivandry',
      latitude: -18.8792, longitude: 47.5079,
      images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'],
      amenities: ['pool', 'garden', 'security', 'wifi', 'garage'],
      featured: true, ownerId: seller.id, categoryId: venteCat.id,
    }
  })

  const appart = await prisma.property.upsert({
    where: { slug: 'appartement-moderne-tana-demo' },
    update: {},
    create: {
      title: 'Appartement moderne centre-ville',
      slug: 'appartement-moderne-tana-demo',
      description: 'Bel appartement refait à neuf, idéalement situé en centre-ville.',
      propertyType: 'APARTMENT', listingType: 'RENT', status: 'ACTIVE',
      price: 1500000, priceUnit: 'MGA',
      area: 80, bedrooms: 2, bathrooms: 1, furnished: true,
      address: "Avenue de l'Indépendance", city: 'Antananarivo', district: 'Analakely',
      latitude: -18.9112, longitude: 47.5362,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      amenities: ['wifi', 'elevator', 'security'],
      featured: true, ownerId: seller.id, categoryId: locationCat.id,
    }
  })

  // ── Community : Posts ────────────────────────────────────────

  const post1 = await prisma.post.upsert({
    where: { id: 'seed-post-1' },
    update: {},
    create: {
      id: 'seed-post-1',
      content: "Après 6 mois de recherche j'ai enfin trouvé mon appartement à Ivandry grâce à Itad-Plus ! Le processus était simple et l'agence très réactive. Je recommande vivement pour les primo-accédants.",
      category: 'EXPERIENCE',
      rating: 5,
      tags: ['#Location', '#Ivandry', '#PrimoAccédant'],
      authorId: vatosoa.id,
      propertyId: appart.id,
    }
  })

  const post2 = await prisma.post.upsert({
    where: { id: 'seed-post-2' },
    update: {},
    create: {
      id: 'seed-post-2',
      content: "Conseil du jour pour les vendeurs : prenez le temps de bien préparer vos photos. Des photos de qualité augmentent les visites de 3x. Investissez dans un bon photographe, ça vaut vraiment le coup !",
      category: 'ADVICE',
      tags: ['#ConseilVendeur', '#Photos', '#Immobilier'],
      authorId: seller.id,
    }
  })

  const post3 = await prisma.post.upsert({
    where: { id: 'seed-post-3' },
    update: {},
    create: {
      id: 'seed-post-3',
      content: "Point juridique important : depuis janvier 2025, les acquéreurs doivent fournir un certificat de résidence lors de la signature chez le notaire. Prenez-en note !",
      category: 'NEWS',
      tags: ['#Juridique', '#Loi2025'],
      authorId: hery.id,
    }
  })

  const post4 = await prisma.post.upsert({
    where: { id: 'seed-post-4' },
    update: {},
    create: {
      id: 'seed-post-4',
      content: "Super villa, exactement comme décrit. Le vendeur était très professionnel et a répondu à toutes nos questions. Je recommande sans hésiter !",
      category: 'REVIEW',
      rating: 5,
      tags: ['#AvisVérifié', '#Villa'],
      authorId: client.id,
      propertyId: villa.id,
    }
  })

  // ── Community : Commentaires ─────────────────────────────────

  const comment1 = await prisma.comment.upsert({
    where: { id: 'seed-comment-1' },
    update: {},
    create: {
      id: 'seed-comment-1',
      content: "Merci pour ce partage ! Quel quartier recommandes-tu pour un budget moyen ?",
      authorId: client.id,
      postId: post1.id,
    }
  })

  // Réponse au commentaire (thread)
  await prisma.comment.upsert({
    where: { id: 'seed-comment-2' },
    update: {},
    create: {
      id: 'seed-comment-2',
      content: "Personnellement j'ai regardé Ivandry et Ambohijatovo, les deux sont bien desservis et le rapport qualité/prix est correct.",
      authorId: vatosoa.id,
      postId: post1.id,
      parentId: comment1.id,
    }
  })

  await prisma.comment.upsert({
    where: { id: 'seed-comment-3' },
    update: {},
    create: {
      id: 'seed-comment-3',
      content: "Totalement d'accord sur les photos ! J'ai vu des biens invendables pendant des mois simplement à cause de mauvaises photos.",
      authorId: sofia.id,
      postId: post2.id,
    }
  })

  // ── Community : Réactions ────────────────────────────────────

  const reactions = [
    { id: 'seed-pr-1', userId: client.id,   postId: post1.id, type: 'LIKE'      },
    { id: 'seed-pr-2', userId: hery.id,     postId: post1.id, type: 'HELPFUL'   },
    { id: 'seed-pr-3', userId: vatosoa.id,  postId: post2.id, type: 'INSIGHTFUL'},
    { id: 'seed-pr-4', userId: client.id,   postId: post2.id, type: 'LIKE'      },
    { id: 'seed-pr-5', userId: sofia.id,    postId: post3.id, type: 'HELPFUL'   },
    { id: 'seed-pr-6', userId: vatosoa.id,  postId: post4.id, type: 'LOVE'      },
  ]

  for (const r of reactions) {
    await prisma.postReaction.upsert({
      where: { userId_postId: { userId: r.userId, postId: r.postId } },
      update: {},
      create: { id: r.id, type: r.type, userId: r.userId, postId: r.postId },
    })
  }

  // ── Community : Bookmarks ────────────────────────────────────

  await prisma.postBookmark.upsert({
    where: { userId_postId: { userId: client.id, postId: post2.id } },
    update: {},
    create: { userId: client.id, postId: post2.id },
  })

  await prisma.postBookmark.upsert({
    where: { userId_postId: { userId: vatosoa.id, postId: post3.id } },
    update: {},
    create: { userId: vatosoa.id, postId: post3.id },
  })

  // ── Community : Shares ───────────────────────────────────────

  await prisma.postShare.createMany({
    skipDuplicates: true,
    data: [
      { userId: client.id,  postId: post2.id, platform: 'whatsapp' },
      { userId: sofia.id,   postId: post3.id, platform: 'facebook' },
      { userId: hery.id,    postId: post1.id, platform: 'copy'     },
    ]
  })

  // ── Community : Follows ──────────────────────────────────────

  const follows = [
    { followerId: client.id,   followingId: seller.id  },
    { followerId: client.id,   followingId: hery.id    },
    { followerId: vatosoa.id,  followingId: seller.id  },
    { followerId: vatosoa.id,  followingId: sofia.id   },
    { followerId: hery.id,     followingId: sofia.id   },
    { followerId: sofia.id,    followingId: seller.id  },
  ]

  for (const f of follows) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: f.followerId, followingId: f.followingId } },
      update: {},
      create: f,
    })
  }

  console.log('✅ Seed terminé!')
  console.log('📧 Admin:   admin@itad-immo.mg   / Admin1234!')
  console.log('📧 Vendeur: vendeur@itad-immo.mg  / Seller123!')
  console.log('📧 Client:  client@itad-immo.mg   / Client123!')
  console.log('📧 Vatosoa: vatosoa@itad-immo.mg  / Client123!')
  console.log('📧 Hery:    hery@itad-immo.mg     / Seller123!')
  console.log('📧 Sofia:   sofia@itad-immo.mg    / Seller123!')
}

main().catch(console.error).finally(() => prisma.$disconnect())