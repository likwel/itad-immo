import { useState } from 'react'
import { useSelector } from 'react-redux'
import PropertyCard from '../components/property/PropertyCard'
import PropertyFilters from '../components/property/PropertyFilters'
import { useProperties } from '../hooks/useProperties'
import { useGeolocation } from '../hooks/useGeolocation'
import Spinner from '../components/ui/Spinner'

export default function Listings() {
  const savedFilters = useSelector(s => s.properties.filters)
  const [filters, setFilters] = useState({ page: 1, limit: 12, ...savedFilters })
  const { location } = useGeolocation()
  const activeFilters = location ? { ...filters, lat: location.lat, lng: location.lng } : filters
  const { properties, total, totalPages, loading } = useProperties(activeFilters)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
      <aside className="w-72 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24">
          <PropertyFilters filters={filters} onChange={f => setFilters({ ...f, page: 1 })}/>
        </div>
      </aside>
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-600">
            <span className="font-bold text-slate-900">{total}</span> biens trouvés
            {location && <span className="text-xs text-blue-600 ml-2">· triés par proximité</span>}
          </p>
          <select value={`${filters.sortBy||'createdAt'}_${filters.sortDir||'desc'}`}
            onChange={e => { const [s,d] = e.target.value.split('_'); setFilters(f => ({ ...f, sortBy:s, sortDir:d })) }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="createdAt_desc">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="viewCount_desc">Plus vus</option>
          </select>
        </div>
        {loading ? <Spinner /> : properties.length === 0
          ? <div className="text-center py-20 text-slate-500"><div className="text-6xl mb-4">🔍</div><p>Aucun bien trouvé avec ces critères</p></div>
          : <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map(p => <PropertyCard key={p.id} property={p}/>)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10 flex-wrap">
                  {Array.from({ length: totalPages }, (_,i) => i+1).map(p => (
                    <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${filters.page === p ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-slate-50'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
        }
      </main>
    </div>
  )
}
