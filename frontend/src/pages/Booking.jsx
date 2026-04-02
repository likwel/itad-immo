import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProperty } from '../services/property.service'
import { createBooking, createPaySession } from '../services/booking.service'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function Booking() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [form, setForm] = useState({ startDate:'', endDate:'', notes:'', isQuote: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // On charge via id — adapter si besoin selon votre routing
    fetch(`${import.meta.env.VITE_API_URL}/properties?limit=1`)
      .then(() => {}) // placeholder, adapter pour charger par id
    getProperty(propertyId).catch(() => {
      // Cherche par id (si le slug n'est pas l'id, adapter le service)
    })
  }, [propertyId])

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true)
    try {
      const booking = await createBooking({ propertyId, ...form })
      if (!form.isQuote) {
        const session = await createPaySession(booking.id)
        window.location.href = session.url
      } else {
        navigate('/espace-client')
      }
    } catch (e) { alert(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="card p-8">
        <h1 className="text-2xl font-bold mb-6">Réservation / Demande</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Date de début *</label>
            <input type="date" className="input" value={form.startDate} required
              onChange={e => setForm(f=>({...f,startDate:e.target.value}))}
              min={new Date().toISOString().split('T')[0]}/>
          </div>
          <div>
            <label className="label">Date de fin (optionnel)</label>
            <input type="date" className="input" value={form.endDate}
              onChange={e => setForm(f=>({...f,endDate:e.target.value}))}
              min={form.startDate}/>
          </div>
          <div>
            <label className="label">Notes / Message</label>
            <textarea className="input resize-none" rows={3} value={form.notes}
              placeholder="Informations complémentaires..."
              onChange={e => setForm(f=>({...f,notes:e.target.value}))}/>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isQuote}
              onChange={e => setForm(f=>({...f,isQuote:e.target.checked}))}
              className="w-4 h-4 rounded"/>
            <span className="text-sm text-slate-700">Demande de devis uniquement (sans paiement)</span>
          </label>
          <Button type="submit" loading={loading} className="w-full">
            {form.isQuote ? '📋 Envoyer la demande' : '💳 Passer au paiement'}
          </Button>
        </form>
      </div>
    </div>
  )
}
