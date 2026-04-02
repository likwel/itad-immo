import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyProperties, deleteProperty } from '../services/property.service'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const STATUS_COLORS = { PENDING:'yellow', ACTIVE:'green', ARCHIVED:'gray', SOLD:'blue', RENTED:'purple' }
const STATUS_LABELS = { PENDING:'En attente', ACTIVE:'Actif', ARCHIVED:'Archivé', SOLD:'Vendu', RENTED:'Loué' }

export default function SellerDashboard() {
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab, setTab] = useState('list')

  const load = () => {
    setLoading(true)
    getMyProperties().then(setProperties).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleDelete = async id => {
    if (!confirm('Archiver ce bien ?')) return
    await deleteProperty(id)
    load()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mes annonces</h1>
        <Button onClick={() => setTab('create')}>+ Nouvelle annonce</Button>
      </div>

      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {[['list','Mes biens'],['bookings','Réservations reçues']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        loading ? <Spinner /> :
        properties.length === 0
          ? <div className="text-center py-16 text-slate-400"><div className="text-6xl mb-4">🏠</div><p>Aucune annonce — créez votre première!</p></div>
          : <div className="grid gap-4">
              {properties.map(p => (
                <div key={p.id} className="card p-5 flex items-center gap-4">
                  <div className="w-24 h-16 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                    {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/annonces/${p.slug}`} className="font-semibold hover:text-blue-600 truncate block">{p.title}</Link>
                    <p className="text-sm text-slate-500">{p.city} · {p.price?.toLocaleString()} MGA</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-400">
                      <span>👁 {p.viewCount} vues</span>
                      <span>📅 {p._count?.bookings} résa</span>
                      <span>⭐ {p._count?.reviews} avis</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge variant={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="text-xs py-1 px-3">Modifier</Button>
                      <Button variant="danger" onClick={() => handleDelete(p.id)} className="text-xs py-1 px-3">Archiver</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      )}

      {tab === 'create' && (
        <div className="card p-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Nouvelle annonce</h2>
          <p className="text-slate-500">Formulaire de création (PropertyForm component — à implémenter)</p>
          <Button variant="secondary" className="mt-4" onClick={() => setTab('list')}>← Retour</Button>
        </div>
      )}
    </div>
  )
}
