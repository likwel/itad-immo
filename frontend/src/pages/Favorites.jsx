import { useState, useEffect } from 'react'
import { api } from '../services/api'
import PropertyCard from '../components/property/PropertyCard'
import PropertyListItem from '../components/property/PropertyListItem'
import Spinner from '../components/ui/Spinner'
import { NAVBAR_HEIGHT } from '../components/layout/Navbar'

// ── Icônes ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  heart:   'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  grid:    ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  list:    'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  search:  'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  x:       'M18 6L6 18M6 6l12 12',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
}

export default function Favorites() {
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [viewMode,   setViewMode]   = useState('grid')
  const [search,     setSearch]     = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api('/properties/my-favorites')
      setProperties(res.properties ?? [])
    } catch (e) {
      setError(e.message ?? 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Supprime la carte quand l'utilisateur retire le favori
  const handleRemove = (id) => {
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  const filtered = properties.filter(p =>
    !search || `${p.title} ${p.city}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

      {/* ── Toolbar ── */}
      <div className="sticky z-40 mt-3" style={{ top: NAVBAR_HEIGHT }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Titre */}
          <div className="flex items-center gap-2 mr-2">
            <Icon d={Icons.heart} size={18} className="text-red-500" strokeWidth={2}/>
            <span className="font-bold text-slate-800 text-base">Mes favoris</span>
            {!loading && (
              <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                {properties.length}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Icon d={Icons.search} size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filtrer par titre, ville..."
              className="w-full border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"/>
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <Icon d={Icons.x} size={13}/>
              </button>
            )}
          </div>

          {/* Compteur filtré */}
          {search && (
            <span className="text-sm text-slate-500 hidden sm:block">
              <strong className="text-slate-800 font-semibold">{filtered.length}</strong> résultat{filtered.length > 1 ? 's' : ''}
            </span>
          )}

          {/* Vue grid/list */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden ml-auto flex-shrink-0">
            {[
              { m:'grid', icon:Icons.grid },
              { m:'list', icon:Icons.list },
            ].map(({ m, icon }) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-3 py-2 transition-colors ${viewMode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Icon d={icon} size={14}/>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Spinner size="lg"/>
            <p className="text-sm text-slate-400">Chargement de vos favoris...</p>
          </div>

        ) : error ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
              <Icon d={Icons.x} size={28} className="text-red-300" strokeWidth={1.2}/>
            </div>
            <div className="text-center">
              <p className="text-slate-700 font-semibold mb-1">Erreur de chargement</p>
              <p className="text-slate-400 text-sm">{error}</p>
            </div>
            <button onClick={load}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 transition-all">
              <Icon d={Icons.refresh} size={13}/> Réessayer
            </button>
          </div>

        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
              <Icon d={Icons.heart} size={36} className="text-red-200" strokeWidth={1.2}/>
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-semibold text-lg mb-1">Aucun favori pour l'instant</p>
              <p className="text-slate-400 text-sm max-w-xs">
                Explorez les annonces et ajoutez vos biens préférés à vos favoris
              </p>
            </div>
            <a href="/listings"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              <Icon d={Icons.search} size={13}/> Parcourir les annonces
            </a>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Icon d={Icons.search} size={32} className="text-slate-300" strokeWidth={1.2}/>
            <p className="text-slate-500 font-medium">Aucun résultat pour <strong>"{search}"</strong></p>
            <button onClick={() => setSearch('')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Effacer le filtre
            </button>
          </div>

        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(p => (
                <PropertyCard key={p.id} property={p} onRemove={handleRemove}/>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(p => (
                <PropertyListItem key={p.id} property={p} onRemove={handleRemove}/>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}