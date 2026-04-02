import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { user } = await login(form.email, form.password)
      const routes = { ADMIN:'/admin', SELLER:'/espace-vendeur', AGENCY:'/espace-vendeur', CLIENT:'/espace-client' }
      navigate(routes[user.role] || '/')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-2xl font-bold text-slate-800">Connexion</h1>
          <p className="text-slate-500 mt-1">Bon retour sur itad-immo</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required/>
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input type="password" className="input" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required/>
          </div>
          <Button type="submit" loading={loading} className="w-full mt-2">Se connecter</Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Pas de compte ? <Link to="/register" className="text-blue-600 font-medium hover:underline">S'inscrire</Link>
        </p>
        <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
          <p className="font-medium mb-1">Comptes démo :</p>
          <p>👑 admin@itad-immo.mg / Admin1234!</p>
          <p>🏠 vendeur@itad-immo.mg / Seller123!</p>
          <p>👤 client@itad-immo.mg / Client123!</p>
        </div>
      </div>
    </div>
  )
}
