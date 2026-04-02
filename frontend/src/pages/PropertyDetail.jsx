import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProperty } from '../services/property.service'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

export default function PropertyDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [imgIdx,   setImgIdx]   = useState(0)

  useEffect(() => {
    getProperty(slug).then(setProperty).catch(console.error).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <Spinner />
  if (!property) return <div className="text-center py-20">Bien introuvable</div>

  const p = property
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Colonne principale */}
      <div className="lg:col-span-2 space-y-8">
        {/* Galerie */}
        <div className="rounded-2xl overflow-hidden bg-slate-100">
          {p.images?.length > 0
            ? <img src={p.images[imgIdx]} alt={p.title} className="w-full h-96 object-cover"/>
            : <div className="w-full h-96 flex items-center justify-center text-8xl">🏠</div>
          }
          {p.images?.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {p.images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setImgIdx(i)}
                  className={`h-16 w-24 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${i === imgIdx ? 'ring-2 ring-blue-600' : 'opacity-60 hover:opacity-100'}`}/>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant={p.listingType === 'SALE' ? 'green' : p.listingType === 'RENT' ? 'blue' : 'yellow'}>
              {p.listingType === 'SALE' ? 'Vente' : p.listingType === 'RENT' ? 'Location' : 'Vacances'}
            </Badge>
            {p.featured && <Badge variant="yellow">⭐ En vedette</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{p.title}</h1>
          <p className="text-slate-500 mb-4">📍 {p.address}, {p.city}{p.district ? ` - ${p.district}` : ''}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
            {p.area      && <div className="text-center"><div className="text-2xl">📐</div><div className="font-semibold">{p.area}m²</div><div className="text-xs text-slate-500">Surface</div></div>}
            {p.bedrooms  && <div className="text-center"><div className="text-2xl">🛏</div><div className="font-semibold">{p.bedrooms}</div><div className="text-xs text-slate-500">Chambres</div></div>}
            {p.bathrooms && <div className="text-center"><div className="text-2xl">🚿</div><div className="font-semibold">{p.bathrooms}</div><div className="text-xs text-slate-500">SDB</div></div>}
            {p.parkingSpots && <div className="text-center"><div className="text-2xl">🚗</div><div className="font-semibold">{p.parkingSpots}</div><div className="text-xs text-slate-500">Parking</div></div>}
          </div>

          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p className="text-slate-600 leading-relaxed">{p.description}</p>

          {p.amenities?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">Équipements</h2>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map(a => <Badge key={a} variant="gray">{a}</Badge>)}
              </div>
            </div>
          )}
        </div>

        {/* Avis */}
        {p.reviews?.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Avis ({p.reviews.length}) — ⭐ {p.avgRating}</h2>
            <div className="space-y-4">
              {p.reviews.map(r => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                      {r.author.firstName?.[0]}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{r.author.firstName} {r.author.lastName}</div>
                      <div className="text-yellow-400 text-xs">{'⭐'.repeat(r.rating)}</div>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Prix & CTA */}
        <div className="card p-6 sticky top-24">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {p.price?.toLocaleString()} {p.priceUnit}
          </div>
          {p.listingType === 'RENT' && <div className="text-slate-500 text-sm">/mois</div>}
          {p.negotiable && <div className="text-green-600 text-sm mt-1">✓ Prix négociable</div>}

          <div className="space-y-3 mt-6">
            {user ? (
              <button onClick={() => navigate(`/reservation/${p.id}`)}
                className="w-full btn-primary">
                {p.listingType === 'SALE' ? '📋 Faire une offre' : '📅 Réserver'}
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="w-full btn-primary">
                Se connecter pour réserver
              </button>
            )}
          </div>

          {/* Vendeur */}
          {p.owner && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                  {p.owner.firstName?.[0]}
                </div>
                <div>
                  <div className="font-semibold">{p.owner.firstName} {p.owner.lastName}</div>
                  {p.agency && <div className="text-sm text-slate-500">{p.agency.name}</div>}
                </div>
              </div>
              {p.owner.phone && (
                <a href={`tel:${p.owner.phone}`} className="mt-3 w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                  📞 {p.owner.phone}
                </a>
              )}
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400 text-center">{p.viewCount} vues</div>
        </div>
      </div>
    </div>
  )
}
