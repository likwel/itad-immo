import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const Icon = ({ d, size = 20, stroke = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  home:     'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  agency:   ['M3 21h18','M5 21V7l7-4 7 4v14','M9 21v-4h6v4'],
  user:     'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  logOut:   'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  chevron:  'M6 9l6 6 6-6',
  menu:     'M3 12h18M3 6h18M3 18h18',
  x:        'M18 6L6 18M6 6l12 12',
  heart:    'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  building: ['M3 21h18','M5 21V7l7-4 7 4v14','M9 21v-4h6v4'],
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  grid:     ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
}

const roleLinks = {
  CLIENT: { label: 'Mon espace',     to: '/espace-client',  icon: Icons.user,     bg: '#eff6ff', iconColor: '#2563eb' },
  SELLER: { label: 'Mes annonces',   to: '/espace-vendeur', icon: Icons.building, bg: '#f0fdf4', iconColor: '#16a34a' },
  AGENCY: { label: 'Mon agence',     to: '/espace-vendeur', icon: Icons.building, bg: '#f0fdf4', iconColor: '#16a34a' },
  ADMIN:  { label: 'Administration', to: '/admin',          icon: Icons.shield,   bg: '#faf5ff', iconColor: '#9333ea' },
}

const navLinks = [
  { label: 'Annonces', to: '/annonces' },
  { label: 'Agences',  to: '/agences'  },
  { label: 'Live',     to: '/live', icon: 'M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', pro: true },
  { label: 'Communauté', to: '/communaute' }
]

export const NAVBAR_HEIGHT = 64

// ── NavLink avec état actif ───────────────────────────────────
function NavLink({ to, label, active, icon, pro }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px',
      borderRadius: 10, textDecoration: 'none', fontSize: 13,
      fontWeight: active ? 600 : 500,
      color: active ? '#2563eb' : '#64748b',
      background: active ? '#eff6ff' : 'transparent',
      border: active ? '1px solid #bfdbfe' : '1px solid transparent',
      transition: 'all .15s',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.background = '#f8fafc' } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent' } }}>
      {icon && (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon}/>
        </svg>
      )}
      {label}
      {pro && (
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
          color: '#9333ea', background: '#faf5ff',
          border: '1px solid #e9d5ff', borderRadius: 5,
          padding: '1px 5px', lineHeight: 1.6,
        }}>
          PRO
        </span>
      )}
    </Link>
  )
}

// ── DropItem ──────────────────────────────────────────────────
function DropItem({ to, icon, iconBg, iconColor, label, onClick }) {
  return (
    <Link to={to} onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
        borderRadius:10, textDecoration:'none', color:'#334155',
        fontSize:13, fontWeight:500, transition:'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width:30, height:30, borderRadius:8, background: iconBg,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon d={icon} size={15} stroke={iconColor}/>
      </div>
      {label}
    </Link>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [dropOpen,   setDropOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); setDropOpen(false); navigate('/') }
  const rl = user ? roleLinks[user.role] : null

  const isActive = (to) => location.pathname === to.split('?')[0] && (
    to.includes('?') ? location.search === '?' + to.split('?')[1] : true
  )
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: NAVBAR_HEIGHT, background: '#fff',
        borderBottom: '1px solid #f1f5f9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div className="max-w-7xl mx-auto" style={{
          padding: '0 20px', height: '100%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
        }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
            <img src="/itadplus.png" alt="itadplus logo" style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block' }} />
          </Link>

          {/* ── Nav links desktop ── */}
          <div style={{ display:'flex', alignItems:'center', gap:2, flex:1, paddingLeft:24 }}
            className="immo-desktop-nav">
            {navLinks.map(({ label, to, icon, pro }) => (
              <NavLink key={to} to={to} label={label} active={isActive(to)} icon={icon} pro={pro}/>
            ))}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" label="Admin" active={isAdmin}/>
            )}
          </div>

          {/* ── Right ── */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {user ? (
              <>
                {/* Favoris icône rapide */}
                <Link to="/favoris"
                  title="Mes favoris"
                  style={{ width:36, height:36, borderRadius:10, border:'1px solid #e2e8f0',
                    background: location.pathname === '/favoris' ? '#fdf2f8' : '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    textDecoration:'none', transition:'all .15s', cursor:'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#fbcfe8'; e.currentTarget.style.background='#fdf2f8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background = location.pathname === '/favoris' ? '#fdf2f8' : '#fff' }}>
                  <Icon d={Icons.heart} size={16}
                    stroke={location.pathname === '/favoris' ? '#db2777' : '#94a3b8'}/>
                </Link>

                {/* Avatar dropdown */}
                <div style={{ position:'relative' }}>
                  <button onClick={() => setDropOpen(v => !v)}
                    style={{ display:'flex', alignItems:'center', gap:8,
                      padding:'5px 10px 5px 5px', borderRadius:12,
                      border: dropOpen ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                      background: dropOpen ? '#eff6ff' : '#fff',
                      cursor:'pointer', transition:'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#bfdbfe' }}
                    onMouseLeave={e => { if (!dropOpen) e.currentTarget.style.borderColor='#e2e8f0' }}>
                    {user.avatar
                      ? <img src={user.avatar} alt="" style={{ width:30, height:30, borderRadius:9, objectFit:'cover' }}/>
                      : <div style={{ width:30, height:30, borderRadius:9,
                          background:'linear-gradient(135deg,#3b82f6,#2563eb)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#fff', fontWeight:700, fontSize:12 }}>
                          {user.firstName?.[0]?.toUpperCase()}
                        </div>
                    }
                    <div style={{ textAlign:'left' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#1e293b', lineHeight:1.3 }}>{user.firstName}</div>
                      <div style={{ fontSize:10, color:'#94a3b8', lineHeight:1.3, textTransform:'capitalize' }}>
                        {user.role?.toLowerCase()}
                      </div>
                    </div>
                    <Icon d={Icons.chevron} size={13} stroke="#94a3b8"
                      style={{ transition:'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)' }}/>
                  </button>

                  {/* Dropdown */}
                  {dropOpen && (
                    <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:224,
                      background:'#fff', border:'1px solid #f1f5f9', borderRadius:16,
                      boxShadow:'0 12px 32px rgba(0,0,0,0.10)', padding:'8px', zIndex:100 }}>

                      {/* Header */}
                      <div style={{ padding:'10px 12px 12px', borderBottom:'1px solid #f1f5f9', marginBottom:4 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{user.firstName} {user.lastName}</div>
                        <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{user.email}</div>
                      </div>

                      {rl && (
                        <DropItem to={rl.to} icon={rl.icon} iconBg={rl.bg} iconColor={rl.iconColor}
                          label={rl.label} onClick={() => setDropOpen(false)}/>
                      )}

                      <DropItem to="/favoris" icon={Icons.heart} iconBg="#fdf2f8" iconColor="#db2777"
                        label="Mes favoris" onClick={() => setDropOpen(false)}/>

                      {/* Déconnexion */}
                      <div style={{ borderTop:'1px solid #f1f5f9', marginTop:4, paddingTop:4 }}>
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
              </>
            ) : (
              <>
                <Link to="/login"
                  style={{ padding:'7px 14px', borderRadius:10, textDecoration:'none',
                    fontSize:13, fontWeight:500, color:'#475569',
                    border:'1px solid #e2e8f0', transition:'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#bfdbfe'; e.currentTarget.style.color='#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#475569' }}>
                  Connexion
                </Link>
                <Link to="/register"
                  style={{ padding:'7px 16px', borderRadius:10, textDecoration:'none',
                    fontSize:13, fontWeight:600, color:'#fff',
                    background:'linear-gradient(135deg,#2563eb,#1d4ed8)',
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
              className="immo-mobile-burger">
              <Icon d={mobileOpen ? Icons.x : Icons.menu} size={18} stroke="#475569"/>
            </button>
          </div>
        </div>

        {/* ── Menu mobile ── */}
        {mobileOpen && (
          <div style={{ borderTop:'1px solid #f1f5f9', padding:'10px 16px 16px',
            background:'#fff', boxShadow:'0 8px 16px rgba(0,0,0,0.07)' }}>
            {navLinks.map(({ label, to, icon, pro }) => {
              const active = isActive(to)
              return (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                    borderRadius:10, textDecoration:'none', marginBottom:2,
                    color: active ? '#2563eb' : '#334155',
                    background: active ? '#eff6ff' : 'transparent',
                    border: active ? '1px solid #bfdbfe' : '1px solid transparent',
                    fontSize:14, fontWeight: active ? 600 : 500 }}>
                  <Icon d={Icons.search} size={16} stroke={active ? '#2563eb' : '#64748b'}/>
                  {label}
                </Link>
              )
            })}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  borderRadius:10, textDecoration:'none', marginBottom:2,
                  color: isAdmin ? '#9333ea' : '#334155',
                  background: isAdmin ? '#faf5ff' : 'transparent',
                  border: isAdmin ? '1px solid #e9d5ff' : '1px solid transparent',
                  fontSize:14, fontWeight: isAdmin ? 600 : 500 }}>
                <Icon d={Icons.grid} size={16} stroke={isAdmin ? '#9333ea' : '#64748b'}/>
                Admin
              </Link>
            )}
            {!user && (
              <div style={{ borderTop:'1px solid #f1f5f9', marginTop:6, paddingTop:10, display:'flex', gap:8 }}>
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  style={{ flex:1, textAlign:'center', padding:'9px', borderRadius:10,
                    textDecoration:'none', color:'#475569', border:'1px solid #e2e8f0',
                    fontSize:13, fontWeight:500 }}>
                  Connexion
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}
                  style={{ flex:1, textAlign:'center', padding:'9px', borderRadius:10,
                    textDecoration:'none', color:'#fff', fontSize:13, fontWeight:600,
                    background:'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                  Inscription
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <div style={{ height: NAVBAR_HEIGHT }}/>

      {dropOpen && (
        <div onClick={() => setDropOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:49 }}/>
      )}

      <style>{`
        @media (max-width: 768px) {
          .immo-desktop-nav   { display: none !important; }
          .immo-mobile-burger { display: flex !important; }
        }
      `}</style>
    </>
  )
}