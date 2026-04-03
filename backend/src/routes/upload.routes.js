
// ════════════════════════════════════════
// backend/src/routes/upload.routes.js
// ════════════════════════════════════════
import { Router }     from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { upload }     from '../middlewares/upload.middleware.js'
import path           from 'path'
import fs             from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const r = Router()

// POST /api/upload  — upload 1 à plusieurs images
// Retourne les URLs accessibles
r.post('/', authenticate, upload.array('images', 10), (req, res) => {
  if (!req.files?.length)
    return res.status(400).json({ message: 'Aucun fichier reçu' })

  const baseUrl = `${req.protocol}://${req.get('host')}`
  const urls = req.files.map(f => `${baseUrl}/uploads/properties/${f.filename}`)

  res.json({ urls })
})

// DELETE /api/upload  — supprimer un fichier
r.delete('/', authenticate, (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ message: 'URL manquante' })

  // Extraire le nom du fichier depuis l'URL
  const filename = url.split('/uploads/properties/').pop()
  if (!filename) return res.status(400).json({ message: 'URL invalide' })

  const filepath = path.join(__dirname, '../../uploads/properties', filename)

  if (!fs.existsSync(filepath))
    return res.status(404).json({ message: 'Fichier introuvable' })

  fs.unlinkSync(filepath)
  res.json({ message: 'Fichier supprimé' })
})

export default r