import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { toggleFav } from '../../services/property.service'

const TYPE_LABELS = { SALE:'Vente', RENT:'Location', VACATION_RENT:'Vacances' }
const TYPE_COLORS = { SALE:'bg-green-100 text-green-700', RENT:'bg-blue-100 text-blue-700', VACATION_RENT:'bg-yellow-100 text-yellow-700' }

export default function PropertyCard({ property: p }) {
  const { user } = useAuth()
  const [fav, setFav] = useState(false)

  const handleFav = async e => {
    e.preventDefault(); e.stopPropagation()
    if (!user) return
    try { const r = await toggleFav(p.id); setFav(r.favorited) } catch {}
  }

  return (
    <Link to={`/annonces/${p.slug}`} className="group block card hover:shadow-lg transition-all duration-200">
      <div className="relative h-52 bg-slate-200 overflow-hidden">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          : <div className="w-full h-full flex items-center justify-center text-5xl">🏠</div>
        }
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${TYPE_COLORS[p.listingType]}`}>{TYPE_LABELS[p.listingType]}</span>
          {p.featured && <span className="bg-amber-400 text-amber-900 px-2 py-1 rounded-lg text-xs font-semibold">⭐</span>}
        </div>
        <button onClick={handleFav} className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow">
          <span className={fav ? 'text-red-500 text-lg' : 'text-slate-400 text-lg'}>{fav ? '♥' : '♡'}</span>
        </button>
        {p.distance != null && (
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
            📍 {p.distance < 1 ? `${(p.distance*1000).toFixed(0)}m` : `${p.distance.toFixed(1)}km`}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{p.title}</h3>
        <p className="text-slate-500 text-sm mt-1">📍 {p.city}{p.district ? `, ${p.district}` : ''}</p>
        <div className="flex gap-4 my-3 text-sm text-slate-600">
          {p.bedrooms  && <span>🛏 {p.bedrooms}</span>}
          {p.bathrooms && <span>🚿 {p.bathrooms}</span>}
          {p.area      && <span>📐 {p.area}m²</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-blue-600">{p.price?.toLocaleString()} {p.priceUnit}</span>
            {p.listingType === 'RENT' && <span className="text-slate-400 text-sm">/mois</span>}
          </div>
          {p.avgRating && (
            <span className="text-sm font-medium text-slate-700">⭐ {p.avgRating}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
