/**
 * Toggle switch animé
 * @param {boolean}  value    — état actuel
 * @param {Function} onChange — callback(boolean)
 * @param {string}   label   — libellé affiché à droite
 */
export default function Toggle({ value, onChange, label }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? '#2563eb' : '#cbd5e1',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, width: 18, height: 18,
          background: '#fff', borderRadius: '50%',
          boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          transition: 'transform .2s',
          transform: value ? 'translateX(20px)' : 'translateX(2px)',
        }}/>
      </div>
      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{label}</span>
    </div>
  )
}