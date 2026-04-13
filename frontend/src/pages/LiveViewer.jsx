import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useWebRTCViewer } from '../hooks/useWebRTC'

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
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12a3 3 0 100-6 3 3 0 000 6z'],
  heart:     'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  share:     ['M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8','M16 6l-4-4-4 4','M12 2v13'],
  send:      'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z'],
  mapPin:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  arrowLeft: 'M19 12H5M12 5l-7 7 7 7',
  video:     'M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  smile:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M8 14s1.5 2 4 2 4-2 4-2','M9 9h.01M15 9h.01'],
  pin:       ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  refresh:   'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  verified:  ['M22 11.08V12a10 10 0 11-5.93-9.14','M22 4L12 14.01l-3-3'],
}

const REACTIONS = [
  { type:'LIKE',  emoji:'❤️' },
  { type:'FIRE',  emoji:'🔥' },
  { type:'CLAP',  emoji:'👏' },
  { type:'HEART', emoji:'😍' },
]

const AVATAR_PALETTE = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626']
const colorFor = str  => AVATAR_PALETTE[(str?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]

export default function LiveViewer() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [live,         setLive]         = useState(null)
  const [liveError,    setLiveError]    = useState(null)
  const [input,        setInput]        = useState('')
  const [following,    setFollowing]    = useState(false)
  const [activeProperty, setActiveProperty] = useState(null)
  const messagesEndRef = useRef(null)

  let {
    remoteVideoRef, connected, liveEnded, joinError,
    viewers, messages, pinned, reactions,
    sendMessage, sendReaction, sendShare, retryJoin,
  } = useWebRTCViewer({ liveId: id })

  connected = true
  console.log({ joinError, liveEnded, connected })

  // Charger les infos du live
  useEffect(() => {
    fetch(`${BASE}/lives/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(r => {
        if (r.status === 404) throw new Error('Live introuvable')
        if (!r.ok) throw new Error(`Erreur ${r.status}`)
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
  }

  // ── État erreur live ──────────────────────────────────────
  if (liveError) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-4 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <Icon d={Icons.video} size={28} className="text-red-300" strokeWidth={1.2}/>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Live indisponible</h2>
          <p className="text-sm text-slate-500">{liveError}</p>
        </div>
        <button onClick={() => navigate('/live')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
          Voir les autres lives
        </button>
        <button onClick={() => navigate(-1)} className="text-xs text-slate-400 hover:text-slate-600 transition">
          Retour
        </button>
      </div>
    </div>
  )

  // ── Chargement ────────────────────────────────────────────
  if (!live) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  const host = live?.host

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
            <Icon d={Icons.arrowLeft} size={15}/> Retour
          </button>
          <Link to="/live/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm shadow-blue-200">
            <Icon d={Icons.video} size={14}/>
            <span className="hidden sm:inline">Démarrer un live</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">

          {/* ── Colonne principale ── */}
          <div className="flex flex-col gap-5 min-w-0">

            {/* Player */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video w-full shadow-xl shadow-slate-200">
              <video ref={remoteVideoRef} autoPlay playsInline
                className="w-full h-full object-cover"/>

              {/* Connexion en cours */}
              {!connected && !liveEnded && !joinError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                  <span className="text-slate-300 text-sm">Connexion au live...</span>
                </div>
              )}

              {/* Erreur de connexion */}
              {!connected && !liveEnded && joinError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/90">
                  <Icon d={Icons.video} size={40} className="text-slate-500" strokeWidth={1}/>
                  <p className="text-red-400 text-sm px-6 text-center">{joinError}</p>
                  <button onClick={retryJoin}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
                    <Icon d={Icons.refresh} size={14}/> Réessayer
                  </button>
                </div>
              )}

              {/* Live terminé */}
              {liveEnded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/90">
                  <Icon d={Icons.video} size={40} className="text-slate-500" strokeWidth={1}/>
                  <p className="text-slate-300 font-semibold">Ce live est terminé</p>
                  <button onClick={() => navigate('/live')}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                    Voir d'autres lives
                  </button>
                </div>
              )}

              {/* Badge LIVE */}
              {!liveEnded && (
                <div className="absolute top-3 left-3">
                  <div className={`flex items-center gap-1.5 text-white text-xs font-bold px-2.5 py-1 rounded-lg ${connected ? 'bg-red-500' : 'bg-slate-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-white ${connected ? 'animate-pulse' : ''}`}/>
                    {connected ? 'LIVE' : 'EN ATTENTE'}
                  </div>
                </div>
              )}

              {/* Viewers */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                <Icon d={Icons.eye} size={12}/> {viewers}
              </div>

              {/* Réactions flottantes */}
              <div className="absolute bottom-16 right-4 flex flex-col gap-1 pointer-events-none">
                {reactions.map(r => (
                  <div key={r.id} className="text-2xl animate-bounce">
                    {REACTIONS.find(x => x.type === r.type)?.emoji}
                  </div>
                ))}
              </div>

              {/* Boutons réactions */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                {REACTIONS.map(r => (
                  <button key={r.type} onClick={() => sendReaction(r.type)}
                    className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition text-lg">
                    {r.emoji}
                  </button>
                ))}
              </div>

              {/* Message épinglé */}
              {pinned && (
                <div className="absolute bottom-3 left-3 max-w-xs bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Icon d={Icons.pin} size={10} className="text-yellow-400"/>
                    <span className="text-yellow-400 text-[10px] font-bold">Épinglé</span>
                  </div>
                  <p className="text-white text-xs">{pinned.content}</p>
                </div>
              )}
            </div>

            {/* Host bar */}
            <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex flex-wrap items-center gap-3 shadow-sm">
              {host?.avatar
                ? <img src={host.avatar} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0"/>
                : <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: colorFor(host?.firstName) }}>
                    {host?.firstName?.[0]}{host?.lastName?.[0]}
                  </div>
              }
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{host?.firstName} {host?.lastName}</span>
                  {host?.isVerified && <Icon d={Icons.verified} size={14} className="text-blue-500"/>}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{live._count?.viewers ?? 0} spectateurs</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => sendReaction('LIKE')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-400 text-xs font-semibold transition-all">
                  <Icon d={Icons.heart} size={13}/> J'aime
                </button>
                <button onClick={() => setFollowing(f => !f)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    following ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'
                  }`}>
                  {following ? 'Suivi ✓' : 'Suivre'}
                </button>
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:border-slate-300 transition-all">
                  <Icon d={Icons.share} size={13}/> Partager
                </button>
              </div>
            </div>

            {/* Biens présentés */}
            {live.properties?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Biens présentés</h3>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
                  {live.properties.map(lp => (
                    <button key={lp.id} onClick={() => setActiveProperty(lp)}
                      className={`flex-shrink-0 w-52 rounded-xl overflow-hidden border text-left transition-all ${
                        activeProperty?.id === lp.id
                          ? 'border-blue-400 shadow-md shadow-blue-100 ring-1 ring-blue-200'
                          : 'border-slate-200 hover:border-blue-200 hover:shadow-sm'
                      }`}>
                      <div className="h-24 bg-slate-50 relative overflow-hidden">
                        {lp.property.images?.[0]
                          ? <img src={lp.property.images[0]} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center">
                              <Icon d={Icons.home} size={28} className="text-slate-300"/>
                            </div>
                        }
                        {lp.isActive && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/> En cours
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-white">
                        <div className={`text-sm font-bold truncate ${activeProperty?.id === lp.id ? 'text-blue-600' : 'text-slate-700'}`}>
                          {lp.property.price?.toLocaleString('fr')} {lp.property.priceUnit}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Icon d={Icons.mapPin} size={10} className="text-slate-400"/>
                          <span className="text-xs text-slate-500 truncate">{lp.property.city}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                          {lp.property.bedrooms && <span>{lp.property.bedrooms} ch.</span>}
                          {lp.property.area && <span>{lp.property.area} m²</span>}
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            lp.property.listingType === 'SALE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>{lp.property.listingType === 'SALE' ? 'Vente' : 'Location'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar chat ── */}
          <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            style={{ maxHeight:'80vh', position:'sticky', top:80 }}>

            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Icon d={Icons.users} size={14} className="text-slate-400"/>
                <span className="text-sm font-bold text-slate-700">Chat live</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                {viewers} en ligne
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-white"
              style={{ minHeight:340, maxHeight:440 }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300 py-8">
                  <Icon d={Icons.users} size={32} strokeWidth={1}/>
                  <p className="text-xs">Le chat apparaîtra ici</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.isHost ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[11px] font-bold ${msg.isHost ? 'text-blue-500' : 'text-slate-400'}`}>
                    {msg.isHost && '✦ '}{msg.author?.firstName} {msg.author?.lastName}
                  </span>
                  <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                    msg.isHost   ? 'bg-blue-50 text-blue-800 rounded-tl-sm border border-blue-100'
                    : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                  }`}>{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef}/>
            </div>

            <div className="flex items-center gap-2 p-3 border-t border-slate-100 bg-slate-50">
              <div className="flex-1 relative">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Poser une question..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition pr-8"/>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <Icon d={Icons.smile} size={15}/>
                </button>
              </div>
              <button onClick={handleSend} disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition flex-shrink-0 shadow-sm shadow-blue-200">
                <Icon d={Icons.send} size={13} className="text-white"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}