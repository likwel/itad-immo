
// ════════════════════════════════════════════════════════════
// routes/live.routes.js
// ════════════════════════════════════════════════════════════
import { Router } from 'express'
import {
  getLives, getLive, createLive, updateLive, deleteLive,
  getLiveHistory, getMyLives, endLive
} from '../controllers/live.controller.js'
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.get ('/',              optionalAuth, getLives)
router.get ('/me/history',    authenticate, getMyLives)
router.get ('/:id',           optionalAuth, getLive)
router.post('/',              authenticate, createLive)
router.post  ('/:id/end',     authenticate, endLive)
router.put ('/:id',           authenticate, updateLive)
router.delete('/:id',         authenticate, deleteLive)
router.get ('/:id/history',   authenticate, getLiveHistory)

export default router