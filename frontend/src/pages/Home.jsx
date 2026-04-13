import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setFilters } from '../store/propertySlice'
import PropertyCard from '../components/property/PropertyCard'
import { useProperties } from '../hooks/useProperties'
import { useStats } from '../hooks/useStats'
import Spinner from '../components/ui/Spinner'

const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const Icons = {
  location:   'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  vente:      ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z','M9 22V12h6v10','M12 2v4','M8 6h8'],
  vacances:   ['M12 17a5 5 0 100-10 5 5 0 000 10z','M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'],
  bureaux:    ['M3 21h18','M5 21V7l7-4 7 4v14','M9 21v-4h6v4','M9 9h1v1H9z','M14 9h1v1h-1z','M9 14h1v1H9z','M14 14h1v1h-1z'],
  terrain:    ['M3 21h18','M9 8a3 3 0 100-6 3 3 0 000 6z','M17 8c0 3-4 13-4 13H6S2 11 2 8a7 7 0 0114 0z'],
  colocation: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  search:     'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  home:       'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  verified:   ['M22 11.08V12a10 10 0 11-5.93-9.14','M22 4L12 14.01l-3-3'],
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  mapPin:     ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  sparkles:   ['M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z','M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z'],
  chevron:    'M6 9l6 6 6-6',
  check:      'M20 6L9 17l-5-5',
  menu:       'M4 6h16M4 12h16M4 18h16',
  close:      'M18 6L6 18M6 6l12 12',
  chevLeft:   'M15 18l-6-6 6-6',
  chevRight:  'M9 18l6-6-6-6',
  filters:    'M3 6h18M7 12h10M11 18h2',
}

const CATEGORIES = [
  { slug:'location',   label:'Location',   icon:Icons.location,   gradient:'from-blue-500 to-blue-600',     light:'bg-blue-50 text-blue-600 border-blue-100'       },
  { slug:'vente',      label:'Vente',       icon:Icons.vente,      gradient:'from-emerald-500 to-green-600', light:'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { slug:'vacances',   label:'Vacances',    icon:Icons.vacances,   gradient:'from-amber-400 to-orange-500',  light:'bg-amber-50 text-amber-600 border-amber-100'     },
  { slug:'bureaux',    label:'Bureaux',     icon:Icons.bureaux,    gradient:'from-violet-500 to-purple-600', light:'bg-violet-50 text-violet-600 border-violet-100'  },
  { slug:'terrain',    label:'Terrain',     icon:Icons.terrain,    gradient:'from-teal-500 to-emerald-600',  light:'bg-teal-50 text-teal-600 border-teal-100'        },
  { slug:'colocation', label:'Colocation',  icon:Icons.colocation, gradient:'from-pink-500 to-rose-600',    light:'bg-pink-50 text-pink-600 border-pink-100'        },
]

const TYPE_OPTIONS = [
  { value:'',              label:'Tout type', icon:Icons.menu     },
  { value:'SALE',          label:'Vente',     icon:Icons.vente    },
  { value:'RENT',          label:'Location',  icon:Icons.location },
  { value:'VACATION_RENT', label:'Vacances',  icon:Icons.vacances },
]

const PROPERTY_TYPES = [
  { value:'',           label:'Tous',        icon:'M4 6h16M4 12h16M4 18h7'                },
  { value:'HOUSE',      label:'Maison',      icon:Icons.home                               },
  { value:'APARTMENT',  label:'Appartement', icon:'M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4'},
  { value:'VILLA',      label:'Villa',       icon:Icons.location                           },
  { value:'STUDIO',     label:'Studio',      icon:'M3 21h18M5 21V5h14v16M9 9h6M9 13h6'    },
  { value:'LAND',       label:'Terrain',     icon:Icons.terrain                            },
  { value:'OFFICE',     label:'Bureau',      icon:Icons.bureaux                            },
  { value:'COMMERCIAL', label:'Commerce',    icon:'M3 3h18v4H3zM5 7v14h14V7M9 7v14M15 7v14'},
]

export default function Home() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [scrolled,     setScrolled]     = useState(false)
  const [search,       setSearch]       = useState('')
  const [type,         setType]         = useState('')
  const [selectOpen,   setSelectOpen]   = useState(false)
  const [advanced,     setAdvanced]     = useState(false)
  const [propertyType, setPropertyType] = useState('')
  const [minPrice,     setMinPrice]     = useState('')
  const [maxPrice,     setMaxPrice]     = useState('')
  const [minSurface,   setMinSurface]   = useState('')
  const [maxSurface,   setMaxSurface]   = useState('')
  const [rooms,        setRooms]        = useState('')
  const [furnished,    setFurnished]    = useState(false)
  const [proximity,    setProximity]    = useState('')
  const [locating,     setLocating]     = useState(false)

  const searchRef = useRef(null)

  const { properties: featured, loading, error } = useProperties({ featured:true, limit:6, status:'ACTIVE' })
  const { stats } = useStats()

  const STATS = [
    { value: stats ? `${stats.properties.toLocaleString('fr')}+` : '—', label:'Biens disponibles', icon:Icons.home     },
    { value: stats ? `${stats.sellers.toLocaleString('fr')}+`    : '—', label:'Vendeurs vérifiés',  icon:Icons.verified },
    { value: stats ? `${stats.satisfaction}%`                    : '—', label:'Clients satisfaits', icon:Icons.star     },
  ]

  const selectedOption = TYPE_OPTIONS.find(o => o.value === type) || TYPE_OPTIONS[0]
  const hasActiveFilters = minPrice || maxPrice || minSurface || maxSurface || rooms || furnished || proximity

  const handleGeolocate = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setProximity(`${pos.coords.latitude},${pos.coords.longitude}`)
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  useEffect(() => {
    const onScroll = () => {
      if (searchRef.current) {
        const { bottom } = searchRef.current.getBoundingClientRect()
        setScrolled(bottom < 0)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = () => {
    dispatch(setFilters({ search, listingType: type, propertyType, minPrice, maxPrice, minSurface, maxSurface, rooms, furnished, proximity }))
    navigate('/annonces')
  }

  const resetFilters = () => {
    setMinPrice(''); setMaxPrice(''); setMinSurface(''); setMaxSurface(''); setRooms(''); setFurnished(false); setProximity('')
  }

  // ── Composant barre de recherche réutilisable ────────────────
  const SearchBar = ({ compact = false }) => (
    <div className={`bg-white/95 rounded-2xl py-3 ${!compact ? 'backdrop-blur shadow-2xl shadow-blue-950/40' : ''}`}>

      {/* Ligne principale */}
      <div className={`flex flex-wrap gap-2 ${compact ? 'p-1.5' : 'p-2'}`}>

        {/* Select type — icône seule sur mobile */}
        <div className="relative flex-shrink-0" style={{ zIndex: 9999 }}>
          <button
            onClick={() => setSelectOpen(o => !o)}
            className={`flex items-center gap-2 text-slate-700 px-3 border border-slate-200 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-sm font-semibold justify-between ${compact ? 'py-2' : 'py-2.5'} sm:min-w-[120px]`}
          >
            <span className="flex items-center gap-2">
              <Icon d={selectedOption.icon} size={14} className="text-blue-500"/>
              <span className="hidden sm:inline">{selectedOption.label}</span>
            </span>
            <Icon d={Icons.chevron} size={13} className={`text-slate-400 transition-transform duration-200 hidden sm:block ${selectOpen ? 'rotate-180' : ''}`}/>
          </button>
          {selectOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 overflow-hidden" style={{ zIndex: 9999 }}>
              {TYPE_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { setType(opt.value); setSelectOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${type === opt.value ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon d={opt.icon} size={14} className={type === opt.value ? 'text-blue-500' : 'text-slate-400'}/>
                  {opt.label}
                  {type === opt.value && <Icon d={Icons.check} size={12} className="ml-auto text-blue-500"/>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input localisation */}
        <div className="flex-1 relative min-w-[120px]">
          <Icon d={Icons.mapPin} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Ville, quartier..."
            className={`w-full text-slate-700 pl-9 pr-4 rounded-xl focus:outline-none bg-white focus:ring-2 border border-slate-200 focus:ring-blue-200 transition text-sm ${compact ? 'py-2' : 'py-2.5'}`}
          />
        </div>

        {/* Bouton me localiser — icône seule, avant filtres */}
        <button
          onClick={handleGeolocate}
          disabled={locating}
          title={locating ? 'Localisation...' : proximity ? 'Localisé ✓' : 'Me localiser'}
          className={`flex items-center justify-center flex-shrink-0 px-2.5 rounded-xl border transition-all ${
            proximity
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
          } ${compact ? 'py-2' : 'py-2.5'}`}
        >
          {locating
            ? <svg className="animate-spin" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            : <Icon d={Icons.mapPin} size={15}/>
          }
        </button>

        {/* Bouton filtres */}
        <button
          onClick={() => setAdvanced(o => !o)}
          className={`flex items-center gap-1.5 px-3 rounded-xl text-sm font-semibold transition-all border flex-shrink-0 ${
            advanced ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
          } ${compact ? 'py-2' : 'py-2.5'}`}
        >
          <Icon d={Icons.filters} size={15}/>
          <span className="hidden sm:inline">Filtres</span>
        </button>

        {/* Bouton rechercher */}
        <button onClick={handleSearch}
          className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 rounded-xl font-semibold text-sm transition-all active:scale-95 flex-shrink-0 ${compact ? 'py-2' : 'py-2.5'}`}>
          <Icon d={Icons.search} size={16}/>
          <span className="hidden sm:inline">Rechercher</span>
        </button>
      </div>

      {/* Chips type de bien */}
      <div className="relative px-3 pb-2 flex items-center gap-1">
        <button
          onClick={() => document.getElementById('chips-scroll').scrollBy({ left:-150, behavior:'smooth' })}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition shadow-sm"
        >
          <Icon d={Icons.chevLeft} size={12} className="text-slate-500"/>
        </button>

        <div id="chips-scroll" className="flex gap-2 overflow-x-auto flex-1" style={{ scrollbarWidth:'none' }}>
          {PROPERTY_TYPES.map(pt => (
            <button key={pt.value}
              onClick={() => setPropertyType(pt.value === propertyType ? '' : pt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 ${
                propertyType === pt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}>
              <Icon d={pt.icon} size={13}/>
              {pt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => document.getElementById('chips-scroll').scrollBy({ left:150, behavior:'smooth' })}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition shadow-sm"
        >
          <Icon d={Icons.chevRight} size={12} className="text-slate-500"/>
        </button>
      </div>

      {/* Filtres avancés */}
      {advanced && (
        <div className="border-t border-slate-100 mx-3 mb-3 p-3">

          {/* Prix + Surface */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Prix min',     value:minPrice,   set:setMinPrice,   suffix:'Ar',  placeholder:'0'         },
              { label:'Prix max',     value:maxPrice,   set:setMaxPrice,   suffix:'Ar',  placeholder:'Sans limite'},
              { label:'Surface min',  value:minSurface, set:setMinSurface, suffix:'m²',  placeholder:'0'         },
              { label:'Surface max',  value:maxSurface, set:setMaxSurface, suffix:'m²',  placeholder:'Sans limite'},
            ].map(f => (
              <div key={f.label} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{f.label}</label>
                <div className="relative">
                  <input
                    type="number" value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full text-slate-700 pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white focus:outline-none text-sm transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">{f.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Meublé + Proximité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">

            {/* Meublé uniquement */}
            <button
              onClick={() => setFurnished(f => !f)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                furnished
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                furnished ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
              }`}>
                {furnished && <Icon d={Icons.check} size={11} className="text-white"/>}
              </div>
              <div>
                <div className="text-sm font-semibold">Meublé uniquement</div>
                <div className="text-xs text-slate-400">Biens avec mobilier inclus</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-slate-400 flex-shrink-0">
                <path d="M20 9V7a2 2 0 00-2-2H6a2 2 0 00-2 2v2M2 11h20M4 11v8a1 1 0 001 1h14a1 1 0 001-1v-8M8 11V9M16 11V9M2 15h4M18 15h4"/>
              </svg>
            </button>

            {/* Proximité */}
            <div className={`flex flex-col gap-1.5 px-4 py-3 rounded-xl border transition-all ${
              proximity ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Proximité</div>
                  <div className="text-xs text-slate-400">Biens près de moi</div>
                </div>
                <button
                  onClick={handleGeolocate}
                  disabled={locating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    proximity
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <Icon d={Icons.mapPin} size={12}/>
                  {locating ? 'Localisation...' : proximity ? 'Localisé ✓' : 'Me localiser'}
                </button>
              </div>
              {proximity && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Rayon</label>
                  <div className="flex gap-1">
                    {['1', '5', '10', '20'].map(km => (
                      <button key={km}
                        onClick={() => setProximity(p => p.split('|')[0] + '|' + km)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          proximity.endsWith('|' + km)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {km} km
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setProximity('')} className="ml-auto text-slate-400 hover:text-red-400 transition">
                    <Icon d={Icons.close} size={13}/>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chambres */}
          <div className="flex flex-col gap-1 mt-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Chambres</label>
            <div className="flex justify-between gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full">
              {['', '1', '2', '3', '4+'].map(r => (
                <button key={r}
                  onClick={() => setRooms(r === rooms ? '' : r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                    rooms === r ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {r || 'Tous'}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button onClick={resetFilters}
              className="mt-3 mb-1 text-xs text-slate-400 hover:text-red-500 transition flex items-center gap-1">
              <Icon d={Icons.close} size={11}/>
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-slate-50 min-h-screen overflow-x-hidden">

      {/* ── BARRE STICKY ─────────────────────────────────────── */}
      <div className={`fixed top-16 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}>
        <div className="bg-white border-b border-slate-200 shadow-md px-4 py-2 overflow-hidden">
          <div className="max-w-4xl mx-auto min-w-0">
            <SearchBar compact />
          </div>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"/>

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/20 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <Icon d={Icons.sparkles} size={13} className="text-blue-400"/>
            N°1 de l'immobilier à Madagascar
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
            Trouvez le bien{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">idéal</span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Location, vente, vacances — des milliers de biens à Madagascar
          </p>

          {/* Barre de recherche principale */}
          <div ref={searchRef} className="relative max-w-4xl mx-auto" style={{ zIndex: 9999 }}>
            <SearchBar />
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {STATS.map(({ value, label, icon }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-5 flex flex-col items-center gap-2 backdrop-blur-sm">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Icon d={icon} size={16} className="text-blue-300"/>
                </div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-slate-400 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Parcourir par catégorie</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sélectionnez un type de bien</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {CATEGORIES.map(c => (
            <button key={c.slug}
              onClick={() => { dispatch(setFilters({ categorySlug: c.slug })); navigate('/annonces') }}
              className="group relative overflow-hidden rounded-2xl border bg-white hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer p-5 text-center"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}/>
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${c.light.split(' ')[0]} group-hover:bg-white/20`}>
                  <Icon d={c.icon} size={22} className={`${c.light.split(' ')[1]} group-hover:text-white transition-colors`}/>
                </div>
                <span className={`font-semibold text-xs ${c.light.split(' ')[1]} group-hover:text-white transition-colors`}>
                  {c.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── BIENS EN VEDETTE ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Biens en vedette</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sélectionnés pour vous</p>
          </div>
          <button onClick={() => navigate('/annonces')}
            className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors group bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl">
            Voir tout
            <Icon d={Icons.arrowRight} size={14} className="group-hover:translate-x-0.5 transition-transform"/>
          </button>
        </div>

        {loading && !error ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-3xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
              <Icon d={Icons.home} size={28} className="text-red-300" strokeWidth={1.2}/>
            </div>
            <p className="text-slate-600 font-medium">Impossible de charger les biens</p>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        ) : featured?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(p => <PropertyCard key={p.id} property={p}/>)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-3xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Icon d={Icons.home} size={28} className="text-slate-300" strokeWidth={1.2}/>
            </div>
            <p className="text-slate-500 font-medium">Aucun bien en vedette pour le moment</p>
          </div>
        )}
      </section>
    </div>
  )
}