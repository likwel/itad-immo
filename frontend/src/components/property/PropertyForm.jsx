import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import CustomSelect from './CustomSelect'
import ImageUploader from './ImageUploader'
import Toggle from './Toggle'

// ── Icônes ────────────────────────────────────────────────────
const Icon = ({ d, size = 14, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const ICONS = {
  home:    'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  trend:   'M23 6l-9.5 9.5-5-5L1 18',
  pin:     ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 7a3 3 0 100 6 3 3 0 000-6z'],
  star:    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  image:     ['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z','M12 13a3 3 0 100 6 3 3 0 000-6z'],
}

const PROPERTY_TYPES = [
  ['HOUSE','Maison'],['VILLA','Villa'],['APARTMENT','Appartement'],
  ['LAND','Terrain'],['OFFICE','Bureau'],['WAREHOUSE','Entrepôt'],
]
const LISTING_TYPES = [
  ['SALE','Vente'],['RENT','Location'],['VACATION_RENT','Vacances'],
]
const AMENITIES_LIST = [
  'wifi','piscine','garage','jardin','sécurité',
  'ascenseur','meublé','climatisation','balcon','terrasse',
]

export const EMPTY_FORM = {
  title: '', description: '', propertyType: 'HOUSE', listingType: 'RENT',
  price: '', priceUnit: 'MGA', area: '', bedrooms: '', bathrooms: '',
  address: '', city: '', district: '', furnished: false, negotiable: false,
  amenities: [], categoryId: '', images: [],
}

// ── Sous-composants internes ──────────────────────────────────
const Label = ({ children, required }) => (
  <label style={{
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#64748b', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '.04em',
  }}>
    {children}
    {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
  </label>
)

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  background: '#fff', transition: 'border .15s, box-shadow .15s',
}

const Input = ({ label, required, ...props }) => (
  <div>
    <Label required={required}>{label}</Label>
    <input
      style={inputStyle}
      onFocus={e => { e.target.style.border = '1.5px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)' }}
      onBlur={e => { e.target.style.border = '1.5px solid #e2e8f0'; e.target.style.boxShadow = 'none' }}
      {...props}
    />
  </div>
)

const Textarea = ({ label, required, rows = 3, ...props }) => (
  <div>
    <Label required={required}>{label}</Label>
    <textarea
      rows={rows}
      style={{ ...inputStyle, resize: 'none' }}
      onFocus={e => { e.target.style.border = '1.5px solid #3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,.15)' }}
      onBlur={e => { e.target.style.border = '1.5px solid #e2e8f0'; e.target.style.boxShadow = 'none' }}
      {...props}
    />
  </div>
)

const SectionTitle = ({ icon, color, bg, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
    <div style={{ width: 24, height: 24, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon d={icon} size={12} style={{ color }}/>
    </div>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em' }}>
      {children}
    </span>
  </div>
)

const Separator = () => (
  <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0 18px' }}/>
)

// ── PropertyForm (forwardRef pour exposer validate()) ─────────
const PropertyForm = forwardRef(function PropertyForm({ initial, categories = [] }, ref) {
  const [form, setForm] = useState(initial
    ? { ...EMPTY_FORM, ...initial }
    : { ...EMPTY_FORM }
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleAmenity = (a) => set('amenities',
    form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a]
  )

  // ── Exposer validate() au parent via ref ──────────────────
  // On utilise useImperativeHandle + un ref sur form pour toujours
  // lire la valeur courante sans closure périmée
  const formRef = useRef(form)
  formRef.current = form

  useImperativeHandle(ref, () => ({
    validate() {
      const f = formRef.current
      if (!f.title?.trim())       return { error: 'Le titre est requis' }
      if (!f.description?.trim()) return { error: 'La description est requise' }
      if (!f.propertyType)        return { error: 'Le type de bien est requis' }
      if (!f.listingType)         return { error: "Le type d'annonce est requis" }
      if (!f.price)               return { error: 'Le prix est requis' }
      if (!f.address?.trim())     return { error: "L'adresse est requise" }
      if (!f.city?.trim())        return { error: 'La ville est requise' }
      return { data: f }
    }
  }), [])

  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const g3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Infos générales ── */}
      <SectionTitle icon={ICONS.home} color="#3b82f6" bg="#eff6ff">
        Informations générales
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <Input label="Titre" required
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Ex : Belle villa avec piscine à Ivandry"
        />
        <Textarea label="Description" required
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Décrivez votre bien..."
        />
        <div style={g2}>
          <div>
            <Label required>Type de bien</Label>
            <CustomSelect
              value={form.propertyType}
              onChange={v => set('propertyType', v)}
              options={PROPERTY_TYPES}
            />
          </div>
          <div>
            <Label required>Type d'annonce</Label>
            <CustomSelect
              value={form.listingType}
              onChange={v => set('listingType', v)}
              options={LISTING_TYPES}
            />
          </div>
        </div>
        {categories.length > 0 && (
          <div>
            <Label>Catégorie</Label>
            <CustomSelect
              value={form.categoryId}
              onChange={v => set('categoryId', v)}
              options={categories.map(c => [c.id, c.name])}
              placeholder="Sélectionner une catégorie..."
            />
          </div>
        )}
      </div>

      <Separator/>

      {/* ── Prix & surface ── */}
      <SectionTitle icon={ICONS.trend} color="#22c55e" bg="#f0fdf4">
        Prix & Surface
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <div style={g2}>
          <Input label="Prix" required type="number" min={0}
            value={form.price}
            onChange={e => set('price', e.target.value)}
            placeholder="0"
          />
          <div>
            <Label>Devise</Label>
            <CustomSelect
              value={form.priceUnit}
              onChange={v => set('priceUnit', v)}
              options={[['MGA','MGA — Ariary'],['EUR','EUR — Euro'],['USD','USD — Dollar']]}
            />
          </div>
        </div>
        <div style={g3}>
          <Input label="Surface m²" type="number" min={0}
            value={form.area} onChange={e => set('area', e.target.value)} placeholder="0"/>
          <Input label="Chambres" type="number" min={0}
            value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="0"/>
          <Input label="SDB" type="number" min={0}
            value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} placeholder="0"/>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Toggle value={form.furnished}  onChange={v => set('furnished', v)}  label="Meublé"/>
          <Toggle value={form.negotiable} onChange={v => set('negotiable', v)} label="Prix négociable"/>
        </div>
      </div>

      <Separator/>

      {/* ── Localisation ── */}
      <SectionTitle icon={ICONS.pin} color="#ef4444" bg="#fef2f2">
        Localisation
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <Input label="Adresse" required
          value={form.address}
          onChange={e => set('address', e.target.value)}
          placeholder="Ex : Lot IV 15, Rue de l'Indépendance"
        />
        <div style={g2}>
          <Input label="Ville" required
            value={form.city}
            onChange={e => set('city', e.target.value)}
            placeholder="Antananarivo"
          />
          <Input label="Quartier"
            value={form.district}
            onChange={e => set('district', e.target.value)}
            placeholder="Ivandry"
          />
        </div>
      </div>

      <Separator/>

      {/* ── Photos ── */}
      <SectionTitle icon={ICONS.image} color="#a855f7" bg="#faf5ff">
        Photos
      </SectionTitle>
      <div style={{ marginBottom: 20 }}>
        <ImageUploader
          images={form.images}
          onChange={urls => set('images', urls)}
          maxImages={10}
        />
      </div>

      <Separator/>

      {/* ── Équipements ── */}
      <SectionTitle icon={ICONS.star} color="#f59e0b" bg="#fffbeb">
        Équipements
      </SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {AMENITIES_LIST.map(a => (
          <div key={a} onClick={() => toggleAmenity(a)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', userSelect: 'none', transition: 'all .15s',
            background: form.amenities.includes(a) ? '#2563eb' : '#f1f5f9',
            color:       form.amenities.includes(a) ? '#fff'    : '#475569',
          }}>
            {a}
          </div>
        ))}
      </div>

      <div style={{ height: 8 }}/>
    </div>
  )
})

export default PropertyForm