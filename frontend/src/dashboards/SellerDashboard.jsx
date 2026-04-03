import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getCategories,
} from '../services/property.service'
import { api } from '../services/api'
import PropertyModal from '../components/property/PropertyModal'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

// ── Icônes ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  home:     'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  plus:     'M12 5v14M5 12h14',
  edit:     ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7','M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  archive:  ['M21 8v13H3V8','M23 3H1v5h22z','M10 12h4'],
  eye:      ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 100 6 3 3 0 000-6z'],
  calendar: ['M3 4h18v18H3z','M16 2v4M8 2v4','M3 10h18'],
  star:     'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  mapPin:   ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  check:    'M20 6L9 17l-5-5',
  x:        'M18 6L6 18M6 6l12 12',
  refresh:  'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  image:    ['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z','M12 13a3 3 0 100 6 3 3 0 000-6z'],
  warning:  ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4M12 17h.01'],
  user:     ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2','M12 11a4 4 0 100-8 4 4 0 000 8z'],
}

// ── Constantes ────────────────────────────────────────────────
const STATUS_COLORS = { PENDING:'yellow', ACTIVE:'green', ARCHIVED:'gray', SOLD:'blue', RENTED:'purple' }
const STATUS_LABELS = { PENDING:'En attente', ACTIVE:'Actif', ARCHIVED:'Archivé', SOLD:'Vendu', RENTED:'Loué' }

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
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      <Icon d={toast.type === 'success' ? Icons.check : Icons.x} size={16}/>
      {toast.message}
    </div>
  )
}

// ── MiniStat ──────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════
// SellerDashboard
// ══════════════════════════════════════════════════════════════
export default function SellerDashboard() {
  const { user }                   = useAuth()
  const { toast, show: showToast } = useToast()

  const [tab,        setTab]        = useState('list')
  const [properties, setProperties] = useState([])
  const [bookings,   setBookings]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [editProp,   setEditProp]   = useState(null)
  const [showModal,  setShowModal]  = useState(false)

  // ── Chargement ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [props, cats] = await Promise.all([
        getMyProperties(),
        getCategories(),
      ])
      setProperties(Array.isArray(props) ? props : [])
      setCategories(Array.isArray(cats)  ? cats  : [])
    } catch (e) {
      showToast(e.message ?? 'Erreur de chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadBookings = useCallback(async () => {
    if (!properties.length) return
    try {
      const all = await Promise.all(
        properties
          .filter(p => p.status !== 'ARCHIVED')
          .map(p => api(`/bookings/property/${p.id}`).catch(() => []))
      )
      setBookings(all.flat())
    } catch {}
  }, [properties])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab === 'bookings') loadBookings() }, [tab, loadBookings])

  // ── Modal ────────────────────────────────────────────────────
  const openModal  = (prop = null) => { setEditProp(prop); setShowModal(true) }
  const closeModal = ()            => { if (!saving) { setEditProp(null); setShowModal(false) } }

  // ── Sauvegarder ──────────────────────────────────────────────
  const handleSave = async (formData) => {
    console.log('formData envoyé:', formData)
    setSaving(true)
    try {
      if (editProp) {
        await updateProperty(editProp.id, formData)
        showToast('Annonce mise à jour')
      } else {
        await createProperty(formData)
        showToast('Annonce publiée — en attente de validation admin')
      }
      closeModal()
      await load()
    } catch (e) {
      showToast(e.message ?? 'Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Archiver ─────────────────────────────────────────────────
  const handleArchive = async (id, title) => {
    if (!confirm(`Archiver "${title}" ?`)) return
    try {
      await deleteProperty(id)
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'ARCHIVED' } : p))
      showToast('Bien archivé')
    } catch {
      showToast("Erreur lors de l'archivage", 'error')
    }
  }

  // ── Réservations ─────────────────────────────────────────────
  const handleBookingStatus = async (id, status) => {
    try {
      await api(`/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      showToast(status === 'CONFIRMED' ? 'Réservation confirmée' : 'Réservation refusée')
    } catch {
      showToast('Erreur', 'error')
    }
  }

  // ── Stats ────────────────────────────────────────────────────
  const active     = properties.filter(p => p.status === 'ACTIVE').length
  const pending    = properties.filter(p => p.status === 'PENDING').length
  const totalViews = properties.reduce((s, p) => s + (p.viewCount ?? 0), 0)
  const totalResas = properties.reduce((s, p) => s + (p._count?.bookings ?? 0), 0)

  const TABS = [
    { key: 'list',     label: 'Mes biens',          icon: Icons.home,     count: properties.length },
    { key: 'bookings', label: 'Réservations reçues', icon: Icons.calendar, count: totalResas        },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Espace vendeur</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
            <Icon d={Icons.user} size={13} className="text-slate-400"/>
            {user?.firstName} {user?.lastName} · {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} className="gap-2">
            <Icon d={Icons.refresh} size={14}/>
            Actualiser
          </Button>
          <Button onClick={() => openModal()} className="gap-2">
            <Icon d={Icons.plus} size={15}/>
            Nouvelle annonce
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MiniStat icon={Icons.home}     label="Total annonces" value={properties.length} color="blue"/>
        <MiniStat icon={Icons.check}    label="Actives"         value={active}            color="green"/>
        <MiniStat icon={Icons.eye}      label="Vues totales"    value={totalViews}        color="purple"/>
        <MiniStat icon={Icons.calendar} label="Réservations"    value={totalResas}        color="yellow"/>
      </div>

      {/* ── Alerte validation ── */}
      {pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Icon d={Icons.warning} size={18} className="text-yellow-500 flex-shrink-0"/>
          <p className="text-yellow-800 text-sm font-medium">
            {pending} bien(s) en attente de validation par l'administrateur
          </p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-8 border-b border-slate-200">
        {TABS.map(({ key, label, icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
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

      {/* ════════════════════════════════════════════════
          TAB — MES BIENS
      ════════════════════════════════════════════════ */}
      {tab === 'list' && (
        loading ? <Spinner /> :
        properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Icon d={Icons.home} size={28} className="text-slate-300" strokeWidth={1.2}/>
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-600">Aucune annonce pour l'instant</p>
              <p className="text-sm mt-1">Créez votre première annonce et commencez à louer ou vendre</p>
            </div>
            <Button onClick={() => openModal()} className="gap-2">
              <Icon d={Icons.plus} size={15}/>
              Créer une annonce
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map(p => (
              <div key={p.id}
                className={`card p-5 flex items-center gap-4 hover:shadow-md transition-shadow
                  ${p.status === 'ARCHIVED' ? 'opacity-50' : ''}`}>

                {/* Image */}
                <Link to={`/annonces/${p.slug}`}
                  className="w-28 h-20 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {p.images?.[0]
                    ? <img src={p.images[0]} className="w-full h-full object-cover hover:scale-105 transition-transform" alt={p.title}/>
                    : <div className="w-full h-full flex items-center justify-center">
                        <Icon d={Icons.image} size={22} className="text-slate-400"/>
                      </div>
                  }
                  {p.images?.length > 1 && (
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                      +{p.images.length - 1}
                    </span>
                  )}
                </Link>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <Link to={`/annonces/${p.slug}`}
                    className="font-semibold text-slate-800 hover:text-blue-600 truncate block transition-colors">
                    {p.title}
                  </Link>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Icon d={Icons.mapPin} size={12} className="text-slate-400"/>
                    {p.city}{p.district ? ` · ${p.district}` : ''} — {p.price?.toLocaleString()} {p.priceUnit}
                    {p.listingType === 'RENT' ? '/mois' : ''}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Icon d={Icons.eye} size={11}/>{p.viewCount ?? 0} vues
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon d={Icons.calendar} size={11}/>{p._count?.bookings ?? 0} résa
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon d={Icons.star} size={11}/>{p._count?.reviews ?? 0} avis
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon d={Icons.image} size={11}/>{p.images?.length ?? 0} photo(s)
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                  <Badge variant={STATUS_COLORS[p.status]}>
                    {STATUS_LABELS[p.status]}
                  </Badge>
                  {p.status !== 'ARCHIVED' && (
                    <div className="flex gap-2">
                      <button onClick={() => openModal(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                        <Icon d={Icons.edit} size={12}/>
                        Modifier
                      </button>
                      <button onClick={() => handleArchive(p.id, p.title)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                        <Icon d={Icons.archive} size={12}/>
                        Archiver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ════════════════════════════════════════════════
          TAB — RÉSERVATIONS REÇUES
      ════════════════════════════════════════════════ */}
      {tab === 'bookings' && (
        loading ? <Spinner /> :
        bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Icon d={Icons.calendar} size={28} className="text-slate-300" strokeWidth={1.2}/>
            </div>
            <p className="font-medium text-slate-600">Aucune réservation reçue</p>
            <p className="text-sm">Les demandes de vos clients apparaîtront ici</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {['Client','Bien','Dates','Montant','Statut','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                            {b.client?.firstName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {b.client?.firstName} {b.client?.lastName}
                            </p>
                            <p className="text-xs text-slate-400">{b.client?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">
                        {b.property?.title}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        <p>{new Date(b.startDate).toLocaleDateString('fr-FR')}</p>
                        {b.endDate && (
                          <p className="text-xs text-slate-400">
                            {'->'} {new Date(b.endDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600 whitespace-nowrap">
                        {b.totalPrice?.toLocaleString()} MGA
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          { PENDING:'yellow', CONFIRMED:'green', CANCELLED:'red', COMPLETED:'blue' }[b.status] ?? 'gray'
                        }>
                          {{ PENDING:'En attente', CONFIRMED:'Confirmé', CANCELLED:'Annulé', COMPLETED:'Terminé' }[b.status] ?? b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {b.status === 'PENDING' && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleBookingStatus(b.id, 'CONFIRMED')}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                              <Icon d={Icons.check} size={11}/>
                              Confirmer
                            </button>
                            <button onClick={() => handleBookingStatus(b.id, 'CANCELLED')}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                              <Icon d={Icons.x} size={11}/>
                              Refuser
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
              {bookings.length} réservation(s) · {bookings.filter(b => b.status === 'PENDING').length} en attente
            </div>
          </div>
        )
      )}

      {/* ── Modal ── */}
      <PropertyModal
        isOpen={showModal}
        editProp={editProp}
        categories={categories}
        saving={saving}
        onSave={handleSave}
        onClose={closeModal}
      />

      <Toast toast={toast}/>
    </div>
  )
}