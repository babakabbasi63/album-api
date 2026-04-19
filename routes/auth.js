import express from 'express'
import { register, login, logout } from '../controllers/auth.js'
import { isAuthenticated } from '../middleware/auth.js'

const router = express.Router()

// public routes
router.post('/register', register)
router.post('/login', login)

// protected route — must be logged in to logout
router.post('/logout', isAuthenticated, logout)

export default router