import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useLiveViewer, getMiroUrl }    from '../hooks/useLiveRoom'
import { useAuth }                      from '../hooks/useAuth'

const BASE     = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const getToken = () => localStorage.getItem('immo_token')

const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  arrowLeft: 'M19 12H5M12 5l-7 7 7 7',
  video:     'M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  share:     ['M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8','M16 6l-4-4-4 4','M12 2v13'],
  send:      'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z'],
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12a3 3 0 100-6 3 3 0 000 6z'],
  heart:     'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  mapPin:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  refresh:   'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  pin:       ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  smile:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M8 14s1.5 2 4 2 4-2 4-2','M9 9h.01M15 9h.01'],
  verified:  ['M22 11.08V12a10 10 0 11-5.93-9.14','M22 4L12 14.01l-3-3'],
  plus:      'M12 5v14M5 12h14',
  copy:      ['M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866','M10.5 6.9h7c1.105 0 2 .91 2 2.036v9.857C19.5 19.09 18.605 20 17.5 20h-7c-1.105 0-2-.911-2-2.036V8.964c0-1.124.895-2.036 2-2.036z'],
  chat:      ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
}

const REACTIONS = [
  { type:'LIKE',  emoji:'❤️' },
  { type:'FIRE',  emoji:'🔥' },
  { type:'CLAP',  emoji:'👏' },
  { type:'HEART', emoji:'😍' },
]

const AVATAR_PALETTE = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626']
const colorFor = str => AVATAR_PALETTE[(str?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]

export default function LiveViewer() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [live,           setLive]           = useState(null)
  const [liveError,      setLiveError]      = useState(null)
  const [input,          setInput]          = useState('')
  const [following,      setFollowing]      = useState(false)
  const [activeProperty, setActiveProperty] = useState(null)
  const [copied,         setCopied]         = useState(false)
  const messagesEndRef = useRef(null)

  const {
    viewers, messages, pinned, reactions,
    liveEnded, joinError, waitingHost,
    sendMessage, sendReaction, sendShare, retryJoin,
  } = useLiveViewer({ liveId: id })

  const miroSrc = id ? getMiroUrl('viewer', id, user) : null

  useEffect(() => {
    if (!id) return
    fetch(`${BASE}/lives/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => {
        if (r.status === 404) throw new Error('Live introuvable')
        if (!r.ok)            throw new Error(`Erreur ${r.status}`)
        return r.json()
      })
      .then(data => {
        setLive(data)
        setActiveProperty(data.properties?.find(p => p.isActive) ?? data.properties?.[0] ?? null)
      })
      .catch(e => setLiveError(e.message))
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href).catch(() => {})
    sendShare('copy')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Écran erreur ─────────────────────────────────────────
  if (liveError) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col items-center gap-5 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
          <Icon d={Icons.video} size={28} className="text-red-400" strokeWidth={1.2}/>
        </div>
        <div>
          <h2 className="text-base font-bold text-white mb-1">Live indisponible</h2>
          <p className="text-sm text-slate-400">{liveError}</p>
        </div>
        <button onClick={() => navigate('/live')}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition">
          Voir les autres lives
        </button>
        <button onClick={() => navigate(-1)} className="text-xs text-slate-500 hover:text-slate-300 transition">
          ← Retour
        </button>
      </div>
    </div>
  )

  // ── Chargement ────────────────────────────────────────────
  if (!live) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950 gap-3">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
      <p className="text-xs text-slate-500">Chargement du live…</p>
    </div>
  )

  const host = live?.host

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors group">
            <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-slate-700 transition">
              <Icon d={Icons.arrowLeft} size={14}/>
            </span>
            <span className="hidden sm:inline">Retour</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Badge viewers */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg">
              <Icon d={Icons.eye} size={12} className="text-slate-400"/>
              {viewers} en ligne
            </div>

            {/* Bouton Démarrer un live */}
            <Link to="/live/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-900/40">
              <Icon d={Icons.plus} size={14} strokeWidth={2.5}/>
              <span className="hidden sm:inline">Démarrer un live</span>
              <span className="sm:hidden">Live</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">

          {/* ── Colonne principale ── */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Player */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl"
              style={{ /*aspectRatio:'16/9'*/ height:'100vh'}}>

              {liveEnded ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-slate-900">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Icon d={Icons.video} size={28} className="text-slate-500" strokeWidth={1.2}/>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold mb-1">Ce live est terminé</p>
                    <p className="text-slate-500 text-sm">Merci d'avoir regardé</p>
                  </div>
                  <button onClick={() => navigate('/live')}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition">
                    Voir d'autres lives
                  </button>
                </div>

              ) : waitingHost ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Icon d={Icons.eye} size={28} className="text-amber-400" strokeWidth={1.2}/>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold mb-1">En attente de l'hôte…</p>
                    <p className="text-slate-400 text-xs">Le live démarrera automatiquement</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
                        style={{ animationDelay:`${i*0.15}s` }}/>
                    ))}
                  </div>
                </div>

              ) : joinError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/95 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Icon d={Icons.refresh} size={24} className="text-red-400" strokeWidth={1.4}/>
                  </div>
                  <div className="text-center">
                    <p className="text-red-400 text-sm font-medium">{joinError}</p>
                  </div>
                  <button onClick={retryJoin}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition">
                    <Icon d={Icons.refresh} size={14}/> Réessayer
                  </button>
                </div>

              ) : (
                miroSrc && (
                  <iframe
                    src={miroSrc}
                    allow="camera; microphone; fullscreen; autoplay"
                    className="w-full h-full border-0"
                    title="Live Viewer"
                  />
                )
              )}

              {/* Message épinglé */}
              {pinned && (
                <div className="absolute bottom-3 left-3 max-w-xs bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 pointer-events-none border border-white/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Icon d={Icons.pin} size={9} className="text-yellow-400"/>
                    <span className="text-yellow-400 text-[10px] font-bold">Épinglé</span>
                  </div>
                  <p className="text-white text-xs leading-relaxed">{pinned.content}</p>
                </div>
              )}
            </div>

            {/* ── Host bar ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {host?.avatar
                  ? <img src={host.avatar} alt="" className="w-12 h-12 rounded-xl object-cover"/>
                  : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: colorFor(host?.firstName) }}>
                      {host?.firstName?.[0]}{host?.lastName?.[0]}
                    </div>
                }
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"/>
              </div>

              {/* Infos */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{host?.firstName} {host?.lastName}</span>
                  {host?.isVerified && (
                    <Icon d={Icons.verified} size={14} className="text-blue-400" fill="none"/>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Icon d={Icons.users} size={11}/>
                  {live._count?.viewers ?? 0} spectateurs
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => sendReaction('LIKE')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-rose-500/40 hover:text-rose-400 text-slate-300 text-xs font-semibold transition-all">
                  <Icon d={Icons.heart} size={12}/> J'aime
                </button>
                <button onClick={() => setFollowing(f => !f)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    following
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/40'
                  }`}>
                  {following ? '✓ Suivi' : 'Suivre'}
                </button>
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold transition-all">
                  <Icon d={copied ? Icons.verified : Icons.share} size={12} className={copied ? 'text-emerald-400' : ''}/>
                  {copied ? 'Copié !' : 'Partager'}
                </button>
              </div>
            </div>

            {/* ── Biens présentés ── */}
            {live.properties?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Icon d={Icons.home} size={12}/> Biens présentés
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
                  {live.properties.map(lp => (
                    <button key={lp.id} onClick={() => setActiveProperty(lp)}
                      className={`flex-shrink-0 w-52 rounded-xl overflow-hidden border text-left transition-all ${
                        activeProperty?.id === lp.id
                          ? 'border-blue-500 ring-1 ring-blue-500/30 shadow-lg shadow-blue-900/20'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}>
                      <div className="h-24 bg-slate-800 relative overflow-hidden">
                        {lp.property.images?.[0]
                          ? <img src={lp.property.images[0]} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center">
                              <Icon d={Icons.home} size={28} className="text-slate-600"/>
                            </div>
                        }
                        {lp.isActive && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/> En cours
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-800">
                        <div className={`text-sm font-bold truncate ${activeProperty?.id === lp.id ? 'text-blue-400' : 'text-white'}`}>
                          {lp.property.price?.toLocaleString('fr')} {lp.property.priceUnit}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Icon d={Icons.mapPin} size={10} className="text-slate-500"/>
                          <span className="text-xs text-slate-400 truncate">{lp.property.city}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}