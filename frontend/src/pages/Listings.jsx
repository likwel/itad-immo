import { useState, useCallback, useRef , useEffect} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearFilters } from '../store/propertySlice'
import { NAVBAR_HEIGHT } from '../components/layout/Navbar'
import PropertyCard from '../components/property/PropertyCard'
import PropertyListItem from '../components/property/PropertyListItem'
import { useProperties } from '../hooks/useProperties'
import { useGeolocation } from '../hooks/useGeolocation'
import Spinner from '../components/ui/Spinner'
import CustomSelect from '../components/property/CustomSelect'

// ── Icônes ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  grid:      ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  filter:    'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  x:         'M18 6L6 18M6 6l12 12',
  mapPin:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  tag:       'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
  key:       ['M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4'],
  sun:       ['M12 17a5 5 0 100-10 5 5 0 000 10z','M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2','M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'],
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  chevLeft:  'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  location:  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  sliders:   ['M4 21v-7','M4 10V3','M12 21v-9','M12 8V3','M20 21v-5','M20 12V3','M1 14h6','M9 8h6','M17 16h6'],
  refresh:   'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  sort:      ['M3 6h18','M7 12h10','M11 18h2'],
}

// ── Constantes ────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { value:'',          label:'Tous les types' },
  { value:'HOUSE',     label:'Maison'         },
  { value:'VILLA',     label:'Villa'          },
  { value:'APARTMENT', label:'Appartement'    },
  { value:'LAND',      label:'Terrain'        },
  { value:'OFFICE',    label:'Bureau'         },
]
const LISTING_TYPES = [
  { value:'',               label:'Tout',     icon:Icons.home },
  { value:'SALE',           label:'Vente',    icon:Icons.tag  },
  { value:'RENT',           label:'Location', icon:Icons.key  },
  { value:'VACATION_RENT',  label:'Vacances', icon:Icons.sun  },
]
const SORT_OPTIONS = [
  { value:'createdAt_desc', label:'Plus récents'     },
  { value:'price_asc',      label:'Prix croissant'   },
  { value:'price_desc',     label:'Prix décroissant' },
  { value:'viewCount_desc', label:'Plus vus'         },
]
const BEDROOMS_OPTIONS = ['','1','2','3','4','5']

// ── RangeInput ────────────────────────────────────────────────
const RangeInput = ({ labelMin, labelMax, min, max, onMin, onMax }) => (
  <div className="grid grid-cols-2 gap-2">
    {[[labelMin, min, onMin],[labelMax, max, onMax]].map(([l, v, fn]) => (
      <div key={l}>
        <label className="block text-xs text-slate-400 mb-1">{l}</label>
        <input type="number" value={v} onChange={e => fn(e.target.value)} min={0}
          placeholder="0"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>
    ))}
  </div>
)

// ── FilterPanel ───────────────────────────────────────────────
function FilterPanel({ filters, onChange, onReset, activeCount }) {
  const set = (k, v) => onChange({ ...filters, [k]: v, page: 1 })

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon d={Icons.sliders} size={15} className="text-slate-400"/>
          <span className="text-base font-bold text-slate-800">Filtres</span>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={onReset}
            className="text-sm text-red-400 hover:text-red-500 font-medium flex items-center gap-1">
            <Icon d={Icons.x} size={10}/> Réinitialiser
          </button>
        )}
      </div>

      {/* Type annonce */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Type d'annonce</p>
        <div className="grid grid-cols-2 gap-1.5">
          {LISTING_TYPES.map(t => (
            <button key={t.value} onClick={() => set('listingType', t.value)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all
                ${filters.listingType === t.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
              <Icon d={t.icon} size={11}/>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type bien */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Type de bien</p>
        <CustomSelect
          value={filters.propertyType ?? ''}
          options={PROPERTY_TYPES.map(t => [t.value, t.label])}
          onChange={val => set('propertyType', val)}
          placeholder="Tous les types"
          padding="6px 12px"
        />
      </div>

      {/* Ville */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ville</p>
        <div className="relative">
          <Icon d={Icons.mapPin} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          <input value={filters.city ?? ''} onChange={e => set('city', e.target.value)}
            placeholder="Antananarivo..."
            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
      </div>

      {/* Prix */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Prix (MGA)</p>
        <RangeInput labelMin="Min" labelMax="Max"
          min={filters.minPrice ?? ''} max={filters.maxPrice ?? ''}
          onMin={v => set('minPrice', v)} onMax={v => set('maxPrice', v)}/>
      </div>

      {/* Surface */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Surface (m²)</p>
        <RangeInput labelMin="Min" labelMax="Max"
          min={filters.minArea ?? ''} max={filters.maxArea ?? ''}
          onMin={v => set('minArea', v)} onMax={v => set('maxArea', v)}/>
      </div>

      {/* Chambres */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chambres min</p>
        <div className="flex gap-1.5 flex-wrap">
          {BEDROOMS_OPTIONS.map(o => (
            <button key={o} onClick={() => set('bedrooms', o)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${(filters.bedrooms ?? '') === o
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              {o === '' ? 'Tous' : `${o}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Meublé */}
      <div onClick={() => set('furnished', filters.furnished === 'true' ? '' : 'true')}
        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
          ${filters.furnished === 'true' ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
        <span className="text-sm font-medium text-slate-800">Meublé uniquement</span>
        <div className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors
          ${filters.furnished === 'true' ? 'bg-blue-600' : 'bg-slate-200'}`}>
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
            ${filters.furnished === 'true' ? 'translate-x-4' : 'translate-x-0.5'}`}/>
        </div>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const left  = Math.max(2, page - 2)
  const right = Math.min(totalPages - 1, page + 2)
  pages.push(1)
  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < totalPages - 1) pages.push('...')
  if (totalPages > 1) pages.push(totalPages)

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <Icon d={Icons.chevLeft} size={13}/> Préc.
      </button>
      {pages.map((p, i) => p === '...'
        ? <span key={`d${i}`} className="w-8 text-center text-slate-400 text-sm">…</span>
        : <button key={p} onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
              ${p === page ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>
            {p}
          </button>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        Suiv. <Icon d={Icons.chevRight} size={13}/>
      </button>
    </div>
  )
}

// ── FilterTags ────────────────────────────────────────────────
function FilterTags({ filters, onChange }) {
  const LMAP = { SALE:'Vente', RENT:'Location', VACATION_RENT:'Vacances' }
  const PMAP = { HOUSE:'Maison', VILLA:'Villa', APARTMENT:'Appart.', LAND:'Terrain', OFFICE:'Bureau' }
  const tags = [
    filters.listingType  && { k:'listingType',  v: LMAP[filters.listingType]                       },
    filters.propertyType && { k:'propertyType', v: PMAP[filters.propertyType]                      },
    filters.city         && { k:'city',          v: filters.city                                    },
    filters.minPrice     && { k:'minPrice',      v:`Min ${(+filters.minPrice).toLocaleString()}`    },
    filters.maxPrice     && { k:'maxPrice',      v:`Max ${(+filters.maxPrice).toLocaleString()}`    },
    filters.minArea      && { k:'minArea',       v:`Min ${filters.minArea}m²`                       },
    filters.maxArea      && { k:'maxArea',       v:`Max ${filters.maxArea}m²`                       },
    filters.bedrooms     && { k:'bedrooms',      v:`${filters.bedrooms}+ ch.`                       },
    filters.furnished === 'true' && { k:'furnished', v:'Meublé'                                    },
    filters.search       && { k:'search',        v:`"${filters.search}"`                           },
  ].filter(Boolean)

  if (!tags.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(t => (
        <button key={t.k} onClick={() => onChange({ ...filters, [t.k]:'', page:1 })}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 hover:bg-blue-100 transition-colors">
          {t.v}<Icon d={Icons.x} size={9}/>
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Listings
// ══════════════════════════════════════════════════════════════
export default function Listings() {
  const dispatch     = useDispatch()
  const savedFilters = useSelector(s => s.properties.filters)
  const searchTimer  = useRef(null)

  const [filters, setFilters] = useState({
    page:1, limit:12, sortBy:'createdAt', sortDir:'desc', ...savedFilters,
  })
  const [viewMode,      setViewMode]      = useState('grid')
  const [mobileFilters, setMobileFilters] = useState(false)
  const [searchInput,   setSearchInput]   = useState(filters.search ?? '')

  const { location }  = useGeolocation()
  const activeFilters = location ? { ...filters, lat:location.lat, lng:location.lng } : filters
  const { properties: fetched, total, totalPages, loading, error } = useProperties(activeFilters)
  const [properties, setProperties] = useState([])

  useEffect(() => {
    setProperties(fetched)
  }, [fetched])

  // 2. Handler
  const handleFavChange = (id, favorited) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, isFavorited: favorited } : p))
  }

  // Debounce search
  const handleSearch = useCallback((val) => {
    setSearchInput(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setFilters(f => ({ ...f, search:val, page:1 }))
    }, 400)
  }, [])

  const handleReset = () => {
    setFilters({ page:1, limit:12, sortBy:'createdAt', sortDir:'desc' })
    setSearchInput('')
    dispatch(clearFilters())
  }

  const handlePage = (p) => {
    setFilters(f => ({ ...f, page:p }))
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  const activeCount = [
    filters.listingType, filters.propertyType, filters.city,
    filters.minPrice, filters.maxPrice, filters.minArea, filters.maxArea,
    filters.bedrooms, filters.furnished === 'true' ? 'y' : '', filters.search,
  ].filter(Boolean).length

  const SIDEBAR_TOP = NAVBAR_HEIGHT + 56 + 16

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 text-base font-sans">

      {/* ══════════════════════════════════════════════════
          TOOLBAR sticky
      ══════════════════════════════════════════════════ */}
      <div className="sticky z-40 mt-3" style={{ top: NAVBAR_HEIGHT }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Icon d={Icons.search} size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={searchInput} onChange={e => handleSearch(e.target.value)}
              placeholder="Ville, quartier..."
              className="w-full border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"/>
            {searchInput && (
              <button onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <Icon d={Icons.x} size={13}/>
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative hidden sm:block">
            <Icon d={Icons.sort} size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <CustomSelect
              value={`${filters.sortBy}_${filters.sortDir}`}
              options={SORT_OPTIONS.map(o => [o.value, o.label])}
              onChange={val => {
                const [sortBy, sortDir] = val.split('_')
                setFilters(f => ({ ...f, sortBy, sortDir, page:1 }))
              }}
              placeholder="Trier"
              padding="6px 12px"
            />
          </div>

          {/* Filtres mobile */}
          <button onClick={() => setMobileFilters(v => !v)}
            className={`lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all
              ${activeCount > 0
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            <Icon d={Icons.filter} size={13}/>
            Filtres
            {activeCount > 0 && (
              <span className="bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          {/* Compteur résultats */}
          <span className="text-sm text-slate-500 hidden md:block">
            <strong className="text-slate-800 font-semibold">{total.toLocaleString()}</strong> bien{total > 1 ? 's' : ''}
          </span>

          {location && (
            <span className="hidden lg:flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100 font-medium">
              <Icon d={Icons.location} size={10}/> Proximité
            </span>
          )}

          {/* Reset */}
          {activeCount > 0 && (
            <button onClick={handleReset}
              className="hidden sm:flex items-center gap-1 text-sm text-red-400 hover:text-red-500 font-medium transition-colors">
              <Icon d={Icons.x} size={11}/> Effacer
            </button>
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

        {/* Tags filtres actifs */}
        {activeCount > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-2.5">
            <FilterTags filters={filters} onChange={setFilters}/>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          LAYOUT principal
      ══════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 items-start">

        {/* Sidebar desktop */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
            style={{ position:'sticky', top: SIDEBAR_TOP }}>
            <FilterPanel
              filters={filters}
              onChange={f => setFilters({ ...f, page:1 })}
              onReset={handleReset}
              activeCount={activeCount}
            />
          </div>
        </aside>

        {/* Main résultats */}
        <main className="flex-1 min-w-0">

          {/* Count mobile */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <p className="text-sm text-slate-500">
              <strong className="text-slate-900 font-semibold">{total.toLocaleString()}</strong> bien{total > 1 ? 's' : ''}
            </p>
            {location && (
              <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100 font-medium">
                <Icon d={Icons.location} size={10}/> Proximité
              </span>
            )}
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Spinner size="lg"/>
              <p className="text-sm text-slate-400">Chargement des biens...</p>
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
              <button onClick={() => setFilters(f => ({ ...f }))}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 transition-all">
                <Icon d={Icons.refresh} size={13}/> Réessayer
              </button>
            </div>

          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
                <Icon d={Icons.search} size={34} className="text-slate-300" strokeWidth={1.2}/>
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-semibold text-lg mb-1">Aucun bien trouvé</p>
                <p className="text-slate-400 text-sm max-w-xs">
                  Essayez d'élargir vos critères ou de rechercher dans une autre ville
                </p>
              </div>
              <button onClick={handleReset}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                Réinitialiser les filtres
              </button>
            </div>

          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map(p => (
                    <PropertyCard key={p.id} property={p}
                      onFavChange={handleFavChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {properties.map(p => (
                    <PropertyListItem key={p.id} property={p}
                      onFavChange={handleFavChange}
                    />
                  ))}
                </div>
              )}

              <Pagination page={filters.page} totalPages={totalPages} onChange={handlePage}/>

              {totalPages > 1 && (
                <p className="text-center text-xs text-slate-400 mt-3">
                  Page {filters.page} / {totalPages} · {total.toLocaleString()} résultats
                </p>
              )}
            </>
          )}
        </main>
      </div>

      {/* Drawer filtres mobile */}
      {mobileFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFilters(false)}/>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="text-base font-bold text-slate-800">Filtres avancés</h3>
              <button onClick={() => setMobileFilters(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
                <Icon d={Icons.x} size={17}/>
              </button>
            </div>
            <div className="p-5">
              <FilterPanel
                filters={filters}
                onChange={f => { setFilters({ ...f, page:1 }); setMobileFilters(false) }}
                onReset={() => { handleReset(); setMobileFilters(false) }}
                activeCount={activeCount}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}