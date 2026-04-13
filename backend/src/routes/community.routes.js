import { Router } from 'express'
import {
  getPosts, createPost, deletePost,
  getComments, addComment,
  reactToPost, bookmarkPost, sharePost,
  toggleFollow, getMembers, getCommunityStats,
} from '../controllers/community.controller.js'
import { authenticate, optionalAuth } from '../middlewares/auth.middleware.js'

const router = Router()

// Stats & membres (lecture publique)
router.get('/stats',   optionalAuth, getCommunityStats)
router.get('/members', optionalAuth, getMembers)

// Posts
router.get('/posts',         optionalAuth,  getPosts)
router.post('/posts',        authenticate,  createPost)
router.delete('/posts/:id',  authenticate,  deletePost)

// Commentaires
router.get('/posts/:id/comments',  optionalAuth, getComments)
router.post('/posts/:id/comments', authenticate, addComment)

// Interactions
router.post('/posts/:id/react',    authenticate, reactToPost)
router.post('/posts/:id/bookmark', authenticate, bookmarkPost)
router.post('/posts/:id/share',    authenticate, sharePost)

// Follow
router.post('/follow/:id', authenticate, toggleFollow)

export default router