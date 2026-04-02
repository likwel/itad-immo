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
