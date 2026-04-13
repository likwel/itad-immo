import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import Spinner from '../components/ui/Spinner'
import { NAVBAR_HEIGHT } from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'

const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  building:  ['M3 21h18','M5 21V7l7-4 7 4v14','M9 21v-4h6v4'],
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  x:         'M18 6L6 18M6 6l12 12',
  pin:       ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  refresh:   'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  chevRight: 'M9 18l6-6-6-6',
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  globe:     ['M12 2a10 10 0 100 20A10 10 0 0012 2z','M2 12h20','M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20'],
  mail:      ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  message:   ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  phone:     'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.99 1.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  grid:      ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  list:      'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
}

// ── helpers ───────────────────────────────────────────────────
const getItemData = (item) => {
  const isAgency = item.type === 'AGENCY'
  return {
    isAgency,
    name:     isAgency ? item.name : `${item.firstName} ${item.lastName}`,
    logo:     isAgency ? (item.logo ?? null) : (item.avatar ?? null),
    city:     item.city ?? null,
    count:    item._count?.properties ?? 0,
    members:  item._count?.members ?? 0,
    verified: item.verified ?? false,
    email:    isAgency ? item.owner?.email : item.email,
    phone:    isAgency ? item.owner?.phone : item.phone,
    ownerId:  isAgency ? item.owner?.id : item.id,
    to:       isAgency ? `/agences/${item.id}` : `/agences/vendeur/${item.id}`,
  }
}

// ── AgencyCard (vue grille) ───────────────────────────────────
function AgencyCard({ item }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!item) return null

  const { isAgency, name, logo, city, count, members, verified, email, phone, ownerId, to } = getItemData(item)
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const stop = fn => e => { e.preventDefault(); e.stopPropagation(); fn() }

  return (
    <Link to={to} className="group block bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 overflow-hidden">

      {/* Bande top */}
      <div className={`h-1.5 w-full ${isAgency ? 'bg-blue-600' : 'bg-green-500'}`}/>

      <div className="p-4">
        {/* Avatar + badges */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-13 h-13 rounded-xl border border-slate-100 overflow-hidden flex-shrink-0"
            style={{ width:52, height:52, background: isAgency ? 'linear-gradient(135deg,#1d4ed8,#1e40af)' : 'linear-gradient(135deg,#16a34a,#15803d)' }}>
            {logo
              ? <img src={logo} alt={name} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-white font-bold text-base">{initials}</div>
            }
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-slate-800 text-sm leading-snug truncate mb-1">{name}</p>
            {isAgency && item.owner && (
              <p className="text-xs text-slate-400 truncate">{item.owner.firstName} {item.owner.lastName}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
              ${isAgency ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
              {isAgency ? 'Agence' : 'Particulier'}
            </span>
            {verified && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Icon d={Icons.shield} size={8} className="text-amber-500"/> Vérifié
              </span>
            )}
          </div>
        </div>

        {/* Ville */}
        {city && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Icon d={Icons.pin} size={11} className="text-slate-300 flex-shrink-0"/>{city}
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{item.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Icon d={Icons.home} size={10} className="text-blue-500"/>
            </div>
            <span className="font-semibold text-slate-700">{count}</span>
            <span className="text-slate-400">annonce{count > 1 ? 's' : ''}</span>
          </div>
          {isAgency && members > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center flex-shrink-0">
                <Icon d={Icons.users} size={10} className="text-green-500"/>
              </div>
              <span className="font-semibold text-slate-700">{members}</span>
              <span className="text-slate-400">agent{members > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="border-t border-slate-100 mb-3"/>

        {/* Actions ligne 1 : Appeler · Email · Message */}
        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
          <button
            onClick={stop(() => phone && (window.location.href = `tel:${phone}`))}
            disabled={!phone}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors
              ${phone ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}>
            <Icon d={Icons.phone} size={11}/> Appeler
          </button>
          <button
            onClick={stop(() => email && (window.location.href = `mailto:${email}`))}
            disabled={!email}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors
              ${email ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}>
            <Icon d={Icons.mail} size={11}/> Email
          </button>
          <button
            onClick={stop(() => user && ownerId && user.id !== ownerId && navigate(`/messages/new?to=${ownerId}`))}
            disabled={!user || !ownerId || user?.id === ownerId}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-colors
              ${user && ownerId && user.id !== ownerId ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}>
            <Icon d={Icons.message} size={11}/> Message
          </button>
        </div>

        {/* Action ligne 2 : Voir le profil — pleine largeur */}
        <Link to={to} onClick={e => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors group-hover:gap-2">
          Voir le profil <Icon d={Icons.chevRight} size={11}/>
        </Link>
      </div>
    </Link>
  )
}

// ── AgencyListItem (vue liste) ────────────────────────────────
function AgencyListItem({ item }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!item) return null

  const { isAgency, name, logo, city, count, members, verified, email, phone, ownerId, to } = getItemData(item)
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const stop = fn => e => { e.preventDefault(); e.stopPropagation(); fn() }

  return (
    <Link to={to} className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 p-4 overflow-hidden">

      {/* Bande gauche */}
      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${isAgency ? 'bg-blue-600' : 'bg-green-500'}`}/>

      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden flex-shrink-0"
        style={{ background: isAgency ? 'linear-gradient(135deg,#1d4ed8,#1e40af)' : 'linear-gradient(135deg,#16a34a,#15803d)' }}>
        {logo
          ? <img src={logo} alt={name} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center text-white font-bold">{initials}</div>
        }
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-slate-800 text-sm truncate">{name}</p>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${isAgency ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {isAgency ? 'Agence' : 'Particulier'}
          </span>
          {verified && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
              <Icon d={Icons.shield} size={8} className="text-amber-500"/> Vérifié
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {city && <span className="flex items-center gap-1"><Icon d={Icons.pin} size={10} className="text-slate-300"/>{city}</span>}
          <span className="flex items-center gap-1"><Icon d={Icons.home} size={10} className="text-slate-300"/>{count} annonce{count > 1 ? 's' : ''}</span>
          {isAgency && members > 0 && (
            <span className="flex items-center gap-1"><Icon d={Icons.users} size={10} className="text-slate-300"/>{members} agent{members > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {phone && (
          <button onClick={stop(() => window.location.href = `tel:${phone}`)}
            title="Appeler"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600 border border-green-100 hover:bg-green-100 transition-colors">
            <Icon d={Icons.phone} size={13}/>
          </button>
        )}
        {email && (
          <button onClick={stop(() => window.location.href = `mailto:${email}`)}
            title="Email"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors">
            <Icon d={Icons.mail} size={13}/>
          </button>
        )}
        {user && ownerId && user.id !== ownerId && (
          <button onClick={stop(() => navigate(`/messages/new?to=${ownerId}`))}
            title="Message"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors">
            <Icon d={Icons.message} size={13}/>
          </button>
        )}
        <span className="flex items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-500 border border-blue-100 hover:bg-blue-50 transition-colors group-hover:gap-1.5 whitespace-nowrap">
          Voir <Icon d={Icons.chevRight} size={11}/>
        </span>
      </div>
    </Link>
  )
}

// ══════════════════════════════════════════════════════════════
// Agencies
// ══════════════════════════════════════════════════════════════
export default function Agencies() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('')
  const [viewMode,    setViewMode]    = useState('grid')
  const searchTimer = useRef(null)

  const load = useCallback(async (q = '') => {
    setLoading(true)
    setError(null)
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : ''
      const res = await api(`/users/agencies${params}`)
      setItems([
        ...(res.agencies ?? []).filter(Boolean).map(a => ({ ...a, type: 'AGENCY' })),
        ...(res.sellers  ?? []).filter(Boolean).map(s => ({ ...s, type: 'SELLER' })),
      ])
    } catch (e) {
      setError(e.message ?? 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSearch = (val) => {
    setSearchInput(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setSearch(val); load(val) }, 400)
  }

  const filtered = typeFilter ? items.filter(i => i.type === typeFilter) : items
  const counts = {
    all:    items.length,
    agency: items.filter(i => i.type === 'AGENCY').length,
    seller: items.filter(i => i.type === 'SELLER').length,
  }

  const renderItems = (list) => viewMode === 'grid'
    ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map(a => <AgencyCard key={a.id} item={a}/>)}
      </div>
    ) : (
      <div className="space-y-3">
        {list.map(a => <AgencyListItem key={a.id} item={a}/>)}
      </div>
    )

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Toolbar ── */}
      <div className="sticky z-40 mt-3" style={{ top: NAVBAR_HEIGHT }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Titre */}
          <div className="flex items-center gap-2 mr-2 flex-shrink-0">
            <Icon d={Icons.building} size={17} className="text-blue-600"/>
            <span className="font-bold text-slate-800 text-base hidden sm:block">Agences & vendeurs</span>
            {!loading && (
              <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Icon d={Icons.search} size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={searchInput} onChange={e => handleSearch(e.target.value)}
              placeholder="Nom, agence, ville..."
              className="w-full border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"/>
            {searchInput && (
              <button onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <Icon d={Icons.x} size={13}/>
              </button>
            )}
          </div>

          {/* Filtre type */}
          <div className="hidden sm:flex gap-1.5 flex-shrink-0">
            {[
              { value:'',       label:`Tous (${counts.all})`       },
              { value:'AGENCY', label:`Agences (${counts.agency})`  },
              { value:'SELLER', label:`Vendeurs (${counts.seller})` },
            ].map(({ value, label }) => (
              <button key={value} onClick={() => setTypeFilter(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap
                  ${typeFilter === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Toggle vue */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden flex-shrink-0">
            {[{ m:'grid', icon:Icons.grid }, { m:'list', icon:Icons.list }].map(({ m, icon }) => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-3 py-2 transition-colors ${viewMode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Icon d={icon} size={14}/>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Spinner size="lg"/>
            <p className="text-sm text-slate-400">Chargement des agences...</p>
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
            <button onClick={() => load(search)}
              className="flex items-center gap-2 text-sm text-blue-600 font-medium px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 transition-all">
              <Icon d={Icons.refresh} size={13}/> Réessayer
            </button>
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
              <Icon d={Icons.building} size={34} className="text-slate-300" strokeWidth={1.2}/>
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-semibold text-lg mb-1">Aucune agence trouvée</p>
              <p className="text-slate-400 text-sm max-w-xs">Essayez un autre terme ou réinitialisez les filtres</p>
            </div>
            <button onClick={() => { handleSearch(''); setTypeFilter('') }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Réinitialiser
            </button>
          </div>

        ) : (
          <div className="space-y-10">
            {(typeFilter === '' || typeFilter === 'AGENCY') && counts.agency > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Agences immobilières · {counts.agency}
                </h2>
                {renderItems(filtered.filter(i => i.type === 'AGENCY'))}
              </div>
            )}
            {(typeFilter === '' || typeFilter === 'SELLER') && counts.seller > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Vendeurs particuliers · {counts.seller}
                </h2>
                {renderItems(filtered.filter(i => i.type === 'SELLER'))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}