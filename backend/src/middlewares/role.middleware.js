export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' })
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: `Accès réservé aux rôles: ${roles.join(', ')}` })
  next()
}
