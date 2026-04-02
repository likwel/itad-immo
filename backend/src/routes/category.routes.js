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
