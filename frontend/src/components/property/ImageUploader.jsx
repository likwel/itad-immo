import { useState, useRef } from 'react'

const Icon = ({ d, size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  upload:  ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4','M17 8l-5-5-5 5','M12 3v12'],
  x:       'M18 6L6 18M6 6l12 12',
  star:    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  image:   ['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z','M12 13a3 3 0 100 6 3 3 0 000-6z'],
  spinner: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  arrowUp: 'M5 15l7-7 7 7',
  arrowDown:'M19 9l-7 7-7-7',
}

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/**
 * ImageUploader
 * Props:
 *   images    : string[]          — URLs actuelles
 *   onChange  : (urls) => void    — callback mise à jour
 *   maxImages : number            — défaut 10
 */
export default function ImageUploader({ images = [], onChange, maxImages = 10 }) {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef()

  // ── Upload vers le backend ──────────────────────────────────
  const uploadFiles = async (files) => {
    if (!files.length) return
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images`)
      return
    }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('images', f))

      const res = await fetch(`${BASE}/upload`, {
        method: 'POST',
        headers: {
          ...(localStorage.getItem('immo_token') && {
            Authorization: `Bearer ${localStorage.getItem('immo_token')}`
          })
        },
        body: fd
      })
      if (!res.ok) throw new Error((await res.json()).message ?? `Erreur ${res.status}`)
      const { urls } = await res.json()
      onChange([...images, ...urls])
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  // ── Supprimer une image ─────────────────────────────────────
  const removeImage = async (url, index) => {
    // Supprimer du serveur
    try {
      await fetch(`${BASE}/upload`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('immo_token') && {
            Authorization: `Bearer ${localStorage.getItem('immo_token')}`
          })
        },
        body: JSON.stringify({ url })
      })
    } catch {}
    onChange(images.filter((_, i) => i !== index))
  }

  // ── Définir comme image principale ──────────────────────────
  const setMain = (index) => {
    if (index === 0) return
    const reordered = [...images]
    const [item] = reordered.splice(index, 1)
    reordered.unshift(item)
    onChange(reordered)
  }

  // ── Réordonner (monter/descendre) ───────────────────────────
  const move = (index, dir) => {
    const next = index + dir
    if (next < 0 || next >= images.length) return
    const reordered = [...images]
    ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
    onChange(reordered)
  }

  // ── Drag & drop ─────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    uploadFiles(files)
  }

  return (
    <div className="space-y-4">

      {/* Zone de dépôt */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${uploading
            ? 'border-blue-300 bg-blue-50/50 cursor-wait'
            : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-blue-500">
            <Icon d={Icons.spinner} size={28} className="animate-spin" strokeWidth={1.5}/>
            <p className="text-sm font-medium">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Icon d={Icons.upload} size={28} strokeWidth={1.5}/>
            <p className="text-sm font-medium text-slate-600">
              Glissez vos photos ici ou <span className="text-blue-600 underline">cliquez pour choisir</span>
            </p>
            <p className="text-xs">JPG, PNG, WEBP — max 5MB par image — {maxImages} max</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => uploadFiles(Array.from(e.target.files))}/>
      </div>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <Icon d={Icons.x} size={13}/>
          {error}
        </p>
      )}

      {/* Galerie */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {images.length} image(s) — la première est l'image principale
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((src, i) => (
              <div key={src + i}
                className={`relative group rounded-xl overflow-hidden bg-slate-100 aspect-video
                  ${i === 0 ? 'ring-2 ring-blue-500' : ''}`}>

                {/* Image */}
                <img src={src} alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = 'https://via.placeholder.com/300x200?text=Erreur' }}/>

                {/* Badge principale */}
                {i === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Icon d={Icons.star} size={9}/>
                    Principale
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Définir comme principale */}
                  {i !== 0 && (
                    <button type="button" onClick={() => setMain(i)}
                      title="Définir comme principale"
                      className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors">
                      <Icon d={Icons.star} size={13}/>
                    </button>
                  )}
                  {/* Monter */}
                  {i > 0 && (
                    <button type="button" onClick={() => move(i, -1)}
                      title="Déplacer avant"
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center justify-center transition-colors">
                      <Icon d={Icons.arrowUp} size={13}/>
                    </button>
                  )}
                  {/* Descendre */}
                  {i < images.length - 1 && (
                    <button type="button" onClick={() => move(i, 1)}
                      title="Déplacer après"
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center justify-center transition-colors">
                      <Icon d={Icons.arrowDown} size={13}/>
                    </button>
                  )}
                  {/* Supprimer */}
                  <button type="button" onClick={() => removeImage(src, i)}
                    title="Supprimer"
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors">
                    <Icon d={Icons.x} size={13}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
