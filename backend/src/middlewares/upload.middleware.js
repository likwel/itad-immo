import multer from 'multer'

const storage = multer.memoryStorage()
const fileFilter = (_, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Format non supporté (jpg/png/webp uniquement)'), false)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 } // 5MB max par fichier
})
