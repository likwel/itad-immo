import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProperties, getProperty, toggleFav } from '../services/property.service'
import { api } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

// ── Icônes ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  home:     'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  mapPin:   ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  bed:      ['M3 9h18M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3','M3 9v9h18V9','M9 9V5'],
  bath:     ['M4 12h16','M4 6h2','M8 6h.01','M4 18a2 2 0 002 2h12a2 2 0 002-2v-6H4v6z'],
  area:     ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  parking:  ['M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3','M9 7h1a2 2 0 010 4H9V7z','M13 21l-4-4 4-4','M21 21v-6a2 2 0 00-2-2H9'],
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  heart:    'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  share:    ['M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8','M16 6l-4-4-4 4','M12 2v13'],
  phone:    'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.1 2.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z',
  message:  ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  check:    'M20 6L9 17l-5-5',
  x:        'M18 6L6 18M6 6l12 12',
  eye:      ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 100 6 3 3 0 000-6z'],
  calendar: ['M3 4h18v18H3z','M16 2v4M8 2v4','M3 10h18'],
  chevL:    'M15 18l-6-6 6-6',
  chevR:    'M9 18l6-6-6-6',
  tag:      'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  arrowR:   'M5 12h14M12 5l7 7-7 7',
}

// ── Constantes ────────────────────────────────────────────────
const LISTING_LABELS = { SALE:'Vente', RENT:'Location', VACATION_RENT:'Vacances' }
const LISTING_COLORS = { SALE:'green', RENT:'blue', VACATION_RENT:'yellow' }

const AMENITY_ICONS = {
  wifi:          'M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01',
  piscine:       ['M2 12h20','M2 6h20','M12 2a5 5 0 015 5v5H7V7a5 5 0 015-5z'],
  garage:        ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z','M9 22V12h6v10'],
  jardin:        ['M12 22V12','M12 12C12 12 7 9 7 5a5 5 0 0110 0c0 4-5 7-5 7z'],
  sécurité:      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  ascenseur:     ['M3 3h18v18H3z','M12 8v8','M9 11l3-3 3 3','M9 16l3 3 3-3'],
  meublé:        ['M20 9V6a2 2 0 00-2-2H4a2 2 0 00-2 2v3','M2 11v5a2 2 0 002 2h16a2 2 0 002-2v-5'],
  climatisation: ['M8 6h8M8 12h8M8 18h8','M4 6h.01M4 12h.01M4 18h.01'],
  balcon:        ['M3 21h18','M5 21V10l7-7 7 7v11','M9 21v-6h6v6'],
  terrasse:      ['M3 21h18','M3 7l9-4 9 4','M4 7v14'],
}

// ── StarRating ────────────────────────────────────────────────
function StarRating({ rating, max = 5, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} d={Icons.star} size={size}
          className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
          strokeWidth={1}/>
      ))}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
      ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      <Icon d={toast.type === 'success' ? Icons.check : Icons.x} size={15}/>
      {toast.message}
    </div>
  )
}

// ── ReviewForm ────────────────────────────────────────────────
function ReviewForm({ propertyId, onSubmitted }) {
  const [rating,  setRating]  = useState(0)
  const [hover,   setHover]   = useState(0)
  const [comment, setComment] = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (!rating)           return setError('Choisissez une note')
    if (!comment.trim())   return setError('Écrivez un commentaire')
    setSaving(true); setError('')
    try {
      await api('/reviews', { method:'POST', body: JSON.stringify({ propertyId, rating, comment }) })
      setRating(0); setComment('')
      onSubmitted()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-slate-800">Laisser un avis</h3>
      {/* Étoiles interactives */}
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <button key={i} type="button"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}>
            <Icon d={Icons.star} size={28}
              className={i <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
              strokeWidth={1}/>
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-slate-500 ml-2">{['','Mauvais','Passable','Bien','Très bien','Excellent'][rating]}</span>}
      </div>
      <textarea
        value={comment} onChange={e => setComment(e.target.value)}
        rows={3} placeholder="Partagez votre expérience avec ce bien..."
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"/>
      {error && <p className="text-red-500 text-xs flex items-center gap-1"><Icon d={Icons.x} size={12}/>{error}</p>}
      <button onClick={handleSubmit} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
        {saving ? 'Envoi...' : 'Publier l\'avis'}
      </button>
    </div>
  )
}

// ── SimilarCard ───────────────────────────────────────────────
function SimilarCard({ p }) {
  return (
    <Link to={`/annonces/${p.slug}`}
      className="group card overflow-hidden hover:shadow-lg transition-all duration-200 flex-shrink-0 w-64">
      <div className="h-36 bg-slate-200 overflow-hidden relative">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          : <div className="w-full h-full flex items-center justify-center"><Icon d={Icons.home} size={32} className="text-slate-400"/></div>
        }
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-xs font-semibold
          ${p.listingType === 'SALE' ? 'bg-green-100 text-green-700' : p.listingType === 'RENT' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {LISTING_LABELS[p.listingType]}
        </span>
      </div>
      <div className="p-3">
        <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{p.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
          <Icon d={Icons.mapPin} size={10}/>{p.city}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-blue-600 font-bold text-sm">{p.price?.toLocaleString()} {p.priceUnit}</span>
          {p.avgRating && <span className="flex items-center gap-1 text-xs text-slate-500">
            <Icon d={Icons.star} size={11} className="text-amber-400 fill-amber-400" strokeWidth={1}/>
            {p.avgRating}
          </span>}
        </div>
      </div>
    </Link>
  )
}

// ══════════════════════════════════════════════════════════════
// PropertyDetail
// ══════════════════════════════════════════════════════════════
export default function PropertyDetail() {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [property,  setProperty]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [imgIdx,    setImgIdx]    = useState(0)
  const [fav,       setFav]       = useState(false)
  const [similar,   setSimilar]   = useState([])
  const [tab,       setTab]       = useState('description')
  const [toast,     setToast]     = useState(null)
  const [msgForm,   setMsgForm]   = useState(false)
  const [message,   setMessage]   = useState('')
  const [sending,   setSending]   = useState(false)
  const similarRef = useRef()

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadProperty = async () => {
    setLoading(true)
    try {
      const p = await getProperty(slug)
      setProperty(p)
      setImgIdx(0)
      // Charger les similaires
      const qs = new URLSearchParams({ city: p.city, listingType: p.listingType, limit: 6 }).toString()
      const res = await getProperties(qs)
      setSimilar((res.data ?? []).filter(s => s.slug !== slug).slice(0, 5))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProperty() }, [slug])

  const handleFav = async () => {
    if (!user) return navigate('/login')
    try {
      const r = await toggleFav(property.id)
      setFav(r.favorited)
      showToast(r.favorited ? 'Ajouté aux favoris' : 'Retiré des favoris')
    } catch {}
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    showToast('Lien copié !')
  }

  const handleMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      await api('/messages', { method:'POST', body: JSON.stringify({
        receiverId: property.owner.id,
        content: message,
        subject: `À propos de : ${property.title}`,
        propertyId: property.id,
      })})
      setMessage(''); setMsgForm(false)
      showToast('Message envoyé !')
    } catch (e) { showToast(e.message, 'error') }
    finally { setSending(false) }
  }

  if (loading) return <Spinner />
  if (!property) return (
    <div className="text-center py-24">
      <Icon d={Icons.home} size={48} className="mx-auto text-slate-300 mb-4" strokeWidth={1}/>
      <p className="text-slate-500 font-medium">Bien introuvable</p>
      <button onClick={() => navigate('/annonces')} className="mt-4 text-blue-600 hover:underline text-sm">
        Retour aux annonces
      </button>
    </div>
  )

  const p = property

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* ── Fil d'Ariane ── */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-blue-600 transition-colors">Accueil</Link>
        <span>/</span>
        <Link to="/annonces" className="hover:text-blue-600 transition-colors">Annonces</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{p.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ════════════════════════════════════════
            COLONNE PRINCIPALE
        ════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-8">

          {/* ── Galerie ── */}
          <div className="rounded-2xl overflow-hidden bg-slate-100 relative">
            {p.images?.length > 0 ? (
              <>
                <img src={p.images[imgIdx]} alt={p.title}
                  className="w-full h-96 object-cover"/>
                {/* Navigation image */}
                {p.images.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i - 1 + p.images.length) % p.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                      <Icon d={Icons.chevL} size={16} className="text-slate-700"/>
                    </button>
                    <button onClick={() => setImgIdx(i => (i + 1) % p.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                      <Icon d={Icons.chevR} size={16} className="text-slate-700"/>
                    </button>
                    <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                      {imgIdx + 1} / {p.images.length}
                    </span>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Icon d={Icons.home} size={48} strokeWidth={1}/>
                <span className="text-sm">Aucune photo disponible</span>
              </div>
            )}
          </div>

          {/* Miniatures */}
          {p.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {p.images.map((img, i) => (
                <img key={i} src={img} alt="" onClick={() => setImgIdx(i)}
                  className={`h-16 w-24 object-cover rounded-xl cursor-pointer flex-shrink-0 transition-all
                    ${i === imgIdx ? 'ring-2 ring-blue-600 opacity-100' : 'opacity-50 hover:opacity-80'}`}/>
              ))}
            </div>
          )}

          {/* ── En-tête titre + actions ── */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={LISTING_COLORS[p.listingType]}>
                {LISTING_LABELS[p.listingType]}
              </Badge>
              {p.featured && <Badge variant="yellow">⭐ En vedette</Badge>}
              {p.negotiable && <Badge variant="green">Prix négociable</Badge>}
            </div>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{p.title}</h1>
                <p className="text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <Icon d={Icons.mapPin} size={14} className="text-slate-400 flex-shrink-0"/>
                  {p.address}, {p.city}{p.district ? ` - ${p.district}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleFav}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all
                    ${fav ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  <Icon d={Icons.heart} size={15} className={fav ? 'fill-red-500 text-red-500' : ''}/>
                  {fav ? 'Favori' : 'Sauvegarder'}
                </button>
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-300 text-sm font-medium transition-all bg-white">
                  <Icon d={Icons.share} size={15}/>
                  Partager
                </button>
              </div>
            </div>

            {/* Stats rapides */}
            {p.avgRating && (
              <div className="flex items-center gap-2 mt-3">
                <StarRating rating={p.avgRating}/>
                <span className="text-sm font-semibold text-slate-700">{p.avgRating}</span>
                <span className="text-sm text-slate-500">({p.reviews?.length} avis)</span>
                <span className="text-slate-300 mx-1">·</span>
                <Icon d={Icons.eye} size={13} className="text-slate-400"/>
                <span className="text-sm text-slate-500">{p.viewCount} vues</span>
              </div>
            )}
          </div>

          {/* ── Caractéristiques ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              p.area        && { icon: Icons.area,    value: `${p.area} m²`,       label: 'Surface'  },
              p.bedrooms    && { icon: Icons.bed,     value: p.bedrooms,            label: 'Chambres' },
              p.bathrooms   && { icon: Icons.bath,    value: p.bathrooms,           label: 'SDB'      },
              p.parkingSpots && { icon: Icons.parking, value: p.parkingSpots,       label: 'Parking'  },
            ].filter(Boolean).map(({ icon, value, label }) => (
              <div key={label} className="card p-4 text-center">
                <Icon d={icon} size={20} className="mx-auto text-blue-500 mb-2"/>
                <div className="font-bold text-slate-800">{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Tabs description/avis/équipements ── */}
          <div>
            <div className="flex gap-1 border-b border-slate-200 mb-6">
              {[
                { key:'description', label:'Description' },
                { key:'amenities',   label:`Équipements (${p.amenities?.length ?? 0})` },
                { key:'reviews',     label:`Avis (${p.reviews?.length ?? 0})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                    ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Description */}
            {tab === 'description' && (
              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{p.description}</p>
                {p.yearBuilt && (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Icon d={Icons.calendar} size={14} className="text-slate-400"/>
                    Année de construction : <span className="font-medium text-slate-700">{p.yearBuilt}</span>
                  </p>
                )}
                {p.furnished && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <Icon d={Icons.check} size={14}/>
                    Bien meublé
                  </p>
                )}
              </div>
            )}

            {/* Équipements */}
            {tab === 'amenities' && (
              p.amenities?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {p.amenities.map(a => (
                    <div key={a} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon d={AMENITY_ICONS[a] ?? Icons.check} size={14} className="text-blue-500"/>
                      </div>
                      <span className="text-sm font-medium text-slate-700 capitalize">{a}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-sm">Aucun équipement renseigné</p>
            )}

            {/* Avis */}
            {tab === 'reviews' && (
              <div className="space-y-6">
                {/* Résumé rating */}
                {p.reviews?.length > 0 && (
                  <div className="card p-5 flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-slate-800">{p.avgRating}</div>
                      <StarRating rating={p.avgRating} size={16}/>
                      <div className="text-xs text-slate-500 mt-1">{p.reviews.length} avis</div>
                    </div>
                    {/* Distribution des notes */}
                    <div className="flex-1 space-y-1.5">
                      {[5,4,3,2,1].map(n => {
                        const count = p.reviews.filter(r => r.rating === n).length
                        const pct   = p.reviews.length ? Math.round((count / p.reviews.length) * 100) : 0
                        return (
                          <div key={n} className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-2">{n}</span>
                            <Icon d={Icons.star} size={10} className="text-amber-400 fill-amber-400" strokeWidth={1}/>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width:`${pct}%` }}/>
                            </div>
                            <span className="w-8 text-right">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Liste des avis */}
                <div className="space-y-4">
                  {p.reviews?.length === 0 && (
                    <p className="text-slate-400 text-sm">Aucun avis pour l'instant. Soyez le premier !</p>
                  )}
                  {p.reviews?.map(r => (
                    <div key={r.id} className="card p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                            {r.author?.firstName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-800">
                              {r.author?.firstName} {r.author?.lastName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StarRating rating={r.rating} size={12}/>
                              {r.isVerified && (
                                <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                  <Icon d={Icons.shield} size={9}/> Vérifié
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {new Date(r.createdAt).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })}
                        </span>
                      </div>
                      {r.title && <p className="font-medium text-slate-700 text-sm mb-1">{r.title}</p>}
                      <p className="text-slate-600 text-sm leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Formulaire avis */}
                {user ? (
                  <ReviewForm propertyId={p.id} onSubmitted={() => { loadProperty(); showToast('Avis publié !') }}/>
                ) : (
                  <div className="card p-5 text-center">
                    <p className="text-slate-500 text-sm mb-3">Connectez-vous pour laisser un avis</p>
                    <button onClick={() => navigate('/login')}
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                      Se connecter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════
            SIDEBAR
        ════════════════════════════════════════ */}
        <div className="space-y-5">

          {/* Prix & CTA */}
          <div className="card p-6 sticky top-24 space-y-4">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {p.price?.toLocaleString()} {p.priceUnit}
              </div>
              {p.listingType === 'RENT' && <span className="text-slate-400 text-sm">/mois</span>}
              {p.negotiable && (
                <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                  <Icon d={Icons.check} size={13}/> Prix négociable
                </p>
              )}
            </div>

            {/* CTA principal */}
            <button
              onClick={() => user ? navigate(`/reservation/${p.id}`) : navigate('/login')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
              <Icon d={Icons.calendar} size={16}/>
              {p.listingType === 'SALE' ? 'Faire une offre' : 'Réserver'}
            </button>

            {/* Contacter le vendeur */}
            {p.owner && user && (
              <>
                <button onClick={() => setMsgForm(v => !v)}
                  className="w-full py-2.5 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm">
                  <Icon d={Icons.message} size={15}/>
                  Contacter le vendeur
                </button>
                {msgForm && (
                  <div className="space-y-2">
                    <textarea value={message} onChange={e => setMessage(e.target.value)}
                      rows={3} placeholder="Votre message..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                    <div className="flex gap-2">
                      <button onClick={() => setMsgForm(false)}
                        className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                        Annuler
                      </button>
                      <button onClick={handleMessage} disabled={sending}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {sending ? 'Envoi...' : 'Envoyer'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Téléphone */}
            {p.owner?.phone && (
              <a href={`tel:${p.owner.phone}`}
                className="w-full py-2.5 border border-slate-200 hover:border-green-300 text-slate-700 hover:text-green-600 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm">
                <Icon d={Icons.phone} size={15}/>
                {p.owner.phone}
              </a>
            )}

            {/* Vendeur */}
            {p.owner && (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                  {p.owner.firstName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{p.owner.firstName} {p.owner.lastName}</p>
                  {p.agency
                    ? <p className="text-xs text-slate-500 flex items-center gap-1"><Icon d={Icons.shield} size={10}/>{p.agency.name}</p>
                    : <p className="text-xs text-slate-500">Vendeur particulier</p>
                  }
                </div>
              </div>
            )}

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
              <Icon d={Icons.eye} size={12}/>{p.viewCount} vues
            </p>
          </div>

          {/* Confiance */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Achat sécurisé</p>
            {[
              [Icons.shield, 'Vendeur vérifié'],
              [Icons.check,  'Paiement sécurisé'],
              [Icons.tag,    'Prix transparent'],
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon d={icon} size={12} className="text-green-500"/>
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          BIENS SIMILAIRES
      ════════════════════════════════════════ */}
      {similar.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800">Biens similaires</h2>
            <div className="flex gap-2">
              <button onClick={() => similarRef.current?.scrollBy({ left:-280, behavior:'smooth' })}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                <Icon d={Icons.chevL} size={15} className="text-slate-500"/>
              </button>
              <button onClick={() => similarRef.current?.scrollBy({ left:280, behavior:'smooth' })}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                <Icon d={Icons.chevR} size={15} className="text-slate-500"/>
              </button>
            </div>
          </div>
          <div ref={similarRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
            style={{ scrollbarWidth:'none' }}>
            {similar.map(s => <SimilarCard key={s.id} p={s}/>)}
          </div>
          <div className="text-center mt-5">
            <Link to={`/annonces?city=${p.city}&listingType=${p.listingType}`}
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors text-sm">
              Voir tous les biens à {p.city}
              <Icon d={Icons.arrowR} size={14}/>
            </Link>
          </div>
        </div>
      )}

      <Toast toast={toast}/>
    </div>
  )
}