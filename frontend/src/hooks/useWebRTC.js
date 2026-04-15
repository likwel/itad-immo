import { useState, useEffect, useRef, useCallback } from 'react'
import { useLiveSocket, getSocket } from './useLiveSocket'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

// ════════════════════════════════════════════════════════════
// useWebRTCHost
// ════════════════════════════════════════════════════════════
export function useWebRTCHost({ liveId, onViewerCount, onMessage, onReaction }) {
  const { emit, on }  = useLiveSocket({ freshConnection: true })
  const streamRef     = useRef(null)
  const peersRef      = useRef({})
  const pendingRef    = useRef([])
  const localVideoRef = useRef(null)

  // Enregistrement (MediaRecorder)
  const recorderRef   = useRef(null)
  const chunksRef     = useRef([])

  const onViewerCountRef = useRef(onViewerCount)
  const onMessageRef     = useRef(onMessage)
  const onReactionRef    = useRef(onReaction)
  useEffect(() => { onViewerCountRef.current = onViewerCount }, [onViewerCount])
  useEffect(() => { onMessageRef.current     = onMessage     }, [onMessage])
  useEffect(() => { onReactionRef.current    = onReaction    }, [onReaction])

  const [streaming,   setStreaming]   = useState(false)
  const [mediaError,  setMediaError]  = useState(null)
  const [micOn,       setMicOn]       = useState(true)
  const [camOn,       setCamOn]       = useState(true)
  const [recording,   setRecording]   = useState(false)

  // ── Créer une PeerConnection vers un viewer ───────────────
  const createPeer = useCallback((viewerSocketId) => {
    if (peersRef.current[viewerSocketId]) {
      peersRef.current[viewerSocketId].close()
    }
    const pc = new RTCPeerConnection(ICE_SERVERS)
    streamRef.current?.getTracks().forEach(t => pc.addTrack(t, streamRef.current))

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        // ✅ targetSocketId
        emit('webrtc:ice-candidate', { targetSocketId: viewerSocketId, candidate })
      }
    }
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        pc.close()
        delete peersRef.current[viewerSocketId]
      }
    }
    peersRef.current[viewerSocketId] = pc
    return pc
  }, [emit])

  // ── Envoyer offre à un viewer ─────────────────────────────
  const sendOffer = useCallback(async (viewerSocketId) => {
    const pc    = createPeer(viewerSocketId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    // ✅ targetSocketId
    emit('webrtc:offer', { targetSocketId: viewerSocketId, offer })
  }, [createPeer, emit])

  // ── Démarrer le broadcast ─────────────────────────────────
  const startBroadcast = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      emit('live:start', { liveId })
      setStreaming(true)

      const waiting = [...pendingRef.current]
      pendingRef.current = []
      for (const sid of waiting) await sendOffer(sid)
    } catch (e) {
      console.error('[HOST] erreur démarrage:', e)
      setMediaError(e.message)
    }
  }, [liveId, emit, sendOffer])

  // ── Arrêter ───────────────────────────────────────────────
  const stopBroadcast = useCallback(() => {
    recorderRef.current?.state === 'recording' && recorderRef.current.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    Object.values(peersRef.current).forEach(pc => pc.close())
    emit('live:end', { liveId })
    peersRef.current   = {}
    pendingRef.current = []
    setStreaming(false)
    setRecording(false)
  }, [liveId, emit])

  // ── Enregistrement local ──────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current || recorderRef.current) return
    chunksRef.current = []
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9,opus' })
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `live-${liveId}-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)
      recorderRef.current = null
      setRecording(false)
    }
    mr.start(1000) // chunk toutes les secondes
    recorderRef.current = mr
    setRecording(true)
  }, [liveId])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  // ── Toggle micro ──────────────────────────────────────────
  const toggleMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn })
    setMicOn(v => !v)
  }, [micOn])

  // ── Toggle caméra ─────────────────────────────────────────
  const toggleCam = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn })
    setCamOn(v => !v)
  }, [camOn])

  // ── Socket listeners ──────────────────────────────────────
  useEffect(() => {
    if (!liveId) return

    const registerHost = () => emit('live:start', { liveId })
    const t = setTimeout(registerHost, 600)
    const s = getSocket(true)
    s.on('connect', registerHost)

    const offs = [
      on('live:started', () => console.log('[HOST] ✅ live:started')),

      // ✅ viewerSocketId
      on('live:viewer-joined', async ({ viewerSocketId, viewerCount }) => {
        onViewerCountRef.current?.(viewerCount)
        if (!streamRef.current?.getTracks().length) {
          pendingRef.current.push(viewerSocketId)
        } else {
          await sendOffer(viewerSocketId)
        }
      }),

      // ✅ fromSocketId
      on('webrtc:answer', async ({ fromSocketId, answer }) => {
        const pc = peersRef.current[fromSocketId]
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer))
      }),

      // ✅ fromSocketId
      on('webrtc:ice-candidate', async ({ fromSocketId, candidate }) => {
        const pc = peersRef.current[fromSocketId]
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
        }
      }),

      // ✅ viewerSocketId
      on('live:viewer-left', ({ viewerSocketId }) => {
        peersRef.current[viewerSocketId]?.close()
        delete peersRef.current[viewerSocketId]
      }),

      on('live:viewers-update', ({ count }) => onViewerCountRef.current?.(count)),
      on('live:message',        msg          => onMessageRef.current?.(msg)),
      on('live:reaction',       r            => onReactionRef.current?.(r)),
    ]

    return () => {
      clearTimeout(t)
      s.off('connect', registerHost)
      offs.forEach(o => o?.())
    }
  }, [liveId, on, emit, sendOffer])

  return {
    localVideoRef, streaming, mediaError,
    micOn, camOn, recording,
    startBroadcast, stopBroadcast,
    toggleMic, toggleCam,
    startRecording, stopRecording,
  }
}

// ════════════════════════════════════════════════════════════
// useWebRTCViewer
// ════════════════════════════════════════════════════════════
export function useWebRTCViewer({ liveId }) {
  const { emit, on }   = useLiveSocket()
  const pcRef          = useRef(null)
  const remoteVideoRef = useRef(null)
  const retryRef       = useRef(null)
  // ✅ File d'attente ICE candidates reçus avant setRemoteDescription
  const iceCandQueueRef = useRef([])

  const [connected,   setConnected]   = useState(false)
  const [liveEnded,   setLiveEnded]   = useState(false)
  const [waitingHost, setWaitingHost] = useState(false)
  const [viewers,     setViewers]     = useState(0)
  const [viewerList,  setViewerList]  = useState([])
  const [messages,    setMessages]    = useState([])
  const [pinned,      setPinned]      = useState(null)
  const [reactions,   setReactions]   = useState([])
  const [joinError,   setJoinError]   = useState(null)

  const joinLive = useCallback(() => {
    setJoinError(null)
    emit('live:join', { liveId }, (res) => {
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
      on('live:host-ready', () => {
        setWaitingHost(false)
        joinLive()
      }),

      on('error', ({ message }) => {
        setJoinError(message)
        if (message !== 'Live non disponible') {
          retryRef.current = setTimeout(joinLive, 3000)
        }
      }),

      // ✅ fromSocketId + ICE queue
      on('webrtc:offer', async ({ fromSocketId, offer }) => {
        if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
        iceCandQueueRef.current = []

        const pc = new RTCPeerConnection(ICE_SERVERS)
        pcRef.current = pc

        pc.ontrack = ({ streams, track }) => {
          if (remoteVideoRef.current && streams[0]) {
            remoteVideoRef.current.srcObject = streams[0]
            remoteVideoRef.current.play()
              .then(() => setConnected(true))
              .catch(() => setConnected(true))
          }
        }

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            // ✅ targetSocketId
            emit('webrtc:ice-candidate', { targetSocketId: fromSocketId, candidate })
          }
        }

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') setConnected(true)
          if (['disconnected', 'failed'].includes(pc.connectionState)) {
            setConnected(false)
            retryRef.current = setTimeout(joinLive, 2000)
          }
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer))

          // ✅ Vider la file d'attente ICE
          for (const c of iceCandQueueRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
          }
          iceCandQueueRef.current = []

          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          // ✅ targetSocketId
          emit('webrtc:answer', { targetSocketId: fromSocketId, answer })
        } catch (e) {
          console.error('[VIEWER] WebRTC erreur:', e)
        }
      }),

      // ✅ fromSocketId + mise en file si pas encore de remoteDescription
      on('webrtc:ice-candidate', async ({ fromSocketId, candidate }) => {
        if (!pcRef.current) return
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
        } else {
          iceCandQueueRef.current.push(candidate)
        }
      }),

      on('live:message', msg => setMessages(m => [...m, msg])),

      on('live:viewers-update', ({ count, viewers: list }) => {
        setViewers(count)
        if (list) setViewerList(list)
      }),

      on('live:reaction', r => {
        const rid = Date.now()
        setReactions(p => [...p, { ...r, id: rid }])
        setTimeout(() => setReactions(p => p.filter(x => x.id !== rid)), 3000)
      }),

      on('live:message-pinned', ({ messageId }) => {
        setMessages(p => {
          const m = p.find(x => x.id === messageId)
          setPinned(m ?? null)
          return p
        })
      }),

      on('live:ended', () => {
        setLiveEnded(true)
        setConnected(false)
        pcRef.current?.close()
        pcRef.current = null
        clearTimeout(retryRef.current)
      }),
    ]

    return () => {
      clearTimeout(t)
      clearTimeout(retryRef.current)
      offs.forEach(o => o?.())
      pcRef.current?.close()
      pcRef.current = null
    }
  }, [liveId, on, emit, joinLive])

  const sendMessage  = useCallback(c => emit('live:message', { liveId, content: c }), [liveId, emit])
  const sendReaction = useCallback(t => emit('live:react',   { liveId, type: t }),    [liveId, emit])
  const sendShare    = useCallback(p => emit('live:share',   { liveId, platform: p }), [liveId, emit])

  return {
    remoteVideoRef,
    connected, liveEnded, waitingHost, joinError,
    viewers, viewerList, messages, pinned, reactions,
    sendMessage, sendReaction, sendShare,
    retryJoin: joinLive,
  }
}