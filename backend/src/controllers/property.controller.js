import { PrismaClient } from '@prisma/client'
import slugify from 'slugify'
import { getDistanceKm } from '../utils/geo.util.js'
import { paginate } from '../utils/response.util.js'

const prisma = new PrismaClient()

const propertyIncludes = {
  owner:    { select: { id:true, firstName:true, lastName:true, avatar:true, phone:true } },
  agency:   { select: { id:true, name:true, logo:true } },
  category: { select: { id:true, name:true, slug:true, icon:true, color:true } },
  reviews:  { select: { rating:true } },
  _count:   { select: { favorites:true, reviews:true, bookings:true } },
}

// ── Helpers ───────────────────────────────────────────────────
const toBool = (v) => v === true || v === 'true' || v === '1' || v === 1
const toInt  = (v) => v != null && v !== '' ? parseInt(v,  10) : null
const toFloat = (v) => v != null && v !== '' ? parseFloat(v)    : null
const toArr  = (v) => Array.isArray(v) ? v : []

// ── GET /properties ───────────────────────────────────────────
export const getProperties = async (req, res, next) => {
  try {
    const {
      page=1, limit=12, lat, lng, radius=10,
      listingType, propertyType, categoryId, categorySlug,
      minPrice, maxPrice, minArea, maxArea,
      bedrooms, city, search,
      sortBy='createdAt', sortDir='desc', featured,
    } = req.query

    const where = { status: 'ACTIVE' }
    if (listingType)         where.listingType  = listingType
    if (propertyType)        where.propertyType = propertyType
    if (categoryId)          where.categoryId   = categoryId
    if (categorySlug)        where.category     = { slug: categorySlug }
    if (featured === 'true') where.featured     = true
    if (city)   where.city = { contains: city, mode: 'insensitive' }
    if (search) where.OR = [
      { title:       { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { address:     { contains: search, mode: 'insensitive' } },
      { city:        { contains: search, mode: 'insensitive' } },
    ]
    if (minPrice || maxPrice) where.price = {
      ...(minPrice && { gte: parseFloat(minPrice) }),
      ...(maxPrice && { lte: parseFloat(maxPrice) }),
    }
    if (minArea || maxArea) where.area = {
      ...(minArea && { gte: parseFloat(minArea) }),
      ...(maxArea && { lte: parseFloat(maxArea) }),
    }
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) }

    const skip = (+page - 1) * +limit
    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where, skip, take: +limit,
        orderBy: { [sortBy]: sortDir },
        include: propertyIncludes,
      }),
    ])

    const result = properties.map(p => ({
      ...p,
      avgRating: p.reviews.length
        ? +(p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1)
        : null,
      distance: (lat && lng && p.latitude && p.longitude)
        ? +getDistanceKm(+lat, +lng, p.latitude, p.longitude).toFixed(2)
        : null,
    }))

    const filtered = (lat && lng)
      ? result.filter(p => p.distance <= +radius).sort((a, b) => a.distance - b.distance)
      : result

    res.json(paginate(filtered, total, page, limit))
  } catch (e) { next(e) }
}

// ── GET /properties/my ────────────────────────────────────────
export const getMyProperties = async (req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      include: {
        category: true,
        _count: { select: { bookings:true, reviews:true, favorites:true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(properties)
  } catch (e) { next(e) }
}

// ── GET /properties/:slug ─────────────────────────────────────
export const getProperty = async (req, res, next) => {
  try {
    const p = await prisma.property.findUnique({
      where: { slug: req.params.slug },
      include: {
        ...propertyIncludes,
        reviews: {
          include: { author: { select: { firstName:true, lastName:true, avatar:true } } },
          orderBy: { createdAt: 'desc' },
        },
        availabilities: { where: { startDate: { gte: new Date() } } },
      },
    })
    if (!p) return res.status(404).json({ message: 'Bien introuvable' })
    await prisma.property.update({ where: { id: p.id }, data: { viewCount: { increment: 1 } } })
    const avgRating = p.reviews.length
      ? +(p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1)
      : null
    res.json({ ...p, avgRating })
  } catch (e) { next(e) }
}

// ── POST /properties ──────────────────────────────────────────
export const createProperty = async (req, res, next) => {
  try {
    const b = req.body

    console.log(b)

    // ── Validation des champs obligatoires ──────────────────
    const title       = b.title?.toString().trim()
    const description = b.description?.toString().trim()
    const propertyType = b.propertyType?.toString().trim()
    const listingType  = b.listingType?.toString().trim()
    const price        = b.price
    const address      = b.address?.toString().trim()
    const city         = b.city?.toString().trim()

    const missing = []
    if (!title)        missing.push('title')
    if (!description)  missing.push('description')
    if (!propertyType) missing.push('propertyType')
    if (!listingType)  missing.push('listingType')
    if (!price)        missing.push('price')
    if (!address)      missing.push('address')
    if (!city)         missing.push('city')

    // if (missing.length > 0)
    //   return res.status(400).json({ message: `Champs obligatoires manquants : ${missing.join(', ')}` })

    // ── Résoudre categoryId ─────────────────────────────────
    let categoryId = b.categoryId?.toString().trim() || null
    if (!categoryId) {
      const firstCat = await prisma.category.findFirst({ where: { isActive: true }, orderBy: { position: 'asc' } })
      categoryId = firstCat?.id ?? null
    }

    const slug = slugify(`${title}-${Date.now()}`, { lower: true, strict: true })

    const property = await prisma.property.create({
      data: {
        title,
        slug,
        description,
        propertyType,
        listingType,
        status:      'PENDING',
        price:       parseFloat(price),
        priceUnit:   b.priceUnit?.toString().trim() || 'MGA',
        negotiable:  toBool(b.negotiable),
        furnished:   toBool(b.furnished),
        featured:    toBool(b.featured),
        area:        toFloat(b.area),
        bedrooms:    toInt(b.bedrooms),
        bathrooms:   toInt(b.bathrooms),
        floors:      toInt(b.floors),
        parkingSpots:toInt(b.parkingSpots),
        yearBuilt:   toInt(b.yearBuilt),
        address,
        city,
        district:    b.district?.toString().trim() || null,
        country:     b.country?.toString().trim()  || 'MG',
        latitude:    toFloat(b.latitude),
        longitude:   toFloat(b.longitude),
        images:      toArr(b.images),
        amenities:   toArr(b.amenities),
        virtualTour: b.virtualTour?.toString().trim() || null,
        metaTitle:   b.metaTitle?.toString().trim()   || null,
        metaDesc:    b.metaDesc?.toString().trim()     || null,
        ownerId:     req.user.id,
        ...(categoryId && { categoryId }),
      },
    })

    res.status(201).json(property)
  } catch (e) { 
    console.error(e)
    next(e)
   }
}

// ── PUT /properties/:id ───────────────────────────────────────
export const updateProperty = async (req, res, next) => {
  try {
    const prop = await prisma.property.findUnique({ where: { id: req.params.id } })
    if (!prop) return res.status(404).json({ message: 'Bien introuvable' })
    if (prop.ownerId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ message: 'Accès refusé' })

    const b = req.body
    const title = b.title?.toString().trim()

    // Recalculer slug si le titre change
    const slug = title && title !== prop.title
      ? slugify(`${title}-${Date.now()}`, { lower: true, strict: true })
      : prop.slug

    // Construire l'objet data dynamiquement — ne mettre à jour
    // que les champs présents dans le body
    const data = {}
    if (title)                          { data.title = title; data.slug = slug }
    if (b.description?.trim())            data.description  = b.description.trim()
    if (b.propertyType)                   data.propertyType = b.propertyType
    if (b.listingType)                    data.listingType  = b.listingType
    if (b.price != null && b.price !== '') data.price       = parseFloat(b.price)
    if (b.priceUnit)                      data.priceUnit    = b.priceUnit
    if (b.address?.trim())                data.address      = b.address.trim()
    if (b.city?.trim())                   data.city         = b.city.trim()
    if (b.district != null)               data.district     = b.district?.trim() || null
    if (b.country)                        data.country      = b.country
    if (b.area      != null)              data.area         = toFloat(b.area)
    if (b.bedrooms  != null)              data.bedrooms     = toInt(b.bedrooms)
    if (b.bathrooms != null)              data.bathrooms    = toInt(b.bathrooms)
    if (b.floors    != null)              data.floors       = toInt(b.floors)
    if (b.parkingSpots != null)           data.parkingSpots = toInt(b.parkingSpots)
    if (b.yearBuilt != null)              data.yearBuilt    = toInt(b.yearBuilt)
    if (b.latitude  != null)              data.latitude     = toFloat(b.latitude)
    if (b.longitude != null)              data.longitude    = toFloat(b.longitude)
    if (b.furnished  != null)             data.furnished    = toBool(b.furnished)
    if (b.negotiable != null)             data.negotiable   = toBool(b.negotiable)
    if (b.featured   != null)             data.featured     = toBool(b.featured)
    if (Array.isArray(b.images))          data.images       = b.images
    if (Array.isArray(b.amenities))       data.amenities    = b.amenities
    if (b.categoryId)                     data.categoryId   = b.categoryId
    if (b.virtualTour != null)            data.virtualTour  = b.virtualTour || null
    if (b.metaTitle   != null)            data.metaTitle    = b.metaTitle   || null
    if (b.metaDesc    != null)            data.metaDesc     = b.metaDesc    || null

    const updated = await prisma.property.update({ where: { id: req.params.id }, data })
    res.json(updated)
  } catch (e) { next(e) }
}

// ── DELETE /properties/:id (soft delete = archive) ────────────
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

// ── POST /properties/:propertyId/favorite ─────────────────────
export const toggleFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params
    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: req.user.id, propertyId } },
    })
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      return res.json({ favorited: false })
    }
    await prisma.favorite.create({ data: { userId: req.user.id, propertyId } })
    res.json({ favorited: true })
  } catch (e) { next(e) }
}