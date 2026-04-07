import { Router } from 'express'
import {
  getProperties, getProperty, createProperty,
  updateProperty, deleteProperty, toggleFavorite,
  getMyProperties, getFavorites
} from '../controllers/property.controller.js'
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js'
import { requireRole } from '../middlewares/role.middleware.js'

const r = Router()

r.get('/',                    optionalAuth,  getProperties)
r.get('/my',                  authenticate,  getMyProperties)
r.get('/my-favorites',        authenticate,  getFavorites)
r.get('/:slug',               optionalAuth,  getProperty)
r.post('/',                   authenticate,  requireRole('SELLER','AGENCY','ADMIN'), createProperty)
r.put('/:id',                 authenticate,  updateProperty)
r.delete('/:id',              authenticate,  deleteProperty)
r.post('/:propertyId/favorite', authenticate, toggleFavorite)

export default r