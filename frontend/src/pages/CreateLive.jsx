import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE     = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const getToken = () => localStorage.getItem('immo_token')
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
})

const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  arrowLeft: 'M19 12H5M12 5l-7 7 7 7',
  video:     'M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  check:     'M20 6L9 17l-5-5',
  close:     'M18 6L6 18M6 6l12 12',
  calendar:  ['M3 4h18v18H3z','M16 2v4M8 2v4','M3 10h18'],
  clock:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 6v6l4 2'],
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12a3 3 0 100-6 3 3 0 000 6z'],
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  globe:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M2 12h20','M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20'],
  lock:      ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z','M7 11V7a5 5 0 0110 0v4'],
  mapPin:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  info:      ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 8h.01','M12 12v4'],
  radio:     ['M12 1a3 3 0 100 6 3 3 0 000-6z','M19.071 4.929a10 10 0 010 14.142M4.929 4.929a10 10 0 000 14.142M16.243 7.757a6 6 0 010 8.485M7.757 7.757a6 6 0 000 8.485'],
  spinner:   'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
}

const VISIBILITIES = [
  { value:'PUBLIC',  label:'Public',  desc:'Visible par tous',        icon:Icons.globe },
  { value:'FRIENDS', label:'Abonnés', desc:'Vos abonnés uniquement',  icon:Icons.users },
  { value:'PRIVATE', label:'Privé',   desc:'Sur invitation seulement',icon:Icons.lock  },
]

export default function CreateLive() {
  const navigate = useNavigate()

  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [scheduled,    setScheduled]    = useState(false)
  const [schedDate,    setSchedDate]    = useState('')
  const [schedTime,    setSchedTime]    = useState('')
  const [visibility,   setVisibility]   = useState('PUBLIC')
  const [searchProp,   setSearchProp]   = useState('')
  const [selectedProps,setSelectedProps]= useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  // Données réelles
  const [properties,   setProperties]   = useState([])
  const [propsLoading, setPropsLoading] = useState(true)
  const [propsError,   setPropsError]   = useState(null)

  // Charger les biens de l'utilisateur connecté
  useEffect(() => {
    setPropsLoading(true)
    fetch(`${BASE}/properties?ownerId=me&status=ACTIVE&limit=50`, { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(`Erreur ${r.status}`); return r.json() })
      .then(d => setProperties(d.data ?? d))
      .catch(e => setPropsError(e.message))
      .finally(() => setPropsLoading(false))
  }, [])

  const filtered = properties.filter(p =>
    p.title.toLowerCase().includes(searchProp.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchProp.toLowerCase())
  )

  const toggleProp = p => {
    setSelectedProps(prev =>
      prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p]
    )
  }

  const handleSubmit = async () => {
    if (!title.trim() || selectedProps.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const scheduledAt = scheduled && schedDate && schedTime
        ? new Date(`${schedDate}T${schedTime}`).toISOString()
        : null

      const res = await fetch(`${BASE}/lives`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title:       title.trim(),
          description: description.trim() || null,
          visibility,
          scheduledAt,
          propertyIds: selectedProps.map(p => p.id),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || `Erreur ${res.status}`)
      }

      const live = await res.json()
      // Rediriger vers la page de diffusion
      navigate(`/live/${live.id}/broadcast`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isValid = title.trim() && selectedProps.length > 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition shadow-sm">
            <Icon d={Icons.arrowLeft} size={15} className="text-slate-500"/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Démarrer un live</h1>
            <p className="text-xs text-slate-400 mt-0.5">Présentez vos biens en direct</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-500 text-xs font-bold px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
            LIVE
          </div>
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <Icon d={Icons.info} size={14} className="flex-shrink-0"/>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5">

          {/* ── Infos générales ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Icon d={Icons.radio} size={15} className="text-blue-500"/>
              Informations générales
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Titre <span className="text-red-400">*</span>
                </label>
                <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
                  placeholder="Ex: Visite exclusive — Villa moderne Analamahitsy"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white focus:outline-none text-sm text-slate-700 transition"/>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-400">{title.length}/80</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={3} maxLength={300}
                  placeholder="Décrivez ce que vous allez présenter..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white focus:outline-none text-sm text-slate-700 transition resize-none"/>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-400">{description.length}/300</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Planification ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Icon d={Icons.calendar} size={15} className="text-blue-500"/>
              Planification
            </h2>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <div>
                <div className="text-sm font-semibold text-slate-700">Programmer à une date ultérieure</div>
                <div className="text-xs text-slate-400 mt-0.5">Annoncez votre live à l'avance</div>
              </div>
              <button onClick={() => setScheduled(s => !s)}
                className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${scheduled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${scheduled ? 'left-5' : 'left-0.5'}`}/>
              </button>
            </div>
            {scheduled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white focus:outline-none text-sm text-slate-700 transition"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Heure</label>
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white focus:outline-none text-sm text-slate-700 transition"/>
                </div>
              </div>
            )}
          </div>

          {/* ── Visibilité ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Icon d={Icons.eye} size={15} className="text-blue-500"/>
              Visibilité
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {VISIBILITIES.map(v => (
                <button key={v.value} onClick={() => setVisibility(v.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                    visibility === v.value
                      ? 'bg-blue-50 border-blue-300 shadow-sm shadow-blue-100'
                      : 'bg-white border-slate-200 hover:border-blue-200'
                  }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${visibility === v.value ? 'bg-blue-600' : 'bg-slate-100'}`}>
                    <Icon d={v.icon} size={16} className={visibility === v.value ? 'text-white' : 'text-slate-400'}/>
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${visibility === v.value ? 'text-blue-700' : 'text-slate-600'}`}>{v.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{v.desc}</div>
                  </div>
                  {visibility === v.value && (
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                      <Icon d={Icons.check} size={9} className="text-white" strokeWidth={3}/>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Biens à présenter ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
              <Icon d={Icons.home} size={15} className="text-blue-500"/>
              Biens à présenter <span className="text-red-400">*</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">Sélectionnez les biens que vous allez montrer</p>

            {/* Sélectionnés */}
            {selectedProps.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                {selectedProps.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-semibold text-blue-700 truncate max-w-[120px]">{p.title}</span>
                    <button onClick={() => toggleProp(p)} className="text-blue-400 hover:text-red-500 transition flex-shrink-0">
                      <Icon d={Icons.close} size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Recherche */}
            <div className="relative mb-3">
              <Icon d={Icons.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input value={searchProp} onChange={e => setSearchProp(e.target.value)}
                placeholder="Rechercher un bien..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white focus:outline-none text-sm text-slate-700 transition"/>
            </div>

            {/* Liste */}
            {propsLoading ? (
              <div className="flex justify-center py-8">
                <Icon d={Icons.spinner} size={24} className="text-blue-400 animate-spin"/>
              </div>
            ) : propsError ? (
              <div className="text-center py-6 text-sm text-red-400">{propsError}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400">
                {properties.length === 0 ? "Vous n'avez aucun bien actif." : 'Aucun bien trouvé.'}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                {filtered.map(p => {
                  const sel = !!selectedProps.find(x => x.id === p.id)
                  return (
                    <button key={p.id} onClick={() => toggleProp(p)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                      }`}>
                      {/* Miniature */}
                      <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${sel ? 'ring-2 ring-blue-400' : ''}`}>
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover"/>
                          : <div className={`w-full h-full flex items-center justify-center ${sel ? 'bg-blue-100' : 'bg-slate-100'}`}>
                              <Icon d={Icons.home} size={18} className={sel ? 'text-blue-400' : 'text-slate-300'}/>
                            </div>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-semibold truncate ${sel ? 'text-blue-700' : 'text-slate-700'}`}>{p.title}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Icon d={Icons.mapPin} size={10} className="text-slate-400"/>
                          <span className="text-xs text-slate-400">{p.city}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs font-semibold ${sel ? 'text-blue-600' : 'text-slate-600'}`}>
                          {p.price?.toLocaleString('fr')} {p.priceUnit}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          p.listingType === 'SALE' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>{p.listingType === 'SALE' ? 'Vente' : 'Location'}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        sel ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                      }`}>
                        {sel && <Icon d={Icons.check} size={9} className="text-white" strokeWidth={3}/>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={!isValid || loading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                isValid && !loading
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-200 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}>
              {loading ? (
                <><Icon d={Icons.spinner} size={14} className="animate-spin"/> Création...</>
              ) : (
                <><span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
                  {scheduled ? 'Programmer le live' : 'Démarrer maintenant'}</>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600">
            <Icon d={Icons.info} size={14} className="text-blue-400 flex-shrink-0 mt-0.5"/>
            Assurez-vous d'avoir une bonne connexion internet. Une connexion 4G ou Wi-Fi est recommandée.
          </div>
        </div>
      </div>
    </div>
  )
}