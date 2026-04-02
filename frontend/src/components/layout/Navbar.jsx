import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// ── Icônes SVG inline ─────────────────────────────────────────
const Icon = ({ d, size = 20, stroke = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  home:     'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  tag:      'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
  key:      ['M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4'],
  sun:      'M12 17a5 5 0 100-10 5 5 0 000 10z M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  user:     'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  logOut:   'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  chevron:  'M6 9l6 6 6-6',
  menu:     'M3 12h18M3 6h18M3 18h18',
  x:        'M18 6L6 18M6 6l12 12',
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  heart:    'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  building: ['M3 21h18','M5 21V7l7-4 7 4v14','M9 21v-4h6v4'],
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
}

const roleLinks = {
  CLIENT: { label: 'Mon espace',     to: '/espace-client',  icon: Icons.user,     bg: '#eff6ff', iconColor: '#2563eb' },
  SELLER: { label: 'Mes annonces',   to: '/espace-vendeur', icon: Icons.building, bg: '#f0fdf4', iconColor: '#16a34a' },
  AGENCY: { label: 'Mon agence',     to: '/espace-vendeur', icon: Icons.building, bg: '#f0fdf4', iconColor: '#16a34a' },
  ADMIN:  { label: 'Administration', to: '/admin',          icon: Icons.shield,   bg: '#faf5ff', iconColor: '#9333ea' },
}

const navLinks = [
  { label: 'Annonces', to: '/annonces',                          icon: Icons.search },
  { label: 'Vente',    to: '/annonces?listingType=SALE',         icon: Icons.tag    },
  { label: 'Location', to: '/annonces?listingType=RENT',         icon: Icons.key    },
  { label: 'Vacances', to: '/annonces?listingType=VACATION_RENT',icon: Icons.sun    },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropOpen,   setDropOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setDropOpen(false)
    navigate('/')
  }

  const rl = user ? roleLinks[user.role] : null

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      <nav style={{ background:'#fff', borderBottom:'1px solid #f1f5f9', position:'sticky',
        top:0, zIndex:40, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', height:64,
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
            <div style={{ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src="/itadimmo.png" alt="itadimmo" style={{ width:36, height:36, objectFit:'contain' }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}/>
              <div style={{ display:'none', width:34, height:34, background:'linear-gradient(135deg,#2563eb,#1d4ed8)',
                borderRadius:10, alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(37,99,235,0.35)' }}>
                <Icon d={Icons.home} size={18} stroke="#fff"/>
              </div>
            </div>
            <span style={{ fontWeight:800, fontSize:20, color:'#1e293b', letterSpacing:'-0.3px' }}>
              itad<span style={{ color:'#2563eb' }}>immo</span>
            </span>
          </Link>

          {/* ── Nav links desktop ── */}
          <div style={{ display:'flex', alignItems:'center', gap:4, flex:1, justifyContent:'center' }}
            className="desktop-nav">
            {navLinks.map(({ label, to, icon }) => (
              <Link key={label} to={to}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:10,
                  textDecoration:'none', fontSize:13, fontWeight:500, color:'#475569', transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.color='#2563eb' }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#475569' }}>
                <Icon d={icon} size={15}/>
                {label}
              </Link>
            ))}
          </div>

          {/* ── Right side ── */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>

            {user ? (
              /* ── Connecté ── */
              <div style={{ position:'relative' }}>
                <button onClick={() => setDropOpen(v => !v)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px 5px 5px',
                    borderRadius:12, border:'1px solid #e2e8f0', background:'#fff',
                    cursor:'pointer', transition:'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#bfdbfe'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>

                  {/* Avatar */}
                  {user.avatar
                    ? <img src={user.avatar} alt="" style={{ width:32, height:32, borderRadius:10, objectFit:'cover' }}/>
                    : <div style={{ width:32, height:32, borderRadius:10,
                        background:'linear-gradient(135deg,#3b82f6,#2563eb)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'#fff', fontWeight:700, fontSize:13 }}>
                        {user.firstName?.[0]?.toUpperCase()}
                      </div>
                  }

                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#1e293b', lineHeight:1.2 }}>
                      {user.firstName}
                    </div>
                    <div style={{ fontSize:10, color:'#94a3b8', lineHeight:1.2 }}>{user.role}</div>
                  </div>

                  <Icon d={Icons.chevron} size={14} stroke="#94a3b8"
                    style={{ transition:'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}/>
                </button>

                {/* Dropdown */}
                {dropOpen && (
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:220,
                    background:'#fff', border:'1px solid #f1f5f9', borderRadius:16,
                    boxShadow:'0 8px 24px rgba(0,0,0,0.1)', padding:'8px', zIndex:100 }}>

                    {/* En-tête */}
                    <div style={{ padding:'10px 12px 12px', borderBottom:'1px solid #f1f5f9', marginBottom:6 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{user.email}</div>
                    </div>

                    {/* Lien espace selon rôle */}
                    {rl && (
                      <Link to={rl.to} onClick={() => setDropOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                          borderRadius:10, textDecoration:'none', color:'#334155',
                          fontSize:13, fontWeight:500, transition:'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div style={{ width:30, height:30, borderRadius:8, background: rl.bg,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Icon d={rl.icon} size={15} stroke={rl.iconColor}/>
                        </div>
                        {rl.label}
                      </Link>
                    )}

                    {/* Favoris */}
                    <Link to="/favoris" onClick={() => setDropOpen(false)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                        borderRadius:10, textDecoration:'none', color:'#334155',
                        fontSize:13, fontWeight:500, transition:'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <div style={{ width:30, height:30, borderRadius:8, background:'#fdf2f8',
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon d={Icons.heart} size={15} stroke="#db2777"/>
                      </div>
                      Mes favoris
                    </Link>

                    {/* Déconnexion */}
                    <div style={{ borderTop:'1px solid #f1f5f9', marginTop:6, paddingTop:6 }}>
                      <button onClick={handleLogout}
                        style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                          padding:'9px 12px', borderRadius:10, border:'none',
                          background:'transparent', cursor:'pointer', color:'#ef4444',
                          fontSize:13, fontWeight:500, transition:'background .15s', textAlign:'left' }}
                        onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <div style={{ width:30, height:30, borderRadius:8, background:'#fef2f2',
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Icon d={Icons.logOut} size={15} stroke="#ef4444"/>
                        </div>
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Non connecté ── */
              <>
                <Link to="/login"
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                    borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:500,
                    color:'#475569', border:'1px solid #e2e8f0', transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#bfdbfe'; e.currentTarget.style.color='#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#475569' }}>
                  <Icon d={Icons.user} size={15}/>
                  Connexion
                </Link>
                <Link to="/register"
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px',
                    borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:600,
                    color:'#fff', background:'linear-gradient(135deg,#2563eb,#1d4ed8)',
                    boxShadow:'0 2px 6px rgba(37,99,235,0.3)', transition:'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(37,99,235,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 6px rgba(37,99,235,0.3)'}>
                  Inscription
                </Link>
              </>
            )}

            {/* Burger mobile */}
            <button onClick={() => setMobileOpen(v => !v)}
              style={{ display:'none', padding:8, borderRadius:10, border:'1px solid #e2e8f0',
                background:'#fff', cursor:'pointer', alignItems:'center', justifyContent:'center' }}
              className="mobile-burger">
              <Icon d={mobileOpen ? Icons.x : Icons.menu} size={18} stroke="#475569"/>
            </button>
          </div>
        </div>

        {/* ── Menu mobile ── */}
        {mobileOpen && (
          <div style={{ borderTop:'1px solid #f1f5f9', padding:'12px 16px 16px', background:'#fff' }}>
            {navLinks.map(({ label, to, icon }) => (
              <Link key={label} to={to} onClick={() => setMobileOpen(false)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  borderRadius:10, textDecoration:'none', color:'#334155',
                  fontSize:14, fontWeight:500, marginBottom:2 }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <Icon d={icon} size={17} stroke="#64748b"/>
                {label}
              </Link>
            ))}
            {/* Connexion dans mobile si non connecté */}
            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  borderRadius:10, textDecoration:'none', color:'#334155',
                  fontSize:14, fontWeight:500, marginTop:4,
                  borderTop:'1px solid #f1f5f9', paddingTop:12 }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <Icon d={Icons.user} size={17} stroke="#64748b"/>
                Connexion
              </Link>
            )}
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav  { display: none !important; }
          .mobile-burger { display: flex !important; }
        }
      `}</style>

      {dropOpen && (
        <div onClick={() => setDropOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:39 }}/>
      )}
    </div>
  )
}