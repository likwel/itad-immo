import { useState, useEffect, useRef } from 'react'
import PropertyForm from './PropertyForm'
import ScrollProgress from './ScrollProgress'

// ── Icônes ────────────────────────────────────────────────────
const Icon = ({ d, size = 16, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const ICONS = {
  plus:     'M12 5v14M5 12h14',
  edit:     ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7','M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  check:    'M20 6L9 17l-5-5',
  x:        'M18 6L6 18M6 6l12 12',
  expand:   ['M8 3H5a2 2 0 00-2 2v3','M21 3h-3a2 2 0 012 2v3','M8 21H5a2 2 0 01-2-2v-3','M21 21h-3a2 2 0 002-2v-3'],
  collapse: ['M15 3h6v6','M9 21H3v-6','M21 3l-7 7','M3 21l7-7'],
  spinner:  'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
}

/**
 * PropertyModal
 * @param {boolean}   isOpen     — afficher ou non
 * @param {object}    editProp   — bien à modifier (null = création)
 * @param {Array}     categories — liste [{id, name}]
 * @param {boolean}   saving     — état de sauvegarde
 * @param {Function}  onSave     — callback(formData)
 * @param {Function}  onClose    — fermer le modal
 */
export default function PropertyModal({ isOpen, editProp, categories = [], saving, onSave, onClose }) {
  const [expanded, setExpanded] = useState(false)
  const [error,    setError]    = useState('')
  const bodyRef   = useRef()
  const formRef   = useRef()   // ref vers PropertyForm pour appeler validate()

  // Reset à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setExpanded(false)
      setError('')
    }
  }, [isOpen])

  // Escape pour fermer
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [saving, onClose])

  if (!isOpen) return null

  const handleSave = () => {
    if (!formRef.current) return
    const result = formRef.current.validate()  // ← appel direct, pas de closure
    if (result.error) {
      setError(result.error)
      // Scroll vers le haut pour voir l'erreur
      if (bodyRef.current) bodyRef.current.scrollTop = 0
      return
    }
    setError('')
    onSave(result.data)
  }

  const r = expanded ? 0 : 16  // border-radius

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: expanded ? 0 : 16,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Overlay */}
      {!expanded && (
        <div
          onClick={() => !saving && onClose()}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Panel */}
      <div style={{
        ...(expanded
          ? { position: 'fixed', inset: 0 }
          : { position: 'relative', width: '100%', maxWidth: 680, maxHeight: '92vh' }
        ),
        background: '#fff', display: 'flex', flexDirection: 'column',
        borderRadius: r, overflow: 'hidden', zIndex: 1,
        boxShadow: expanded ? 'none' : '0 20px 60px rgba(0,0,0,.2)',
        transition: 'border-radius .2s',
      }}>

        {/* ── Header ── */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fff',
        }}>
          {/* Gauche — icône + titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon d={editProp ? ICONS.edit : ICONS.plus} size={15} style={{ color: '#2563eb' }}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>
                {editProp ? "Modifier l'annonce" : 'Nouvelle annonce'}
              </div>
              {editProp && (
                <div style={{
                  fontSize: 11, color: '#94a3b8', marginTop: 1,
                  maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {editProp.title}
                </div>
              )}
            </div>
          </div>

          {/* Droite — scroll progress + expand + close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <ScrollProgress targetRef={bodyRef}/>

            {/* Toggle plein écran */}
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 12, fontWeight: 600, color: '#475569',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <Icon d={expanded ? ICONS.collapse : ICONS.expand} size={13}/>
              <span>{expanded ? 'Réduire' : 'Plein écran'}</span>
            </button>

            {/* Fermer */}
            <button
              onClick={() => !saving && onClose()}
              disabled={saving}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
            >
              <Icon d={ICONS.x} size={17}/>
            </button>
          </div>
        </div>

        {/* ── Barre d'erreur ── */}
        {error && (
          <div style={{
            flexShrink: 0, padding: '10px 20px',
            background: '#fef2f2', borderBottom: '1px solid #fecaca',
            fontSize: 13, color: '#dc2626',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon d={ICONS.x} size={14}/> {error}
          </div>
        )}

        {/* ── Body scrollable ── */}
        <div
          ref={bodyRef}
          style={{
            flex: 1, overflowY: 'auto', padding: '20px 20px 8px',
            scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent',
          }}
        >
          <PropertyForm
            ref={formRef}
            initial={editProp}
            categories={categories}
          />
        </div>

        {/* ── Footer fixe ── */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          padding: '12px 20px', borderTop: '1px solid #f1f5f9',
          background: 'rgba(248,250,252,0.97)', backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {editProp ? 'Modifiez puis sauvegardez' : 'Les champs * sont obligatoires'}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Annuler */}
            <button
              onClick={() => !saving && onClose()}
              disabled={saving}
              style={{
                padding: '8px 18px', borderRadius: 10,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#475569',
                cursor: saving ? 'not-allowed' : 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Annuler
            </button>

            {/* Sauvegarder */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 20px', borderRadius: 10, border: 'none',
                background: saving ? '#93c5fd' : '#2563eb',
                fontSize: 13, fontWeight: 600, color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,.3)', transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#1d4ed8' }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#2563eb' }}
            >
              {saving ? (
                <>
                  <Icon d={ICONS.spinner} size={14} style={{ animation: 'spin 1s linear infinite' }}/>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Icon d={ICONS.check} size={14}/>
                  {editProp ? 'Enregistrer' : "Publier l'annonce"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}