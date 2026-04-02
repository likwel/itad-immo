import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [users, setUsers]   = useState([])
  const [props, setProps]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    Promise.all([
      api('/admin/stats'),
      api('/admin/users?limit=20'),
      api('/admin/properties?limit=20')
    ]).then(([s, u, p]) => { setStats(s); setUsers(u.data); setProps(p.data) })
    .catch(console.error).finally(() => setLoading(false))
  }, [])

  const toggleUser = async id => {
    await api(`/admin/users/${id}/toggle`, { method:'PUT' })
    setUsers(u => u.map(user => user.id === id ? { ...user, isActive: !user.isActive } : user))
  }

  const moderate = async (id, status) => {
    await api(`/admin/properties/${id}/moderate`, { method:'PUT', body: JSON.stringify({ status }) })
    setProps(p => p.map(prop => prop.id === id ? { ...prop, status } : prop))
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">Administration</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
        {[['dashboard','Tableau de bord'],['users','Utilisateurs'],['properties','Biens'],['reviews','Avis']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {[
              ['👥', 'Utilisateurs', stats.users, 'blue'],
              ['🏠', 'Biens actifs', stats.properties, 'green'],
              ['📅', 'Réservations', stats.bookings, 'yellow'],
              ['💰', 'Revenus', `${stats.revenue?.toLocaleString()} €`, 'purple'],
            ].map(([icon, label, value, color]) => (
              <div key={label} className={`card p-5 border-l-4 ${color === 'blue' ? 'border-blue-500' : color === 'green' ? 'border-green-500' : color === 'yellow' ? 'border-yellow-500' : 'border-purple-500'}`}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          {stats.pendingProps > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <span className="text-yellow-800 font-medium">{stats.pendingProps} bien(s) en attente de modération</span>
              <Button variant="secondary" className="ml-auto text-sm py-1.5" onClick={() => setTab('properties')}>Voir</Button>
            </div>
          )}
        </>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Nom','Email','Rôle','Biens','Résa','Statut','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant={u.role === 'ADMIN' ? 'red' : u.role === 'SELLER' ? 'green' : 'blue'}>{u.role}</Badge></td>
                    <td className="px-4 py-3">{u._count?.properties}</td>
                    <td className="px-4 py-3">{u._count?.bookings}</td>
                    <td className="px-4 py-3"><Badge variant={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Actif' : 'Inactif'}</Badge></td>
                    <td className="px-4 py-3">
                      <Button variant={u.isActive ? 'danger' : 'secondary'} onClick={() => toggleUser(u.id)} className="text-xs py-1 px-3">
                        {u.isActive ? 'Désactiver' : 'Réactiver'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'properties' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Titre','Ville','Type','Prix','Statut','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {props.map(p => (
                  <tr key={p.id} className={`hover:bg-slate-50 ${p.status === 'PENDING' ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{p.title}</td>
                    <td className="px-4 py-3 text-slate-500">{p.city}</td>
                    <td className="px-4 py-3"><Badge variant="gray">{p.listingType}</Badge></td>
                    <td className="px-4 py-3">{p.price?.toLocaleString()} MGA</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'ACTIVE' ? 'green' : p.status === 'PENDING' ? 'yellow' : 'gray'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {p.status === 'PENDING' && (
                        <Button variant="secondary" onClick={() => moderate(p.id, 'ACTIVE')} className="text-xs py-1 px-2">✓ Valider</Button>
                      )}
                      {p.status !== 'ARCHIVED' && (
                        <Button variant="danger" onClick={() => moderate(p.id, 'ARCHIVED')} className="text-xs py-1 px-2">Archiver</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
