// routes/user.routes.js
import express from 'express'
import {
  getAgencies, getAgencyDetail, getSellerDetail,
  getMe, updateMe, getStats
} from '../controllers/user.controller.js'
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.get('/stats', getStats)
router.get('/me',                   authenticate,         getMe)
router.put('/me',                   authenticate,         updateMe)
router.get('/agencies',             optionalAuth,         getAgencies)
router.get('/agencies/:id',         optionalAuth,         getAgencyDetail)
router.get('/agencies/seller/:id',  optionalAuth,         getSellerDetail)

export default router