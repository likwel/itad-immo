import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  building:  ['M3 21h18','M5 21V7l7-4 7 4v14','M9 21v-4h6v4'],
  mapPin:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12a3 3 0 100-6 3 3 0 000 6z'],
  heart:     'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  share:     ['M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8','M16 6l-4-4-4 4','M12 2v13'],
  send:      'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  video:     'M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  play:      'M5 3l14 9-14 9V3z',
  pause:     'M6 4h4v16H6zM14 4h4v16h-4z',
  volume:    ['M11 5L6 9H2v6h4l5 4V5z','M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07'],
  fullscreen:'M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3',
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  chevRight: 'M9 18l6-6-6-6',
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  calendar:  ['M3 4h18v18H3z','M16 2v4M8 2v4M3 10h18'],
  arrowLeft: 'M19 12H5M12 5l-7 7 7 7',
  close:     'M18 6L6 18M6 6l12 12',
}

const MOCK_STREAMS = [
  {
    id: 1, live: true, viewers: 247,
    title: 'Visite exclusive — Villa moderne Analamahitsy',
    host: { name: 'Martin Rakoto', agency: 'Prestige Immo', followers: 142, initials: 'MR', color: '#2563eb' },
    properties: [
      { id: 1, active: true,  type: 'Vente',     price: '850 000 000 Ar',    location: 'Analamahitsy',  beds: 5, surface: 320, icon: Icons.home     },
      { id: 2, active: false, type: 'Vente',     price: '480 000 000 Ar',    location: 'Ivandry',       beds: 3, surface: 180, icon: Icons.building  },
      { id: 3, active: false, type: 'Location',  price: '1 200 000 Ar/mois', location: 'Ambohijatovo', beds: 2, surface: 90,  icon: Icons.home     },
    ],
    messages: [
      { id: 1, user: 'Hery_Rabe',     role: 'viewer', text: 'Bonjour depuis Toamasina !' },
      { id: 2, user: 'Vatosoa',       role: 'viewer', text: "C'est possible d'avoir le plan de la villa ?" },
      { id: 3, user: 'Martin Rakoto', role: 'host',   text: 'Oui bien sûr, je vous montre ça dans 2 minutes' },
      { id: 4, user: 'Jean_Luc',      role: 'viewer', text: '❤ ❤ ❤' },
      { id: 5, user: 'Mihaja',        role: 'viewer', text: 'Quelle est la surface du jardin ?' },
      { id: 6, user: 'Ravo',          role: 'viewer', text: 'C\'est magnifique ! Le prix est négociable ?' },
      { id: 7, user: 'Martin Rakoto', role: 'host',   text: '800m² de jardin, piscine incluse ✓' },
      { id: 8, user: 'Tojo2024',      role: 'viewer', text: 'Merci pour cette visite en direct !' },
    ]
  },
]

const UPCOMING_STREAMS = [
  { id: 2, title: 'Appartement 3P Ivandry — visite live',           host: 'Sofia Andriamasy', time: 'Aujourd\'hui 18h00', viewers: 0 },
  { id: 3, title: 'Terrain constructible — 2000m² Ambohidratrimo', host: 'Ony Immo',          time: 'Demain 10h00',     viewers: 0 },
  { id: 4, title: 'Villa vacances Nosy Be — saison 2025',          host: 'Paradise Estates',  time: 'Sam. 15h00',       viewers: 0 },
]

export default function Live() {
  const navigate = useNavigate()
  const stream   = MOCK_STREAMS[0]

  const [messages,    setMessages]    = useState(stream.messages)
  const [input,       setInput]       = useState('')
  const [playing,     setPlaying]     = useState(false)
  const [viewers,     setViewers]     = useState(stream.viewers)
  const [following,   setFollowing]   = useState(false)
  const [activeProperty, setActiveProperty] = useState(stream.properties[0])
  const [liked,       setLiked]       = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(v => v + Math.floor(Math.random() * 3 - 1))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages(m => [...m, { id: Date.now(), user: 'Vous', role: 'me', text: input.trim() }])
    setInput('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-medium mb-5 transition-colors">
          <Icon d={Icons.arrowLeft} size={15}/>
          Retour
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

          {/* ── Colonne principale ── */}
          <div className="flex flex-col gap-5 min-w-0">

            {/* Player */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video w-full">

              {/* Faux player sombre */}
              <div className="w-full h-full flex items-center justify-center flex-col gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <button
                  onClick={() => setPlaying(p => !p)}
                  className="w-16 h-16 rounded-full border-2 border-blue-500 bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                >
                  <Icon d={playing ? Icons.pause : Icons.play} size={26} className="text-blue-400" fill={playing ? 'currentColor' : 'none'}/>
                </button>
                <span className="text-slate-500 text-sm">{stream.title}</span>
              </div>

              {/* Badge LIVE */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
                LIVE
              </div>

              {/* Viewers */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm">
                <Icon d={Icons.eye} size={12}/>
                {viewers}
              </div>

              {/* Controls bar */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-3">
                <button onClick={() => setPlaying(p => !p)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Icon d={playing ? Icons.pause : Icons.play} size={13} className="text-white"/>
                </button>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-blue-500 rounded-full"/>
                </div>
                <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Icon d={Icons.volume} size={13} className="text-white"/>
                </button>
                <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <Icon d={Icons.fullscreen} size={13} className="text-white"/>
                </button>
              </div>
            </div>

            {/* Host bar */}
            <div className="flex items-center gap-3 py-2 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: stream.host.color }}>
                {stream.host.initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">{stream.host.name}</div>
                <div className="text-xs text-slate-500">{stream.host.agency} · {stream.host.followers} abonnés</div>
              </div>
              <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                <button
                  onClick={() => setLiked(l => !l)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    liked ? 'bg-rose-950 border-rose-700 text-rose-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>
                  <Icon d={Icons.heart} size={13} fill={liked ? 'currentColor' : 'none'}/>
                  {liked ? 'Aimé' : 'J\'aime'}
                </button>
                <button
                  onClick={() => setFollowing(f => !f)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    following ? 'bg-slate-700 text-slate-300 border border-slate-600' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                  {following ? 'Suivi ✓' : 'Suivre'}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:border-slate-600 text-xs font-semibold transition-all">
                  <Icon d={Icons.share} size={13}/>
                  Partager
                </button>
              </div>
            </div>

            {/* Biens présentés */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Biens présentés dans ce live
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {stream.properties.map(prop => (
                  <button key={prop.id}
                    onClick={() => setActiveProperty(prop)}
                    className={`flex-shrink-0 w-52 rounded-xl overflow-hidden border text-left transition-all ${
                      activeProperty.id === prop.id
                        ? 'border-blue-500 bg-slate-800'
                        : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                    }`}>
                    <div className="h-24 flex items-center justify-center bg-slate-800 relative">
                      {activeProperty.id === prop.id && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          En cours
                        </div>
                      )}
                      <Icon d={prop.icon} size={32} className="text-slate-600"/>
                    </div>
                    <div className="p-3">
                      <div className={`text-sm font-bold ${activeProperty.id === prop.id ? 'text-blue-400' : 'text-slate-400'}`}>
                        {prop.price}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Icon d={Icons.mapPin} size={10} className="text-slate-600"/>
                        <span className="text-xs text-slate-500 truncate">{prop.location}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                        <span>{prop.beds} ch.</span>
                        <span>{prop.surface} m²</span>
                        <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          prop.type === 'Vente' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-blue-900/60 text-blue-400'
                        }`}>{prop.type}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prochains lives */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Prochains lives
              </h3>
              <div className="flex flex-col gap-2">
                {UPCOMING_STREAMS.map(s => (
                  <div key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Icon d={Icons.video} size={15} className="text-slate-500"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-200 truncate">{s.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.host}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
                      <Icon d={Icons.calendar} size={11}/>
                      {s.time}
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                      <Icon d={Icons.chevRight} size={13} className="text-slate-500"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar chat ── */}
          <div className="flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden" style={{ height: 'fit-content', maxHeight: '80vh', position: 'sticky', top: 80 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Icon d={Icons.users} size={14} className="text-slate-400"/>
                <span className="text-sm font-semibold text-slate-200">Chat live</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"/>
                {viewers} en ligne
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ minHeight: 340, maxHeight: 420 }}>
              {messages.map(msg => (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <span className={`text-xs font-semibold ${
                    msg.role === 'host' ? 'text-blue-400' :
                    msg.role === 'me'   ? 'text-emerald-400' :
                    'text-slate-400'
                  }`}>
                    {msg.role === 'host' && '✦ '}{msg.user}
                  </span>
                  <span className="text-sm text-slate-300 leading-relaxed">{msg.text}</span>
                </div>
              ))}
              <div ref={messagesEndRef}/>
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-slate-800">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Poser une question..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                <Icon d={Icons.send} size={14} className="text-white"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}