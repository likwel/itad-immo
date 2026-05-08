// ════════════════════════════════════════════════════════════
// routes/live.routes.js
// ════════════════════════════════════════════════════════════
import { Router } from 'express'
import {
  getLives, getLive, getLiveStats, createLive, updateLive, deleteLive,
  getLiveHistory, getMyLives, endLive
} from '../controllers/live.controller.js'
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.get ('/',              optionalAuth, getLives)
router.get ('/me/history',    authenticate, getMyLives)
router.get ('/:id/stats',     optionalAuth, getLiveStats)  // 👈 NOUVEAU - AVANT /:id
router.get ('/:id/history',   authenticate, getLiveHistory) // 👈 DÉPLACÉ AVANT /:id
router.get ('/:id',           optionalAuth, getLive)        // 👈 Après les routes spécifiques
router.post('/',              authenticate, createLive)
router.post('/:id/end',       authenticate, endLive)
router.put ('/:id',           authenticate, updateLive)
router.delete('/:id',         authenticate, deleteLive)

export default router