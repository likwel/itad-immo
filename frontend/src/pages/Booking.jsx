import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import { createBooking, createPaySession } from '../services/booking.service'
import Spinner from '../components/ui/Spinner'

// ── Icônes ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  calendar:  ['M3 4h18v18H3z','M16 2v4M8 2v4','M3 10h18'],
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  mapPin:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  bed:       ['M3 9h18M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3','M3 9v9h18V9'],
  area:      ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  tag:       'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01',
  credit:    ['M1 4h22v16H1z','M1 10h22'],
  file:      ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M16 13H8M16 17H8M10 9H8'],
  check:     'M20 6L9 17l-5-5',
  x:         'M18 6L6 18M6 6l12 12',
  arrowL:    'M19 12H5M12 5l-7 7 7 7',
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  info:      ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 8h.01','M12 12v4'],
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  sun:       ['M12 17a5 5 0 100-10 5 5 0 000 10z','M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2'],
}

// ── Helpers ───────────────────────────────────────────────────
const today    = () => new Date().toISOString().split('T')[0]
const diffDays = (a, b) => {
  if (!a || !b) return 0
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000))
}
const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '—'

// ── Toggle switch ─────────────────────────────────────────────
const Toggle = ({ value, onChange, label, sub }) => (
  <div onClick={() => onChange(!value)}
    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all select-none group">
    <div>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
    <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${value ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}/>
    </div>
  </div>
)

// ── Step indicator ────────────────────────────────────────────
const Steps = ({ current }) => {
  const steps = ['Bien', 'Dates', 'Confirmation']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
            ${i < current ? 'bg-blue-600 text-white' : i === current ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}>
            {i < current ? <Icon d={Icons.check} size={13}/> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i <= current ? 'text-slate-700' : 'text-slate-400'}`}>{s}</span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 rounded transition-colors ${i < current ? 'bg-blue-600' : 'bg-slate-200'}`}/>
          )}
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function Booking() {
  const { propertyId } = useParams()
  const navigate       = useNavigate()

  const [property,  setProperty]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [submitting,setSubmitting]= useState(false)
  const [step,      setStep]      = useState(1)   // 0=bien 1=dates 2=confirmation
  const [error,     setError]     = useState('')
  const [form, setForm] = useState({
    startDate: '',
    endDate:   '',
    notes:     '',
    isQuote:   false,
  })

  // ── Charger le bien par ID ───────────────────────────────────
  useEffect(() => {
    setLoading(true)
    api(`/properties/by-id/${propertyId}`)
      .then(setProperty)
      .catch(() => {
        // fallback : chercher dans la liste (si pas de route by-id)
        api(`/properties?limit=100`)
          .then(res => {
            const found = res.data?.find(p => p.id === propertyId)
            if (found) setProperty(found)
          })
      })
      .finally(() => setLoading(false))
  }, [propertyId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Prix estimé ──────────────────────────────────────────────
  const nights    = diffDays(form.startDate, form.endDate)
  const priceUnit = property?.listingType === 'RENT' ? 'mois' : 'nuit'
  const total     = property
    ? (nights > 0 ? property.price * nights : property.price)
    : 0

  // ── Validation étape dates ───────────────────────────────────
  const validateDates = () => {
    if (!form.startDate) { setError('La date de début est requise'); return false }
    if (form.endDate && form.endDate <= form.startDate) {
      setError('La date de fin doit être après la date de début'); return false
    }
    setError(''); return true
  }

  // ── Soumission ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true); setError('')
    try {
      const booking = await createBooking({ propertyId, ...form })
      if (!form.isQuote) {
        const session = await createPaySession(booking.id)
        window.location.href = session.url
      } else {
        navigate('/espace-client', { state: { bookingSuccess: true } })
      }
    } catch (e) {
      setError(e.message ?? 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg"/>
    </div>
  )

  if (!property) return (
    <div className="text-center py-24 px-4">
      <Icon d={Icons.home} size={48} className="mx-auto text-slate-300 mb-4" strokeWidth={1}/>
      <p className="text-slate-600 font-medium mb-2">Bien introuvable</p>
      <button onClick={() => navigate('/annonces')}
        className="text-blue-600 hover:underline text-sm flex items-center gap-1 mx-auto">
        <Icon d={Icons.arrowL} size={13}/> Retour aux annonces
      </button>
    </div>
  )

  const p = property

  return (
    <div className="min-h-[80vh] bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Fil d'Ariane */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-blue-600 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/annonces" className="hover:text-blue-600 transition-colors">Annonces</Link>
          <span>/</span>
          <Link to={`/annonces/${p.slug}`} className="hover:text-blue-600 transition-colors truncate max-w-[150px]">{p.title}</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Réservation</span>
        </nav>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {p.listingType === 'SALE' ? 'Faire une offre' : 'Réserver ce bien'}
        </h1>
        <p className="text-slate-500 text-sm mb-8">Complétez le formulaire ci-dessous pour finaliser votre demande</p>

        <Steps current={step}/>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ════════════════════════════════════════
              FORMULAIRE (3/5)
          ════════════════════════════════════════ */}
          <div className="lg:col-span-3 space-y-5">

            {/* ── Étape 1 : Résumé du bien ── */}
            <div className={`bg-white rounded-2xl border transition-all overflow-hidden
              ${step === 0 ? 'border-blue-300 shadow-md' : 'border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => setStep(0)}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step > 0 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    {step > 0 ? <Icon d={Icons.check} size={14}/> : <Icon d={Icons.home} size={14}/>}
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">Bien sélectionné</span>
                </div>
                {step > 0 && <span className="text-xs text-blue-600 font-medium">Modifier</span>}
              </div>
              {step === 0 && (
                <div className="px-5 pb-5 space-y-4">
                  <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-20 h-16 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                      {p.images?.[0]
                        ? <img src={p.images[0]} className="w-full h-full object-cover" alt={p.title}/>
                        : <div className="w-full h-full flex items-center justify-center"><Icon d={Icons.home} size={20} className="text-slate-400"/></div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Icon d={Icons.mapPin} size={11}/>{p.city}{p.district ? `, ${p.district}` : ''}
                      </p>
                      <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                        {p.bedrooms && <span className="flex items-center gap-1"><Icon d={Icons.bed} size={10}/>{p.bedrooms} ch.</span>}
                        {p.area     && <span className="flex items-center gap-1"><Icon d={Icons.area} size={10}/>{p.area}m²</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setStep(1)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    Continuer <Icon d={Icons.check} size={14}/>
                  </button>
                </div>
              )}
            </div>

            {/* ── Étape 2 : Dates ── */}
            <div className={`bg-white rounded-2xl border transition-all overflow-hidden
              ${step === 1 ? 'border-blue-300 shadow-md' : 'border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between p-5 cursor-pointer"
                onClick={() => step > 1 && setStep(1)}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                    ${step > 1 ? 'bg-blue-600 text-white' : step === 1 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    {step > 1 ? <Icon d={Icons.check} size={14}/> : <Icon d={Icons.calendar} size={14}/>}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">Dates & options</span>
                    {step > 1 && form.startDate && (
                      <p className="text-xs text-slate-500 mt-0.5">{fmt(form.startDate)}{form.endDate ? ` → ${fmt(form.endDate)}` : ''}</p>
                    )}
                  </div>
                </div>
                {step > 1 && <span className="text-xs text-blue-600 font-medium">Modifier</span>}
              </div>

              {step === 1 && (
                <div className="px-5 pb-5 space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                      <Icon d={Icons.x} size={14}/>{error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Date de début <span className="text-red-500">*</span>
                      </label>
                      <input type="date" value={form.startDate}
                        onChange={e => set('startDate', e.target.value)}
                        min={today()}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Date de fin
                        <span className="text-slate-400 font-normal ml-1">(optionnel)</span>
                      </label>
                      <input type="date" value={form.endDate}
                        onChange={e => set('endDate', e.target.value)}
                        min={form.startDate || today()}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"/>
                    </div>
                  </div>

                  {/* Durée calculée */}
                  {nights > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm">
                      <Icon d={Icons.moon} size={14}/>
                      <span><strong>{nights}</strong> {priceUnit}(s) · Total estimé : <strong>{(p.price * nights).toLocaleString()} {p.priceUnit}</strong></span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Message / Notes
                    </label>
                    <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                      rows={3} placeholder="Questions, demandes particulières, informations complémentaires..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"/>
                  </div>

                  <Toggle
                    value={form.isQuote}
                    onChange={v => set('isQuote', v)}
                    label="Demande de devis uniquement"
                    sub="Sans engagement de paiement — le vendeur vous contactera"
                  />

                  <button
                    onClick={() => { if (validateDates()) setStep(2) }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    Continuer <Icon d={Icons.check} size={14}/>
                  </button>
                </div>
              )}
            </div>

            {/* ── Étape 3 : Confirmation ── */}
            <div className={`bg-white rounded-2xl border transition-all overflow-hidden
              ${step === 2 ? 'border-blue-300 shadow-md' : 'border-slate-100 shadow-sm opacity-60'}`}>
              <div className="flex items-center gap-3 p-5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                  ${step === 2 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {form.isQuote ? <Icon d={Icons.file} size={14}/> : <Icon d={Icons.credit} size={14}/>}
                </div>
                <span className="font-semibold text-slate-800 text-sm">
                  {form.isQuote ? 'Envoi de la demande' : 'Paiement'}
                </span>
              </div>

              {step === 2 && (
                <div className="px-5 pb-5 space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                      <Icon d={Icons.x} size={14}/>{error}
                    </div>
                  )}

                  {/* Récap */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm">
                    <p className="font-semibold text-slate-700 mb-3">Récapitulatif</p>
                    <div className="flex justify-between text-slate-600">
                      <span>Bien</span>
                      <span className="font-medium text-slate-800 truncate ml-4 max-w-[200px]">{p.title}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Début</span>
                      <span className="font-medium text-slate-800">{fmt(form.startDate)}</span>
                    </div>
                    {form.endDate && (
                      <div className="flex justify-between text-slate-600">
                        <span>Fin</span>
                        <span className="font-medium text-slate-800">{fmt(form.endDate)}</span>
                      </div>
                    )}
                    {nights > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Durée</span>
                        <span className="font-medium text-slate-800">{nights} {priceUnit}(s)</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-2.5 flex justify-between">
                      <span className="font-semibold text-slate-800">Total</span>
                      <span className="font-bold text-blue-600 text-base">{total.toLocaleString()} {p.priceUnit}</span>
                    </div>
                  </div>

                  {/* Infos devis */}
                  {form.isQuote && (
                    <div className="flex gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 text-xs">
                      <Icon d={Icons.info} size={14} className="flex-shrink-0 mt-0.5"/>
                      <span>Votre demande sera envoyée au vendeur qui vous contactera pour finaliser les modalités.</span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm
                      ${form.isQuote
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}>
                    {submitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                        </svg>
                        Traitement en cours...
                      </>
                    ) : form.isQuote ? (
                      <><Icon d={Icons.file} size={16}/> Envoyer la demande de devis</>
                    ) : (
                      <><Icon d={Icons.credit} size={16}/> Procéder au paiement</>
                    )}
                  </button>

                  {/* Sécurité */}
                  <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <Icon d={Icons.shield} size={12}/> Paiement sécurisé par Stripe · Annulation gratuite sous 24h
                  </p>
                </div>
              )}
            </div>

            {/* Retour */}
            <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              <Icon d={Icons.arrowL} size={14}/> Retour
            </button>
          </div>

          {/* ════════════════════════════════════════
              RÉSUMÉ SIDEBAR (2/5)
          ════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-4">

            {/* Card bien */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
              <div className="h-44 bg-slate-200 relative">
                {p.images?.[0]
                  ? <img src={p.images[0]} className="w-full h-full object-cover" alt={p.title}/>
                  : <div className="w-full h-full flex items-center justify-center"><Icon d={Icons.home} size={40} className="text-slate-400" strokeWidth={1}/></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-bold text-sm truncate">{p.title}</p>
                  <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                    <Icon d={Icons.mapPin} size={10}/>{p.city}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-blue-600">{p.price?.toLocaleString()}</span>
                  <span className="text-sm text-slate-500">{p.priceUnit}</span>
                  {p.listingType === 'RENT' && <span className="text-xs text-slate-400">/mois</span>}
                </div>

                {/* Détail prix */}
                {nights > 0 && (
                  <div className="space-y-1.5 text-sm pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-slate-600">
                      <span>{p.price?.toLocaleString()} × {nights} {priceUnit}(s)</span>
                      <span>{(p.price * nights).toLocaleString()} {p.priceUnit}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                      <span>Total</span>
                      <span className="text-blue-600">{total.toLocaleString()} {p.priceUnit}</span>
                    </div>
                  </div>
                )}

                {/* Caractéristiques */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {p.bedrooms && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Icon d={Icons.bed} size={11}/>{p.bedrooms} ch.
                    </span>
                  )}
                  {p.area && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Icon d={Icons.area} size={11}/>{p.area}m²
                    </span>
                  )}
                  {p.furnished && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                      <Icon d={Icons.check} size={11}/>Meublé
                    </span>
                  )}
                </div>
              </div>

              {/* Garanties */}
              <div className="px-4 pb-4 space-y-2">
                {[
                  [Icons.shield,   'Paiement 100% sécurisé'],
                  [Icons.calendar, 'Annulation flexible'],
                  [Icons.check,    'Réservation confirmée instantanément'],
                ].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-slate-500">
                    <Icon d={icon} size={12} className="text-green-500 flex-shrink-0"/>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}