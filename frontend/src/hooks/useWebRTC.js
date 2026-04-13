
// ════════════════════════════════════════════════════════════
// hooks/useWebRTC.js — WebRTC broadcaster (HOST)
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLiveSocket } from './useLiveSocket'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // En production, ajouter un serveur TURN :
    // { urls: 'turn:your-turn-server.com', username: '...', credential: '...' }
  ],
}

// ── Hook pour l'HÔTE ─────────────────────────────────────────
export function useWebRTCHost({ liveId, onViewerCount }) {
  const { socket, emit, on } = useLiveSocket()
  const localStream  = useRef(null)
  const peerConns    = useRef({}) // socketId → RTCPeerConnection
  const [streaming,  setStreaming]  = useState(false)
  const [mediaError, setMediaError] = useState(null)
  const localVideoRef = useRef(null)

  // Démarrer la caméra + micro
  const startMedia = useCallback(async ({ video = true, audio = true } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio })
      localStream.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      return stream
    } catch (e) {
      setMediaError(e.message)
      throw e
    }
  }, [])

  // Créer une connexion WebRTC vers un viewer
  const createPeerConnection = useCallback((viewerSocketId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    // Ajouter les tracks du stream local
    localStream.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStream.current)
    })

    // ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        emit('webrtc:ice-candidate', { targetSocketId: viewerSocketId, candidate })
      }
    }

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        pc.close()
        delete peerConns.current[viewerSocketId]
      }
    }

    peerConns.current[viewerSocketId] = pc
    return pc
  }, [emit])

  useEffect(() => {
    if (!liveId) return
    const offs = []

    // Un viewer rejoint → créer une offre WebRTC
    offs.push(on('live:viewer-joined', async ({ viewerSocketId }) => {
      const pc    = createPeerConnection(viewerSocketId)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      emit('webrtc:offer', { targetSocketId: viewerSocketId, offer })
    }))

    // Recevoir la réponse d'un viewer
    offs.push(on('webrtc:answer', async ({ fromSocketId, answer }) => {
      const pc = peerConns.current[fromSocketId]
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }))

    // ICE candidate d'un viewer
    offs.push(on('webrtc:ice-candidate', async ({ fromSocketId, candidate }) => {
      const pc = peerConns.current[fromSocketId]
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }))

    // Viewer quitte → fermer sa connexion
    offs.push(on('live:viewer-left', ({ viewerSocketId }) => {
      peerConns.current[viewerSocketId]?.close()
      delete peerConns.current[viewerSocketId]
    }))

    // Mise à jour compteur viewers
    offs.push(on('live:viewers-update', ({ count }) => onViewerCount?.(count)))

    return () => offs.forEach(off => off?.())
  }, [liveId, on, emit, createPeerConnection, onViewerCount])

  const startBroadcast = useCallback(async () => {
    await startMedia()
    emit('live:start', { liveId })
    setStreaming(true)
  }, [liveId, emit, startMedia])

  const stopBroadcast = useCallback(() => {
    emit('live:end', { liveId })
    localStream.current?.getTracks().forEach(t => t.stop())
    Object.values(peerConns.current).forEach(pc => pc.close())
    peerConns.current = {}
    setStreaming(false)
  }, [liveId, emit])

  return { localVideoRef, streaming, mediaError, startBroadcast, stopBroadcast }
}

// ── Hook pour le VIEWER ──────────────────────────────────────
export function useWebRTCViewer({ liveId }) {
  const { socket, emit, on } = useLiveSocket()
  const pc            = useRef(null)
  const remoteVideoRef = useRef(null)
  const [connected,  setConnected]  = useState(false)
  const [liveEnded,  setLiveEnded]  = useState(false)
  const [viewers,    setViewers]    = useState(0)
  const [messages,   setMessages]   = useState([])
  const [pinned,     setPinned]     = useState(null)
  const [reactions,  setReactions]  = useState([])

  useEffect(() => {
    if (!liveId) return
    const offs = []

    // Rejoindre le live
    emit('live:join', { liveId })

    // Recevoir les infos initiales
    offs.push(on('live:joined', ({ viewerCount }) => setViewers(viewerCount)))
    offs.push(on('live:history', ({ messages }) => setMessages(messages)))

    // Recevoir une offre WebRTC de l'hôte
    offs.push(on('webrtc:offer', async ({ fromSocketId, offer }) => {
      pc.current = new RTCPeerConnection(ICE_SERVERS)

      pc.current.ontrack = ({ streams }) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = streams[0]
        setConnected(true)
      }

      pc.current.onicecandidate = ({ candidate }) => {
        if (candidate) emit('webrtc:ice-candidate', { targetSocketId: fromSocketId, candidate })
      }

      await pc.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.current.createAnswer()
      await pc.current.setLocalDescription(answer)
      emit('webrtc:answer', { targetSocketId: fromSocketId, answer })
    }))

    // ICE candidates de l'hôte
    offs.push(on('webrtc:ice-candidate', async ({ candidate }) => {
      if (pc.current) await pc.current.addIceCandidate(new RTCIceCandidate(candidate))
    }))

    // Réception messages
    offs.push(on('live:message', msg => setMessages(m => [...m, msg])))

    // Réactions animées
    offs.push(on('live:reaction', r => {
      const id = Date.now()
      setReactions(prev => [...prev, { ...r, id }])
      setTimeout(() => setReactions(prev => prev.filter(x => x.id !== id)), 3000)
    }))

    // Viewers
    offs.push(on('live:viewers-update', ({ count }) => setViewers(count)))

    // Message épinglé
    offs.push(on('live:message-pinned', ({ messageId }) => {
      setMessages(prev => {
        const msg = prev.find(m => m.id === messageId)
        setPinned(msg || null)
        return prev
      })
    }))

    // Fin du live
    offs.push(on('live:ended', () => {
      setLiveEnded(true)
      setConnected(false)
      pc.current?.close()
    }))

    return () => {
      offs.forEach(off => off?.())
      pc.current?.close()
    }
  }, [liveId, emit, on])

  const sendMessage = useCallback((content) => {
    emit('live:message', { liveId, content })
  }, [liveId, emit])

  const sendReaction = useCallback((type = 'LIKE') => {
    emit('live:react', { liveId, type })
  }, [liveId, emit])

  const sendShare = useCallback((platform) => {
    emit('live:share', { liveId, platform })
  }, [liveId, emit])

  return {
    remoteVideoRef, connected, liveEnded,
    viewers, messages, pinned, reactions,
    sendMessage, sendReaction, sendShare,
  }
}