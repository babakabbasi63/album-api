import express from 'express'
import {
  getAlbums,
  getAlbum,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumsByGenre
} from '../controllers/albums.js'
import { isAuthenticated } from '../middleware/auth.js'

const router = express.Router()

// ─── Public routes — no login needed ─────────────────────────────────────────
router.get('/', getAlbums)
router.get('/genre/:genre', getAlbumsByGenre)
router.get('/:id', getAlbum)

// ─── Protected routes — must be logged in ────────────────────────────────────
router.post('/', isAuthenticated, createAlbum)
router.put('/:id', isAuthenticated, updateAlbum)
router.delete('/:id', isAuthenticated, deleteAlbum)

export default router