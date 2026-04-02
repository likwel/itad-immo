import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setFilters } from '../store/propertySlice'
import PropertyCard from '../components/property/PropertyCard'
import { useProperties } from '../hooks/useProperties'
import Spinner from '../components/ui/Spinner'

// ── Icônes SVG ────────────────────────────────────────────────
const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const Icons = {
  // Catégories
  location:   'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  vente:      ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10', 'M12 2v4', 'M8 6h8'],
  vacances:   ['M12 17a5 5 0 100-10 5 5 0 000 10z', 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'],
  bureaux:    ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 21v-4h6v4', 'M9 9h1v1H9z', 'M14 9h1v1h-1z', 'M9 14h1v1H9z', 'M14 14h1v1h-1z'],
  terrain:    ['M3 21h18', 'M9 8a3 3 0 100-6 3 3 0 000 6z', 'M17 8c0 3-4 13-4 13H6S2 11 2 8a7 7 0 0114 0z'],
  colocation: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  // Recherche
  search:     'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  // Stats
  home:       'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  verified:   ['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4L12 14.01l-3-3'],
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  // Flèche
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  chevronRight: 'M9 18l6-6-6-6',
}

const CATEGORIES = [
  { slug: 'location',   label: 'Location',   icon: Icons.location,   bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100'    },
  { slug: 'vente',      label: 'Vente',       icon: Icons.vente,      bg: 'bg-green-50',   text: 'text-green-600',   border: 'border-green-100'   },
  { slug: 'vacances',   label: 'Vacances',    icon: Icons.vacances,   bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100'   },
  { slug: 'bureaux',    label: 'Bureaux',     icon: Icons.bureaux,    bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100'  },
  { slug: 'terrain',    label: 'Terrain',     icon: Icons.terrain,    bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { slug: 'colocation', label: 'Colocation',  icon: Icons.colocation, bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-100'    },
]

const STATS = [
  { value: '2 400+', label: 'Biens disponibles', icon: Icons.home     },
  { value: '1 200+', label: 'Vendeurs vérifiés',  icon: Icons.verified },
  { value: '98%',    label: 'Clients satisfaits', icon: Icons.star     },
]

export default function Home() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [search, setSearch] = useState('')
  const [type,   setType]   = useState('')
  const { properties: featured, loading, error } = useProperties({ featured: true, limit: 6, status:'ACTIVE' })

  const handleSearch = () => {
    dispatch(setFilters({ search, listingType: type }))
    navigate('/annonces')
  }

  return (
    <div>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight">
            Trouvez le bien <span className="text-blue-400">idéal</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10">
            Location, vente, vacances — des milliers de biens à Madagascar
          </p>

          {/* Barre de recherche */}
          <div className="bg-white rounded-2xl p-3 flex flex-wrap gap-3 shadow-2xl max-w-3xl mx-auto">
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="text-slate-700 px-4 py-3 rounded-xl bg-slate-50 focus:outline-none font-medium flex-shrink-0"
            >
              <option value="">Tout type</option>
              <option value="SALE">Vente</option>
              <option value="RENT">Location</option>
              <option value="VACATION_RENT">Vacances</option>
            </select>

            <div className="flex-1 relative min-w-[180px]">
              <Icon d={Icons.search} size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ville, quartier, adresse..."
                className="w-full text-slate-700 pl-9 pr-4 py-3 rounded-xl focus:outline-none bg-slate-50"
              />
            </div>

            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-semibold transition-colors"
            >
              <Icon d={Icons.search} size={16} className="text-white"/>
              Rechercher
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-14 grid grid-cols-3 gap-6 text-center">
          {STATS.map(({ value, label, icon }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Icon d={icon} size={18} className="text-blue-300"/>
              </div>
              <div className="text-3xl font-bold text-blue-400">{value}</div>
              <div className="text-slate-400 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATÉGORIES ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Parcourir par catégorie</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {CATEGORIES.map(c => (
            <button
              key={c.slug}
              onClick={() => { dispatch(setFilters({ categorySlug: c.slug })); navigate('/annonces') }}
              className={`group ${c.bg} border ${c.border} rounded-2xl p-5 text-center hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer`}
            >
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <Icon d={c.icon} size={22} className={c.text}/>
              </div>
              <div className={`font-semibold text-sm ${c.text}`}>{c.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── BIENS EN VEDETTE ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Biens en vedette</h2>
          <button
            onClick={() => navigate('/annonces')}
            className="flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-700 transition-colors group"
          >
            Voir tout
            <Icon d={Icons.arrowRight} size={16} className="group-hover:translate-x-0.5 transition-transform"/>
          </button>
        </div>

        {loading && !error ? (
          <Spinner />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Icon d={Icons.home} size={40} className="text-slate-300" strokeWidth={1.2}/>
            <p className="text-sm">Impossible de charger les biens</p>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        ) : featured?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Icon d={Icons.home} size={40} className="text-slate-300" strokeWidth={1.2}/>
            <p className="text-sm">Aucun bien en vedette pour le moment</p>
          </div>
        )}
      </section>
    </div>
  )
}