import { useNavigate } from 'react-router-dom'
export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🏚️</div>
        <h1 className="text-4xl font-bold text-slate-800 mb-3">404 — Page introuvable</h1>
        <p className="text-slate-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Retour à l'accueil</button>
      </div>
    </div>
  )
}
