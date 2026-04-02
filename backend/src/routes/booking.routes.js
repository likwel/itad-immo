import { Router } from 'express'
import { createBooking, getMyBookings, getPropertyBookings, updateBookingStatus } from '../controllers/booking.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/',                    authenticate, createBooking)
r.get('/my',                   authenticate, getMyBookings)
r.get('/property/:propertyId', authenticate, getPropertyBookings)
r.put('/:id/status',           authenticate, updateBookingStatus)
export default r
