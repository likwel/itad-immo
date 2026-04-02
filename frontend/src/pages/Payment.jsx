import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
export default function Payment() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const success = window.location.pathname.includes('success')
  useEffect(() => { if (success) setTimeout(() => navigate('/espace-client'), 4000) }, [])
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md w-full">
        <div className="text-6xl mb-4">{success ? '✅' : '❌'}</div>
        <h1 className="text-2xl font-bold mb-2">{success ? 'Paiement réussi !' : 'Paiement annulé'}</h1>
        <p className="text-slate-500">{success ? 'Votre réservation est confirmée. Redirection...' : 'Votre paiement a été annulé.'}</p>
        {!success && <button onClick={() => navigate('/espace-client')} className="btn-primary mt-6">Retour</button>}
      </div>
    </div>
  )
}
