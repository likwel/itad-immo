import { Router } from 'express'
import { register, login, getMe, updateProfile, changePassword } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/register', register)
r.post('/login',    login)
r.get('/me',        authenticate, getMe)
r.put('/me',        authenticate, updateProfile)
r.put('/me/password', authenticate, changePassword)
export default r
