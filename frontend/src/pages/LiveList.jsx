import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE     = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const getToken = () => localStorage.getItem('immo_token')
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
})

const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  video:  'M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  eye:    ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12a3 3 0 100-6 3 3 0 000 6z'],
  clock:  ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 6v6l4 2'],
  home:   'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  bell:   ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 01-3.46 0'],
  search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  check:  'M20 6L9 17l-5-5',
}

// ── Helpers pour transformer les données API ─────────────────

const LISTING_LABELS  = { SALE:'Vente', RENT:'Location', VACATION_RENT:'Vacances' }
const PROPERTY_LABELS = { VILLA:'Villa', APARTMENT:'Appartement', HOUSE:'Maison', LAND:'Terrain', OFFICE:'Bureau', WAREHOUSE:'Entrepôt' }
const AVATAR_PALETTE  = ['#2563eb','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#6366f1']
const colorFor = str  => AVATAR_PALETTE[(str?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]

// Extrait les tags d'un live (depuis ses biens liés)
const tagsFrom = live => {
  const props = live.properties ?? []
  const types = [...new Set(props.map(p => PROPERTY_LABELS[p.property?.propertyType]).filter(Boolean))]
  const listings = [...new Set(props.map(p => LISTING_LABELS[p.property?.listingType]).filter(Boolean))]
  return [...types.slice(0,1), ...listings.slice(0,1)]
}

const fmtDuration = secs => {
  if (!secs) return null
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

const fmtRelative = dateStr => {
  if (!dateStr) return ''
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  if (d === 0) return 'Hier'
  if (d < 7)  return `Il y a ${d} jours`
  if (d < 14) return 'Il y a 1 sem.'
  return `Il y a ${Math.floor(d/7)} sem.`
}

const fmtScheduled = dateStr => {
  if (!dateStr) return ''
  const d = new Date(dateStr), now = new Date()
  const isToday    = d.toDateString() === now.toDateString()
  const isTomorrow = d.toDateString() === new Date(now.getTime()+86400000).toDateString()
  const time = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
  if (isToday)    return `Aujourd'hui · ${time}`
  if (isTomorrow) return `Demain · ${time}`
  return `${d.toLocaleDateString('fr-FR', { weekday:'short' })} · ${time}`
}

// Adapte un live API → shape attendue par les composants existants
const adaptLive = live => ({
  id:         live.id,
  viewers:    live.totalViews ?? 0,
  views:      live.totalViews ?? 0,
  duration:   fmtDuration(live.duration),
  daysAgo:    fmtRelative(live.endedAt),
  scheduledAt:fmtScheduled(live.scheduledAt),
  title:      live.title,
  properties: (live.properties ?? []).length,
  tags:       tagsFrom(live),
  host: {
    name:     `${live.host?.firstName ?? ''} ${live.host?.lastName ?? ''}`.trim(),
    agency:   live.host?.agency?.name ?? '',
    initials: `${live.host?.firstName?.[0] ?? ''}${live.host?.lastName?.[0] ?? ''}`,
    color:    live.host?.avatar ? colorFor(live.host.firstName) : colorFor(live.host?.firstName),
    verified: live.host?.isVerified ?? false,
    avatar:   live.host?.avatar ?? null,
  },
})

// ── Mêmes composants visuels qu'avant ────────────────────────

const TAG_COLORS = {
  'Vente':       { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe' },
  'Location':    { bg:'#f0fdf4', text:'#15803d', border:'#bbf7d0' },
  'Vacances':    { bg:'#fffbeb', text:'#b45309', border:'#fde68a' },
  'Terrain':     { bg:'#f0fdf4', text:'#065f46', border:'#6ee7b7' },
  'Bureau':      { bg:'#f5f3ff', text:'#6d28d9', border:'#ddd6fe' },
  'Villa':       { bg:'#faf5ff', text:'#7c3aed', border:'#e9d5ff' },
  'Appartement': { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe' },
  'Maison':      { bg:'#fff7ed', text:'#c2410c', border:'#fed7aa' },
  'Studio':      { bg:'#fdf4ff', text:'#a21caf', border:'#f0abfc' },
}

function Tag({ label }) {
  const c = TAG_COLORS[label] || { bg:'#f8fafc', text:'#475569', border:'#e2e8f0' }
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6, background:c.bg, color:c.text, border:`1px solid ${c.border}`, letterSpacing:'0.01em' }}>
      {label}
    </span>
  )
}

function Avatar({ host, size = 40 }) {
  if (host.avatar) return (
    <img src={host.avatar} alt={host.initials}
      style={{ width:size, height:size, borderRadius:Math.round(size*0.28), objectFit:'cover', flexShrink:0 }}/>
  )
  return (
    <div style={{
      width:size, height:size, borderRadius:Math.round(size*0.28),
      background:`${host.color}15`, border:`1.5px solid ${host.color}30`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:Math.round(size*0.3), fontWeight:700, color:host.color,
      flexShrink:0, position:'relative', letterSpacing:'-0.02em',
    }}>
      {host.initials}
      {host.verified && (
        <div style={{ position:'absolute', bottom:-2, right:-2, width:13, height:13, borderRadius:'50%', background:'#2563eb', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
      )}
    </div>
  )
}

function LiveCard({ stream, featured, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ borderRadius:16, overflow:'hidden', cursor:'pointer', border:`1px solid ${hovered ? '#cbd5e1' : '#e2e8f0'}`, background:'#fff', transform:hovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow:hovered ? '0 12px 40px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.04)', transition:'all .2s ease' }}>
      <div style={{ height:featured ? 210 : 195, position:'relative', background:`linear-gradient(135deg, ${stream.host.color}10, ${stream.host.color}04)`, display:'flex', alignItems:'center', justifyContent:'center', borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.35, backgroundImage:'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize:'20px 20px' }}/>
        <div style={{ width:52, height:52, borderRadius:'50%', background:stream.host.color, border:'3px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 8px 24px ${stream.host.color}45`, position:'relative', zIndex:1, transform:hovered ? 'scale(1.08)' : 'scale(1)', transition:'transform .2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M5 3l14 9-14 9V3z"/></svg>
        </div>
        <div style={{ position:'absolute', top:12, left:12, display:'flex', alignItems:'center', gap:5, background:'#ef4444', color:'#fff', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:8, letterSpacing:'0.07em', boxShadow:'0 2px 8px rgba(239,68,68,0.35)' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#fff', animation:'livePulse 1.5s infinite' }}/>
          LIVE
        </div>
        <div style={{ position:'absolute', top:12, right:12, display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.92)', color:'#475569', fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:8, border:'1px solid #e2e8f0' }}>
          <Icon d={Icons.eye} size={12}/>{stream.viewers}
        </div>
        {stream.duration && (
          <div style={{ position:'absolute', bottom:10, right:12, background:'rgba(255,255,255,0.88)', color:'#64748b', fontSize:11, padding:'2px 8px', borderRadius:6, border:'1px solid #e2e8f0' }}>
            {stream.duration}
          </div>
        )}
      </div>
      <div style={{ padding:'14px 16px 16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <Avatar host={stream.host} size={34}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:featured ? 15 : 13, fontWeight:600, color:'#0f172a', lineHeight:1.4, margin:'0 0 2px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {stream.title}
            </p>
            <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>{stream.host.agency || stream.host.name}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:12, flexWrap:'wrap' }}>
          {stream.tags.map(t => <Tag key={t} label={t}/>)}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:3, color:'#94a3b8', fontSize:11 }}>
            <Icon d={Icons.home} size={11}/>{stream.properties} bien{stream.properties > 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

function UpcomingCard({ stream, notified, onToggle }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:14, border:`1px solid ${hovered ? '#cbd5e1' : '#e2e8f0'}`, background:'#fff', transition:'all .18s', boxShadow:hovered ? '0 4px 20px rgba(0,0,0,0.07)' : 'none' }}>
      <Avatar host={stream.host} size={40}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:600, color:'#0f172a', margin:'0 0 5px', lineHeight:1.3 }}>{stream.title}</p>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>
            <Icon d={Icons.clock} size={11}/>{stream.scheduledAt}
          </span>
          <div style={{ display:'flex', gap:5 }}>{stream.tags.map(t => <Tag key={t} label={t}/>)}</div>
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onToggle() }} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:600, border:notified ? '1.5px solid #bfdbfe' : '1.5px solid #e2e8f0', background:notified ? '#eff6ff' : '#f8fafc', color:notified ? '#2563eb' : '#64748b', cursor:'pointer', transition:'all .15s' }}>
        <Icon d={notified ? Icons.check : Icons.bell} size={13}/>
        {notified ? 'Notifié' : 'Me notifier'}
      </button>
    </div>
  )
}

function PastCard({ stream, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display:'flex', gap:14, padding:'12px 16px', borderRadius:14, border:`1px solid ${hovered ? '#cbd5e1' : '#e2e8f0'}`, background:'#fff', cursor:'pointer', transition:'all .18s', transform:hovered ? 'translateY(-2px)' : 'translateY(0)', boxShadow:hovered ? '0 6px 20px rgba(0,0,0,0.07)' : 'none' }}>
      <div style={{ width:110, height:72, borderRadius:10, flexShrink:0, background:`linear-gradient(135deg, ${stream.host.color}12, ${stream.host.color}05)`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', border:'1px solid #f1f5f9', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.3, backgroundImage:'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize:'14px 14px' }}/>
        <div style={{ width:30, height:30, borderRadius:'50%', background:`${stream.host.color}20`, border:`1.5px solid ${stream.host.color}40`, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill={stream.host.color}><path d="M5 3l14 9-14 9V3z"/></svg>
        </div>
        {stream.duration && (
          <div style={{ position:'absolute', bottom:5, left:6, background:'rgba(255,255,255,0.9)', color:'#64748b', fontSize:10, fontWeight:500, padding:'1px 6px', borderRadius:5, border:'1px solid #e2e8f0' }}>
            {stream.duration}
          </div>
        )}
      </div>
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontSize:14, fontWeight:600, color:'#0f172a', lineHeight:1.35, margin:'0 0 5px' }}>{stream.title}</p>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Avatar host={stream.host} size={18}/>
            <span style={{ fontSize:12, color:'#94a3b8' }}>{stream.host.name}</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
          <span style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:3 }}>
            <Icon d={Icons.eye} size={11}/>{(stream.views ?? 0).toLocaleString('fr')} vues
          </span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'#e2e8f0' }}/>
          <span style={{ fontSize:11, color:'#94a3b8' }}>{stream.daysAgo}</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:5 }}>
            {stream.tags.slice(0,2).map(t => <Tag key={t} label={t}/>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ accent, label, count, countColor='#64748b', countBg='#f1f5f9', countBorder='#e2e8f0' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
      <div style={{ width:3, height:20, borderRadius:2, background:accent }}/>
      <h2 style={{ fontSize:16, fontWeight:700, color:'#0f172a', letterSpacing:'-0.01em', margin:0 }}>{label}</h2>
      <span style={{ fontSize:12, fontWeight:600, color:countColor, background:countBg, border:`1px solid ${countBorder}`, padding:'2px 9px', borderRadius:20 }}>{count}</span>
    </div>
  )
}

const FILTER_TAGS = ['Tous','Vente','Location','Vacances','Terrain','Bureau']

export default function LiveList() {
  const navigate = useNavigate()
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('Tous')
  const [notifs,   setNotifs]   = useState({})
  const [lives,    setLives]    = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [past,     setPast]     = useState([])
  const [loading,  setLoading]  = useState(true)

  const toggleNotif = id => setNotifs(n => ({ ...n, [id]: !n[id] }))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${BASE}/lives?status=LIVE&limit=10`,      { headers: authHeaders() }).then(r => r.json()),
      fetch(`${BASE}/lives?status=SCHEDULED&limit=10`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${BASE}/lives?status=ENDED&limit=12`,     { headers: authHeaders() }).then(r => r.json()),
    ])
      .then(([l, u, p]) => {
        setLives((l.data   ?? []).map(adaptLive))
        setUpcoming((u.data ?? []).map(adaptLive))
        setPast((p.data    ?? []).map(adaptLive))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const match = list => list.filter(s => {
    const q   = search.toLowerCase()
    const ok1 = !q || s.title.toLowerCase().includes(q) || s.host.name.toLowerCase().includes(q) || s.host.agency.toLowerCase().includes(q)
    const ok2 = filter === 'Tous' || s.tags.includes(filter)
    return ok1 && ok2
  })

  const filteredLives    = match(lives)
  const filteredUpcoming = match(upcoming)
  const filteredPast     = match(past)

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .lu-item { animation: fadeUp .3s ease both }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'20px 24px 28px' }}>
        <div style={{ margin:'0 auto' }} className='max-w-7xl mx-auto px-4 py-8'>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#fef2f2', border:'1px solid #fecaca', padding:'4px 12px', borderRadius:20 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#ef4444', animation:'livePulse 1.5s infinite' }}/>
              <span style={{ fontSize:12, fontWeight:700, color:'#dc2626', letterSpacing:'0.06em' }}>
                {loading ? '...' : `${filteredLives.length} LIVE EN COURS`}
              </span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:24, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:240 }}>
              <h1 style={{ fontSize:30, fontWeight:700, color:'#0f172a', letterSpacing:'-0.03em', lineHeight:1.2, margin:0 }}>
                Visites immobilières<span style={{ color:'#2563eb' }}> en direct</span>
              </h1>
              <p style={{ fontSize:14, color:'#64748b', marginTop:6, fontWeight:400 }}>
                Découvrez des biens en temps réel avec nos agences partenaires
              </p>
            </div>
            <div style={{ position:'relative', width:280 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Agence, ville, type..."
                style={{ width:'100%', paddingLeft:36, paddingRight:14, paddingTop:10, paddingBottom:10, borderRadius:12, border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:13, color:'#334155', outline:'none', boxSizing:'border-box', transition:'all .15s' }}
                onFocus={e => { e.target.style.borderColor='#93c5fd'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.08)'; e.target.style.background='#fff' }}
                onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='#f8fafc' }}
              />
            </div>
          </div>
          <div style={{ display:'flex', gap:6, marginTop:22, flexWrap:'wrap' }}>
            {FILTER_TAGS.map(tag => {
              const active = filter === tag
              return (
                <button key={tag} onClick={() => setFilter(tag)} style={{ padding:'7px 16px', borderRadius:10, fontSize:13, fontWeight:600, border:active ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0', background:active ? '#2563eb' : '#fff', color:active ? '#fff' : '#475569', cursor:'pointer', transition:'all .15s' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor='#93c5fd'; e.currentTarget.style.color='#2563eb' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#475569' } }}>
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ margin:'0 auto', padding:'36px 24px 60px' }} className='max-w-7xl mx-auto px-4 py-8'>

        {loading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#2563eb', animation:'spin .7s linear infinite' }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && (
          <>
            {filteredLives.length > 0 && (
              <section style={{ marginBottom:48 }}>
                <SectionTitle accent="#ef4444" label="En direct maintenant" count={filteredLives.length} countColor="#ef4444" countBg="#fef2f2" countBorder="#fecaca"/>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
                  {filteredLives.map((stream, i) => (
                    <div key={stream.id} className="lu-item" style={{ animationDelay:`${i*0.06}s`, gridColumn:i === 0 && filteredLives.length > 1 ? 'span 2' : 'span 1' }}>
                      <LiveCard stream={stream} featured={i === 0 && filteredLives.length > 1} onClick={() => navigate(`/live/${stream.id}`)}/>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {filteredUpcoming.length > 0 && (
              <section style={{ marginBottom:48 }}>
                <SectionTitle accent="#2563eb" label="Prochains lives" count={`${filteredUpcoming.length} programmés`} countColor="#2563eb" countBg="#eff6ff" countBorder="#bfdbfe"/>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {filteredUpcoming.map((stream, i) => (
                    <div key={stream.id} className="lu-item" style={{ animationDelay:`${i*0.06}s` }}>
                      <UpcomingCard stream={stream} notified={!!notifs[stream.id]} onToggle={() => toggleNotif(stream.id)}/>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {filteredPast.length > 0 && (
              <section>
                <SectionTitle accent="#94a3b8" label="Replays disponibles" count={`${filteredPast.length} vidéos`}/>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(420px, 1fr))', gap:10 }}>
                  {filteredPast.map((stream, i) => (
                    <div key={stream.id} className="lu-item" style={{ animationDelay:`${i*0.04}s` }}>
                      <PastCard stream={stream} onClick={() => navigate(`/live/${stream.id}`)}/>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!filteredLives.length && !filteredUpcoming.length && !filteredPast.length && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:12 }}>
                <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d={Icons.video} size={24}/>
                </div>
                <p style={{ fontSize:15, fontWeight:600, color:'#334155', margin:0 }}>Aucun live trouvé</p>
                <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>Essayez un autre filtre ou terme de recherche</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}