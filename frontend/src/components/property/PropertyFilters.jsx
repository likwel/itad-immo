export default function PropertyFilters({ filters, onChange }) {
  const update = (k, v) => onChange({ ...filters, [k]: v })
  return (
    <div className="card p-5 space-y-5">
      <h3 className="font-semibold text-slate-800">Filtres</h3>

      <div>
        <label className="label">Type d'annonce</label>
        <select className="input text-sm" value={filters.listingType || ''} onChange={e => update('listingType', e.target.value)}>
          <option value="">Tous</option>
          <option value="SALE">Vente</option>
          <option value="RENT">Location</option>
          <option value="VACATION_RENT">Vacances</option>
        </select>
      </div>

      <div>
        <label className="label">Type de bien</label>
        <select className="input text-sm" value={filters.propertyType || ''} onChange={e => update('propertyType', e.target.value)}>
          <option value="">Tous</option>
          <option value="HOUSE">Maison</option>
          <option value="VILLA">Villa</option>
          <option value="APARTMENT">Appartement</option>
          <option value="LAND">Terrain</option>
          <option value="OFFICE">Bureau</option>
        </select>
      </div>

      <div>
        <label className="label">Ville</label>
        <input className="input text-sm" placeholder="Ex: Antananarivo" value={filters.city || ''}
          onChange={e => update('city', e.target.value)}/>
      </div>

      <div>
        <label className="label">Prix max (MGA)</label>
        <input type="number" className="input text-sm" placeholder="Ex: 5000000" value={filters.maxPrice || ''}
          onChange={e => update('maxPrice', e.target.value)}/>
      </div>

      <div>
        <label className="label">Surface min (m²)</label>
        <input type="number" className="input text-sm" placeholder="Ex: 50" value={filters.minArea || ''}
          onChange={e => update('minArea', e.target.value)}/>
      </div>

      <div>
        <label className="label">Chambres min</label>
        <select className="input text-sm" value={filters.bedrooms || ''} onChange={e => update('bedrooms', e.target.value)}>
          <option value="">Indifférent</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
        </select>
      </div>

      <button onClick={() => onChange({})} className="w-full btn-secondary text-sm">
        Réinitialiser
      </button>
    </div>
  )
}
