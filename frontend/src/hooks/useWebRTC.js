
// ════════════════════════════════════════════════════════════
// hooks/useWebRTC.js — WebRTC broadcaster (HOST)
// ════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLiveSocket, getSocket } from './useLiveSocket'

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
  const { socket, emit, on } = useLiveSocket({ freshConnection: true })
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

    // Re-émettre live:start à chaque reconnexion socket
    const handleReconnect = () => {
      console.log('🔄 Socket reconnecté, re-enregistrement...')
      emit('live:start', { liveId })
    }
    const s = getSocket()
    s.on('connect', handleReconnect)

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

    return () => {
      s.off('connect', handleReconnect)
      offs.forEach(off => off?.())
    }
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
  const pc             = useRef(null)
  const remoteVideoRef = useRef(null)
  const retryTimer     = useRef(null)
  const [connected,     setConnected]     = useState(false)
  const [liveEnded,     setLiveEnded]     = useState(false)
  const [waitingHost,   setWaitingHost]   = useState(false)
  const [viewers,       setViewers]       = useState(0)
  const [messages,      setMessages]      = useState([])
  const [pinned,        setPinned]        = useState(null)
  const [reactions,     setReactions]     = useState([])
  const [joinError,     setJoinError]     = useState(null)

  const joinLive = useCallback(() => {
    setJoinError(null)
    emit('live:join', { liveId })
  }, [liveId, emit])

  useEffect(() => {
    if (!liveId) return
    const offs = []

    // Rejoindre avec un léger délai pour laisser le socket s'établir
    const joinTimer = setTimeout(joinLive, 500)

    offs.push(on('live:joined',       ({ viewerCount }) => { setViewers(viewerCount); setWaitingHost(false) }))
    offs.push(on('live:history',      ({ messages })    => setMessages(messages)))
    offs.push(on('live:waiting-host', ()               => { setWaitingHost(true); setJoinError(null) }))
    offs.push(on('live:host-ready',   ()               => { setWaitingHost(false); joinLive() }))

    offs.push(on('error', ({ message }) => {
      setJoinError(message)
      // Retry après 3s si le live n'est pas disponible
      if (message !== 'Live non disponible') {
        retryTimer.current = setTimeout(joinLive, 3000)
      }
    }))

    offs.push(on('webrtc:offer', async ({ fromSocketId, offer }) => {
      console.log('📨 [VIEWER] webrtc:offer reçu de', fromSocketId)

      if (pc.current) { pc.current.close(); pc.current = null }

      pc.current = new RTCPeerConnection(ICE_SERVERS)
      console.log('🔧 [VIEWER] PeerConnection créé, état:', pc.current.signalingState)

      pc.current.ontrack = ({ streams, track }) => {
        console.log('🎥 [VIEWER] ontrack fired! track:', track.kind, 'streams:', streams.length)
        if (remoteVideoRef.current && streams[0]) {
          remoteVideoRef.current.srcObject = streams[0]
          console.log('✅ [VIEWER] srcObject set, tracks:', streams[0].getTracks().length)
          remoteVideoRef.current.play()
            .then(() => { console.log('▶️ [VIEWER] video.play() OK'); setConnected(true) })
            .catch(e => { console.warn('⚠️ [VIEWER] video.play() erreur:', e); setConnected(true) })
        }
      }

      pc.current.onicecandidate = ({ candidate }) => {
        if (candidate) {
          console.log('🧊 [VIEWER] ICE candidate envoyé')
          emit('webrtc:ice-candidate', { targetSocketId: fromSocketId, candidate })
        }
      }

      pc.current.oniceconnectionstatechange = () => {
        console.log('🔗 [VIEWER] ICE state:', pc.current?.iceConnectionState)
      }

      pc.current.onconnectionstatechange = () => {
        console.log('📡 [VIEWER] Connection state:', pc.current?.connectionState)
        if (pc.current?.connectionState === 'connected') setConnected(true)
        if (['disconnected','failed'].includes(pc.current?.connectionState)) {
          setConnected(false)
          retryTimer.current = setTimeout(joinLive, 2000)
        }
      }

      try {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer))
        console.log('✅ [VIEWER] setRemoteDescription OK')
        const answer = await pc.current.createAnswer()
        await pc.current.setLocalDescription(answer)
        console.log('✅ [VIEWER] answer créé, envoi à', fromSocketId)
        emit('webrtc:answer', { targetSocketId: fromSocketId, answer })
      } catch (e) {
        console.error('❌ [VIEWER] Erreur WebRTC:', e)
      }
    }))

    offs.push(on('webrtc:ice-candidate', async ({ candidate }) => {
      try {
        if (pc.current?.remoteDescription) {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch (e) { console.warn('ICE candidate ignoré:', e.message) }
    }))

    offs.push(on('live:message',        msg  => setMessages(m => [...m, msg])))
    offs.push(on('live:viewers-update', ({ count }) => setViewers(count)))
    offs.push(on('live:reaction',       r => {
      const id = Date.now()
      setReactions(prev => [...prev, { ...r, id }])
      setTimeout(() => setReactions(prev => prev.filter(x => x.id !== id)), 3000)
    }))
    offs.push(on('live:message-pinned', ({ messageId }) => {
      setMessages(prev => { const msg = prev.find(m => m.id === messageId); setPinned(msg || null); return prev })
    }))
    offs.push(on('live:ended', () => {
      setLiveEnded(true); setConnected(false)
      pc.current?.close(); pc.current = null
      clearTimeout(retryTimer.current)
    }))

    return () => {
      clearTimeout(joinTimer)
      clearTimeout(retryTimer.current)
      offs.forEach(off => off?.())
      pc.current?.close(); pc.current = null
    }
  }, [liveId, emit, on, joinLive])

  const sendMessage  = useCallback((content)   => emit('live:message', { liveId, content }),  [liveId, emit])
  const sendReaction = useCallback((type='LIKE')=> emit('live:react',   { liveId, type }),     [liveId, emit])
  const sendShare    = useCallback((platform)   => emit('live:share',   { liveId, platform }), [liveId, emit])

  return {
    remoteVideoRef, connected, liveEnded, waitingHost, joinError,
    viewers, messages, pinned, reactions,
    sendMessage, sendReaction, sendShare, retryJoin: joinLive,
  }
}