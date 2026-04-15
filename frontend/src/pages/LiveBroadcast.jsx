import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams }                    from 'react-router-dom'
import { useWebRTCHost }                             from '../hooks/useWebRTC'
import { useLiveSocket }                             from '../hooks/useLiveSocket'

const BASE     = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const getToken = () => localStorage.getItem('immo_token')

// ── Icônes ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)
const Icons = {
  send:      'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  chat:      ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12a3 3 0 100-6 3 3 0 000 6z'],
  clock:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 6v6l4 2'],
  heart:     'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  stop:      'M18 6H6v12h12V6z',
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  cam:       'M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  camOff:    ['M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34','M23 7l-7 5 7 5V7z','M1 1l22 22'],
  mic:       ['M12 1a3 3 0 013 3v8a3 3 0 01-6 0V4a3 3 0 013-3z','M19 10v2a7 7 0 01-14 0v-2','M12 19v4','M8 23h8'],
  micOff:    ['M1 1l22 22','M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6','M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23','M12 19v4','M8 23h8'],
  pinMap:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  smile:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M8 14s1.5 2 4 2 4-2 4-2','M9 9h.01M15 9h.01'],
  record:    'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  maximize:  ['M8 3H5a2 2 0 00-2 2v3','M21 8V5a2 2 0 00-2-2h-3','M3 16v3a2 2 0 002 2h3','M16 21h3a2 2 0 002-2v-3'],
  minimize:  ['M8 3v3a2 2 0 01-2 2H3','M21 8h-3a2 2 0 01-2-2V3','M3 16h3a2 2 0 012 2v3','M16 21v-3a2 2 0 012-2h3'],
}

const AVATAR_PALETTE = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626']
const colorFor = str  => AVATAR_PALETTE[(str?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]
const fmtTime  = secs => {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function ViewerAvatar({ viewer }) {
  const color    = colorFor(viewer?.firstName)
  const initials = `${viewer?.firstName?.[0] ?? '?'}${viewer?.lastName?.[0] ?? ''}`
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition">
      {viewer?.avatar
        ? <img src={viewer.avatar} alt={initials} className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/>
        : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: color }}>{initials}</div>
      }
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-700 truncate">
          {viewer?.firstName ?? 'Anonyme'} {viewer?.lastName ?? ''}
        </div>
        <div className="text-[10px] text-slate-400">{viewer?.role ?? 'Visiteur'}</div>
      </div>
      <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"/>
    </div>
  )
}

export default function LiveBroadcast() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  // ✅ useLiveSocket utilisé UNIQUEMENT pour les listeners chat/réactions
  // useWebRTCHost gère lui-même son socket host via freshConnection:true
  const { emit, on } = useLiveSocket({ freshConnection: true })

  const [live,       setLive]       = useState(null)
  const [viewers,    setViewers]    = useState(0)
  const [viewerList, setViewerList] = useState([])
  const [messages,   setMessages]   = useState([])
  const [reactions,  setReactions]  = useState([])
  const [input,      setInput]      = useState('')
  const [stopping,   setStopping]   = useState(false)
  const [elapsed,    setElapsed]    = useState(0)
  const [sideTab,    setSideTab]    = useState('chat')
  const [likes,      setLikes]      = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const messagesEndRef  = useRef(null)
  const timerRef        = useRef(null)
  const videoWrapRef    = useRef(null)  // ← ref sur le conteneur vidéo pour plein écran

  const {
    localVideoRef, streaming, mediaError,
    micOn, camOn, recording,
    startBroadcast, stopBroadcast,
    toggleMic, toggleCam,
    startRecording, stopRecording,
  } = useWebRTCHost({
    liveId:        id,
    onViewerCount: setViewers,
    onMessage:     msg => setMessages(m => [...m, msg]),
    onReaction:    r   => {
      setLikes(l => l + 1)
      const rid = Date.now()
      setReactions(prev => [...prev, { ...r, id: rid }])
      setTimeout(() => setReactions(prev => prev.filter(x => x.id !== rid)), 3000)
    },
  })

  // ── ✅ PLUS de useEffect qui émet live:start ici
  //    useWebRTCHost s'en charge déjà

  // ── Charger les infos du live ─────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/lives/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()).then(setLive).catch(console.error)
  }, [id])

  // ── Timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (streaming) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [streaming])

  // ── Scroll chat ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Écouter viewers-update depuis le socket partagé ───────
  useEffect(() => {
    const offs = [
      on('live:viewers-update', ({ count, viewers: list }) => {
        setViewers(count)
        if (list) setViewerList(list)
      }),
    ]
    return () => offs.forEach(o => o?.())
  }, [on])

  // ── Plein écran ───────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    const el = videoWrapRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Envoyer message ───────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim()) return
    emit('live:message', { liveId: id, content: input.trim() })
    setInput('')
  }

  // ── Arrêter le live ───────────────────────────────────────
  const handleStop = useCallback(async (e) => {
    e?.stopPropagation()
    if (stopping) return
    setStopping(true)
    try {
      await fetch(`${BASE}/lives/${id}/end`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      stopBroadcast()
      navigate(`/live/${id}/history`)
    } catch (err) {
      console.error('Erreur arrêt live:', err)
      setStopping(false)
    }
  }, [id, stopping, stopBroadcast, navigate])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Icon d={Icons.cam} size={18} className="text-blue-600"/>
              Tableau de bord — Live
            </h1>
            {live && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{live.title}</p>}
          </div>
          <div className="flex items-center gap-3">
            {streaming && (
              <>
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/> EN DIRECT
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm">
                  <Icon d={Icons.clock} size={13} className="text-blue-500"/>
                  {fmtTime(elapsed)}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

          {/* ── Colonne principale ── */}
          <div className="flex flex-col gap-4">

            {/* Player */}
            <div ref={videoWrapRef}
              className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-xl shadow-slate-200">
              <video ref={localVideoRef} autoPlay muted playsInline
                className="w-full h-full object-cover"/>

              {!camOn && streaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <Icon d={Icons.camOff} size={48} className="text-slate-600" strokeWidth={1}/>
                </div>
              )}

              {!streaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/80">
                  {mediaError
                    ? <p className="text-red-400 text-sm px-6 text-center">{mediaError}</p>
                    : <p className="text-slate-400 text-sm">Caméra prête — cliquez pour démarrer</p>
                  }
                  <button onClick={startBroadcast}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-sm transition active:scale-95 shadow-lg shadow-red-500/30">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
                    Démarrer le live
                  </button>
                </div>
              )}

              {streaming && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/> LIVE
                </div>
              )}

              {/* Enregistrement en cours */}
              {recording && (
                <div className="absolute top-3 right-12 flex items-center gap-1.5 bg-slate-800/80 text-red-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/> REC
                </div>
              )}

              {/* Réactions flottantes */}
              <div className="absolute bottom-16 right-4 flex flex-col gap-1 pointer-events-none">
                {reactions.map(r => (
                  <div key={r.id} className="text-2xl animate-bounce">
                    {r.type === 'FIRE' ? '🔥' : r.type === 'CLAP' ? '👏' : '❤️'}
                  </div>
                ))}
              </div>

              {/* Barre de contrôles */}
              {streaming && (
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-2">
                  {/* Micro */}
                  <button onClick={toggleMic}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${micOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
                    <Icon d={micOn ? Icons.mic : Icons.micOff} size={15} className="text-white"/>
                  </button>

                  {/* Caméra */}
                  <button onClick={toggleCam}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${camOn ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
                    <Icon d={camOn ? Icons.cam : Icons.camOff} size={15} className="text-white"/>
                  </button>

                  {/* Enregistrement */}
                  <button onClick={recording ? stopRecording : startRecording}
                    title={recording ? 'Arrêter l\'enregistrement' : 'Enregistrer'}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${recording ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}>
                    <Icon d={Icons.record} size={15} className="text-white" fill={recording ? 'currentColor' : 'none'} strokeWidth={recording ? 0 : 1.8}/>
                  </button>

                  <div className="flex-1"/>

                  {/* Viewers */}
                  <div className="flex items-center gap-1.5 bg-black/40 text-white text-xs px-2.5 py-1.5 rounded-lg">
                    <Icon d={Icons.eye} size={12}/> {viewers}
                  </div>

                  {/* Plein écran */}
                  <button onClick={toggleFullscreen}
                    className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
                    <Icon d={isFullscreen ? Icons.minimize : Icons.maximize} size={15} className="text-white"/>
                  </button>

                  {/* Terminer */}
                  <button onClick={handleStop} disabled={stopping}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95">
                    {stopping
                      ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      : <Icon d={Icons.stop} size={13} fill="currentColor" strokeWidth={0}/>
                    }
                    <span className="hidden sm:inline">{stopping ? 'Arrêt...' : 'Terminer'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label:'Spectateurs', value:viewers,          icon:Icons.eye,   color:'text-blue-600',    bg:'bg-blue-50'    },
                { label:'Messages',    value:messages.length,  icon:Icons.chat,  color:'text-violet-600',  bg:'bg-violet-50'  },
                { label:"J'aimes",     value:likes,            icon:Icons.heart, color:'text-rose-600',    bg:'bg-rose-50'    },
                { label:'Durée',       value:fmtTime(elapsed), icon:Icons.clock, color:'text-emerald-600', bg:'bg-emerald-50' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
                  <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                    <Icon d={s.icon} size={15} className={s.color}/>
                  </div>
                  <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Biens présentés */}
            {live?.properties?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Biens présentés</h3>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
                  {live.properties.map(lp => (
                    <button key={lp.id}
                      onClick={() => emit('live:set-property', { liveId: id, propertyId: lp.property.id })}
                      className={`flex-shrink-0 w-44 rounded-xl overflow-hidden border text-left transition-all ${
                        lp.isActive ? 'border-blue-400 ring-1 ring-blue-200 shadow-md shadow-blue-100' : 'border-slate-200 hover:border-blue-200'
                      }`}>
                      <div className="h-20 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                        {lp.property.images?.[0]
                          ? <img src={lp.property.images[0]} className="w-full h-full object-cover" alt=""/>
                          : <Icon d={Icons.home} size={24} className="text-slate-300"/>
                        }
                        {lp.isActive && (
                          <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-white animate-pulse"/> En cours
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-slate-700 truncate">{lp.property.title}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Icon d={Icons.pinMap} size={9}/>{lp.property.city}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {streaming && (
              <button onClick={handleStop} disabled={stopping}
                className="sm:hidden w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md shadow-red-200 active:scale-95">
                {stopping
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Arrêt en cours...</>
                  : <><Icon d={Icons.stop} size={15} fill="currentColor" strokeWidth={0}/> Terminer le live</>
                }
              </button>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            style={{ maxHeight:'80vh', position:'sticky', top:80 }}>

            <div className="flex border-b border-slate-100 bg-slate-50">
              {[
                { key:'chat',    label:'Chat',        icon:Icons.chat,  count:messages.length },
                { key:'viewers', label:'Spectateurs', icon:Icons.users, count:viewers         },
              ].map(t => (
                <button key={t.key} onClick={() => setSideTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all ${
                    sideTab === t.key ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <Icon d={t.icon} size={13}/>
                  {t.label}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    sideTab === t.key ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                  }`}>{t.count}</span>
                </button>
              ))}
            </div>

            {sideTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
                  style={{ minHeight:300, maxHeight:460 }}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300 py-12">
                      <Icon d={Icons.chat} size={32} strokeWidth={1}/>
                      <p className="text-xs">Les messages apparaîtront ici</p>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.isHost ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[11px] font-bold ${msg.isHost ? 'text-blue-500' : 'text-slate-400'}`}>
                        {msg.isHost && '✦ '}{msg.author?.firstName} {msg.author?.lastName}
                      </span>
                      <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                        msg.isHost ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                      }`}>{msg.content}</div>
                    </div>
                  ))}
                  <div ref={messagesEndRef}/>
                </div>
                <div className="flex items-center gap-2 p-3 border-t border-slate-100 bg-slate-50">
                  <div className="flex-1 relative">
                    <input value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Répondre au chat..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition pr-8"/>
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <Icon d={Icons.smile} size={15}/>
                    </button>
                  </div>
                  <button onClick={sendMessage} disabled={!input.trim()}
                    className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition flex-shrink-0 shadow-sm shadow-blue-200">
                    <Icon d={Icons.send} size={13} className="text-white"/>
                  </button>
                </div>
              </>
            )}

            {sideTab === 'viewers' && (
              <div className="flex-1 overflow-y-auto py-2" style={{ minHeight:300, maxHeight:520 }}>
                {viewerList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-300 py-16">
                    <Icon d={Icons.users} size={32} strokeWidth={1}/>
                    <p className="text-xs">Aucun spectateur pour le moment</p>
                  </div>
                ) : (
                  viewerList.map((v, i) => <ViewerAvatar key={v?.id ?? i} viewer={v}/>)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}