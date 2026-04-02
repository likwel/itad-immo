import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'

export default function Register() {
  const [form, setForm]   = useState({ firstName:'', lastName:'', email:'', password:'', phone:'', role:'CLIENT' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await register(form); navigate('/') }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="text-slate-500 mt-1">Rejoignez itad-immo aujourd'hui</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom</label>
              <input className="input" value={form.firstName} onChange={e => setForm(f=>({...f,firstName:e.target.value}))} required/>
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input" value={form.lastName} onChange={e => setForm(f=>({...f,lastName:e.target.value}))} required/>
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required/>
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+261 34 00 000 00"/>
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required minLength={8}/>
          </div>
          <div>
            <label className="label">Je suis</label>
            <select className="input" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
              <option value="CLIENT">Chercheur de bien</option>
              <option value="SELLER">Propriétaire / Vendeur</option>
              <option value="AGENCY">Agence immobilière</option>
            </select>
          </div>
          <Button type="submit" loading={loading} className="w-full">Créer mon compte</Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Déjà un compte ? <Link to="/login" className="text-blue-600 font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
