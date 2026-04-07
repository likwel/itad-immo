import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  pin:       ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  globe:     ['M12 2a10 10 0 100 20A10 10 0 0012 2z','M2 12h20','M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20'],
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  chevRight: 'M9 18l6-6-6-6',
  mail:      ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  message:   ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
}

export default function AgencyCard({ item }) {
  const { user } = useAuth()

  const isAgency = item.type === 'AGENCY'
  const name     = isAgency ? item.name : `${item.firstName} ${item.lastName}`
  const logo     = isAgency ? (item.logo ?? null) : (item.avatar ?? null)
  const city     = item.city ?? null
  const count    = item._count?.properties ?? 0
  const members  = item._count?.members ?? 0
  const verified = item.verified ?? false
  const email    = isAgency ? item.owner?.email : item.email
  const ownerId  = isAgency ? item.owner?.id : item.id
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const to       = isAgency ? `/agences/${item.id}` : `/agences/vendeur/${item.id}`

  const handleMessage = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Redirige vers la messagerie avec le destinataire pré-sélectionné
    window.location.href = `/messages/new?to=${ownerId}`
  }

  const handleMail = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (email) window.location.href = `mailto:${email}`
  }

  return (
    <Link to={to} className="group block bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 overflow-hidden">

      {/* ── Bande couleur top ── */}
      <div className={`h-1.5 w-full ${isAgency ? 'bg-blue-600' : 'bg-green-500'}`}/>

      <div className="p-5">

        {/* ── Avatar + badges ── */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 shadow-sm"
            style={{ background: isAgency
              ? 'linear-gradient(135deg,#1d4ed8,#1e40af)'
              : 'linear-gradient(135deg,#16a34a,#15803d)' }}>
            {logo
              ? <img src={logo} alt={name} className="w-full h-full object-cover"/>
              : <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                  {initials}
                </div>
            }
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
              ${isAgency
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-green-50 text-green-700 border-green-200'}`}>
              {isAgency ? 'Agence' : 'Particulier'}
            </span>
            {verified && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Icon d={Icons.shield} size={9} className="text-amber-500"/> Vérifié
              </span>
            )}
          </div>
        </div>

        {/* ── Nom ── */}
        <p className="font-bold text-slate-800 text-sm leading-snug mb-1 truncate">{name}</p>

        {/* ── Owner si agence ── */}
        {isAgency && item.owner && (
          <p className="text-xs text-slate-400 mb-2 truncate">
            {item.owner.firstName} {item.owner.lastName}
          </p>
        )}

        {/* ── Description ── */}
        {item.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}

        {/* ── Ville ── */}
        {city && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
            <Icon d={Icons.pin} size={11} className="text-slate-300 flex-shrink-0"/>
            {city}
          </div>
        )}

        {/* ── Stats ── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
              <Icon d={Icons.home} size={10} className="text-blue-500"/>
            </div>
            <span className="font-semibold text-slate-700">{count}</span>
            <span className="text-slate-400">annonce{count > 1 ? 's' : ''}</span>
          </div>

          {isAgency && members > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
                <Icon d={Icons.users} size={10} className="text-green-500"/>
              </div>
              <span className="font-semibold text-slate-700">{members}</span>
              <span className="text-slate-400">agent{members > 1 ? 's' : ''}</span>
            </div>
          )}

          {isAgency && item.website && (
            <div className="flex items-center gap-1 text-xs">
              <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center">
                <Icon d={Icons.globe} size={10} className="text-slate-400"/>
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          {/* Mail */}
          {email && (
            <button
              onClick={handleMail}
              title={`Envoyer un email à ${name}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors flex-1 justify-center">
              <Icon d={Icons.mail} size={12} className="text-slate-400"/>
              Email
            </button>
          )}

          {/* Message interne */}
          {user && ownerId && user.id !== ownerId && (
            <button
              onClick={handleMessage}
              title={`Envoyer un message à ${name}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-1 justify-center">
              <Icon d={Icons.message} size={12}/>
              Message
            </button>
          )}

          {/* Voir le profil */}
          <Link
            to={to}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-500 border border-blue-100 hover:bg-blue-50 transition-colors group-hover:gap-1.5 whitespace-nowrap">
            Voir <Icon d={Icons.chevRight} size={11}/>
          </Link>
        </div>
      </div>
    </Link>
  )
}