
import { useState, useEffect, useCallback } from 'react'
import { useLiveSocket } from './useLiveSocket'

const BASE     = import.meta.env.VITE_API_URL    || 'http://localhost:4000/api'
const MIRO_URL = import.meta.env.VITE_MIRO_URL   || 'http://localhost:3016'
const getToken = () => localStorage.getItem('immo_token')

// Décode le payload JWT pour récupérer le nom de l'utilisateur
const getUserFromToken = () => {
  try {
    const token = getToken()
    if (!token) return null
    return JSON.parse(atob(token.split('.')[1]))
  } catch { return null }
}

// Construit l'URL MiroTalk avec id (= liveId) + name (= prénom de l'utilisateur)
export const getMiroUrl = (type, liveId, user) => {
  // const user = getUserFromToken()
  const name = user?.firstName
    ? encodeURIComponent(`${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`)
    : 'Anonyme'
  return `${MIRO_URL}/${type}?id=${liveId}&name=${name}`
}

// ── Hook hôte ────────────────────────────────────────────────
export function useLiveHost({ liveId }) {
  const { emit, on } = useLiveSocket({ freshConnection: true })

  const [viewers,    setViewers]    = useState(0)
  const [viewerList, setViewerList] = useState([])
  const [messages,   setMessages]   = useState([])
  const [reactions,  setReactions]  = useState([])
  const [likes,      setLikes]      = useState(0)
  const [started,    setStarted]    = useState(false)

  // Enregistrer l'hôte dans la room socket
  useEffect(() => {
    if (!liveId) return
    const register = () => emit('live:start', { liveId })
    const t = setTimeout(register, 600)

    const offs = [
      on('connect',             register),
      on('live:started',        () => setStarted(true)),
      on('live:viewers-update', ({ count, viewers: list }) => {
        setViewers(count)
        if (list) setViewerList(list)
      }),
      on('live:message', msg => setMessages(m => [...m, msg])),
      on('live:reaction', r => {
        setLikes(l => l + 1)
        const rid = Date.now()
        setReactions(p => [...p, { ...r, id: rid }])
        setTimeout(() => setReactions(p => p.filter(x => x.id !== rid)), 3000)
      }),
    ]

    return () => {
      clearTimeout(t)
      offs.forEach(o => o?.())
    }
  }, [liveId, emit, on])

  const sendMessage  = useCallback(c => emit('live:message', { liveId, content: c }), [liveId, emit])
  const setProperty  = useCallback(pId => emit('live:set-property', { liveId, propertyId: pId }), [liveId, emit])

  const endLive = useCallback(async () => {
    await fetch(`${BASE}/lives/${liveId}/end`, {
      method: 'POST', headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {})
    emit('live:end', { liveId })
  }, [liveId, emit])

  return { viewers, viewerList, messages, reactions, likes, started, sendMessage, setProperty, endLive }
}

// ── Hook viewer ───────────────────────────────────────────────
export function useLiveViewer({ liveId }) {
  const { emit, on } = useLiveSocket()

  const [viewers,    setViewers]    = useState(0)
  const [viewerList, setViewerList] = useState([])
  const [messages,   setMessages]   = useState([])
  const [reactions,  setReactions]  = useState([])
  const [pinned,     setPinned]     = useState(null)
  const [liveEnded,  setLiveEnded]  = useState(false)
  const [joinError,  setJoinError]  = useState(null)
  const [waitingHost,setWaitingHost]= useState(false)

  const joinLive = useCallback(() => {
    setJoinError(null)
    emit('live:join', { liveId }, res => {
      if (!res)      return setJoinError('Pas de réponse du serveur')
      if (res.error) return setJoinError(res.error)
      if (res.waiting) {
        setWaitingHost(true)
        setMessages(res.messages ?? [])
        return
      }
      setWaitingHost(false)
      setViewers(res.viewerCount ?? 0)
      setMessages(res.messages ?? [])
    })
  }, [liveId, emit])

  useEffect(() => {
    if (!liveId) return
    const t = setTimeout(joinLive, 600)

    const offs = [
      on('live:host-ready',     () => { setWaitingHost(false); joinLive() }),
      on('live:viewers-update', ({ count, viewers: list }) => {
        setViewers(count)
        if (list) setViewerList(list)
      }),
      on('live:message', msg => setMessages(m => [...m, msg])),
      on('live:message-pinned', ({ messageId }) => {
        setMessages(p => { const m = p.find(x => x.id === messageId); setPinned(m ?? null); return p })
      }),
      on('live:reaction', r => {
        const rid = Date.now()
        setReactions(p => [...p, { ...r, id: rid }])
        setTimeout(() => setReactions(p => p.filter(x => x.id !== rid)), 3000)
      }),
      on('live:ended', () => setLiveEnded(true)),
    ]

    return () => { clearTimeout(t); offs.forEach(o => o?.()) }
  }, [liveId, on, emit, joinLive])

  const sendMessage  = useCallback(c => emit('live:message', { liveId, content: c }), [liveId, emit])
  const sendReaction = useCallback(t => emit('live:react',   { liveId, type: t }),    [liveId, emit])
  const sendShare    = useCallback(p => emit('live:share',   { liveId, platform: p }), [liveId, emit])

  return {
    viewers, viewerList, messages, pinned, reactions,
    liveEnded, joinError, waitingHost,
    sendMessage, sendReaction, sendShare, retryJoin: joinLive,
  }
}
