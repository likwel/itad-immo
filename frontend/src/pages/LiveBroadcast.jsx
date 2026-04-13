
// ════════════════════════════════════════════════════════════
// pages/LiveBroadcast.jsx — PAGE HÔTE
// ════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWebRTCHost } from '../hooks/useWebRTC'
import { useLiveSocket } from '../hooks/useLiveSocket'

export default function LiveBroadcast() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { emit } = useLiveSocket()

  const [viewers,    setViewers]    = useState(0)
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [properties, setProperties] = useState([])

  const { localVideoRef, streaming, mediaError, startBroadcast, stopBroadcast } =
    useWebRTCHost({ liveId: id, onViewerCount: setViewers })

  // Recevoir les messages via socket
  const { on } = useLiveSocket()
  useState(() => {
    const off = on('live:message', msg => setMessages(m => [...m, msg]))
    return off
  })

  const sendMessage = () => {
    if (!input.trim()) return
    emit('live:message', { liveId: id, content: input.trim() })
    setInput('')
  }

  const handleStop = async () => {
    stopBroadcast()
    navigate(`/live/${id}/history`)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold">Tableau de bord — Live</h1>
          {streaming && (
            <div className="flex items-center gap-2 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
              EN DIRECT — {viewers} spectateur{viewers > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <div className="flex flex-col gap-4">

            {/* Aperçu caméra */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover"/>
              {!streaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
                  {mediaError
                    ? <p className="text-red-400 text-sm">{mediaError}</p>
                    : <p className="text-slate-400">Aperçu de votre caméra</p>
                  }
                  <button onClick={startBroadcast}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-sm transition active:scale-95">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>
                    Démarrer le live
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:'Spectateurs', value:viewers     },
                { label:'Messages',    value:messages.length },
                { label:'Durée',       value:'--:--'     },
              ].map(s => (
                <div key={s.label} className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Contrôles */}
            {streaming && (
              <button onClick={handleStop}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition">
                Terminer le live
              </button>
            )}
          </div>

          {/* Chat hôte */}
          <div className="flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden" style={{ maxHeight:'70vh' }}>
            <div className="px-4 py-3 border-b border-slate-700 text-sm font-bold">Chat — {viewers} en ligne</div>
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2" style={{ minHeight:300 }}>
              {messages.map(msg => (
                <div key={msg.id}>
                  <span className={`text-xs font-bold ${msg.isHost ? 'text-blue-400' : 'text-slate-400'}`}>
                    {msg.author?.firstName}
                  </span>
                  <p className="text-sm text-slate-200">{msg.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-3 border-t border-slate-700">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Répondre..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
              <button onClick={sendMessage} disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition">
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}