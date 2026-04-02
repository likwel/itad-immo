export const errorMiddleware = (err, req, res, next) => {
  console.error('❌ Erreur:', err.message)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
