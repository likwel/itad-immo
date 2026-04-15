import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams }                    from 'react-router-dom'
import { useLiveHost, getMiroUrl }                   from '../hooks/useLiveRoom'
import { useAuth }                                   from '../hooks/useAuth'

const BASE     = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const getToken = () => localStorage.getItem('immo_token')

const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  eye:    ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12a3 3 0 100-6 3 3 0 000 6z'],
  clock:  ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 6v6l4 2'],
  heart:  'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  chat:   ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
  stop:   'M18 6H6v12h12V6z',
  home:   'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  pinMap: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  cam:    'M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  signal: ['M2 20h.01','M7 20v-4','M12 20v-8','M17 20V8','M22 4v16'],
  warn:   ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01'],
}

const fmtTime = secs => {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  return h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function LiveBroadcast() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [live,        setLive]        = useState(null)
  const [stopping,    setStopping]    = useState(false)
  const [confirmStop, setConfirmStop] = useState(false)
  const [elapsed,     setElapsed]     = useState(0)
  const timerRef = useRef(null)

  const { viewers, messages, reactions, likes, setProperty, endLive } =
    useLiveHost({ liveId: id })

  const miroSrc = id ? getMiroUrl('broadcast', id, user) : null

  useEffect(() => {
    if (!id) return
    fetch(`${BASE}/lives/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(setLive).catch(console.error)
  }, [id])

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Réactions flottantes
  const [floatingReactions, setFloatingReactions] = useState([])
  useEffect(() => {
    if (reactions.length === 0) return
    setFloatingReactions(reactions)
  }, [reactions])

  const handleStop = useCallback(async () => {
    if (!confirmStop) { setConfirmStop(true); return }
    if (stopping) return
    setStopping(true)
    try {
      await endLive()
      navigate(`/live/${id}/history`)
    } catch {
      setStopping(false)
      setConfirmStop(false)
    }
  }, [confirmStop, stopping, endLive, id, navigate])

  // Reset confirm si on clique ailleurs
  useEffect(() => {
    if (!confirmStop) return
    const t = setTimeout(() => setConfirmStop(false), 4000)
    return () => clearTimeout(t)
  }, [confirmStop])

  return (
    <div style={{ minHeight:'100vh', background:'#020617', color:'#f1f5f9', fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── CSS inline pour les animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.85)}}
        @keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-80px) scale(1.3)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4)!important}
        .stat-card{transition:transform .2s,box-shadow .2s}
        .prop-card:hover{transform:translateY(-1px)}
        .prop-card{transition:transform .18s}
        .stop-btn-confirm{animation:pulseBtn .8s infinite}
        @media (max-width: 768px) {
          .hide-mobile {
            display: none;
          }
        }
        @keyframes pulseBtn{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
      `}</style>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'20px 16px' }}>

        {/* ══════════════════ HEADER ══════════════════ */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>

          {/* Gauche : titre + titre live */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d={Icons.cam} size={18} className="" style={{ color:'#f87171' }}/>
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>Tableau de bord</span>
                {/* Badge LIVE */}
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#ef4444', color:'#fff', fontSize:10, fontWeight:800, letterSpacing:'.08em', padding:'3px 10px', borderRadius:20, boxShadow:'0 0 12px rgba(239,68,68,.4)' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#fff', animation:'livePulse 1.5s infinite', display:'inline-block' }}/>
                  EN DIRECT
                </span>
              </div>
              {live && <p style={{ fontSize:12, color:'#475569', marginTop:2, maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{live.title}</p>}
            </div>
          </div>

          {/* Droite : durée */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#0f172a', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'8px 14px' }}>
            <Icon d={Icons.clock} size={14} style={{ color:'#3b82f6' }}/>
            <span style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', fontVariantNumeric:'tabular-nums' }}>{fmtTime(elapsed)}</span>
          </div>
        </div>

        {/* ══════════════════ ZONE PRINCIPALE ══════════════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* ── iframe MiroTalk ── */}
          <div style={{ position:'relative', borderRadius:20, overflow:'hidden', background:'#000', height :'100vh', boxShadow:'0 25px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.06)' }}>
            {miroSrc && (
              <iframe
                src={miroSrc}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                style={{ width:'100%', height:'100%', border:'none', display:'block' }}
                title="Live Broadcast"
              />
            )}

            {/* Réactions flottantes (hors iframe) */}
            <div style={{ position:'absolute', bottom:24, right:16, display:'flex', flexDirection:'column', gap:4, pointerEvents:'none' }}>
              {floatingReactions.map(r => (
                <div key={r.id} style={{ fontSize:24, animation:'floatUp 3s ease-out forwards' }}>
                  {r.type === 'FIRE' ? '🔥' : r.type === 'CLAP' ? '👏' : '❤️'}
                </div>
              ))}
            </div>
          </div>

          {/* ── BARRE DE CONTRÔLE sous le live ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0f172a', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'12px 20px', gap:12 }}>

            {/* Spectateurs en temps réel */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.2)', borderRadius:10, padding:'6px 12px' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', animation:'livePulse 2s infinite', display:'inline-block' }}/>
                <Icon d={Icons.eye} size={13} style={{ color:'#10b981' }}/>
                <span style={{ fontSize:14, fontWeight:700, color:'#10b981' }}>{viewers}</span>
                <span className="hide-mobile" style={{ fontSize:11, color:'#34d399', fontWeight:500 }}>spectateurs</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(59,130,246,.08)', border:'1px solid rgba(59,130,246,.15)', borderRadius:10, padding:'6px 12px' }}>
                <Icon d={Icons.chat} size={13} style={{ color:'#60a5fa' }}/>
                <span style={{ fontSize:14, fontWeight:700, color:'#60a5fa' }}>{messages.length}</span>
                <span className="hide-mobile" style={{ fontSize:11, color:'#93c5fd', fontWeight:500 }}>messages</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(244,63,94,.08)', border:'1px solid rgba(244,63,94,.15)', borderRadius:10, padding:'6px 12px' }}>
                <Icon d={Icons.heart} size={13} style={{ color:'#fb7185' }}/>
                <span style={{ fontSize:14, fontWeight:700, color:'#fb7185' }}>{likes}</span>
                <span className="hide-mobile" style={{ fontSize:11, color:'#fda4af', fontWeight:500 }}>j'aimes</span>
              </div>
            </div>

            {/* Bouton Terminer — centré à droite, confirmation en 2 clics */}
            <button
              onClick={handleStop}
              disabled={stopping}
              className={confirmStop ? 'stop-btn-confirm' : ''}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding: confirmStop ? '10px 22px' : '10px 20px',
                borderRadius:12,
                background: confirmStop ? '#dc2626' : 'rgba(239,68,68,.12)',
                border: `1.5px solid ${confirmStop ? '#ef4444' : 'rgba(239,68,68,.3)'}`,
                color: confirmStop ? '#fff' : '#f87171',
                fontSize:13, fontWeight:700,
                cursor: stopping ? 'not-allowed' : 'pointer',
                opacity: stopping ? .6 : 1,
                transition:'all .2s',
                whiteSpace:'nowrap',
              }}
            >
              {stopping
                ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/> Arrêt…</>
                : confirmStop
                  ? <><Icon d={Icons.warn} size={14} fill="currentColor" strokeWidth={0}/> Confirmer l'arrêt ?</>
                  : <><Icon d={Icons.stop} size={14} fill="currentColor" strokeWidth={0}/> Terminer le live</>
              }
            </button>
          </div>

          {/* ── STATS CARDS ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            {[
              { label:'Spectateurs en direct', value:viewers,         sub:'en ce moment',   icon:Icons.eye,   c1:'#3b82f6', c2:'rgba(59,130,246,.12)',  border:'rgba(59,130,246,.2)',  dot:true  },
              { label:'J\'aimes reçus',        value:likes,           sub:'total du live',  icon:Icons.heart, c1:'#f43f5e', c2:'rgba(244,63,94,.12)',   border:'rgba(244,63,94,.2)'         },
              { label:'Durée du live',         value:fmtTime(elapsed),sub:'en cours',       icon:Icons.clock, c1:'#10b981', c2:'rgba(16,185,129,.12)',  border:'rgba(16,185,129,.2)'        },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ background:'#0f172a', border:`1px solid ${s.border}`, borderRadius:16, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
                {/* Glow bg */}
                <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:s.c2, filter:'blur(20px)', pointerEvents:'none' }}/>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'.06em' }}>{s.label}</span>
                  <div style={{ width:32, height:32, borderRadius:9, background:s.c2, border:`1px solid ${s.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon d={s.icon} size={15} style={{ color:s.c1 }}/>
                  </div>
                </div>
                <div style={{ fontSize:28, fontWeight:800, color:s.c1, lineHeight:1, marginBottom:4 }}>{s.value}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#475569' }}>
                  {s.dot && <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', animation:'livePulse 2s infinite', display:'inline-block' }}/>}
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── BIENS PRÉSENTÉS ── */}
          {live?.properties?.length > 0 && (
            <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <Icon d={Icons.home} size={14} style={{ color:'#475569' }}/>
                <span style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'.07em' }}>Biens présentés</span>
                <span style={{ fontSize:11, fontWeight:600, color:'#3b82f6', background:'rgba(59,130,246,.1)', border:'1px solid rgba(59,130,246,.2)', padding:'1px 8px', borderRadius:20 }}>
                  {live.properties.length}
                </span>
              </div>
              <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none' }}>
                {live.properties.map(lp => (
                  <button key={lp.id} className="prop-card"
                    onClick={() => setProperty(lp.property.id)}
                    style={{
                      flexShrink:0, width:180, borderRadius:14, overflow:'hidden',
                      border: lp.isActive ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,.08)',
                      background: lp.isActive ? 'rgba(59,130,246,.08)' : '#1e293b',
                      cursor:'pointer', textAlign:'left',
                      boxShadow: lp.isActive ? '0 0 20px rgba(59,130,246,.2)' : 'none',
                    }}>
                    <div style={{ height:90, background:'#0f172a', position:'relative', overflow:'hidden' }}>
                      {lp.property.images?.[0]
                        ? <img src={lp.property.images[0]} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/>
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Icon d={Icons.home} size={28} style={{ color:'#1e293b' }}/>
                          </div>
                      }
                      {lp.isActive && (
                        <div style={{ position:'absolute', top:8, left:8, background:'#3b82f6', color:'#fff', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:'#fff', animation:'livePulse 1s infinite', display:'inline-block' }}/>
                          EN COURS
                        </div>
                      )}
                    </div>
                    <div style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:12, fontWeight:700, color: lp.isActive ? '#60a5fa' : '#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {lp.property.title}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                        <Icon d={Icons.pinMap} size={9} style={{ color:'#475569', flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lp.property.city}</span>
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
  )
}