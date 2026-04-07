import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { api } from '../services/api'
import PropertyCard from '../components/property/PropertyCard'
import Spinner from '../components/ui/Spinner'
import { NAVBAR_HEIGHT } from '../components/layout/Navbar'

const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  arrowLeft: 'M19 12H5M12 5l-7 7 7 7',
  pin:       ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  phone:     'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.99 1.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  globe:     ['M12 2a10 10 0 100 20A10 10 0 0012 2z','M2 12h20','M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20'],
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  mail:      ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  calendar:  ['M3 4h18v18H3z','M16 2v4','M8 2v4','M3 10h18'],
  building:  ['M3 21h18','M5 21V7l7-4 7 4v14','M9 21v-4h6v4'],
  x:         'M18 6L6 18M6 6l12 12',
  refresh:   'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  message:   ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  user:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
}

// ── StatCard ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon d={icon} size={20}/>
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

// ── MemberCard ────────────────────────────────────────────────
function MemberCard({ member }) {
  const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase()
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3">
      <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
        {member.avatar
          ? <img src={member.avatar} alt="" className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{initials}</div>
        }
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{member.firstName} {member.lastName}</p>
        <p className="text-xs text-slate-400">{member.role === 'AGENCY' ? 'Agent' : 'Vendeur'}</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// AgencyDetail
// ══════════════════════════════════════════════════════════════
export default function AgencyDetail() {
  const { id }   = useParams()
  const location = useLocation()
  const isSeller = location.pathname.includes('/vendeur/')

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const endpoint = isSeller
    ? `/users/agencies/seller/${id}`
    : `/users/agencies/${id}`

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api(endpoint)
      setData(res)
    } catch (e) {
      setError(e.message ?? 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id, location.pathname])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg"/>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
        <Icon d={Icons.x} size={28} className="text-red-300" strokeWidth={1.2}/>
      </div>
      <div className="text-center">
        <p className="text-slate-700 font-semibold mb-1">Erreur de chargement</p>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
      <button onClick={load}
        className="flex items-center gap-2 text-sm text-blue-600 font-medium px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 transition-all">
        <Icon d={Icons.refresh} size={13}/> Réessayer
      </button>
    </div>
  )

  if (!data) return null

  // ── Normalise agence vs vendeur ──────────────────────────────
  const isAgency   = !isSeller
  const name       = isAgency ? data.name : `${data.firstName} ${data.lastName}`
  const logo       = isAgency ? (data.logo ?? null) : (data.avatar ?? null)
  const city       = data.city ?? null
  const address    = data.address ?? null
  const website    = data.website ?? null
  const verified   = data.verified ?? false
  const properties = data.properties ?? []
  const members    = data.members    ?? []
  const owner      = isAgency ? data.owner : data
  const initials   = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const yearsActive = new Date().getFullYear() - new Date(data.createdAt).getFullYear()

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100" style={{ paddingTop: NAVBAR_HEIGHT }}>
        <div className="max-w-5xl mx-auto px-4 py-6">

          {/* Retour */}
          <Link to="/agences"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors">
            <Icon d={Icons.arrowLeft} size={14}/> Agences & vendeurs
          </Link>

          <div className="flex flex-col sm:flex-row gap-6 items-start">

            {/* Logo / Avatar */}
            <div className="w-20 h-20 rounded-2xl border-2 border-slate-100 overflow-hidden flex-shrink-0 shadow-sm"
              style={{ background: isAgency
                ? 'linear-gradient(135deg,#1d4ed8,#1e40af)'
                : 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              {logo
                ? <img src={logo} alt={name} className="w-full h-full object-cover"/>
                : <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                    {initials}
                  </div>
              }
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-800">{name}</h1>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border
                  ${isAgency
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-green-50 text-green-700 border-green-200'}`}>
                  {isAgency ? 'Agence' : 'Particulier'}
                </span>
                {verified && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Icon d={Icons.shield} size={10} className="text-amber-500"/> Vérifié
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                {city && (
                  <span className="flex items-center gap-1.5">
                    <Icon d={Icons.pin} size={13} className="text-slate-300"/>
                    {city}
                  </span>
                )}
                {address && (
                  <span className="flex items-center gap-1.5">
                    <Icon d={Icons.building} size={13} className="text-slate-300"/>
                    {address}
                  </span>
                )}
                {isAgency && owner && (
                  <span className="flex items-center gap-1.5">
                    <Icon d={Icons.user} size={13} className="text-slate-300"/>
                    Gérant : {owner.firstName} {owner.lastName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Icon d={Icons.calendar} size={13} className="text-slate-300"/>
                  Depuis {new Date(data.createdAt).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })}
                </span>
              </div>

              {/* Boutons contact */}
              <div className="flex flex-wrap gap-2">
                {website && (
                  <a href={website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors">
                    <Icon d={Icons.globe} size={12}/> Site web
                  </a>
                )}
                {owner?.phone && (
                  <a href={`tel:${owner.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-colors">
                    <Icon d={Icons.phone} size={12}/> Appeler
                  </a>
                )}
                {owner?.email && (
                  <a href={`mailto:${owner.email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors">
                    <Icon d={Icons.mail} size={12}/> Email
                  </a>
                )}
                <Link to={`/messages/new?to=${owner?.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  <Icon d={Icons.message} size={12}/> Contacter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Icons.home}     label="Annonces actives" value={properties.length}      color="blue"/>
          <StatCard icon={Icons.users}    label="Membres"          value={isAgency ? members.length + 1 : 1} color="green"/>
          <StatCard icon={Icons.star}     label="Note moyenne"     value={data.avgRating ?? '—'}  color="amber"/>
          <StatCard icon={Icons.calendar} label="Années actif"     value={yearsActive || '< 1'}   color="purple"/>
        </div>

        {/* Description */}
        {data.description && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-3">À propos</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{data.description}</p>
          </div>
        )}

        {/* Membres (agences uniquement) */}
        {isAgency && members.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Équipe · {members.length + 1}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {owner && <MemberCard member={{ ...owner, role: 'AGENCY' }}/>}
              {members.map(m => <MemberCard key={m.id} member={m}/>)}
            </div>
          </div>
        )}

        {/* Annonces */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Annonces · {properties.length}
          </h2>
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-slate-100">
              <Icon d={Icons.home} size={32} className="text-slate-200" strokeWidth={1.2}/>
              <p className="text-slate-400 text-sm">Aucune annonce pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map(p => <PropertyCard key={p.id} property={p}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}