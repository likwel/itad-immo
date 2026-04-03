import { Link } from 'react-router-dom'

const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  home:   'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  mapPin: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  bed:    ['M3 9h18M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3','M3 9v9h18V9'],
  bath:   ['M4 12h16','M4 6h2','M8 6h.01','M4 18a2 2 0 002 2h12a2 2 0 002-2v-6H4v6z'],
  area:   ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  star:   'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
}

const TYPE_COLORS = {
  SALE:         'bg-green-100 text-green-700',
  RENT:         'bg-blue-100 text-blue-700',
  VACATION_RENT:'bg-yellow-100 text-yellow-700',
}
const TYPE_LABELS = {
  SALE:         'Vente',
  RENT:         'Location',
  VACATION_RENT:'Vacances',
}

export default function PropertyListItem({ property: p }) {
  return (
    <Link
      to={`/annonces/${p.slug}`}
      className="group card p-4 flex gap-4 hover:shadow-lg transition-all duration-200"
    >
      {/* ── Image ── */}
      <div className="w-40 h-28 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0 relative">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          : <div className="w-full h-full flex items-center justify-center">
              <Icon d={Icons.home} size={28} className="text-slate-400"/>
            </div>
        }
        {p.featured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            Vedette
          </span>
        )}
      </div>

      {/* ── Infos ── */}
      <div className="flex-1 min-w-0">

        {/* Ligne 1 — badges + prix */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[p.listingType] ?? 'bg-slate-100 text-slate-600'}`}>
                {TYPE_LABELS[p.listingType] ?? p.listingType}
              </span>
              {p.distance != null && (
                <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
                  <Icon d={Icons.mapPin} size={10}/>
                  {p.distance < 1
                    ? `${(p.distance * 1000).toFixed(0)}m`
                    : `${p.distance.toFixed(1)}km`}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
              {p.title}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
              <Icon d={Icons.mapPin} size={11}/>
              {p.city}{p.district ? `, ${p.district}` : ''}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-blue-600">
              {p.price?.toLocaleString()} {p.priceUnit}
            </div>
            {p.listingType === 'RENT' && (
              <div className="text-xs text-slate-400">/mois</div>
            )}
          </div>
        </div>

        {/* Ligne 2 — caractéristiques */}
        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
          {p.bedrooms && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Icon d={Icons.bed} size={11}/>{p.bedrooms} ch.
            </span>
          )}
          {p.bathrooms && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Icon d={Icons.bath} size={11}/>{p.bathrooms} sdb
            </span>
          )}
          {p.area && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Icon d={Icons.area} size={11}/>{p.area}m²
            </span>
          )}
          {p.furnished && (
            <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
              Meublé
            </span>
          )}
          {p.avgRating != null && (
            <span className="flex items-center gap-1 text-xs text-amber-600 ml-auto">
              <Icon d={Icons.star} size={11} className="fill-amber-400 text-amber-400" strokeWidth={1}/>
              {p.avgRating}
              {p._count?.reviews != null && (
                <span className="text-slate-400">({p._count.reviews})</span>
              )}
            </span>
          )}
        </div>

        {/* Ligne 3 — équipements */}
        {p.amenities?.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {p.amenities.slice(0, 4).map(a => (
              <span key={a} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize">
                {a}
              </span>
            ))}
            {p.amenities.length > 4 && (
              <span className="text-[10px] text-slate-400">+{p.amenities.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}