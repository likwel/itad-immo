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
