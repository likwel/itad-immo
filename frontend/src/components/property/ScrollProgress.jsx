import { useState, useEffect } from 'react'

/**
 * Barre de progression de scroll
 * @param {React.RefObject} targetRef — ref sur l'élément scrollable
 */
export default function ScrollProgress({ targetRef }) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const el = targetRef?.current
    if (!el) return
    const fn = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const max = scrollHeight - clientHeight
      setPct(max > 0 ? Math.round((scrollTop / max) * 100) : 100)
    }
    el.addEventListener('scroll', fn)
    fn() // init
    return () => el.removeEventListener('scroll', fn)
  }, [targetRef])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 56, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#3b82f6', borderRadius: 2,
          transition: 'width .15s', width: `${pct}%`,
        }}/>
      </div>
      <span style={{
        fontSize: 10, color: '#94a3b8',
        minWidth: 28, textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {pct}%
      </span>
    </div>
  )
}