import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMyBookings } from '../services/booking.service'
import { updateMe, changePassword } from '../services/auth.service'
import { api } from '../services/api'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

// ── Icônes SVG ────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  calendar:   ['M3 4h18v18H3z','M16 2v4M8 2v4','M3 10h18'],
  heart:      'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  user:       ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2','M12 11a4 4 0 100-8 4 4 0 000 8z'],
  home:       'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  edit:       ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7','M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  lock:       ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z','M7 11V7a5 5 0 0110 0v4'],
  eye:        ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 100 6 3 3 0 000-6z'],
  eyeOff:     ['M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24','M1 1l22 22'],
  mapPin:     ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  phone:      'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.1 2.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z',  
  check:      'M20 6L9 17l-5-5',
  x:          'M18 6L6 18M6 6l12 12',
  trash:      ['M3 6h18','M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2'],
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  refresh:    'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  bell:       'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
}

// ── Statuts ───────────────────────────────────────────────────
const STATUS_COLORS = { PENDING:'yellow', CONFIRMED:'green', CANCELLED:'red', COMPLETED:'blue' }
const STATUS_LABELS = { PENDING:'En attente', CONFIRMED:'Confirmé', CANCELLED:'Annulé', COMPLETED:'Terminé' }

// ── Toast ─────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      <Icon d={toast.type === 'success' ? Icons.check : Icons.x} size={16}/>
      {toast.message}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  return { toast, show }
}

// ── StatCard mini ─────────────────────────────────────────────
function MiniStat({ icon, label, value, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon d={icon} size={18}/>
      </div>
      <div>
        <div className="text-xl font-bold text-slate-800">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}

// ── PasswordInput ─────────────────────────────────────────────
function PasswordInput({ label, value, onChange, name }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} name={name} value={value}
          onChange={onChange} className="input pr-10"/>
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          <Icon d={show ? Icons.eyeOff : Icons.eye} size={16}/>
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function ClientDashboard() {
  const { user, setCredentials } = useAuth()
  const navigate = useNavigate()
  const { toast, show: showToast } = useToast()

  const [tab,      setTab]      = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [favorites,setFavorites]= useState([])
  const [loading,  setLoading]  = useState(true)

  // Profil
  const [profileForm, setProfileForm] = useState({ firstName:'', lastName:'', phone:'' })
  const [profileSaving, setProfileSaving] = useState(false)

  // Mot de passe
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const [pwSaving, setPwSaving] = useState(false)

  // ── Chargement ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [b, f] = await Promise.all([
        getMyBookings(),
        api('/properties/my-favorites').catch(() => []),
      ])
      setBookings(b)
      setFavorites(f)
    } catch (e) {
      showToast('Erreur de chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (user) setProfileForm({
      firstName: user.firstName ?? '',
      lastName:  user.lastName  ?? '',
      phone:     user.phone     ?? '',
    })
  }, [user])

  // ── Annuler une réservation ──────────────────────────────────
  const handleCancelBooking = async (id) => {
    if (!confirm('Annuler cette réservation ?')) return
    try {
      await api(`/bookings/${id}/status`, { method:'PUT', body: JSON.stringify({ status:'CANCELLED' }) })
      setBookings(b => b.map(bk => bk.id === id ? { ...bk, status:'CANCELLED' } : bk))
      showToast('Réservation annulée')
    } catch {
      showToast('Erreur lors de l\'annulation', 'error')
    }
  }

  // ── Supprimer un favori ──────────────────────────────────────
  const handleRemoveFavorite = async (propertyId) => {
    try {
      await api(`/properties/${propertyId}/favorite`, { method:'POST' })
      setFavorites(f => f.filter(p => p.id !== propertyId))
      showToast('Retiré des favoris')
    } catch {
      showToast('Erreur', 'error')
    }
  }

  // ── Sauvegarder profil ───────────────────────────────────────
  const handleSaveProfile = async e => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      const updated = await updateMe(profileForm)
      // Mettre à jour le store Redux
      if (setCredentials) setCredentials({ user: { ...user, ...updated }, token: localStorage.getItem('immo_token') })
      showToast('Profil mis à jour')
    } catch (err) {
      showToast(err.message ?? 'Erreur', 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Changer mot de passe ─────────────────────────────────────
  const handleChangePassword = async e => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return showToast('Les mots de passe ne correspondent pas', 'error')
    if (pwForm.newPassword.length < 8)
      return showToast('Minimum 8 caractères', 'error')
    setPwSaving(true)
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' })
      showToast('Mot de passe modifié')
    } catch (err) {
      showToast(err.message ?? 'Erreur', 'error')
    } finally {
      setPwSaving(false)
    }
  }

  // ── Stats rapides ────────────────────────────────────────────
  const confirmed  = bookings.filter(b => b.status === 'CONFIRMED').length
  const pending    = bookings.filter(b => b.status === 'PENDING').length
  const totalSpent = bookings.filter(b => b.status !== 'CANCELLED').reduce((s, b) => s + (b.totalPrice ?? 0), 0)

  const TABS = [
    { key:'bookings',  label:'Réservations', icon: Icons.calendar, count: bookings.length },
    { key:'favorites', label:'Favoris',       icon: Icons.heart,    count: favorites.length },
    { key:'profile',   label:'Mon profil',    icon: Icons.user      },
    { key:'security',  label:'Sécurité',      icon: Icons.lock      },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* ── Header profil ── */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover"/>
              : <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-md">
                  {user?.firstName?.[0]?.toUpperCase()}
                </div>
            }
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bonjour, {user?.firstName}</h1>
            <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
              <Icon d={Icons.bell} size={13} className="text-slate-400"/>
              {user?.email}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={loadData} className="gap-2">
          <Icon d={Icons.refresh} size={14}/>
          Actualiser
        </Button>
      </div>

      {/* ── Mini stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MiniStat icon={Icons.calendar} label="Total réservations" value={bookings.length} color="blue"/>
        <MiniStat icon={Icons.check}    label="Confirmées"          value={confirmed}       color="green"/>
        <MiniStat icon={Icons.bell}     label="En attente"          value={pending}         color="yellow"/>
        <MiniStat icon={Icons.heart}    label="Favoris"             value={favorites.length} color="purple"/>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-8 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ key, label, icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Icon d={icon} size={14}/>
            {label}
            {count != null && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full
                ${tab === key ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB — RÉSERVATIONS
      ══════════════════════════════════════════════════════ */}
      {tab === 'bookings' && (
        loading ? <Spinner /> :
        bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Icon d={Icons.calendar} size={28} className="text-slate-300" strokeWidth={1.2}/>
            </div>
            <div className="text-center">
              <p className="font-medium">Aucune réservation pour l'instant</p>
              <p className="text-sm mt-1">Explorez nos biens et faites votre première réservation</p>
            </div>
            <Button onClick={() => navigate('/annonces')} className="gap-2">
              <Icon d={Icons.home} size={15}/>
              Voir les annonces
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b.id} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                {/* Image */}
                <Link to={`/annonces/${b.property?.slug}`} className="w-24 h-20 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                  {b.property?.images?.[0]
                    ? <img src={b.property.images[0]} className="w-full h-full object-cover hover:scale-105 transition-transform"/>
                    : <div className="w-full h-full flex items-center justify-center"><Icon d={Icons.home} size={20} className="text-slate-400"/></div>
                  }
                </Link>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <Link to={`/annonces/${b.property?.slug}`} className="font-semibold text-slate-800 hover:text-blue-600 truncate block transition-colors">
                    {b.property?.title}
                  </Link>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Icon d={Icons.mapPin} size={12} className="text-slate-400"/>
                    {b.property?.city}
                  </p>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Icon d={Icons.calendar} size={12} className="text-slate-400"/>
                    {new Date(b.startDate).toLocaleDateString('fr-FR')}
                    {b.endDate && ` → ${new Date(b.endDate).toLocaleDateString('fr-FR')}`}
                  </p>
                  {b.isQuote && (
                    <span className="inline-block text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full mt-1">Devis</span>
                  )}
                </div>

                {/* Droite */}
                <div className="text-right flex-shrink-0 space-y-2">
                  <Badge variant={STATUS_COLORS[b.status]}>{STATUS_LABELS[b.status]}</Badge>
                  <p className="text-sm font-bold text-blue-600">{b.totalPrice?.toLocaleString()} MGA</p>

                  <div className="flex gap-2 justify-end">
                    {/* Payer si en attente */}
                    {b.status === 'PENDING' && !b.isQuote && (
                      <Button onClick={() => navigate(`/paiement/${b.id}`)} className="text-xs py-1 px-2.5 gap-1">
                        Payer
                      </Button>
                    )}
                    {/* Annuler si possible */}
                    {['PENDING', 'CONFIRMED'].includes(b.status) && (
                      <button onClick={() => handleCancelBooking(b.id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium">
                        <Icon d={Icons.x} size={11}/>
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════
          TAB — FAVORIS
      ══════════════════════════════════════════════════════ */}
      {tab === 'favorites' && (
        loading ? <Spinner /> :
        favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Icon d={Icons.heart} size={28} className="text-slate-300" strokeWidth={1.2}/>
            </div>
            <div className="text-center">
              <p className="font-medium">Aucun favori pour l'instant</p>
              <p className="text-sm mt-1">Sauvegardez les biens qui vous intéressent</p>
            </div>
            <Button onClick={() => navigate('/annonces')} className="gap-2">
              <Icon d={Icons.home} size={15}/>
              Explorer les biens
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map(p => (
              <div key={p.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 bg-slate-200">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center"><Icon d={Icons.home} size={32} className="text-slate-400"/></div>
                  }
                  <button onClick={() => handleRemoveFavorite(p.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-white hover:text-red-600 transition-colors shadow">
                    <Icon d={Icons.trash} size={13}/>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 truncate">{p.title}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Icon d={Icons.mapPin} size={12}/>
                    {p.city}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-blue-600 font-bold">{p.price?.toLocaleString()} MGA</span>
                    <Link to={`/annonces/${p.slug}`}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Voir <Icon d={Icons.arrowRight} size={12}/>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════
          TAB — PROFIL
      ══════════════════════════════════════════════════════ */}
      {tab === 'profile' && (
        <div className="max-w-lg space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <Icon d={Icons.edit} size={16} className="text-blue-500"/>
              Informations personnelles
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prénom</label>
                  <input className="input" value={profileForm.firstName}
                    onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} required/>
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input className="input" value={profileForm.lastName}
                    onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} required/>
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input bg-slate-50 cursor-not-allowed" value={user?.email ?? ''} disabled/>
                <p className="text-xs text-slate-400 mt-1">L'email ne peut pas être modifié</p>
              </div>
              <div>
                <label className="label">Téléphone</label>
                <div className="relative">
                  <Icon d={Icons.phone} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  <input className="input pl-9" value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+261 34 00 000 00"/>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="blue">{user?.role}</Badge>
                  {user?.isVerified && <Badge variant="green">Vérifié</Badge>}
                </div>
                <Button type="submit" loading={profileSaving} className="gap-2">
                  <Icon d={Icons.check} size={14}/>
                  Sauvegarder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB — SÉCURITÉ
      ══════════════════════════════════════════════════════ */}
      {tab === 'security' && (
        <div className="max-w-lg">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <Icon d={Icons.lock} size={16} className="text-blue-500"/>
              Changer le mot de passe
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <PasswordInput label="Mot de passe actuel" name="currentPassword"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}/>
              <PasswordInput label="Nouveau mot de passe" name="newPassword"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}/>
              <PasswordInput label="Confirmer le nouveau mot de passe" name="confirmPassword"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}/>

              {pwForm.newPassword && (
                <div className="text-xs space-y-1">
                  {[
                    [pwForm.newPassword.length >= 8, 'Minimum 8 caractères'],
                    [/[A-Z]/.test(pwForm.newPassword), 'Une majuscule'],
                    [/[0-9]/.test(pwForm.newPassword), 'Un chiffre'],
                  ].map(([ok, label]) => (
                    <div key={label} className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                      <Icon d={ok ? Icons.check : Icons.x} size={11}/>
                      {label}
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" loading={pwSaving} className="w-full gap-2 mt-2">
                <Icon d={Icons.lock} size={14}/>
                Mettre à jour le mot de passe
              </Button>
            </form>
          </div>
        </div>
      )}

      <Toast toast={toast}/>
    </div>
  )
}