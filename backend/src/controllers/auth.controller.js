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
