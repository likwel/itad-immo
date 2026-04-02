import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMyBookings } from '../services/booking.service'
import { getMe } from '../services/auth.service'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

const STATUS_COLORS = { PENDING:'yellow', CONFIRMED:'green', CANCELLED:'red', COMPLETED:'blue' }
const STATUS_LABELS = { PENDING:'En attente', CONFIRMED:'Confirmé', CANCELLED:'Annulé', COMPLETED:'Terminé' }

export default function ClientDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab, setTab] = useState('bookings')

  useEffect(() => {
    getMyBookings().then(setBookings).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
          {user?.firstName?.[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bonjour, {user?.firstName} 👋</h1>
          <p className="text-slate-500 text-sm">Bienvenue dans votre espace personnel</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {[['bookings','Mes réservations'],['favorites','Mes favoris'],['profile','Mon profil']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        loading ? <Spinner /> :
        bookings.length === 0
          ? <div className="text-center py-16 text-slate-400"><div className="text-6xl mb-4">📅</div><p>Aucune réservation pour l'instant</p></div>
          : <div className="space-y-4">
              {bookings.map(b => (
                <div key={b.id} className="card p-5 flex items-center gap-4">
                  <div className="w-20 h-16 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                    {b.property.images?.[0] && <img src={b.property.images[0]} className="w-full h-full object-cover"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{b.property.title}</h3>
                    <p className="text-sm text-slate-500">{b.property.city}</p>
                    <p className="text-sm text-slate-500">📅 {new Date(b.startDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                    <p className="text-sm font-semibold text-blue-600 mt-1">{b.totalPrice?.toLocaleString()} MGA</p>
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab === 'profile' && (
        <div className="card p-6 max-w-md">
          <h2 className="font-semibold mb-4">Informations personnelles</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-slate-500">Prénom:</span> <span className="font-medium ml-2">{user?.firstName}</span></div>
            <div><span className="text-slate-500">Nom:</span> <span className="font-medium ml-2">{user?.lastName}</span></div>
            <div><span className="text-slate-500">Email:</span> <span className="font-medium ml-2">{user?.email}</span></div>
            <div><span className="text-slate-500">Rôle:</span> <Badge variant="blue" className="ml-2">{user?.role}</Badge></div>
          </div>
        </div>
      )}
    </div>
  )
}
