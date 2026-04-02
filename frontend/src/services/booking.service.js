import { api } from './api'
export const createBooking     = data => api('/bookings', { method:'POST', body: JSON.stringify(data) })
export const getMyBookings     = ()   => api('/bookings/my')
export const createPaySession  = bookingId => api('/payments/create-session', { method:'POST', body: JSON.stringify({ bookingId }) })
