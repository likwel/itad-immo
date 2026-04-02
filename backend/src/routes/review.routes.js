import { Router } from 'express'
import { createReview, getPropertyReviews, deleteReview } from '../controllers/review.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/',                     authenticate, createReview)
r.get('/property/:propertyId',  getPropertyReviews)
r.delete('/:id',                authenticate, deleteReview)
export default r
