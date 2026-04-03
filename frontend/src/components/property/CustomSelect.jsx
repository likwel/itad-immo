import { useState, useEffect, useRef } from 'react'

const Icon = ({ d, size = 16, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const CHEV = 'M6 9l6 6 6-6'
const CHECK = 'M20 6L9 17l-5-5'

/**
 * CustomSelect
 * @param {string}   value       — valeur sélectionnée
 * @param {Function} onChange    — callback(value)
 * @param {Array}    options     — [[value, label], ...]
 * @param {string}   placeholder — texte si rien de sélectionné
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Sélectionner...' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = options.find(([v]) => v === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderRadius: 10,
          border: open ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0',
          boxShadow: open ? '0 0 0 3px rgba(59,130,246,.15)' : 'none',
          background: '#fff', cursor: 'pointer',
          transition: 'border .15s, box-shadow .15s', userSelect: 'none',
        }}
      >
        <span style={{
          fontSize: 13,
          color: selected ? '#1e293b' : '#94a3b8',
          fontWeight: selected ? 500 : 400,
        }}>
          {selected ? selected[1] : placeholder}
        </span>
        <Icon d={CHEV} size={14} style={{
          color: '#94a3b8', flexShrink: 0,
          transition: 'transform .2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}/>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,.12)', overflow: 'hidden',
        }}>
          {options.map(([v, l]) => (
            <div
              key={v}
              onClick={() => { onChange(v); setOpen(false) }}
              style={{
                padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                background: v === value ? '#eff6ff' : 'transparent',
                color: v === value ? '#2563eb' : '#334155',
                fontWeight: v === value ? 600 : 400,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background .1s',
              }}
              onMouseEnter={e => { if (v !== value) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (v !== value) e.currentTarget.style.background = 'transparent' }}
            >
              {l}
              {v === value && <Icon d={CHECK} size={13}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}