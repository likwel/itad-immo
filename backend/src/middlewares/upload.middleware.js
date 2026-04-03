
import multer from 'multer'
import path   from 'path'
import fs     from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Dossier uploads/ à la racine du backend
const UPLOAD_DIR = path.join(__dirname, '../../uploads/properties')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, name)
  }
})

const fileFilter = (_, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Format non supporté (jpg/png/webp)'), false)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }  // 5MB max
})

