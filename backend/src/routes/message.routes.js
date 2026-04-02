import { Router } from 'express'
import { sendMessage, getConversations, getConversation } from '../controllers/message.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
const r = Router()
r.post('/',               authenticate, sendMessage)
r.get('/conversations',   authenticate, getConversations)
r.get('/:userId',         authenticate, getConversation)
export default r
