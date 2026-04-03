import { useState, useEffect, useCallback } from 'react'
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
  users:      ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  home:       'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  calendar:   ['M3 4h18v18H3z','M16 2v4M8 2v4M3 10h18'],
  euro:       ['M12 2a10 10 0 100 20A10 10 0 0012 2z','M15 8.5A4 4 0 008 11v2a4 4 0 007 2.5','M6 11h8'],
  warning:    ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4M12 17h.01'],
  check:      'M20 6L9 17l-5-5',
  x:          'M18 6L6 18M6 6l12 12',
  archive:    ['M21 8v13H3V8','M23 3H1v5h22z','M10 12h4'],
  ban:        'M12 2a10 10 0 100 20A10 10 0 0012 2zM4.93 4.93l14.14 14.14',
  userCheck:  ['M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M17 11l2 2 4-4'],
  eye:        ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 100 6 3 3 0 000-6z'],
  shield:     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  refresh:    'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  search:     'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  grid:       ['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z'],
  list:       'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  trendUp:    'M23 6l-9.5 9.5-5-5L1 18',
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  const colors = {
    blue:   { border: 'border-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-600'   },
    green:  { border: 'border-green-500',  bg: 'bg-green-50',  text: 'text-green-600'  },
    yellow: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
  }
  const c = colors[color]
  return (
    <div className={`card p-5 border-l-4 ${c.border}`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
        <Icon d={icon} size={20} className={c.text}/>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

// ── Confirm modal ─────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirmer', variant = 'danger' }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  return { toast, show }
}

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
      ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      <Icon d={toast.type === 'success' ? Icons.check : Icons.x} size={16}/>
      {toast.message}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [users,    setUsers]    = useState([])
  const [props,    setProps]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('dashboard')
  const [search,   setSearch]   = useState('')
  const [confirm,  setConfirm]  = useState(null)   // { type, id, extra }
  const { toast, show: showToast } = useToast()

  // ── Chargement initial ──────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, u, p] = await Promise.all([
        api('/admin/stats'),
        api('/admin/users?limit=50'),
        api('/admin/properties?limit=50'),
      ])
      setStats(s)
      setUsers(u.data ?? [])
      setProps(p.data ?? [])
    } catch (e) {
      showToast('Erreur de chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Actions utilisateurs ────────────────────────────────────
  const handleToggleUser = async (id) => {
    try {
      const res = await api(`/admin/users/${id}/toggle`, { method: 'PUT' })
      setUsers(u => u.map(user => user.id === id ? { ...user, isActive: res.isActive } : user))
      showToast(res.isActive ? 'Utilisateur réactivé' : 'Utilisateur désactivé')
    } catch {
      showToast('Erreur lors de la mise à jour', 'error')
    }
    setConfirm(null)
  }

  // ── Actions biens ───────────────────────────────────────────
  const handleModerate = async (id, status) => {
    try {
      await api(`/admin/properties/${id}/moderate`, { method: 'PUT', body: JSON.stringify({ status }) })
      setProps(p => p.map(prop => prop.id === id ? { ...prop, status } : prop))
      const labels = { ACTIVE: 'Bien validé', ARCHIVED: 'Bien archivé', PENDING: 'Bien repassé en attente' }
      showToast(labels[status] ?? 'Statut mis à jour')
    } catch {
      showToast('Erreur lors de la modération', 'error')
    }
    setConfirm(null)
  }

  // ── Actions avis ────────────────────────────────────────────
  const handleApproveReview = async (id) => {
    try {
      await api(`/admin/reviews/${id}/approve`, { method: 'PUT' })
      showToast('Avis approuvé')
    } catch {
      showToast('Erreur', 'error')
    }
    setConfirm(null)
  }

  // ── Filtres ─────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )
  const filteredProps = props.filter(p =>
    !search || `${p.title} ${p.city}`.toLowerCase().includes(search.toLowerCase())
  )
  const pendingProps = props.filter(p => p.status === 'PENDING')

  const TABS = [
    { key: 'dashboard',  label: 'Tableau de bord', icon: Icons.grid   },
    { key: 'users',      label: 'Utilisateurs',    icon: Icons.users  },
    { key: 'properties', label: 'Biens',            icon: Icons.home   },
    { key: 'reviews',    label: 'Avis',             icon: Icons.star   },
  ]

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg"/></div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administration</h1>
          <p className="text-slate-500 text-sm mt-1">Gestion complète de la plateforme</p>
        </div>
        <Button variant="secondary" onClick={loadAll} className="gap-2">
          <Icon d={Icons.refresh} size={14}/>
          Actualiser
        </Button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-8 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ key, label, icon }) => (
          <button key={key} onClick={() => { setTab(key); setSearch('') }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Icon d={icon} size={14}/>
            {label}
            {key === 'properties' && pendingProps.length > 0 && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingProps.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB — DASHBOARD
      ══════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && stats && (
        <div className="space-y-8">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <StatCard icon={Icons.users}    label="Utilisateurs"  value={stats.users}      color="blue"   sub={`${users.filter(u=>u.isActive).length} actifs`}/>
            <StatCard icon={Icons.home}     label="Biens actifs"  value={stats.properties} color="green"  sub={`${pendingProps.length} en attente`}/>
            <StatCard icon={Icons.calendar} label="Réservations"  value={stats.bookings}   color="yellow" />
            <StatCard icon={Icons.euro}     label="Revenus"       value={`${stats.revenue?.toLocaleString() ?? 0} €`} color="purple"/>
          </div>

          {/* Alerte biens en attente */}
          {pendingProps.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon d={Icons.warning} size={18} className="text-yellow-600"/>
              </div>
              <div className="flex-1">
                <p className="text-yellow-800 font-medium text-sm">
                  {pendingProps.length} bien(s) en attente de modération
                </p>
                <p className="text-yellow-600 text-xs mt-0.5">Vérifiez et validez les nouvelles annonces</p>
              </div>
              <Button variant="secondary" className="text-sm flex-shrink-0" onClick={() => setTab('properties')}>
                Voir les biens
              </Button>
            </div>
          )}

          {/* Réservations récentes */}
          {stats.recentBookings?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Réservations récentes</h2>
                <Icon d={Icons.calendar} size={16} className="text-slate-400"/>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.recentBookings.slice(0, 6).map(b => (
                  <div key={b.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                      {b.client?.firstName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {b.client?.firstName} {b.client?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{b.property?.title}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={b.status === 'CONFIRMED' ? 'green' : b.status === 'PENDING' ? 'yellow' : 'gray'}>
                        {b.status}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(b.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Répartition par type */}
          {stats.byListingType?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Icon d={Icons.trendUp} size={16} className="text-blue-500"/>
                  Biens par type
                </h3>
                <div className="space-y-3">
                  {stats.byListingType.map(({ listingType, _count }) => {
                    const labels = { SALE:'Vente', RENT:'Location', VACATION_RENT:'Vacances' }
                    const total = stats.properties || 1
                    const pct = Math.round((_count / total) * 100)
                    return (
                      <div key={listingType}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">{labels[listingType] ?? listingType}</span>
                          <span className="font-medium text-slate-800">{_count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width:`${pct}%` }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Icon d={Icons.home} size={16} className="text-green-500"/>
                  Top villes
                </h3>
                <div className="space-y-2">
                  {stats.byCity?.map(({ city, _count }) => (
                    <div key={city} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-600">{city}</span>
                      <Badge variant="blue">{_count} biens</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB — UTILISATEURS
      ══════════════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="relative max-w-sm">
            <Icon d={Icons.search} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {['Utilisateur', 'Email', 'Rôle', 'Biens', 'Résa', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400">Aucun utilisateur trouvé</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                            {u.firstName?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'ADMIN' ? 'red' : u.role === 'SELLER' ? 'green' : u.role === 'AGENCY' ? 'purple' : 'blue'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{u._count?.properties ?? 0}</td>
                      <td className="px-4 py-3 text-center">{u._count?.bookings ?? 0}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'green' : 'gray'}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => setConfirm({ type: 'toggleUser', id: u.id,
                              label: u.isActive ? 'Désactiver' : 'Réactiver',
                              message: `${u.isActive ? 'Désactiver' : 'Réactiver'} le compte de ${u.firstName} ${u.lastName} ?`,
                              variant: u.isActive ? 'danger' : 'secondary'
                            })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                              ${u.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            <Icon d={u.isActive ? Icons.ban : Icons.userCheck} size={13}/>
                            {u.isActive ? 'Désactiver' : 'Réactiver'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
              {filteredUsers.length} utilisateur(s) affiché(s)
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB — BIENS
      ══════════════════════════════════════════════════════ */}
      {tab === 'properties' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Icon d={Icons.search} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un bien..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {['Bien', 'Ville', 'Type', 'Prix', 'Statut', 'Vues', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProps.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400">Aucun bien trouvé</td></tr>
                  ) : filteredProps.map(p => (
                    <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${p.status === 'PENDING' ? 'bg-yellow-50/60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt="" className="w-full h-full object-cover"/>
                              : <div className="w-full h-full flex items-center justify-center"><Icon d={Icons.home} size={16} className="text-slate-400"/></div>
                            }
                          </div>
                          <span className="font-medium text-slate-800 max-w-[180px] truncate">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.city}</td>
                      <td className="px-4 py-3">
                        <Badge variant="gray">
                          {{ SALE:'Vente', RENT:'Location', VACATION_RENT:'Vacances' }[p.listingType] ?? p.listingType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{p.price?.toLocaleString()} MGA</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === 'ACTIVE' ? 'green' : p.status === 'PENDING' ? 'yellow' : 'gray'}>
                          {{ ACTIVE:'Actif', PENDING:'En attente', ARCHIVED:'Archivé', SOLD:'Vendu', RENTED:'Loué' }[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Icon d={Icons.eye} size={13} className="text-slate-400"/>
                          {p.viewCount ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {p.status === 'PENDING' && (
                            <button
                              onClick={() => setConfirm({ type:'moderate', id: p.id, status:'ACTIVE',
                                label:'Valider', message:`Valider et publier "${p.title}" ?`, variant:'secondary' })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                              <Icon d={Icons.check} size={12}/>
                              Valider
                            </button>
                          )}
                          {p.status === 'ACTIVE' && (
                            <button
                              onClick={() => setConfirm({ type:'moderate', id: p.id, status:'PENDING',
                                label:'Suspendre', message:`Suspendre "${p.title}" ?`, variant:'danger' })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors">
                              <Icon d={Icons.warning} size={12}/>
                              Suspendre
                            </button>
                          )}
                          {p.status !== 'ARCHIVED' && (
                            <button
                              onClick={() => setConfirm({ type:'moderate', id: p.id, status:'ARCHIVED',
                                label:'Archiver', message:`Archiver définitivement "${p.title}" ?`, variant:'danger' })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                              <Icon d={Icons.archive} size={12}/>
                              Archiver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
              {filteredProps.length} bien(s) · {pendingProps.length} en attente
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB — AVIS
      ══════════════════════════════════════════════════════ */}
      {tab === 'reviews' && (
        <div className="card p-10 text-center text-slate-400">
          <Icon d={Icons.star} size={40} className="mx-auto mb-3 text-slate-300" strokeWidth={1.2}/>
          <p className="font-medium">Gestion des avis</p>
          <p className="text-sm mt-1">À implémenter — endpoint <code className="bg-slate-100 px-1 rounded">/admin/reviews</code></p>
        </div>
      )}

      {/* ── Modal de confirmation ── */}
      <ConfirmModal
        isOpen={!!confirm}
        title={confirm?.label ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.label}
        variant={confirm?.variant ?? 'danger'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm.type === 'toggleUser')  handleToggleUser(confirm.id)
          if (confirm.type === 'moderate')    handleModerate(confirm.id, confirm.status)
          if (confirm.type === 'approveReview') handleApproveReview(confirm.id)
        }}
      />

      {/* ── Toast ── */}
      <Toast toast={toast}/>
    </div>
  )
}