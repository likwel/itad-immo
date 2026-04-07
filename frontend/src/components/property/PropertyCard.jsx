import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { toggleFav } from '../../services/property.service'

const Icon = ({ d, size = 14, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const ICONS = {
  pin:   ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  bed:   ['M2 4v16','M2 8h18a2 2 0 012 2v10','M2 17h20','M6 8v9'],
  bath:  ['M9 6l2 2-2 2','M4 4h16v7a5 5 0 01-5 5H9a5 5 0 01-5-5V4z','M3 20h18'],
  area:  ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  star:  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  image: ['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z','M12 13a3 3 0 100 6 3 3 0 000-6z'],
  eye:   ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 100 6 3 3 0 000-6z'],
}

const TYPE_CONFIG = {
  SALE:          { label: 'Vente',    bg: '#dcfce7', color: '#15803d' },
  RENT:          { label: 'Location', bg: '#dbeafe', color: '#1d4ed8' },
  VACATION_RENT: { label: 'Vacances', bg: '#fef9c3', color: '#a16207' },
}

const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

export default function PropertyCard({ property: p, onRemove, onFavChange }) {
  const { user } = useAuth()
  const [fav,     setFav]     = useState(p.isFavorited ?? false)
  const [favAnim, setFavAnim] = useState(false)
  const [imgErr,  setImgErr]  = useState(false)

  useEffect(() => {
    setFav(p.isFavorited ?? false)
  }, [p.isFavorited])

  const handleFav = async e => {
    e.preventDefault(); e.stopPropagation()
    if (!user) return
    setFavAnim(true)
    setTimeout(() => setFavAnim(false), 300)
    try {
      const r = await toggleFav(p.id)
      setFav(r.favorited)
      onFavChange?.(p.id, r.favorited)
      if (!r.favorited) onRemove?.(p.id)
    } catch {}
  }

  const type = TYPE_CONFIG[p.listingType] ?? TYPE_CONFIG.RENT

  return (
    <Link
      to={`/annonces/${p.slug}`}
      style={{
        display: 'block', borderRadius: 16, overflow: 'hidden',
        background: '#fff', textDecoration: 'none',
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        transition: 'box-shadow .2s, transform .2s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.12)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* ── Image ── */}
      <div style={{ position: 'relative', height: 196, background: '#f1f5f9', overflow: 'hidden' }}>
        {p.images?.[0] && !imgErr ? (
          <img
            src={p.images[0]} alt={p.title}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .35s' }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICONS.image} size={32} style={{ color: '#cbd5e1' }}/>
          </div>
        )}

        {/* Badges top-left */}
        <div style={{ position: 'absolute', top: 11, left: 11, display: 'flex', gap: 5 }}>
          <span style={{
            padding: '3px 9px', borderRadius: 7, fontSize: 10, fontWeight: 700,
            background: type.bg, color: type.color, letterSpacing: '.03em',
          }}>
            {type.label}
          </span>
          {p.featured && (
            <span style={{
              padding: '3px 7px', borderRadius: 7, fontSize: 10, fontWeight: 700,
              background: '#fef3c7', color: '#b45309',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Icon d={ICONS.star} size={9} style={{ color: '#f59e0b' }}/>
              Vedette
            </span>
          )}
        </div>

        {/* Favori */}
        <button
          onClick={handleFav}
          style={{
            position: 'absolute', top: 9, right: 9,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,.92)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 8px rgba(0,0,0,.12)',
            transform: favAnim ? 'scale(1.35)' : 'scale(1)',
            transition: 'transform .15s',
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24"
            fill={fav ? '#ef4444' : 'none'}
            stroke={fav ? '#ef4444' : '#94a3b8'}
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>

        {/* Footer image — vues + nb photos + distance */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '18px 10px 8px',
          background: 'linear-gradient(transparent, rgba(0,0,0,.45))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {p.viewCount != null && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'rgba(0,0,0,.45)', color: '#fff',
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                backdropFilter: 'blur(4px)',
              }}>
                <Icon d={ICONS.eye} size={10} style={{ color: '#fff' }}/>
                {fmt(p.viewCount)}
              </span>
            )}
            {p.images?.length > 1 && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'rgba(0,0,0,.45)', color: '#fff',
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                backdropFilter: 'blur(4px)',
              }}>
                <Icon d={ICONS.image} size={10} style={{ color: '#fff' }}/>
                {p.images.length}
              </span>
            )}
          </div>
          {p.distance != null && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: 'rgba(0,0,0,.45)', color: '#fff',
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
              backdropFilter: 'blur(4px)',
            }}>
              <Icon d={ICONS.pin} size={10} style={{ color: '#fff' }}/>
              {p.distance < 1 ? `${(p.distance * 1000).toFixed(0)} m` : `${p.distance.toFixed(1)} km`}
            </span>
          )}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div style={{ padding: '12px 14px 14px' }}>

        {/* Titre */}
        <div style={{
          fontSize: 16, fontWeight: 700, color: '#1e293b',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 3, lineHeight: 1.4,
        }}>
          {p.title}
        </div>

        {/* Localisation */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 13, color: '#94a3b8', marginBottom: 10,
        }}>
          <Icon d={ICONS.pin} size={13} style={{ color: '#cbd5e1', flexShrink: 0 }}/>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.city}{p.district ? `, ${p.district}` : ''}
          </span>
        </div>

        {/* Caractéristiques */}
        {(p.bedrooms || p.bathrooms || p.area) && (
          <div style={{
            display: 'flex', gap: 10, marginBottom: 11,
            paddingBottom: 11, borderBottom: '1px solid #f1f5f9',
          }}>
            {p.bedrooms && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#64748b' }}>
                <Icon d={ICONS.bed} size={12} style={{ color: '#94a3b8' }}/>
                <span style={{ fontWeight: 700 }}>{p.bedrooms}</span>
                <span style={{ color: '#94a3b8' }}>ch.</span>
              </div>
            )}
            {p.bathrooms && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#64748b' }}>
                <Icon d={ICONS.bath} size={12} style={{ color: '#94a3b8' }}/>
                <span style={{ fontWeight: 700 }}>{p.bathrooms}</span>
                <span style={{ color: '#94a3b8' }}>sdb</span>
              </div>
            )}
            {p.area && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#64748b' }}>
                <Icon d={ICONS.area} size={12} style={{ color: '#94a3b8' }}/>
                <span style={{ fontWeight: 700 }}>{p.area}</span>
                <span style={{ color: '#94a3b8' }}>m²</span>
              </div>
            )}
          </div>
        )}

        {/* Prix + note */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ lineHeight: 1.2 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>
              {p.price?.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 3 }}>
              {p.priceUnit}{p.listingType === 'RENT' ? '/mois' : ''}
            </span>
          </div>
          {p.avgRating && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: '#fffbeb', padding: '2px 7px', borderRadius: 5,
            }}>
              <Icon d={ICONS.star} size={10} style={{ color: '#f59e0b' }}/>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                {p.avgRating}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}